"use client";

import { MoreVertical, Search, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useAssignmentStore } from "@/store/assignmentStore";

export function AssignmentList() {
  const assignments = useAssignmentStore((state) => state.assignments);
  const status = useAssignmentStore((state) => state.status);
  const hasLoadedAssignments = useAssignmentStore((state) => state.hasLoadedAssignments);
  const openOutput = useAssignmentStore((state) => state.openOutput);
  const startCreate = useAssignmentStore((state) => state.startCreate);
  const deleteAssignmentById = useAssignmentStore((state) => state.deleteAssignmentById);
  const [openMenuId, setOpenMenuId] = useState<string>();

  if (!hasLoadedAssignments && status === "processing") {
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
          <span className="skeletonLine short" />
          <span className="skeletonLine wide" />
        </div>
        <div className="assignmentGrid">
          {Array.from({ length: 4 }).map((_, index) => (
            <article className="assignmentCard" key={index}>
              <div className="cardSkeleton loading">
                <span className="skeletonLine title" />
                <span className="skeletonLine" />
                <span className="skeletonLine short" />
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (assignments.length === 0) {
    return (
      <section className="emptyState">
        <div className="emptyArt">
          <div className="paperGlyph" />
          <span>×</span>
        </div>
        <h1>No assignments yet</h1>
        <p>Create your first assignment to start collecting and grading student submissions. You can set rubrics, define marking criteria, and let AI assist with grading.</p>
        <button className="primaryDark" onClick={startCreate}>+ Create Your First Assignment</button>
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
            {(assignment.status === "queued" || assignment.status === "processing") && (
              <div className="cardSkeleton" aria-hidden="true">
                <span className="skeletonLine short" />
                <span className="skeletonLine" />
              </div>
            )}
          </article>
        ))}
      </div>

      <button className="bottomCreate" onClick={startCreate}>+ Create Assignment</button>
    </section>
  );
}
