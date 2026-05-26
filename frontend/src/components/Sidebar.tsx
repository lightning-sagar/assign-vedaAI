"use client";

import { BookOpen, Bot, ClipboardList, Grid2X2, Library, Plus, School, Settings, Sparkles } from "lucide-react";
import { useAssignmentStore } from "@/store/assignmentStore";

export function Sidebar() {
  const setView = useAssignmentStore((state) => state.setView);
  const assignments = useAssignmentStore((state) => state.assignments);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brandMark">V</div>
        <strong>VedaAI</strong>
      </div>

      <button className="createButton" onClick={() => setView("create")}>
        <Sparkles size={15} />
        Create Assignment
      </button>

      <nav className="navList" aria-label="Primary">
        <a><Grid2X2 size={16} /> Home</a>
        <a><BookOpen size={16} /> My Groups</a>
        <button className="active" onClick={() => setView("list")}>
          <ClipboardList size={16} /> Assignments
          {assignments.length > 0 && <span>{assignments.length}</span>}
        </button>
        <a><Bot size={16} /> AI Teacher&apos;s Toolkit</a>
        <a><Library size={16} /> My Library</a>
      </nav>

      <div className="sidebarFooter">
        <a><Settings size={16} /> Settings</a>
        <div className="schoolCard">
          <School size={28} />
          <div>
            <strong>Delhi Public School</strong>
            <small>Bokaro Steel City</small>
          </div>
        </div>
      </div>

      <button className="mobileFab" onClick={() => setView("create")} aria-label="Create assignment">
        <Plus size={18} />
      </button>
    </aside>
  );
}
