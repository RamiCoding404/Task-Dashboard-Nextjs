/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Header from "@/components/Header";
import useAuth from "@/lib/useAuth";
import { useDebounce } from "@/lib/useDebounce";

async function fetchProjects(search?: string) {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Failed to fetch");
  const json = await res.json();
  const projects = json.projects || [];
  if (search) {
    return projects.filter((p: any) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }
  return projects;
}

async function patchProject(id: string, patch: any) {
  const res = await fetch(`/api/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update");
  const data = await res.json();
  if (!data.project) throw new Error("No project in response");
  return data;
}

export default function DashboardPage() {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [statusFilter, setStatusFilter] = useState<string | "All">("All");
  const [sortBy, setSortBy] = useState<
    "startDate" | "endDate" | "progress" | "name" | "budget"
  >("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const search = useDebounce(searchInput, 300);

  const [localValues, setLocalValues] = useState<
    Record<string, { progress: number; budget: number }>
  >({});

  const { user } = useAuth();
  const canEditBudget = user?.role === "Admin";
  const canEditProgress =
    user?.role === "Admin" || user?.role === "ProjectManager";

  const timersRef = React.useRef<Record<string, number>>({});
  // const [saving, setSaving] = useState<Record<string, boolean>>({});

  const qc = useQueryClient();
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", search],
    queryFn: () => fetchProjects(search),
  });

  const mutation = useMutation({
    mutationFn: async (vars: { id: string; patch: any }) =>
      patchProject(vars.id, vars.patch),
    onMutate: async (vars: { id: string; patch: any }) => {
      await qc.cancelQueries({ queryKey: ["projects", search] });
      const previous = qc.getQueryData(["projects", search]);
      qc.setQueryData(["projects", search], (old: any) => {
        return old?.map((p: any) =>
          p.id === vars.id ? { ...p, ...vars.patch } : p
        );
      });
      return { previous };
    },
    onError: (context: any) => {
      qc.setQueryData(["projects", search], context?.previous);

      // try {
      //   if (variables?.id) setSaving((s) => ({ ...s, [variables.id]: false }));
      // } catch {}
    },
    onSuccess: (data: any, variables: any) => {
      try {
        const proj = data?.project;
        if (proj && variables?.id) {
          setLocalValues((s) => ({
            ...s,
            [variables.id]: {
              progress: proj.progress ?? s[variables.id]?.progress ?? 0,
              budget: proj.budget ?? s[variables.id]?.budget ?? 0,
            },
          }));

          try {
            qc.setQueryData(["projects", search], (old: any) =>
              old?.map((p: any) => (p.id === variables.id ? proj : p))
            );
            qc.setQueryData(["projects"], (old: any) =>
              old?.map((p: any) => (p.id === variables.id ? proj : p))
            );
          } catch {}
        }
      } catch {
        return null;
      }

      // try {
      //   if (variables?.id) setSaving((s) => ({ ...s, [variables.id]: false }));
      // } catch {}
      qc.invalidateQueries({ queryKey: ["projects", search] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["projects", search] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  function scheduleMutate(id: string, patch: any, delay = 500) {
    // setSaving((s) => ({ ...s, [id]: true }));

    try {
      const prev = timersRef.current[id];
      if (prev) clearTimeout(prev);
    } catch {}
    const t = window.setTimeout(() => {
      mutation.mutate({ id, patch });
      try {
        delete timersRef.current[id];
      } catch {}
    }, delay);
    timersRef.current[id] = t;
  }

  React.useEffect(() => {
    if (!projects) return;

    if (Object.keys(localValues).length > 0) return;
    const map: Record<string, { progress: number; budget: number }> = {};
    for (const p of projects) {
      map[p.id] = { progress: p.progress ?? 0, budget: p.budget ?? 0 };
    }
    setLocalValues(map);
  }, [projects, localValues]);

  const all = (projects ?? []) as any[];
  const statuses = Array.from(new Set(all.map((p) => p.status)));

  const filtered = all.filter((p) =>
    statusFilter === "All" ? true : p.status === statusFilter
  );

  const sorted = filtered.sort((a: any, b: any) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (sortBy === "name") {
      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    if (sortBy === "progress" || sortBy === "budget") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  // console.log("paged", paged);

  return (
    <>
      <Header />
      <div className="lg:p-6 p-4">
        <div className="flex lg:flex-row gap-4 flex-col items-center justify-between mb-4">
          <p className="text-2xl font-semibold">Projects</p>
          <div className="flex lg:flex-nowrap flex-wrap gap-2 items-center">
            <Input
              aria-label="Search projects"
              placeholder="Search projects"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 grid-cols-1 gap-4 mb-4 ">
          <div className="w-full">
            <p className=" font-medium mb-2">Status</p>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded px-2 py-1 w-full"
            >
              <option value="All">All</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-auto bg-card rounded">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left bg-slate-100">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Start</th>
                <th className="px-4 py-2">End</th>
                <th className="px-4 py-2">Progress</th>
                <th className="px-4 py-2">Budget</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t animate-pulse">
                      <td className="px-4 py-3">
                        <div className="h-4 w-32 bg-slate-200 rounded"></div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="h-4 w-24 bg-slate-200 rounded"></div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="h-4 w-24 bg-slate-200 rounded"></div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="h-4 w-20 bg-slate-200 rounded"></div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="h-4 w-24 bg-slate-200 rounded"></div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="h-4 w-14 bg-slate-200 rounded"></div>
                      </td>
                    </tr>
                  ))
                : paged.map((p: any) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-4 py-3">{p.name}</td>
                      <td className="px-4 py-3">
                        <Badge
                          color={
                            p.status === "Active"
                              ? "green"
                              : p.status === "Blocked"
                              ? "red"
                              : "gray"
                          }
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{p.startDate}</td>
                      <td className="px-4 py-3">{p.endDate}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={
                            localValues[p.id]?.progress ?? p.progress
                          }
                          onChange={(e) => {
                            if (!canEditProgress) return;
                            const v = Number(e.target.value);
                            setLocalValues((s) => ({
                              ...s,
                              [p.id]: {
                                ...(s[p.id] ?? {
                                  progress: p.progress,
                                  budget: p.budget,
                                }),
                                progress: v,
                              },
                            }));
                            scheduleMutate(p.id, { progress: v });
                          }}
                          className={`w-20 border px-2 py-1 rounded ${
                            !canEditProgress
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          aria-label={`Progress for ${p.name}`}
                          disabled={!canEditProgress}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          defaultValue={localValues[p.id]?.budget ?? p.budget}
                          onChange={(e) => {
                            if (!canEditBudget) return;
                            const v = Number(e.target.value);
                            setLocalValues((s) => ({
                              ...s,
                              [p.id]: {
                                ...(s[p.id] ?? {
                                  progress: p.progress,
                                  budget: p.budget,
                                }),
                                budget: v,
                              },
                            }));
                            scheduleMutate(p.id, { budget: v });
                          }}
                          className={`w-32 border px-2 py-1 rounded ${
                            !canEditBudget
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          aria-label={`Budget for ${p.name}`}
                          disabled={!canEditBudget}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <a
                            className="text-sky-600 hover:underline"
                            href={`/projects/${p.id}`}
                          >
                            Open
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm">
            Page {page} / {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => setPage((s) => Math.max(1, s - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              aria-label="Next page"
              disabled={page >= totalPages}
              onClick={() => setPage((s) => Math.min(totalPages, s + 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
