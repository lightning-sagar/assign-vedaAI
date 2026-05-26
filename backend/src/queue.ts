import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import type { AssignmentInput } from "./types.js";
import { generatePaper } from "./ai/generator.js";
import { getAssignment, updateAssignment } from "./store.js";
import { broadcast } from "./wsHub.js";

let queue: Queue<{ assignmentId: string; input: AssignmentInput }> | undefined;
let redisReady = false;

export async function setupQueue(redisUrl: string) {
  let connection: Redis | undefined;
  try {
    connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      connectTimeout: 1500
    });
    connection.on("error", () => {
      // The app intentionally falls back to in-process jobs when Redis is unavailable.
    });
    await Promise.race([
      connection.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Redis connection timed out")), 1500))
    ]);
    await Promise.race([
      connection.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Redis ping timed out")), 1500))
    ]);
    redisReady = true;
    queue = new Queue("assessment-generation", { connection });
    new Worker(
      "assessment-generation",
      async (job) => processGeneration(job.data.assignmentId, job.data.input),
      { connection }
    );
    console.log("Redis/BullMQ connected");
  } catch {
    connection?.disconnect();
    redisReady = false;
    console.warn("Redis unavailable, processing jobs in-process");
  }
}

export async function enqueueGeneration(assignmentId: string, input: AssignmentInput) {
  broadcast({ assignmentId, status: "queued", message: "Generation queued" });
  if (redisReady && queue) {
    await queue.add("generate", { assignmentId, input }, { attempts: 2, backoff: { type: "exponential", delay: 1000 } });
  } else {
    setTimeout(() => {
      void processGeneration(assignmentId, input);
    }, 250);
  }
}

async function processGeneration(assignmentId: string, input: AssignmentInput) {
  await updateAssignment(assignmentId, { status: "processing" });
  broadcast({ assignmentId, status: "processing", message: "AI is generating the paper" });
  try {
    const paper = await generatePaper(input);
    const updated = await updateAssignment(assignmentId, { status: "completed", paper });
    broadcast({ assignmentId, status: "completed", paper: updated?.paper ?? paper });
  } catch (error) {
    await updateAssignment(assignmentId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Generation failed"
    });
    broadcast({ assignmentId, status: "failed", message: "Generation failed" });
  }
}

export async function enqueuePdf(assignmentId: string) {
  return getAssignment(assignmentId);
}
