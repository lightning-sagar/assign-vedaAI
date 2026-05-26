"use client";

import { ArrowLeft, Download, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { pdfUrl } from "@/lib/api";
import { useAssignmentStore } from "@/store/assignmentStore";

export function OutputPage() {
  const assignments = useAssignmentStore((state) => state.assignments);
  const activeAssignmentId = useAssignmentStore((state) => state.activeAssignmentId);
  const setView = useAssignmentStore((state) => state.setView);
  const error = useAssignmentStore((state) => state.error);
  const assignment = assignments.find((item) => item.id === activeAssignmentId);

  if (!assignment) {
    return (
      <section className="emptyState">
        <h1>No paper selected</h1>
        <button className="primaryDark" onClick={() => setView("create")}>Create Assignment</button>
      </section>
    );
  }

  if (!assignment.paper) {
    return (
      <section className="generationState">
        <div className="pulseIcon"><Sparkles size={28} /></div>
        <h1>Generating assessment</h1>
        <p>AI is structuring sections, balancing marks, and preparing a readable question paper.</p>
        <div className="progressTrack"><span /></div>
        <div className="paperSkeleton" aria-hidden="true">
          <span className="skeletonLine title" />
          <span className="skeletonLine" />
          <span className="skeletonLine" />
          <span className="skeletonLine wide" />
          <span className="skeletonLine" />
          <span className="skeletonLine short" />
        </div>
        {error && <p className="softError">{error}</p>}
      </section>
    );
  }

  return (
    <section className="outputPage">
      <div className="actionBar">
        <div className="actionInfo">
          <h1>{assignment.paper.title}</h1>
          <p>Assigned {format(new Date(assignment.assignedOn), "dd MMM yyyy")} - Due {format(new Date(assignment.dueDate), "dd MMM yyyy")}</p>
        </div>
        <div className="actionButtons">
          <button onClick={() => setView("list")}><ArrowLeft size={17} /> Back</button>
          <a className="primaryDark" href={pdfUrl(assignment.id)}><Download size={17} /> Download PDF</a>
        </div>
      </div>

      <article className="paper">
        <header className="paperHeader">
          <p>Delhi Public School, Bokaro Steel City</p>
          <h2>{assignment.paper.title}</h2>
          <div>
            <span>Time: {assignment.paper.durationMinutes} minutes</span>
            <span>Maximum Marks: {assignment.paper.totalMarks}</span>
          </div>
        </header>

        <section className="studentInfo">
          <label>Name <span /></label>
          <label>Roll Number <span /></label>
          <label>Section <span /></label>
        </section>

        {assignment.paper.sections.map((section) => (
          <section className="questionSection" key={section.id}>
            <div className="sectionTitle">
              <h3>{section.title}</h3>
              <p>{section.instruction}</p>
            </div>
            <ol>
              {section.questions.map((question) => {
                const options = question.options?.length
                  ? question.options
                  : isMcqSection(section.title)
                    ? fallbackMcqOptions(question.text, assignment.paper?.title ?? assignment.title)
                    : [];

                return (
                  <li key={question.id}>
                    <div className="questionText">{question.text}</div>
                    {options.length > 0 && (
                    <ol className="mcqOptions" type="A">
                      {options.map((option, index) => (
                        <li key={`${question.id}-${index}`}>{option}</li>
                      ))}
                    </ol>
                    )}
                    <div className="questionMeta">
                      <span className={`difficulty ${question.difficulty}`}>{question.difficulty}</span>
                      <strong>{question.marks} marks</strong>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </article>
    </section>
  );
}

function isMcqSection(title: string) {
  return /multiple choice|mcq/i.test(title);
}

function fallbackMcqOptions(questionText: string, title: string) {
  const topic = title || "This topic";
  if (/what is|define/i.test(questionText)) {
    return [
      `A correct definition related to ${topic}`,
      "An unrelated historical event",
      "A formatting style only",
      "None of the above"
    ];
  }

  return [
    `A valid concept from ${topic}`,
    "A distractor that does not match the lesson",
    "A partially related but incorrect option",
    "All of the above"
  ];
}
