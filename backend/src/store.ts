import mongoose from "mongoose";
import { AssignmentModel } from "./models/Assignment.js";
import type { AssignmentRecord, GeneratedPaper, JobStatus } from "./types.js";

const memory = new Map<string, AssignmentRecord>();
let mongoReady = false;

export async function connectMongo(uri: string) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 1500 });
    mongoReady = true;
    console.log("MongoDB connected");
  } catch (error) {
    mongoReady = false;
    console.warn("MongoDB unavailable, using in-memory assignment store");
  }
}

export async function saveAssignment(record: AssignmentRecord) {
  memory.set(record.id, record);
  if (mongoReady) {
    await AssignmentModel.findOneAndUpdate({ id: record.id }, record, { upsert: true, new: true });
  }
  return record;
}

export async function getAssignment(id: string) {
  if (mongoReady) {
    const record = await AssignmentModel.findOne({ id }).lean<AssignmentRecord>();
    if (record) return record;
  }
  return memory.get(id);
}

export async function listAssignments() {
  if (mongoReady) {
    return AssignmentModel.find().sort({ createdAt: -1 }).lean<AssignmentRecord[]>();
  }
  return Array.from(memory.values()).sort((a, b) => b.assignedOn.localeCompare(a.assignedOn));
}

export async function updateAssignment(id: string, patch: Partial<AssignmentRecord> & { paper?: GeneratedPaper; status?: JobStatus }) {
  const existing = await getAssignment(id);
  if (!existing) return undefined;
  const next = { ...existing, ...patch };
  memory.set(id, next);
  if (mongoReady) {
    await AssignmentModel.findOneAndUpdate({ id }, patch, { new: true });
  }
  return next;
}

export async function deleteAssignment(id: string) {
  memory.delete(id);
  if (mongoReady) {
    await AssignmentModel.deleteOne({ id });
  }
}
