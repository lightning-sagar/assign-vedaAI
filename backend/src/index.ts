import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "node:http";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { assignmentSchema } from "./validation.js";
import { connectMongo, deleteAssignment, getAssignment, listAssignments, saveAssignment } from "./store.js";
import { enqueueGeneration, enqueuePdf, setupQueue } from "./queue.js";
import { attachWebSockets } from "./wsHub.js";
import { renderPdf } from "./pdf.js";
import { extractSourceText } from "./ai/sourceExtractor.js";
import type { AssignmentRecord } from "./types.js";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config();

const app = express();
const server = http.createServer(app);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const port = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/assignments", async (_req, res) => {
  res.json(await listAssignments());
});

app.post("/api/assignments", upload.single("file"), async (req, res) => {
  const body = normalizeAssignmentBody(req.body);
  body.sourceText = await extractSourceText(req.file, body.sourceText);
  body.title = deriveAssignmentTitle(body);
  const parsed = assignmentSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid assignment payload" });
    return;
  }

  const id = randomUUID();
  const record: AssignmentRecord = {
    ...parsed.data,
    id,
    assignedOn: new Date().toISOString(),
    status: "queued"
  };

  await saveAssignment(record);
  await enqueueGeneration(id, parsed.data);
  res.status(202).json({ assignmentId: id, status: "queued" });
});

app.get("/api/assignments/:id", async (req, res) => {
  const assignment = await getAssignment(req.params.id);
  if (!assignment) {
    res.status(404).json({ message: "Assignment not found" });
    return;
  }
  res.json(assignment);
});

app.post("/api/assignments/:id/regenerate", async (req, res) => {
  const assignment = await getAssignment(req.params.id);
  if (!assignment) {
    res.status(404).json({ message: "Assignment not found" });
    return;
  }
  await enqueueGeneration(assignment.id, assignment);
  res.status(202).json({ assignmentId: assignment.id, status: "queued" });
});

app.delete("/api/assignments/:id", async (req, res) => {
  const assignment = await getAssignment(req.params.id);
  if (!assignment) {
    res.status(404).json({ message: "Assignment not found" });
    return;
  }
  await deleteAssignment(req.params.id);
  res.status(204).send();
});

app.get("/api/assignments/:id/pdf", async (req, res) => {
  const assignment = await enqueuePdf(req.params.id);
  if (!assignment || !assignment.paper) {
    res.status(404).json({ message: "Generated paper not found" });
    return;
  }
  const buffer = await renderPdf(assignment);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${assignment.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf"`);
  res.send(buffer);
});

async function bootstrap() {
  attachWebSockets(server);
  await connectMongo(process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/vedaai_assessments");
  await setupQueue(process.env.REDIS_URL ?? "redis://127.0.0.1:6379");
  server.listen(port, () => {
    console.log(`Assessment API listening on http://localhost:${port}`);
  });
}

void bootstrap();

function normalizeAssignmentBody(body: Record<string, unknown>) {
  const questionTypes =
    typeof body.questionTypes === "string" ? JSON.parse(body.questionTypes) : body.questionTypes;

  return {
    ...body,
    title: String(body.title ?? ""),
    dueDate: String(body.dueDate ?? ""),
    instructions: String(body.instructions ?? ""),
    sourceText: String(body.sourceText ?? ""),
    questionTypes: Array.isArray(questionTypes)
      ? questionTypes.map((type) => ({
          ...type,
          count: Number(type.count),
          marks: Number(type.marks)
        }))
      : []
  };
}

function deriveAssignmentTitle(body: { title: string; instructions: string; sourceText: string }) {
  if (body.sourceText.trim()) {
    const sourceTitle = body.sourceText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length >= 4 && line.length <= 80 && !line.startsWith("--"));
    if (sourceTitle) return sourceTitle;
  }

  const instructionTopic = body.instructions.match(/(?:for|on|about)\s+([a-z0-9 -]{3,60})/i)?.[1]?.trim();
  if (instructionTopic) return `Assessment on ${instructionTopic}`;

  if (!body.title || /quiz on electricity/i.test(body.title)) return "AI Generated Assessment";
  return body.title;
}
