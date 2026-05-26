import type { Assignment, AssignmentForm } from "@/types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? browserApiUrl()).replace(/\/$/, "");

function browserApiUrl() {
  if (typeof window === "undefined") return "http://localhost:4000";
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

export async function createAssignment(form: AssignmentForm) {
  const body = new FormData();
  body.append("title", form.title);
  body.append("dueDate", form.dueDate);
  body.append("instructions", form.instructions);
  body.append("sourceText", form.sourceText);
  body.append("questionTypes", JSON.stringify(form.questionTypes));
  if (form.sourceFile) body.append("file", form.sourceFile);

  const response = await fetch(`${API_URL}/api/assignments`, {
    method: "POST",
    body
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unable to create assignment" }));
    throw new Error(error.message);
  }

  return (await response.json()) as { assignmentId: string; status: string };
}

export async function fetchAssignment(id: string) {
  const response = await fetch(`${API_URL}/api/assignments/${id}`);
  if (!response.ok) throw new Error("Assignment not found");
  return (await response.json()) as Assignment;
}

export async function fetchAssignments() {
  const response = await fetch(`${API_URL}/api/assignments`);
  if (!response.ok) throw new Error("Unable to load assignments");
  return (await response.json()) as Assignment[];
}

export async function deleteAssignment(id: string) {
  const response = await fetch(`${API_URL}/api/assignments/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Unable to delete assignment");
}

export async function regenerateAssignment(id: string) {
  const response = await fetch(`${API_URL}/api/assignments/${id}/regenerate`, { method: "POST" });
  if (!response.ok) throw new Error("Unable to regenerate assignment");
  return (await response.json()) as { assignmentId: string; status: string };
}

export function pdfUrl(id: string) {
  return `${API_URL}/api/assignments/${id}/pdf`;
}
