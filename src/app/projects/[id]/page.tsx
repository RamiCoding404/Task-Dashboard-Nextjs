/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchema, TaskInput } from "@/lib/schemas";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Header from "@/components/Header";
import ProgressChart from "@/components/ProgressChart";
import Loading from "@/components/ui/Loading";

function ProjectPageContent({
  id,
  projectData,
}: {
  id: string;
  projectData: any;
}) {
  const qc = useQueryClient();

  //de batgeb projects

  //de batgeb tasks
  const { data: tasksData } = useQuery({
    queryKey: ["project", id, "tasks"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${id}/tasks`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (input: TaskInput) => {
      const res = await fetch(`/api/projects/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", id, "tasks"] });
      const bc = new BroadcastChannel("project-updates");
      bc.postMessage({ type: "tasks-updated", projectId: id });
      bc.close();
    },
  });

  // Bulk update mutation
  const bulkMutation = useMutation({
    mutationFn: async ({
      taskIds,
      patch,
    }: {
      taskIds: string[];
      patch: any;
    }) => {
      const res = await fetch(`/api/projects/${id}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds, patch }),
      });
      if (!res.ok) throw new Error("Bulk update failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", id, "tasks"] });
      const bc = new BroadcastChannel("project-updates");
      bc.postMessage({ type: "tasks-updated", projectId: id });
      bc.close();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ taskId, patch }: any) => {
      const res = await fetch(`/api/projects/${id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onMutate: async ({ taskId, patch }: any) => {
      await qc.cancelQueries({ queryKey: ["project", id, "tasks"] });

      const previous = qc.getQueryData(["project", id, "tasks"]);

      qc.setQueryData(["project", id, "tasks"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((t: any) =>
            t.id === taskId ? { ...t, ...patch } : t
          ),
        };
      });

      return { previous };
    },
    onError: (err: any, variables: any, context: any) => {
      if (context?.previous) {
        qc.setQueryData(["project", id, "tasks"], context.previous);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", id, "tasks"] });
      const bc = new BroadcastChannel("project-updates");
      bc.postMessage({ type: "tasks-updated", projectId: id });
      bc.close();
    },
  });

  useEffect(() => {
    const bc = new BroadcastChannel("project-updates");
    bc.onmessage = (ev) => {
      if (ev.data?.type === "tasks-updated" && ev.data.projectId === id) {
        qc.invalidateQueries({ queryKey: ["project", id, "tasks"] });
      }
    };
    return () => bc.close();
  }, [id, qc]);

  const { register, handleSubmit, reset } = useForm<any>({
    resolver: zodResolver(taskSchema),
  });

  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValues, setEditValues] = React.useState<Record<string, any>>({});
  const [updatingTaskId, setUpdatingTaskId] = React.useState<string | null>(
    null
  );

  const [filterPriority, setFilterPriority] = React.useState<string>("all");
  const [filterAssignee, setFilterAssignee] = React.useState<string>("all");

  const assignees = React.useMemo(() => {
    const s = new Set<string>();
    tasksData?.tasks?.forEach((t: any) => {
      if (t.assignee) s.add(t.assignee);
    });
    return Array.from(s).sort();
  }, [tasksData]);

  const filteredTasks = React.useMemo(() => {
    if (!tasksData?.tasks) return [];
    return tasksData.tasks.filter((t: any) => {
      if (filterPriority !== "all" && t.priority !== filterPriority)
        return false;
      if (filterAssignee !== "all" && t.assignee !== filterAssignee)
        return false;
      return true;
    });
  }, [tasksData, filterPriority, filterAssignee]);

  useEffect(() => {
    Promise.resolve().then(() => {
      setSelected({});
      setEditingId(null);
    });
  }, [filterPriority, filterAssignee]);

  function toggleSelect(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function clearSelection() {
    setSelected({});
  }

  function selectedIds() {
    return Object.keys(selected).filter((k) => selected[k]);
  }

  async function onAdd(data: TaskInput) {
    addMutation.mutate(data);
    reset();
  }

  return (
    <div className="lg:p-6 p-4">
      <p className="text-2xl font-semibold mb-4">
        {projectData?.project?.name ?? "Project"}
      </p>

      {projectData?.project && (
        <ProgressChart
          progress={projectData.project.progress ?? 0}
          budget={projectData.project.budget ?? 0}
        />
      )}

      <section className="mb-6 mt-8">
        <h2 className="text-lg font-medium mb-2">Tasks</h2>

        <div className="flex lg:flex-row flex-col lg:items-center gap-2 mb-3">
          <div className="text-sm">
            Selected:{" "}
            {
              selectedIds().filter((id) =>
                filteredTasks.some((t: any) => t.id === id)
              ).length
            }
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => {
                const ids = selectedIds().filter((id) =>
                  filteredTasks.some((t: any) => t.id === id)
                );
                if (ids.length === 0) return;
                bulkMutation.mutate({
                  taskIds: ids,
                  patch: { status: "done" },
                });
                clearSelection();
              }}
            >
              Mark Done
            </Button>

            <Button
              onClick={() => {
                const ids = selectedIds().filter((id) =>
                  filteredTasks.some((t: any) => t.id === id)
                );
                if (ids.length === 0) return;
                bulkMutation.mutate({
                  taskIds: ids,
                  patch: { priority: "low" },
                });
                clearSelection();
              }}
            >
              Set Low Priority
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 grid-cols-1 gap-4 mb-4">
          <div className="flex flex-col  gap-2 w-full">
            <label className="text-sm font-medium">Priority:</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border px-2 py-1 rounded w-full"
            >
              <option value="all">All</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </div>

          <div className="flex flex-col  gap-2 w-full">
            <label className="text-sm font-medium">Assignee:</label>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="border px-2 py-1 rounded w-full"
            >
              <option value="all">All</option>
              {assignees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
        <form onSubmit={handleSubmit(onAdd)} className="flex gap-2 mb-4">
          <Input
            {...register("title")}
            placeholder="Task title"
            aria-label="Task title"
          />
          <Button type="submit">Add</Button>
        </form>

        <div className="space-y-4">
          {filteredTasks.map((t: any) => (
            <div
              key={t.id}
              className="bg-card p-3 rounded flex items-center justify-between"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={!!selected[t.id]}
                  onChange={() => toggleSelect(t.id)}
                  aria-label={`Select ${t.title}`}
                />
                <div>
                  {editingId === t.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editValues[t.id]?.title ?? t.title}
                        onChange={(e) =>
                          setEditValues((s) => ({
                            ...s,
                            [t.id]: {
                              ...(s[t.id] ?? {}),
                              title: e.target.value,
                            },
                          }))
                        }
                      />
                      <div className="flex gap-2">
                        <select
                          value={editValues[t.id]?.priority ?? t.priority}
                          onChange={(e) =>
                            setEditValues((s) => ({
                              ...s,
                              [t.id]: {
                                ...(s[t.id] ?? {}),
                                priority: e.target.value,
                              },
                            }))
                          }
                          className="border px-2 py-1 rounded"
                        >
                          <option value="low">low</option>
                          <option value="medium">medium</option>
                          <option value="high">high</option>
                        </select>
                        <Input
                          value={editValues[t.id]?.assignee ?? t.assignee}
                          onChange={(e) =>
                            setEditValues((s) => ({
                              ...s,
                              [t.id]: {
                                ...(s[t.id] ?? {}),
                                assignee: e.target.value,
                              },
                            }))
                          }
                          placeholder="Assignee"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">{t.title}</div>
                      <div className="text-sm font-bold">
                        {t.priority} • {t.assignee}
                      </div>
                      <div className="border p-3 mt-3 capitalize">
                        {t.status}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {editingId === t.id ? (
                  <>
                    <Button
                      onClick={() => {
                        const patch = editValues[t.id] ?? {};
                        updateMutation.mutate({ taskId: t.id, patch });
                        setEditingId(null);
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingId(null);
                        setEditValues((s) => ({ ...s, [t.id]: undefined }));
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setEditingId(t.id)}>Edit</Button>
                    <button
                      aria-label={`Toggle status for ${t.title}`}
                      className="text-sky-600 hover:underline disabled:opacity-50 cursor-pointer"
                      disabled={updatingTaskId === t.id}
                      onClick={() => {
                        setUpdatingTaskId(t.id);
                        updateMutation.mutate(
                          {
                            taskId: t.id,
                            patch: {
                              status: t.status === "done" ? "cancel" : "done",
                            },
                          },
                          {
                            onSettled: () => setUpdatingTaskId(null),
                          }
                        );
                      }}
                    >
                      {updatingTaskId === t.id
                        ? "Updating..."
                        : "Change Status"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: projectData, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  if (isLoading) return <Loading />;
  return (
    <>
      <Header />
      <ProjectPageContent id={id} projectData={projectData} />
    </>
  );
}
