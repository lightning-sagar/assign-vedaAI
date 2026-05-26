import { create } from "zustand";
import { createAssignment, deleteAssignment, fetchAssignment, regenerateAssignment } from "@/lib/api";
import type { Assignment, AssignmentForm, JobEvent, JobStatus, QuestionType, ViewMode } from "@/types";

const defaultTypes: QuestionType[] = [
  { id: "mcq", label: "Multiple Choice Questions", count: 4, marks: 1 },
  { id: "short", label: "Short Questions", count: 3, marks: 2 },
  { id: "diagram", label: "Diagram/Graph-Based Questions", count: 5, marks: 5 },
  { id: "numerical", label: "Numerical Problems", count: 5, marks: 5 }
];

type AssignmentState = {
  view: ViewMode;
  form: AssignmentForm;
  assignments: Assignment[];
  activeAssignmentId?: string;
  status: JobStatus;
  socket?: WebSocket;
  error?: string;
  setView: (view: ViewMode) => void;
  updateForm: (patch: Partial<AssignmentForm>) => void;
  updateQuestionType: (id: string, patch: Partial<QuestionType>) => void;
  addQuestionType: () => void;
  removeQuestionType: (id: string) => void;
  submit: () => Promise<void>;
  deleteAssignmentById: (id: string) => Promise<void>;
  regenerate: (id: string) => Promise<void>;
  openOutput: (id: string) => void;
  connectSocket: () => void;
  handleJobEvent: (event: JobEvent) => void;
  pollAssignment: (assignmentId: string) => void;
};

const initialForm: AssignmentForm = {
  title: "AI Generated Assessment",
  dueDate: "",
  instructions: "",
  sourceText: "",
  sourceFile: undefined,
  questionTypes: defaultTypes
};

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  view: "list",
  form: initialForm,
  assignments: [],
  status: "idle",
  setView: (view) => set({ view, error: undefined }),
  updateForm: (patch) => set((state) => ({ form: { ...state.form, ...patch } })),
  updateQuestionType: (id, patch) =>
    set((state) => ({
      form: {
        ...state.form,
        questionTypes: state.form.questionTypes.map((type) => (type.id === id ? { ...type, ...patch } : type))
      }
    })),
  addQuestionType: () =>
    set((state) => ({
      form: {
        ...state.form,
        questionTypes: [
          ...state.form.questionTypes,
          { id: crypto.randomUUID(), label: "Long Answer Questions", count: 2, marks: 6 }
        ]
      }
    })),
  removeQuestionType: (id) =>
    set((state) => ({
      form: {
        ...state.form,
        questionTypes: state.form.questionTypes.filter((type) => type.id !== id)
      }
    })),
  submit: async () => {
    const { form } = get();
    const totalQuestions = form.questionTypes.reduce((sum, type) => sum + type.count, 0);
    if (!form.dueDate) throw new Error("Choose a due date.");
    if (totalQuestions <= 0) throw new Error("Add at least one question.");
    if (form.questionTypes.some((type) => type.count < 0 || type.marks <= 0)) {
      throw new Error("Question counts cannot be negative and marks must be positive.");
    }

    set({ status: "queued", error: undefined });
    get().connectSocket();

    try {
      const payload = {
        ...form,
        title: inferTitle(form)
      };
      const result = await createAssignment(payload);
      const assignment: Assignment = {
        id: result.assignmentId,
        title: payload.title,
        dueDate: form.dueDate,
        assignedOn: new Date().toISOString(),
        status: "queued"
      };
      set((state) => ({
        assignments: [assignment, ...state.assignments],
        activeAssignmentId: assignment.id,
        view: "output"
      }));
      get().pollAssignment(assignment.id);
    } catch (error) {
      set({
        status: "failed",
        error: error instanceof Error ? error.message : "Unable to create assignment."
      });
      throw error;
    }
  },
  deleteAssignmentById: async (id) => {
    await deleteAssignment(id);
    set((state) => {
      const assignments = state.assignments.filter((assignment) => assignment.id !== id);
      return {
        assignments,
        activeAssignmentId: state.activeAssignmentId === id ? assignments[0]?.id : state.activeAssignmentId,
        view: state.activeAssignmentId === id ? "list" : state.view
      };
    });
  },
  regenerate: async (id) => {
    await regenerateAssignment(id);
    set((state) => ({
      status: "queued",
      assignments: state.assignments.map((assignment) =>
        assignment.id === id ? { ...assignment, status: "queued", paper: undefined } : assignment
      )
    }));
    get().pollAssignment(id);
  },
  openOutput: (id) => set({ activeAssignmentId: id, view: "output" }),
  connectSocket: () => {
    if (get().socket || typeof window === "undefined") return;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/ws";
    const socket = new WebSocket(wsUrl);
    socket.onmessage = (message) => {
      try {
        get().handleJobEvent(JSON.parse(message.data) as JobEvent);
      } catch {
        set({ error: "Received an unreadable job update." });
      }
    };
    socket.onclose = () => set({ socket: undefined });
    set({ socket });
  },
  handleJobEvent: (event) =>
    set((state) => ({
      status: event.status,
      assignments: state.assignments.map((assignment) =>
        assignment.id === event.assignmentId
          ? { ...assignment, status: event.status, paper: event.paper ?? assignment.paper }
          : assignment
      )
    })),
  pollAssignment: (assignmentId) => {
    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;
      try {
        const assignment = await fetchAssignment(assignmentId);
        set((state) => ({
          status: assignment.status,
          assignments: state.assignments.map((item) => (item.id === assignmentId ? assignment : item))
        }));
        if (assignment.status === "completed" || assignment.status === "failed" || attempts > 40) {
          window.clearInterval(timer);
        }
      } catch {
        if (attempts > 40) window.clearInterval(timer);
      }
    }, 1500);
  }
}));

function inferTitle(form: AssignmentForm) {
  const instructionTopic = form.instructions.match(/(?:for|on|about)\s+([a-z0-9 -]{3,60})/i)?.[1]?.trim();
  const fileTopic = form.sourceFile?.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return instructionTopic || fileTopic || form.title || "AI Generated Assessment";
}
