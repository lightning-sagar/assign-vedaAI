import PDFDocument from "pdfkit";
import type { AssignmentRecord } from "./types.js";

export function renderPdf(assignment: AssignmentRecord) {
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));

  const paper = assignment.paper;
  doc.fontSize(11).text("Delhi Public School, Bokaro Steel City", { align: "center" });
  doc.moveDown(0.4).fontSize(20).text(paper?.title ?? assignment.title, { align: "center" });
  doc.moveDown(0.5).fontSize(10).text(`Time: ${paper?.durationMinutes ?? 60} minutes`, { continued: true });
  doc.text(`Maximum Marks: ${paper?.totalMarks ?? 0}`, { align: "right" });
  doc.moveDown().text("Name: ____________________   Roll Number: ____________________   Section: __________");
  doc.moveDown();

  for (const section of paper?.sections ?? []) {
    doc.moveDown(0.8).fontSize(14).text(section.title, { underline: true });
    doc.fontSize(10).fillColor("#555").text(section.instruction);
    doc.fillColor("#111");
    section.questions.forEach((question, index) => {
      doc.moveDown(0.45).fontSize(11).text(`${index + 1}. ${question.text}`);
      doc.fontSize(9).fillColor("#555").text(`Difficulty: ${question.difficulty}   Marks: ${question.marks}`);
      doc.fillColor("#111");
    });
  }

  doc.end();

  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
