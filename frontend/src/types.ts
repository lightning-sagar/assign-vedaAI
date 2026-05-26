export type ViewMode = "list" | "create" | "output";
export type Difficulty = "easy" | "medium" | "hard";
export type JobStatus = "idle" | "queued" | "processing" | "completed" | "failed";

export type QuestionType = {
  id: string;
  label: string;
  count: number;
  marks: number;
};

export type AssignmentForm = {
  title: string;
  dueDate: string;
  instructions: string;
  sourceText: string;
  sourceFile?: File;
  questionTypes: QuestionType[];
};

export type Question = {
  id: string;
  text: string;
  options?: string[];
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

export type Assignment = {
  id: string;
  title: string;
  dueDate: string;
  assignedOn: string;
  status: JobStatus;
  paper?: GeneratedPaper;
};

export type JobEvent = {
  assignmentId: string;
  status: JobStatus;
  message?: string;
  paper?: GeneratedPaper;
};
