"use client";

import { useEffect } from "react";
import { AssignmentCreator } from "@/components/AssignmentCreator";
import { AssignmentList } from "@/components/AssignmentList";
import { OutputPage } from "@/components/OutputPage";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useAssignmentStore } from "@/store/assignmentStore";

export default function Home() {
  const view = useAssignmentStore((state) => state.view);
  const loadAssignments = useAssignmentStore((state) => state.loadAssignments);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  return (
    <main className="shell">
      <Sidebar />
      <section className="workspace">
        <Topbar />
        {view === "list" && <AssignmentList />}
        {view === "create" && <AssignmentCreator />}
        {view === "output" && <OutputPage />}
      </section>
    </main>
  );
}
