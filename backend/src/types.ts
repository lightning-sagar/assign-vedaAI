export type Difficulty = "easy" | "medium" | "hard";
export type JobStatus = "idle" | "queued" | "processing" | "completed" | "failed";

export type QuestionType = {
  id: string;
  label: string;
  count: number;
  marks: number;
};

export type AssignmentInput = {
  title: string;
  dueDate: string;
  instructions?: string;
  sourceText?: string;
  questionTypes: QuestionType[];
};

export type Question = {
  id: string;
  text: string;
  difficulty: Difficulty;
  marks: number;
};

export type QuestionSection = {
  id: string;
  title: string;
  instruction: string;
  questions: Question[];
};

export type GeneratedPaper = {
  title: string;
  durationMinutes: number;
  totalMarks: number;
  sections: QuestionSection[];
};

export type AssignmentRecord = AssignmentInput & {
  id: string;
  assignedOn: string;
  status: JobStatus;
  paper?: GeneratedPaper;
  error?: string;
};
