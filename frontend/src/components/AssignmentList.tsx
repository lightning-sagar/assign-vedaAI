"use client";

import { MoreVertical, Search, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useAssignmentStore } from "@/store/assignmentStore";

export function AssignmentList() {
  const assignments = useAssignmentStore((state) => state.assignments);
  const openOutput = useAssignmentStore((state) => state.openOutput);
  const setView = useAssignmentStore((state) => state.setView);
  const deleteAssignmentById = useAssignmentStore((state) => state.deleteAssignmentById);
  const [openMenuId, setOpenMenuId] = useState<string>();

  if (assignments.length === 0) {
    return (
      <section className="emptyState">
        <div className="emptyArt">
          <div className="paperGlyph" />
          <span>×</span>
        </div>
        <h1>No assignments yet</h1>
        <p>Create your first assignment to start collecting and grading student submissions. You can set rubrics, define marking criteria, and let AI assist with grading.</p>
        <button className="primaryDark" onClick={() => setView("create")}>+ Create Your First Assignment</button>
      </section>
    );
  }

  return (
    <section className="listPage">
      <div className="pageTitle">
        <span className="statusDot" />
        <div>
          <h1>Assignments</h1>
          <p>Manage and create assignments for your classes.</p>
        </div>
      </div>

      <div className="filterBar">
        <button><SlidersHorizontal size={16} /> Filter By</button>
        <label>
          <Search size={16} />
          <input placeholder="Search Assignment" />
        </label>
      </div>

      <div className="assignmentGrid">
        {assignments.map((assignment) => (
          <article className="assignmentCard" key={assignment.id}>
            <button
              className="dots"
              aria-label="More actions"
              onClick={() => setOpenMenuId(openMenuId === assignment.id ? undefined : assignment.id)}
            >
              <MoreVertical size={17} />
            </button>
            {openMenuId === assignment.id && (
              <div className="assignmentMenu">
                <button onClick={() => openOutput(assignment.id)}>View Assignment</button>
                <button
                  className="danger"
                  onClick={async () => {
                    await deleteAssignmentById(assignment.id);
                    setOpenMenuId(undefined);
                  }}
                >
                  Delete
                </button>
              </div>
            )}
            <button className="titleLink" onClick={() => openOutput(assignment.id)}>{assignment.title}</button>
            <div className="assignmentMeta">
              <span><strong>Assigned on :</strong> {format(new Date(assignment.assignedOn), "dd-MM-yyyy")}</span>
              <span><strong>Due :</strong> {assignment.dueDate ? format(new Date(assignment.dueDate), "dd-MM-yyyy") : "Not set"}</span>
            </div>
            <div className={`cardStatus ${assignment.status}`}>{assignment.status}</div>
          </article>
        ))}
      </div>

      <button className="bottomCreate" onClick={() => setView("create")}>+ Create Assignment</button>
    </section>
  );
}
