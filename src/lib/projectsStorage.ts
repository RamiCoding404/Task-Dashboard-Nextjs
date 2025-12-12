import fs from "fs";
import path from "path";

type Project = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  progress: number;
  budget: number;
};

const dataFilePath = path.join(process.cwd(), ".data", "projects.json");

function ensureDataDir() {
  const dir = path.dirname(dataFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadProjects(defaultProjects: Project[]): Project[] {
  try {
    ensureDataDir();
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error loading projects from file:", err);
  }
  return defaultProjects;
}

function saveProjects(projects: Project[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(dataFilePath, JSON.stringify(projects, null, 2));
  } catch (err) {
    console.error("Error saving projects to file:", err);
  }
}

export { loadProjects, saveProjects, type Project };
