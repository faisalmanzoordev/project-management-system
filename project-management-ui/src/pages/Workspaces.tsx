import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";

export type TaskItemStatus =
  | "Pending"
  | "InProgress"
  | "Done"
  | "Overdue"
  | "OnHold"
  | "Critical"
  | "Cancelled";

export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export type ViewState = "table" | "kanban" | "calendar";

export type Workspace = {
  id: number;
  name: string;
  description?: string | null;
};

export type Project = {
  id: number;
  workspaceId: number;
  name: string;
  description?: string | null;
};

export type ApiTask = {
  id: number;
  projectId: number;
  parentTaskId?: number | null;
  title: string;
  description?: string | null;
  targetDate?: string | null;
  status: TaskItemStatus | number;
  priority?: TaskPriority | number; // optional (backend may not send)
  assigneeName?: string | null; // optional (backend may not send)
};

export type UiTask = {
  id: number;
  projectId: number;
  parentTaskId?: number | null;
  title: string;
  description?: string | null;
  targetDate?: string | null;
  status: TaskItemStatus;
  priority: TaskPriority;
  assigneeName: string;
};

export type KanbanColumn = {
  id: "todo" | "inprogress" | "done";
  title: string;
  statuses: TaskItemStatus[];
};

const kanbanColumns: KanbanColumn[] = [
  { id: "todo", title: "To Do", statuses: ["Pending", "OnHold"] },
  { id: "inprogress", title: "In Progress", statuses: ["InProgress", "Overdue", "Critical"] },
  { id: "done", title: "Done", statuses: ["Done", "Cancelled"] },
];

function normalizeTaskStatus(value: TaskItemStatus | number): TaskItemStatus {
  if (typeof value === "string") return value;

  const map: Record<number, TaskItemStatus> = {
    0: "Pending",
    1: "InProgress",
    2: "Done",
    3: "Overdue",
    4: "OnHold",
    5: "Critical",
    6: "Cancelled",
  };

  return map[value] ?? "Pending";
}

function normalizePriority(value: TaskPriority | number | undefined): TaskPriority {
  if (!value) return "Medium";
  if (typeof value === "string") return value;

  const map: Record<number, TaskPriority> = {
    0: "Low",
    1: "Medium",
    2: "High",
    3: "Critical",
  };

  return map[value] ?? "Medium";
}

function statusLabel(status: TaskItemStatus): string {
  switch (status) {
    case "InProgress":
      return "In Progress";
    case "OnHold":
      return "On Hold";
    default:
      return status;
  }
}

function statusPillClasses(status: TaskItemStatus): string {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset";
  switch (status) {
    case "Done":
      return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200`;
    case "InProgress":
      return `${base} bg-blue-50 text-blue-700 ring-blue-200`;
    case "Pending":
      return `${base} bg-slate-50 text-slate-700 ring-slate-200`;
    case "OnHold":
      return `${base} bg-amber-50 text-amber-800 ring-amber-200`;
    case "Overdue":
      return `${base} bg-rose-50 text-rose-700 ring-rose-200`;
    case "Critical":
      return `${base} bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200`;
    case "Cancelled":
      return `${base} bg-gray-50 text-gray-700 ring-gray-200`;
    default:
      return `${base} bg-slate-50 text-slate-700 ring-slate-200`;
  }
}

function formatDate(dateIso?: string | null): string {
  if (!dateIso) return "—";
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function initials(name: string): string {
  const clean = name.trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/).slice(0, 2);
  const letters = parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return letters || "?";
}

function sameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

type TaskModalProps = {
  task: UiTask;
  onClose: () => void;
};

const TaskModal: React.FC<TaskModalProps> = ({ task, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-lg bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
            <div className="mt-1 text-sm text-slate-600">
              {task.description ?? "No description"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md border border-slate-200 p-3">
            <div className="text-xs font-medium text-slate-500">Status</div>
            <div className="mt-1">
              <span className={statusPillClasses(task.status)}>{statusLabel(task.status)}</span>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 p-3">
            <div className="text-xs font-medium text-slate-500">Due Date</div>
            <div className="mt-1 font-medium text-slate-900">{formatDate(task.targetDate)}</div>
          </div>

          <div className="rounded-md border border-slate-200 p-3">
            <div className="text-xs font-medium text-slate-500">Priority</div>
            <div className="mt-1 font-medium text-slate-900">{task.priority}</div>
          </div>

          <div className="rounded-md border border-slate-200 p-3">
            <div className="text-xs font-medium text-slate-500">Assignee</div>
            <div className="mt-1 font-medium text-slate-900">{task.assigneeName}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Workspaces: React.FC = () => {
  const [view, setView] = useState<ViewState>("table");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<UiTask[]>([]);

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | "all">("all");
  const [selectedProjectId, setSelectedProjectId] = useState<number | "all">("all");

  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [selectedTask, setSelectedTask] = useState<UiTask | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [wsRes, prRes, taskRes] = await Promise.all([
          axiosInstance.get<Workspace[]>("workspaces"),
          axiosInstance.get<Project[]>("projects"),
          axiosInstance.get<ApiTask[]>("tasks"),
        ]);

        setWorkspaces(wsRes.data);
        setProjects(prRes.data);

        const normalizedTasks: UiTask[] = taskRes.data.map((t) => ({
          id: t.id,
          projectId: t.projectId,
          parentTaskId: t.parentTaskId ?? null,
          title: t.title,
          description: t.description ?? null,
          targetDate: t.targetDate ?? null,
          status: normalizeTaskStatus(t.status),
          priority: normalizePriority(t.priority),
          assigneeName: (t.assigneeName ?? "").trim() || "Unassigned",
        }));

        setTasks(normalizedTasks);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? "Failed to load workspace data.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const projectsForWorkspace = useMemo(() => {
    if (selectedWorkspaceId === "all") return projects;
    return projects.filter((p) => p.workspaceId === selectedWorkspaceId);
  }, [projects, selectedWorkspaceId]);

  useEffect(() => {
    if (selectedProjectId !== "all") {
      const projectIsInWorkspace =
        selectedWorkspaceId === "all" ||
        projectsForWorkspace.some((p) => p.id === selectedProjectId);

      if (!projectIsInWorkspace) setSelectedProjectId("all");
    }
  }, [projectsForWorkspace, selectedProjectId, selectedWorkspaceId]);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();

    const allowedProjectIds =
      selectedWorkspaceId === "all"
        ? null
        : new Set(projectsForWorkspace.map((p) => p.id));

    return tasks.filter((t) => {
      if (selectedProjectId !== "all" && t.projectId !== selectedProjectId) return false;
      if (allowedProjectIds && !allowedProjectIds.has(t.projectId)) return false;

      if (!q) return true;

      const haystack = `${t.title} ${t.description ?? ""} ${t.assigneeName}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [tasks, query, selectedWorkspaceId, selectedProjectId, projectsForWorkspace]);

  const tasksByColumn = useMemo(() => {
    const map: Record<string, UiTask[]> = {};
    for (const col of kanbanColumns) {
      map[col.id] = filteredTasks.filter((t) => col.statuses.includes(t.status));
    }
    return map as Record<KanbanColumn["id"], UiTask[]>;
  }, [filteredTasks]);

  const calendarCells = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);

    const startWeekday = monthStart.getDay(); // 0 Sun - 6 Sat
    const totalDays = monthEnd.getDate();

    const cells: Array<{ date: Date | null }> = [];

    for (let i = 0; i < startWeekday; i++) cells.push({ date: null });
    for (let day = 1; day <= totalDays; day++) {
      cells.push({ date: new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day) });
    }

    while (cells.length % 7 !== 0) cells.push({ date: null });

    return cells;
  }, [calendarMonth]);

  const tasksForDate = (date: Date): UiTask[] => {
    return filteredTasks.filter((t) => {
      if (!t.targetDate) return false;
      const due = new Date(t.targetDate);
      if (Number.isNaN(due.getTime())) return false;
      return sameDate(due, date);
    });
  };

  const ViewToggleButton: React.FC<{ id: ViewState; label: string }> = ({ id, label }) => (
    <button
      type="button"
      onClick={() => setView(id)}
      className={[
        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
        view === id
          ? "bg-slate-900 text-white"
          : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Workspaces</h1>
          <p className="mt-1 text-sm text-slate-600">
            Switch between table, Kanban, and calendar views for tasks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ViewToggleButton id="table" label="Table" />
          <ViewToggleButton id="kanban" label="Kanban" />
          <ViewToggleButton id="calendar" label="Calendar" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <label className="block text-sm font-medium text-slate-700">Workspace</label>
          <select
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            value={selectedWorkspaceId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedWorkspaceId(val === "all" ? "all" : Number(val));
            }}
          >
            <option value="all">All workspaces</option>
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3">
          <label className="block text-sm font-medium text-slate-700">Project</label>
          <select
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            value={selectedProjectId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedProjectId(val === "all" ? "all" : Number(val));
            }}
          >
            <option value="all">All projects</option>
            {projectsForWorkspace.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-6">
          <label className="block text-sm font-medium text-slate-700">Search</label>
          <input
            type="text"
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            placeholder="Search by title, description, or assignee..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">
          Loading workspace data...
        </div>
      )}

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* A) Table View */}
          {view === "table" && (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">Task List</div>
                <div className="mt-1 text-xs text-slate-500">
                  Showing {filteredTasks.length} task(s)
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Assignee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Priority
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-sm text-slate-600" colSpan={5}>
                          No tasks match your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setSelectedTask(t)}
                              className="text-left text-sm font-semibold text-slate-900 hover:underline"
                            >
                              {t.title}
                            </button>
                            <div className="mt-1 line-clamp-1 text-xs text-slate-500">
                              {t.description ?? ""}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-sm text-slate-700">
                            {t.assigneeName}
                          </td>

                          <td className="px-4 py-3 text-sm text-slate-700">
                            {t.priority}
                          </td>

                          <td className="px-4 py-3 text-sm text-slate-700">
                            {formatDate(t.targetDate)}
                          </td>

                          <td className="px-4 py-3 text-sm">
                            <span className={statusPillClasses(t.status)}>
                              {statusLabel(t.status)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* B) Kanban View */}
          {view === "kanban" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {kanbanColumns.map((col) => (
                <div key={col.id} className="rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <div className="text-sm font-semibold text-slate-900">{col.title}</div>
                    <div className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {tasksByColumn[col.id].length}
                    </div>
                  </div>

                  <div className="space-y-3 p-3">
                    {tasksByColumn[col.id].length === 0 ? (
                      <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                        No tasks in this lane.
                      </div>
                    ) : (
                      tasksByColumn[col.id].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTask(t)}
                          className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {t.title}
                              </div>
                              <div className="mt-1 line-clamp-2 text-xs text-slate-600">
                                {t.description ?? ""}
                              </div>
                            </div>

                            <span className={statusPillClasses(t.status)}>
                              {statusLabel(t.status)}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-xs text-slate-600">
                              Due: <span className="font-medium text-slate-900">{formatDate(t.targetDate)}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                                {initials(t.assigneeName)}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* C) Calendar View */}
          {view === "calendar" && (
            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Calendar</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCalendarMonth((d) => addMonths(d, -1))}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarMonth(new Date())}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarMonth((d) => addMonths(d, 1))}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="px-2 py-3">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendarCells.map((cell, idx) => {
                  const isToday = cell.date ? sameDate(cell.date, new Date()) : false;
                  const dayTasks = cell.date ? tasksForDate(cell.date) : [];

                  return (
                    <div
                      key={idx}
                      className="min-h-28 border-b border-r border-slate-200 p-2"
                    >
                      {cell.date ? (
                        <div className="flex items-center justify-between">
                          <div
                            className={[
                              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                              isToday ? "bg-slate-900 text-white" : "text-slate-700",
                            ].join(" ")}
                          >
                            {cell.date.getDate()}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {dayTasks.length > 0 ? `${dayTasks.length} task(s)` : ""}
                          </div>
                        </div>
                      ) : (
                        <div className="h-7" />
                      )}

                      <div className="mt-2 space-y-2">
                        {dayTasks.slice(0, 3).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedTask(t)}
                            className="w-full truncate rounded-md bg-slate-900 px-2 py-1 text-left text-xs font-medium text-white hover:bg-slate-800"
                          >
                            {t.title}
                          </button>
                        ))}

                        {dayTasks.length > 3 && (
                          <div className="text-xs text-slate-500">
                            +{dayTasks.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
        </>
      )}
    </div>
  );
};

export default Workspaces;