"use client";

import { Bell, ChevronDown, Grid2X2, MoveLeft } from "lucide-react";
import { useAssignmentStore } from "@/store/assignmentStore";

export function Topbar() {
  const view = useAssignmentStore((state) => state.view);
  const setView = useAssignmentStore((state) => state.setView);

  return (
    <header className="topbar">
      <div className="crumb">
        <Grid2X2 size={15} />
        <span>Assignment</span>
      </div>
      <div className="profileTools">
        <button className="iconButton notify" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <div className="avatar">JD</div>
        <strong>John Doe</strong>
        <ChevronDown size={16} />
      </div>
    </header>
  );
}
