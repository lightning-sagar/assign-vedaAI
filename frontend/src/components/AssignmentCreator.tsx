"use client";

import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, FileText, Mic, Plus, UploadCloud, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useAssignmentStore } from "@/store/assignmentStore";

export function AssignmentCreator() {
  const form = useAssignmentStore((state) => state.form);
  const updateForm = useAssignmentStore((state) => state.updateForm);
  const updateQuestionType = useAssignmentStore((state) => state.updateQuestionType);
  const addQuestionType = useAssignmentStore((state) => state.addQuestionType);
  const removeQuestionType = useAssignmentStore((state) => state.removeQuestionType);
  const submit = useAssignmentStore((state) => state.submit);
  const setView = useAssignmentStore((state) => state.setView);
  const [error, setError] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);

  const totals = useMemo(() => {
    return form.questionTypes.reduce(
      (acc, type) => ({
        questions: acc.questions + Number(type.count || 0),
        marks: acc.marks + Number(type.count || 0) * Number(type.marks || 0)
      }),
      { questions: 0, marks: 0 }
    );
  }, [form.questionTypes]);

  async function onSubmit() {
    setError("");
    try {
      await submit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please check the form.");
    }
  }

  return (
    <section className="createPage">
      <div className="pageTitle">
        <span className="statusDot" />
        <div>
          <h1>Create Assignment</h1>
          <p>Set up a new assessment for your students</p>
        </div>
      </div>

      <div className="stepper"><span /><span /></div>

      <div className="formCard">
        <h2>Assignment Details</h2>
        <p>Basic information about your assignment</p>

        <label className="uploadBox">
          {form.sourceFile ? <CheckCircle2 className="uploadSuccessIcon" size={24} /> : <UploadCloud size={22} />}
          <strong>Choose a file or drag & drop it here</strong>
          <span>PDF, JPEG, PNG, upto 10MB</span>
          <input
            type="file"
            accept=".pdf,.txt,.png,.jpg,.jpeg"
            onChange={(event) => {
              const file = event.target.files?.[0];
              updateForm({ sourceText: file?.name ?? "", sourceFile: file });
            }}
          />
          <em>Browse Files</em>
        </label>
        {form.sourceFile && (
          <div className="uploadedFile">
            <FileText size={18} />
            <div>
              <strong>{form.sourceFile.name}</strong>
              <span>{formatFileSize(form.sourceFile.size)} uploaded</span>
            </div>
            <button type="button" onClick={() => updateForm({ sourceText: "", sourceFile: undefined })}>
              <X size={15} />
            </button>
          </div>
        )}
        <p className="uploadHint">Upload images of your preferred document/image</p>

        <label className="fieldLabel dateField">
          Due Date
          <span>
            <input
              ref={dateInputRef}
              type="date"
              value={form.dueDate}
              onChange={(event) => updateForm({ dueDate: event.target.value })}
            />
            <button
              type="button"
              className="calendarPickerButton"
              aria-label="Open due date picker"
              onClick={() => {
                dateInputRef.current?.showPicker?.();
                dateInputRef.current?.focus();
              }}
            >
              <Calendar size={18} />
            </button>
          </span>
        </label>

        <div className="questionHeader">
          <strong>Question Type</strong>
          <strong>No. of Questions</strong>
          <strong>Marks</strong>
        </div>

        <div className="questionRows">
          {form.questionTypes.map((type) => (
            <div className="questionRow" key={type.id}>
              <select value={type.label} onChange={(event) => updateQuestionType(type.id, { label: event.target.value })}>
                <option>Multiple Choice Questions</option>
                <option>Short Questions</option>
                <option>Diagram/Graph-Based Questions</option>
                <option>Numerical Problems</option>
                <option>Long Answer Questions</option>
                <option>Case Study Questions</option>
              </select>
              <button className="removeType" onClick={() => removeQuestionType(type.id)} aria-label="Remove question type">
                <X size={14} />
              </button>
              <NumberStepper value={type.count} onChange={(count) => updateQuestionType(type.id, { count })} min={0} />
              <NumberStepper value={type.marks} onChange={(marks) => updateQuestionType(type.id, { marks })} min={1} />
            </div>
          ))}
        </div>

        <button className="addType" onClick={addQuestionType}><Plus size={18} /> Add Question Type</button>

        <div className="totals">
          <span>Total Questions : <strong>{totals.questions}</strong></span>
          <span>Total Marks : <strong>{totals.marks}</strong></span>
        </div>

        <label className="fieldLabel">
          Additional Information (For better output)
          <span className="textareaWrap">
            <textarea
              value={form.instructions}
              onChange={(event) => updateForm({ instructions: event.target.value })}
              placeholder="e.g Generate a question paper for 3 hour exam duration..."
            />
            <Mic size={16} />
          </span>
        </label>
        {error && <p className="formError">{error}</p>}
      </div>

      <div className="formActions">
        <button onClick={() => setView("list")}><ArrowLeft size={15} /> Previous</button>
        <button className="primaryDark" onClick={onSubmit}>Next <ArrowRight size={15} /></button>
      </div>
    </section>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function NumberStepper({ value, onChange, min }: { value: number; onChange: (value: number) => void; min: number }) {
  return (
    <div className="stepperInput">
      <button onClick={() => onChange(Math.max(min, value - 1))}>-</button>
      <input type="number" min={min} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <button onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}
