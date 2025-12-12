import { loadProjects, saveProjects } from "./projectsStorage";

// hana fake data

type Project = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  progress: number;
  budget: number;
};

type Task = {
  id: string;
  title: string;
  status: "cancel" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  assignee?: string;
};

const defaultProjects: Project[] = Array.from({ length: 12 }).map((_, i) => {
  const id = i + 1;
  const statuses = ["Planned", "Active", "Blocked", "Completed"];
  const status = statuses[i % statuses.length];
  const start = new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + (30 + i) * 24 * 60 * 60 * 1000);
  return {
    id: `p-${id}`,
    name: `Project ${id}`,
    status,
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    progress: Math.min(100, Math.max(0, Math.round((i / 11) * 100))),
    budget: 50000 + i * 10000,
  };
});

const projects: Project[] = loadProjects(defaultProjects);

const tasks: Record<string, Task[]> = {};
projects.forEach((p) => {
  const list: Task[] = Array.from({ length: 5 }).map((_, i) => ({
    id: `t-${p.id}-${i + 1}`,
    title: `Task ${i + 1} for ${p.name}`,
    status: i % 3 === 0 ? "cancel" : i % 3 === 1 ? "in-progress" : "done",
    priority: i % 2 === 0 ? "high" : "medium",
    assignee: i % 2 === 0 ? "user1" : "user2",
  }));
  tasks[p.id] = list;
});

function persistProjects() {
  saveProjects(projects);
}

export { projects, tasks, persistProjects };
