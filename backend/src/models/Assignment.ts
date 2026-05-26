import mongoose, { Schema } from "mongoose";
import type { AssignmentRecord } from "../types.js";

const QuestionSchema = new Schema(
  {
    id: String,
    text: String,
    difficulty: String,
    marks: Number
  },
  { _id: false }
);

const SectionSchema = new Schema(
  {
    id: String,
    title: String,
    instruction: String,
    questions: [QuestionSchema]
  },
  { _id: false }
);

const AssignmentSchema = new Schema<AssignmentRecord>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    dueDate: { type: String, required: true },
    assignedOn: { type: String, required: true },
    status: { type: String, required: true },
    instructions: String,
    sourceText: String,
    questionTypes: [{ id: String, label: String, count: Number, marks: Number, _id: false }],
    paper: {
      title: String,
      durationMinutes: Number,
      totalMarks: Number,
      sections: [SectionSchema]
    },
    error: String
  },
  { timestamps: true }
);

export const AssignmentModel =
  mongoose.models.Assignment || mongoose.model<AssignmentRecord>("Assignment", AssignmentSchema);
