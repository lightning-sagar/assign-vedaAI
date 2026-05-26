import { randomUUID } from "node:crypto";
import type { AssignmentInput, Difficulty, GeneratedPaper, QuestionSection } from "../types.js";

export function buildPrompt(input: AssignmentInput) {
  const blueprint = input.questionTypes
    .filter((type) => type.count > 0)
    .map((type) => `${type.count} ${type.label}, ${type.marks} marks each`)
    .join("; ");

  return [
    "Create a school assessment question paper as strict JSON only.",
    "The reference material is authoritative. Every generated question must be based on the reference material and teacher instructions.",
    "If the title conflicts with the reference material, ignore the title and use the reference material topic.",
    `Assessment title/topic: ${input.title}`,
    `Due date: ${input.dueDate}`,
    `Question blueprint: ${blueprint}`,
    `Teacher instructions: ${input.instructions || "No extra instructions"}`,
    `Reference material: ${input.sourceText || "Use grade-appropriate general knowledge for the topic."}`,
    "Schema: { title, durationMinutes, totalMarks, sections: [{ id, title, instruction, questions: [{ id, text, difficulty, marks }] }] }.",
    "Difficulty values must be easy, medium, or hard. Group related questions into Section A, Section B, etc.",
    "Do not generate questions about electricity, circuits, Ohm's law, voltage, current, or resistors unless those topics appear in the reference material."
  ].join("\n");
}

export async function generatePaper(input: AssignmentInput): Promise<GeneratedPaper> {
  if (!process.env.GROQ_API_KEY) return fallbackPaper(input);

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You generate assessment papers as valid JSON. Do not include markdown." },
        { role: "user", content: buildPrompt(input) }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4
    })
  });

  if (!response.ok) {
    throw new Error(`Groq generation failed with status ${response.status}`);
  }

  const completion = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = completion.choices?.[0]?.message?.content;
  if (!raw) return fallbackPaper(input);
  const paper = normalizePaper(JSON.parse(raw), input);
  return isGroundedInSource(paper, input) ? paper : fallbackPaper(input);
}

function normalizePaper(value: unknown, input: AssignmentInput): GeneratedPaper {
  const paper = value as Partial<GeneratedPaper>;
  const sections = Array.isArray(paper.sections) && paper.sections.length > 0 ? paper.sections : fallbackPaper(input).sections;
  const normalizedSections = sections.map((section, sectionIndex) => ({
    id: section.id || String.fromCharCode(97 + sectionIndex),
    title: section.title || `Section ${String.fromCharCode(65 + sectionIndex)}`,
    instruction: section.instruction || "Attempt all questions.",
    questions: (section.questions || []).map((question, questionIndex) => ({
      id: question.id || randomUUID(),
      text: question.text || `Question ${questionIndex + 1}`,
      difficulty: normalizeDifficulty(question.difficulty),
      marks: Number(question.marks || 1)
    }))
  }));

  return {
    title: sourceTitle(input) || paper.title || input.title,
    durationMinutes: Number(paper.durationMinutes || inferDuration(input)),
    totalMarks: normalizedSections.reduce((sum, section) => sum + section.questions.reduce((inner, question) => inner + question.marks, 0), 0),
    sections: normalizedSections
  };
}

function normalizeDifficulty(value: unknown): Difficulty {
  if (value === "easy" || value === "medium" || value === "hard") return value;
  return "medium";
}

function fallbackPaper(input: AssignmentInput): GeneratedPaper {
  const sections: QuestionSection[] = input.questionTypes
    .filter((type) => type.count > 0)
    .map((type, index) => {
      const sectionName = `Section ${String.fromCharCode(65 + index)}`;
      return {
        id: sectionName.toLowerCase().replace(/\s+/g, "-"),
        title: sectionName,
        instruction: `Attempt all ${type.label.toLowerCase()}. Each question carries ${type.marks} marks.`,
        questions: Array.from({ length: type.count }, (_, questionIndex) => ({
          id: randomUUID(),
          text: makeQuestion(input, type.label, questionIndex),
          difficulty: pickDifficulty(questionIndex),
          marks: type.marks
        }))
      };
    });

  return {
    title: sourceTitle(input) || input.title,
    durationMinutes: inferDuration(input),
    totalMarks: sections.reduce((sum, section) => sum + section.questions.reduce((inner, question) => inner + question.marks, 0), 0),
    sections
  };
}

function makeQuestion(input: AssignmentInput, type: string, index: number) {
  const concepts = extractConcepts(input);
  const concept = concepts[index % concepts.length] ?? input.title;
  const prompts = [
    `Define ${concept} and explain why it is important in this topic.`,
    `Apply ${concept} to a short example from the reference material.`,
    `Compare ${concept} with another related idea from the lesson.`,
    `Analyze a challenge or limitation related to ${concept}.`,
    `Create a brief explanation showing how ${concept} is used in practice.`
  ];
  return `${prompts[index % prompts.length]} (${type})`;
}

function sourceTitle(input: AssignmentInput) {
  return (input.sourceText ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length >= 4 && line.length <= 80 && !line.startsWith("--"));
}

function extractConcepts(input: AssignmentInput) {
  const sourceText = input.sourceText ?? "";
  const text = `${input.title}\n${input.instructions ?? ""}\n${sourceText}`.toLowerCase();
  const candidates = [
    "tokenization",
    "tokens",
    "subword tokenization",
    "byte pair encoding",
    "bpe",
    "unicode",
    "utf-8",
    "regular expressions",
    "minimum edit distance",
    "morphemes",
    "clitics",
    "code points",
    "vocabulary",
    "unknown words"
  ];
  const found = candidates.filter((candidate) => text.includes(candidate));
  if (found.length > 0) return found;

  return Array.from(
    new Set(
      sourceText
        .split(/[^A-Za-z0-9+-]+/)
        .filter((word) => word.length > 5)
        .slice(0, 12)
    )
  );
}

function isGroundedInSource(paper: GeneratedPaper, input: AssignmentInput) {
  const sourceText = input.sourceText ?? "";
  if (!sourceText.trim()) return true;
  const sourceConcepts = extractConcepts(input);
  const paperText = JSON.stringify(paper).toLowerCase();
  const hits = sourceConcepts.filter((concept) => paperText.includes(concept.toLowerCase())).length;
  const bannedElectricityLeak =
    /electric|circuit|voltage|current|resistor|ohm/.test(paperText) &&
    !/electric|circuit|voltage|current|resistor|ohm/.test(sourceText.toLowerCase());
  return hits >= Math.min(2, sourceConcepts.length) && !bannedElectricityLeak;
}

function pickDifficulty(index: number): Difficulty {
  return (["easy", "medium", "hard"] as const)[index % 3];
}

function inferDuration(input: AssignmentInput) {
  const totalQuestions = input.questionTypes.reduce((sum, type) => sum + type.count, 0);
  return Math.max(30, Math.min(180, totalQuestions * 5));
}
