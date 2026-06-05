import React, { useCallback, useMemo, useState } from "react";
import Modal from "../components/Modal";
import { useApp } from "../context/AppContext";
import type { AppUser, TaskItem, TaskPriority, TaskStatus } from "../context/AppContext";

import { Dropdown } from "../components/ui/Dropdown";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import {
    IconCalendar,
    IconColumns,
    IconEdit,
    IconGrid,
    IconPlus,
    IconTrash,
} from "../components/ui/icons";

type ViewMode = "table" | "kanban" | "calendar";

function classNames(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(" ");
}

function formatDate(dateIso?: string | null): string {
    if (!dateIso) return "—";
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function toDateInputValue(dateIso?: string | null): string {
    if (!dateIso) return "";
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function fromDateInputValue(dateInput: string): string | null {
    if (!dateInput.trim()) return null;
    const d = new Date(`${dateInput}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
}

function statusPill(status: TaskStatus): string {
    const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";
    if (status === "Done") return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200`;
    if (status === "In Progress") return `${base} bg-blue-50 text-blue-700 ring-blue-200`;
    return `${base} bg-slate-50 text-slate-700 ring-slate-200`;
}

function priorityPill(priority: TaskPriority): string {
    const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";
    if (priority === "High") return `${base} bg-rose-50 text-rose-700 ring-rose-200`;
    if (priority === "Medium") return `${base} bg-amber-50 text-amber-800 ring-amber-200`;
    return `${base} bg-slate-50 text-slate-700 ring-slate-200`;
}

function sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, delta: number): Date {
    return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

type TaskFormState = {
    title: string;
    description: string;
    assigneeId: number | null;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: string; // yyyy-mm-dd
};

const defaultTaskForm: TaskFormState = {
    title: "",
    description: "",
    assigneeId: null,
    priority: "Medium",
    status: "To Do",
    dueDate: "",
};

function userOptionLabel(u: AppUser): string {
    return `${u.name} (${u.email})`;
}

const Workspaces: React.FC = () => {
    const {
        users,
        workspaces,
        projects,
        tasks,
        selectedWorkspaceId,
        selectedProjectId,
        setSelectedWorkspaceId,
        setSelectedProjectId,
        isLoading,
        error,

        createWorkspace,
        updateWorkspace,
        deleteWorkspace,

        createProject,
        updateProject,
        deleteProject,

        createTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
    } = useApp();

    const [viewMode, setViewMode] = useState<ViewMode>("table");
    const [search, setSearch] = useState<string>("");

    const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());

    // Modals
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isTaskEditMode, setIsTaskEditMode] = useState(false);
    const [taskEditId, setTaskEditId] = useState<number | null>(null);
    const [taskForm, setTaskForm] = useState<TaskFormState>({ ...defaultTaskForm });

    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

    const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
    const [workspaceEditId, setWorkspaceEditId] = useState<number | null>(null);
    const [workspaceName, setWorkspaceName] = useState("");
    const [workspaceDescription, setWorkspaceDescription] = useState("");

    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [projectEditId, setProjectEditId] = useState<number | null>(null);
    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] = useState("");

    // Subtask create
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [newSubtaskAssigneeId, setNewSubtaskAssigneeId] = useState<number | null>(null);
    const [newSubtaskPriority, setNewSubtaskPriority] = useState<TaskPriority>("Medium");
    const [newSubtaskDueDate, setNewSubtaskDueDate] = useState("");

    const selectedWorkspace = useMemo(
        () => workspaces.find((w) => w.id === selectedWorkspaceId) ?? null,
        [workspaces, selectedWorkspaceId]
    );

    const selectedProject = useMemo(
        () => projects.find((p) => p.id === selectedProjectId) ?? null,
        [projects, selectedProjectId]
    );

    const taskById = useMemo(() => {
        const map = new Map<number, TaskItem>();
        for (const t of tasks) map.set(t.id, t);
        return map;
    }, [tasks]);

    const selectedTask = useMemo(
        () => (selectedTaskId ? taskById.get(selectedTaskId) ?? null : null),
        [selectedTaskId, taskById]
    );

    const topLevelTasks = useMemo(() => tasks.filter((t) => !t.parentTaskId), [tasks]);

    const filteredTasks = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return topLevelTasks;

        return topLevelTasks.filter((t) => {
            const hay = `${t.title} ${t.description ?? ""} ${t.assigneeName ?? ""}`.toLowerCase();
            return hay.includes(q);
        });
    }, [topLevelTasks, search]);

    const selectedTaskSubtasks = useMemo(() => {
        if (!selectedTask) return [];
        return tasks
            .filter((t) => t.parentTaskId === selectedTask.id)
            .sort((a, b) => a.id - b.id);
    }, [tasks, selectedTask]);

    const kanbanColumns = useMemo(
        () => [
            { title: "To Do", status: "To Do" as TaskStatus },
            { title: "In Progress", status: "In Progress" as TaskStatus },
            { title: "Done", status: "Done" as TaskStatus },
        ],
        []
    );

    const calendarCells = useMemo(() => {
        const start = startOfMonth(calendarMonth);
        const end = endOfMonth(calendarMonth);

        const startWeekday = start.getDay();
        const totalDays = end.getDate();

        const cells: Array<{ date: Date | null }> = [];
        for (let i = 0; i < startWeekday; i++) cells.push({ date: null });

        for (let day = 1; day <= totalDays; day++) {
            cells.push({ date: new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day) });
        }

        while (cells.length % 7 !== 0) cells.push({ date: null });
        return cells;
    }, [calendarMonth]);

    const tasksForCalendarDate = useCallback(
        (date: Date) => {
            return tasks
                .filter((t) => t.dueDate)
                .filter((t) => {
                    const d = new Date(t.dueDate!);
                    if (Number.isNaN(d.getTime())) return false;
                    return sameDay(d, date);
                })
                .sort((a, b) => a.title.localeCompare(b.title));
        },
        [tasks]
    );

    function openCreateTaskModal() {
        if (!selectedProjectId) return;
        setIsTaskEditMode(false);
        setTaskEditId(null);
        setTaskForm({ ...defaultTaskForm });
        setIsTaskModalOpen(true);
    }

    function openEditTaskModal(task: TaskItem) {
        setIsTaskEditMode(true);
        setTaskEditId(task.id);
        setTaskForm({
            title: task.title,
            description: task.description ?? "",
            assigneeId: task.assigneeId ?? null,
            priority: task.priority,
            status: task.status,
            dueDate: toDateInputValue(task.dueDate ?? null),
        });
        setIsTaskModalOpen(true);
    }

    //function openTaskDetail(taskId: number) {
    //    setSelectedTaskId(taskId);
    //    setNewSubtaskTitle("");
    //    setNewSubtaskAssigneeId(null);
    //    setNewSubtaskPriority("Medium");
    //    setNewSubtaskDueDate("");
    //}

    function closeTaskDetail() {
        setSelectedTaskId(null);
    }

    async function handleSubmitTaskForm(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedProjectId) return;
        if (!taskForm.title.trim()) return;

        const dueIso = fromDateInputValue(taskForm.dueDate);

        if (!isTaskEditMode) {
            await createTask({
                projectId: selectedProjectId,
                parentTaskId: null,
                title: taskForm.title,
                description: taskForm.description || null,
                status: taskForm.status,
                priority: taskForm.priority,
                dueDate: dueIso,
                assigneeId: taskForm.assigneeId ?? null,
            });
        } else if (taskEditId) {
            const current = taskById.get(taskEditId);
            if (!current) return;

            await updateTask(taskEditId, {
                projectId: selectedProjectId,
                parentTaskId: current.parentTaskId ?? null,
                title: taskForm.title,
                description: taskForm.description || null,
                status: taskForm.status,
                priority: taskForm.priority,
                dueDate: dueIso,
                assigneeId: taskForm.assigneeId ?? null,
            });
        }

        setIsTaskModalOpen(false);
    }

    async function handleDeleteTask(taskId: number) {
        const ok = window.confirm("Delete this task?");
        if (!ok) return;
        await deleteTask(taskId);
        if (selectedTaskId === taskId) closeTaskDetail();
    }

    function openCreateWorkspaceModal() {
        setWorkspaceEditId(null);
        setWorkspaceName("");
        setWorkspaceDescription("");
        setIsWorkspaceModalOpen(true);
    }

    function openEditWorkspaceModal() {
        if (!selectedWorkspace) return;
        setWorkspaceEditId(selectedWorkspace.id);
        setWorkspaceName(selectedWorkspace.name);
        setWorkspaceDescription(selectedWorkspace.description ?? "");
        setIsWorkspaceModalOpen(true);
    }

    async function handleSubmitWorkspace(e: React.FormEvent) {
        e.preventDefault();
        if (!workspaceName.trim()) return;

        if (!workspaceEditId) {
            const created = await createWorkspace({
                name: workspaceName,
                description: workspaceDescription || null,
            });
            setSelectedWorkspaceId(created.id);
        } else {
            await updateWorkspace(workspaceEditId, {
                name: workspaceName,
                description: workspaceDescription || null,
            });
        }

        setIsWorkspaceModalOpen(false);
    }

    async function handleDeleteWorkspace() {
        if (!selectedWorkspace) return;
        const ok = window.confirm("Delete this workspace? This will also remove access to its projects/tasks.");
        if (!ok) return;
        await deleteWorkspace(selectedWorkspace.id);
    }

    function openCreateProjectModal() {
        if (!selectedWorkspaceId) return;
        setProjectEditId(null);
        setProjectName("");
        setProjectDescription("");
        setIsProjectModalOpen(true);
    }

    function openEditProjectModal() {
        if (!selectedProject) return;
        setProjectEditId(selectedProject.id);
        setProjectName(selectedProject.name);
        setProjectDescription(selectedProject.description ?? "");
        setIsProjectModalOpen(true);
    }

    async function handleSubmitProject(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedWorkspaceId) return;
        if (!projectName.trim()) return;

        if (!projectEditId) {
            const created = await createProject({
                workspaceId: selectedWorkspaceId,
                name: projectName,
                description: projectDescription || null,
            });
            setSelectedProjectId(created.id);
        } else {
            await updateProject(projectEditId, {
                workspaceId: selectedWorkspaceId,
                name: projectName,
                description: projectDescription || null,
            });
        }

        setIsProjectModalOpen(false);
    }

    async function handleDeleteProject() {
        if (!selectedProject) return;
        const ok = window.confirm("Delete this project and all its tasks?");
        if (!ok) return;
        await deleteProject(selectedProject.id);
    }

    async function toggleSubtaskDone(subtask: TaskItem, done: boolean) {
        if (!selectedProjectId) return;

        const newStatus: TaskStatus = done ? "Done" : "To Do";

        await updateTask(subtask.id, {
            projectId: subtask.projectId,
            parentTaskId: subtask.parentTaskId ?? null,
            title: subtask.title,
            description: subtask.description ?? null,
            status: newStatus,
            priority: subtask.priority,
            dueDate: subtask.dueDate ?? null,
            assigneeId: subtask.assigneeId ?? null,
        });
    }

    async function addSubtask() {
        if (!selectedProjectId || !selectedTask) return;
        if (!newSubtaskTitle.trim()) return;

        const dueIso = fromDateInputValue(newSubtaskDueDate);

        await createTask({
            projectId: selectedProjectId,
            parentTaskId: selectedTask.id,
            title: newSubtaskTitle,
            description: null,
            status: "To Do",
            priority: newSubtaskPriority,
            dueDate: dueIso,
            assigneeId: newSubtaskAssigneeId ?? null,
        });

        setNewSubtaskTitle("");
        setNewSubtaskAssigneeId(null);
        setNewSubtaskPriority("Medium");
        setNewSubtaskDueDate("");
    }

    const canCreateTask = Boolean(selectedWorkspaceId && selectedProjectId);

    const workspaceDropdownItems = useMemo(
        () =>
            workspaces.map((w) => ({
                value: w.id,
                label: w.name,
                description: w.description ?? undefined,
            })),
        [workspaces]
    );

    const projectDropdownItems = useMemo(
        () =>
            projects.map((p) => ({
                value: p.id,
                label: p.name,
                description: p.description ?? undefined,
            })),
        [projects]
    );

    const assigneeDropdownItems = useMemo(
        () =>
            [
                { value: 0, label: "Unassigned", description: "No user assigned" },
                ...users.map((u) => ({
                    value: u.id,
                    label: userOptionLabel(u),
                    description: u.role ? `Role: ${u.role}` : undefined,
                })),
            ],
        [users]
    );

    const viewTabs = [
        { id: "table" as const, label: "Table", icon: <IconGrid /> },
        { id: "kanban" as const, label: "Kanban", icon: <IconColumns /> },
        { id: "calendar" as const, label: "Calendar", icon: <IconCalendar /> },
    ];

    return (
        <div className="space-y-6">
            {/* Premium Header + Toolbar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                            Workspace Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Manage workspaces, projects, tasks, subtasks, and assignments with premium views.
                        </p>

                        <div className="mt-3 text-xs text-slate-500">
                            Current:{" "}
                            <span className="font-semibold text-slate-800">{selectedWorkspace?.name ?? "—"}</span>{" "}
                            /{" "}
                            <span className="font-semibold text-slate-800">{selectedProject?.name ?? "—"}</span>
                        </div>
                    </div>

                    {/* Unified action toolbar */}
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<IconPlus />}
                            onClick={openCreateWorkspaceModal}
                        >
                            Workspace
                        </Button>

                        <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<IconPlus />}
                            disabled={!selectedWorkspaceId}
                            onClick={openCreateProjectModal}
                        >
                            Project
                        </Button>

                        <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<IconPlus />}
                            disabled={!canCreateTask}
                            onClick={openCreateTaskModal}
                        >
                            New Task
                        </Button>

                        <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

                        <IconButton
                            ariaLabel="Edit workspace"
                            icon={<IconEdit />}
                            disabled={!selectedWorkspace}
                            onClick={openEditWorkspaceModal}
                        />

                        <IconButton
                            ariaLabel="Delete workspace"
                            icon={<IconTrash />}
                            tone="danger"
                            disabled={!selectedWorkspace}
                            onClick={handleDeleteWorkspace}
                        />

                        <IconButton
                            ariaLabel="Edit project"
                            icon={<IconEdit />}
                            disabled={!selectedProject}
                            onClick={openEditProjectModal}
                        />

                        <IconButton
                            ariaLabel="Delete project"
                            icon={<IconTrash />}
                            tone="danger"
                            disabled={!selectedProject}
                            onClick={handleDeleteProject}
                        />
                    </div>
                </div>

                {/* Filters row (responsive grid) */}
                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                        <Dropdown<number>
                            label="Workspace"
                            items={workspaceDropdownItems}
                            value={selectedWorkspaceId}
                            onChange={(id) => setSelectedWorkspaceId(id)}
                            placeholder="Select workspace..."
                        />
                    </div>

                    <div className="lg:col-span-4">
                        <Dropdown<number>
                            label="Project"
                            items={projectDropdownItems}
                            value={selectedProjectId}
                            onChange={(id) => setSelectedProjectId(id)}
                            placeholder={selectedWorkspaceId ? "Select project..." : "Select workspace first..."}
                            buttonClassName={!selectedWorkspaceId ? "opacity-60 pointer-events-none" : ""}
                        />
                    </div>

                    <div className="lg:col-span-4">
                        <div className="mb-1 text-sm font-medium text-slate-700">Search</div>
                        <div className="rounded-xl bg-white shadow-sm ring-1 ring-inset ring-slate-200 focus-within:ring-4 focus-within:ring-slate-900/10">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by title, description, assignee..."
                                className="w-full rounded-xl bg-transparent px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* View tabs */}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                    {viewTabs.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setViewMode(t.id)}
                            className={[
                                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
                                "ring-1 ring-inset",
                                viewMode === t.id
                                    ? "bg-slate-900 text-white ring-slate-900 shadow-sm"
                                    : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
                            ].join(" ")}
                        >
                            <span className={viewMode === t.id ? "text-white" : "text-slate-600"}>{t.icon}</span>
                            {t.label}
                        </button>
                    ))}

                    <div className="ml-auto text-xs text-slate-500">
                        Showing <span className="font-semibold text-slate-700">{filteredTasks.length}</span> task(s)
                    </div>
                </div>
            </div>

            {/* Loading / Error */}
            {isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
                    Loading data...
                </div>
            ) : null}

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
                    {error}
                </div>
            ) : null}

            {!isLoading && !error ? (
                <>
                    {/* TABLE VIEW */}
                    {viewMode === "table" ? (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-5 py-4">
                                <div className="text-sm font-extrabold text-slate-900">Tasks</div>
                                <div className="mt-1 text-xs text-slate-500">
                                    Click any task to open details and manage subtasks.
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            {["Title", "Description", "Assignee", "Priority", "Due", "Status", "Actions"].map((h) => (
                                                <th
                                                    key={h}
                                                    className={[
                                                        "px-5 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-600",
                                                        h === "Actions" ? "text-right" : "",
                                                    ].join(" ")}
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-200">
                                        {filteredTasks.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-600">
                                                    No tasks found for the selected project.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTasks.map((t) => (
                                                <tr key={t.id} className="hover:bg-slate-50">
                                                    <td className="px-5 py-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedTaskId(t.id)}
                                                            className="text-left text-sm font-extrabold text-slate-900 hover:underline"
                                                        >
                                                            {t.title}
                                                        </button>
                                                        <div className="mt-1 text-xs text-slate-500">
                                                            Subtasks:{" "}
                                                            <span className="font-semibold text-slate-700">
                                                                {tasks.filter((x) => x.parentTaskId === t.id).length}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-slate-700">
                                                        <div className="max-w-md truncate">{t.description ?? "—"}</div>
                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-slate-700">
                                                        {t.assigneeName ?? "Unassigned"}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span className={priorityPill(t.priority)}>{t.priority}</span>
                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-slate-700">
                                                        {formatDate(t.dueDate ?? null)}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={statusPill(t.status)}>{t.status}</span>
                                                            <Button
                                                                variant="soft"
                                                                size="sm"
                                                                onClick={() => toggleTaskStatus(t.id)}
                                                            >
                                                                Toggle
                                                            </Button>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <IconButton
                                                                ariaLabel="Edit task"
                                                                icon={<IconEdit />}
                                                                onClick={() => openEditTaskModal(t)}
                                                            />
                                                            <IconButton
                                                                ariaLabel="Delete task"
                                                                icon={<IconTrash />}
                                                                tone="danger"
                                                                onClick={() => handleDeleteTask(t.id)}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : null}

                    {/* KANBAN VIEW */}
                    {viewMode === "kanban" ? (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            {kanbanColumns.map((col) => {
                                const colTasks = filteredTasks
                                    .filter((t) => t.status === col.status)
                                    .sort((a, b) => a.title.localeCompare(b.title));

                                return (
                                    <div key={col.title} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                                            <div className="text-sm font-extrabold text-slate-900">{col.title}</div>
                                            <div className="rounded-full bg-slate-100 px-2 py-1 text-xs font-extrabold text-slate-700">
                                                {colTasks.length}
                                            </div>
                                        </div>

                                        <div className="space-y-3 p-4">
                                            {colTasks.length === 0 ? (
                                                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                                                    No tasks in this column.
                                                </div>
                                            ) : (
                                                colTasks.map((t) => (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => setSelectedTaskId(t.id)}
                                                        className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:bg-slate-50"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="truncate text-sm font-extrabold text-slate-900">{t.title}</div>
                                                                <div className="mt-1 line-clamp-2 text-xs text-slate-600">
                                                                    {t.description ?? ""}
                                                                </div>
                                                            </div>
                                                            <span className={statusPill(t.status)}>{t.status}</span>
                                                        </div>

                                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                                            <span className={priorityPill(t.priority)}>{t.priority}</span>
                                                            <span className="text-xs text-slate-600">
                                                                Due: <span className="font-semibold text-slate-900">{formatDate(t.dueDate ?? null)}</span>
                                                            </span>
                                                            <span className="text-xs text-slate-600">
                                                                Assignee:{" "}
                                                                <span className="font-semibold text-slate-900">{t.assigneeName ?? "Unassigned"}</span>
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}

                    {/* CALENDAR VIEW */}
                    {viewMode === "calendar" ? (
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="text-sm font-extrabold text-slate-900">Calendar</div>
                                    <div className="mt-1 text-xs text-slate-500">
                                        {calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="secondary" size="sm" onClick={() => setCalendarMonth((d) => addMonths(d, -1))}>
                                        Prev
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={() => setCalendarMonth(new Date())}>
                                        Today
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={() => setCalendarMonth((d) => addMonths(d, 1))}>
                                        Next
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-extrabold uppercase tracking-wide text-slate-600">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                                    <div key={d} className="px-2 py-3">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7">
                                {calendarCells.map((cell, idx) => {
                                    const isToday = cell.date ? sameDay(cell.date, new Date()) : false;
                                    const dayTasks = cell.date ? tasksForCalendarDate(cell.date) : [];

                                    return (
                                        <div key={idx} className="min-h-28 border-b border-r border-slate-200 p-2">
                                            {cell.date ? (
                                                <div className="flex items-center justify-between">
                                                    <div
                                                        className={classNames(
                                                            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold",
                                                            isToday ? "bg-slate-900 text-white" : "text-slate-700"
                                                        )}
                                                    >
                                                        {cell.date.getDate()}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">
                                                        {dayTasks.length ? `${dayTasks.length} task(s)` : ""}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-7" />
                                            )}

                                            <div className="mt-2 space-y-2">
                                                {dayTasks.slice(0, 4).map((t) => (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => setSelectedTaskId(t.id)}
                                                        className={classNames(
                                                            "w-full truncate rounded-lg px-2 py-1 text-left text-xs font-extrabold",
                                                            t.status === "Done"
                                                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                                : t.status === "In Progress"
                                                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                                                    : "bg-slate-900 text-white hover:bg-slate-800"
                                                        )}
                                                    >
                                                        {t.title}
                                                    </button>
                                                ))}
                                                {dayTasks.length > 4 ? (
                                                    <div className="text-xs text-slate-500">+{dayTasks.length - 4} more</div>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}
                </>
            ) : null}

            {/* Task Create/Edit Modal */}
            <Modal
                title={isTaskEditMode ? "Edit Task" : "Create New Task"}
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                maxWidthClassName="max-w-3xl"
            >
                <form onSubmit={handleSubmitTaskForm} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <div className="mb-1 text-sm font-medium text-slate-700">Title</div>
                            <input
                                value={taskForm.title}
                                onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))}
                                className="w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                                required
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <div className="mb-1 text-sm font-medium text-slate-700">Description</div>
                            <textarea
                                value={taskForm.description}
                                onChange={(e) => setTaskForm((p) => ({ ...p, description: e.target.value }))}
                                className="w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                                rows={4}
                            />
                        </div>

                        <div>
                            <Dropdown<number>
                                label="Assignee"
                                items={assigneeDropdownItems}
                                value={taskForm.assigneeId ?? 0}
                                onChange={(id) => setTaskForm((p) => ({ ...p, assigneeId: id === 0 ? null : id }))}
                            />
                        </div>

                        <div>
                            <div className="mb-1 text-sm font-medium text-slate-700">Due Date</div>
                            <input
                                type="date"
                                value={taskForm.dueDate}
                                onChange={(e) => setTaskForm((p) => ({ ...p, dueDate: e.target.value }))}
                                className="w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                            />
                        </div>

                        <div>
                            <Dropdown<TaskPriority>
                                label="Priority"
                                items={[
                                    { value: "Low", label: "Low" },
                                    { value: "Medium", label: "Medium" },
                                    { value: "High", label: "High" },
                                ]}
                                value={taskForm.priority}
                                onChange={(v) => setTaskForm((p) => ({ ...p, priority: v }))}
                            />
                        </div>

                        <div>
                            <Dropdown<TaskStatus>
                                label="Status"
                                items={[
                                    { value: "To Do", label: "To Do" },
                                    { value: "In Progress", label: "In Progress" },
                                    { value: "Done", label: "Done" },
                                ]}
                                value={taskForm.status}
                                onChange={(v) => setTaskForm((p) => ({ ...p, status: v }))}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-end">
                        <Button variant="secondary" onClick={() => setIsTaskModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={!selectedProjectId}>
                            {isTaskEditMode ? "Save Changes" : "Create Task"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Workspace Create/Edit Modal */}
            <Modal
                title={workspaceEditId ? "Edit Workspace" : "Create Workspace"}
                isOpen={isWorkspaceModalOpen}
                onClose={() => setIsWorkspaceModalOpen(false)}
                maxWidthClassName="max-w-2xl"
            >
                <form onSubmit={handleSubmitWorkspace} className="space-y-4">
                    <div>
                        <div className="mb-1 text-sm font-medium text-slate-700">Name</div>
                        <input
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            className="w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                            required
                        />
                    </div>

                    <div>
                        <div className="mb-1 text-sm font-medium text-slate-700">Description</div>
                        <textarea
                            value={workspaceDescription}
                            onChange={(e) => setWorkspaceDescription(e.target.value)}
                            className="w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                            rows={4}
                        />
                    </div>

                    <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-end">
                        <Button variant="secondary" onClick={() => setIsWorkspaceModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            {workspaceEditId ? "Save Changes" : "Create Workspace"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Project Create/Edit Modal */}
            <Modal
                title={projectEditId ? "Edit Project" : "Create Project"}
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                maxWidthClassName="max-w-2xl"
            >
                <form onSubmit={handleSubmitProject} className="space-y-4">
                    <div>
                        <div className="mb-1 text-sm font-medium text-slate-700">Name</div>
                        <input
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className="w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                            required
                        />
                    </div>

                    <div>
                        <div className="mb-1 text-sm font-medium text-slate-700">Description</div>
                        <textarea
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                            className="w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                            rows={4}
                        />
                    </div>

                    <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-end">
                        <Button variant="secondary" onClick={() => setIsProjectModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={!selectedWorkspaceId}>
                            {projectEditId ? "Save Changes" : "Create Project"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Task Detail Modal with Subtasks */}
            <Modal
                title="Task Details"
                isOpen={Boolean(selectedTask)}
                onClose={closeTaskDetail}
                maxWidthClassName="max-w-4xl"
            >
                {selectedTask ? (
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="text-base font-extrabold text-slate-900">{selectedTask.title}</div>
                                    <div className="mt-1 text-sm text-slate-700">{selectedTask.description ?? "No description"}</div>

                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className={statusPill(selectedTask.status)}>{selectedTask.status}</span>
                                        <span className={priorityPill(selectedTask.priority)}>{selectedTask.priority}</span>
                                    </div>

                                    <div className="mt-3 text-sm text-slate-700">
                                        Assignee:{" "}
                                        <span className="font-semibold text-slate-900">
                                            {selectedTask.assigneeName ?? "Unassigned"}
                                        </span>
                                    </div>

                                    <div className="mt-1 text-sm text-slate-700">
                                        Due:{" "}
                                        <span className="font-semibold text-slate-900">
                                            {formatDate(selectedTask.dueDate ?? null)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button variant="soft" size="sm" onClick={() => toggleTaskStatus(selectedTask.id)}>
                                        Toggle Status
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            closeTaskDetail();
                                            openEditTaskModal(selectedTask);
                                        }}
                                    >
                                        Edit
                                    </Button>
                                    <Button variant="danger" size="sm" onClick={() => handleDeleteTask(selectedTask.id)}>
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Subtasks */}
                        <div>
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-extrabold text-slate-900">Subtasks</h4>
                                <div className="text-xs text-slate-500">{selectedTaskSubtasks.length} subtask(s)</div>
                            </div>

                            <div className="mt-3 space-y-2">
                                {selectedTaskSubtasks.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600">
                                        No subtasks yet. Add one below.
                                    </div>
                                ) : (
                                    selectedTaskSubtasks.map((st) => (
                                        <div
                                            key={st.id}
                                            className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                                        >
                                            <label className="flex flex-1 items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={st.status === "Done"}
                                                    onChange={(e) => toggleSubtaskDone(st, e.target.checked)}
                                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20"
                                                />
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-extrabold text-slate-900">{st.title}</div>
                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        <span className={statusPill(st.status)}>{st.status}</span>
                                                        <span className={priorityPill(st.priority)}>{st.priority}</span>
                                                        <span className="text-xs text-slate-600">
                                                            Due:{" "}
                                                            <span className="font-semibold text-slate-900">
                                                                {formatDate(st.dueDate ?? null)}
                                                            </span>
                                                        </span>
                                                        <span className="text-xs text-slate-600">
                                                            Assignee:{" "}
                                                            <span className="font-semibold text-slate-900">{st.assigneeName ?? "Unassigned"}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </label>

                                            <IconButton
                                                ariaLabel="Delete subtask"
                                                icon={<IconTrash />}
                                                tone="danger"
                                                onClick={() => handleDeleteTask(st.id)}
                                            />
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add subtask */}
                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="text-sm font-extrabold text-slate-900">Add Subtask</div>

                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <div className="mb-1 text-sm font-medium text-slate-700">Title</div>
                                        <input
                                            value={newSubtaskTitle}
                                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                            className="w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                                            placeholder="Subtask title..."
                                        />
                                    </div>

                                    <div>
                                        <Dropdown<number>
                                            label="Assignee"
                                            items={assigneeDropdownItems}
                                            value={newSubtaskAssigneeId ?? 0}
                                            onChange={(id) => setNewSubtaskAssigneeId(id === 0 ? null : id)}
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-1 text-sm font-medium text-slate-700">Due Date</div>
                                        <input
                                            type="date"
                                            value={newSubtaskDueDate}
                                            onChange={(e) => setNewSubtaskDueDate(e.target.value)}
                                            className="w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                                        />
                                    </div>

                                    <div>
                                        <Dropdown<TaskPriority>
                                            label="Priority"
                                            items={[
                                                { value: "Low", label: "Low" },
                                                { value: "Medium", label: "Medium" },
                                                { value: "High", label: "High" },
                                            ]}
                                            value={newSubtaskPriority}
                                            onChange={(v) => setNewSubtaskPriority(v)}
                                        />
                                    </div>

                                    <div className="flex items-end">
                                        <Button variant="primary" className="w-full" onClick={addSubtask}>
                                            Add Subtask
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};

export default Workspaces;