import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import axiosInstance from "../api/axiosInstance";

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

export type TaskStatus = "To Do" | "In Progress" | "Done";
export type TaskPriority = "Low" | "Medium" | "High";

export type AppUser = {
    id: number;
    name: string;
    email: string;
    roleId?: number;
    role?: string;
};

export type TaskItem = {
    id: number;
    projectId: number;
    parentTaskId?: number | null;
    title: string;
    description?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string | null; // ISO
    assigneeId?: number | null;
    assigneeName?: string | null;
};

export type WorkspaceUpsertRequest = {
    name: string;
    description?: string | null;
};

export type ProjectUpsertRequest = {
    workspaceId: number;
    name: string;
    description?: string | null;
};

export type TaskUpsertRequest = {
    projectId: number;
    parentTaskId?: number | null;
    title: string;
    description?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string | null; // ISO
    assigneeId?: number | null; // used for assignment endpoints ONLY (not sent in task payload)
};

type ApiWorkspace = Workspace;
type ApiProject = Project;

type ApiUser = {
    id: number;
    name: string;
    email: string;
    roleId?: number;
    role?: string;
};

type ApiTask = {
    id: number;
    projectId: number;
    parentTaskId?: number | null;
    title: string;
    description?: string | null;

    // backend may use either naming
    dueDate?: string | null;
    targetDate?: string | null;

    status: string | number;
    priority?: string | number;

    // new fields
    assigneeId?: number | null;
    assigneeName?: string | null;
};

function normalizeTaskStatus(value: string | number): TaskStatus {
    if (typeof value === "number") {
        // common mapping if backend returns enum int
        if (value === 1) return "In Progress";
        if (value === 2) return "Done";
        return "To Do";
    }

    const s = value.trim().toLowerCase();
    if (s === "to do" || s === "todo" || s === "pending") return "To Do";
    if (s === "in progress" || s === "inprogress") return "In Progress";
    if (s === "done" || s === "completed" || s === "complete") return "Done";
    return "To Do";
}

function normalizePriority(value: string | number | undefined): TaskPriority {
    if (value === undefined || value === null) return "Medium";
    if (typeof value === "number") {
        if (value <= 0) return "Low";
        if (value === 1) return "Medium";
        return "High";
    }

    const s = value.trim().toLowerCase();
    if (s === "low") return "Low";
    if (s === "high") return "High";
    return "Medium";
}

function normalizeDueDate(api: ApiTask): string | null {
    const raw = api.dueDate ?? api.targetDate ?? null;
    if (!raw) return null;

    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;

    return d.toISOString();
}

function toApiStatus(status: TaskStatus): string {
    return status;
}

function toApiPriority(priority: TaskPriority): string {
    return priority;
}

function safeNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
    if (typeof value === "string" && value.trim()) {
        const n = Number(value);
        if (Number.isFinite(n) && n > 0) return n;
    }
    return null;
}

type AppContextValue = {
    users: AppUser[];
    workspaces: Workspace[];
    projects: Project[];
    tasks: TaskItem[];

    selectedWorkspaceId: number | null;
    selectedProjectId: number | null;

    isLoading: boolean;
    error: string | null;

    setSelectedWorkspaceId: (workspaceId: number | null) => void;
    setSelectedProjectId: (projectId: number | null) => void;

    // Workspaces
    fetchWorkspaces: () => Promise<void>;
    createWorkspace: (request: WorkspaceUpsertRequest) => Promise<Workspace>;
    updateWorkspace: (id: number, request: WorkspaceUpsertRequest) => Promise<Workspace>;
    deleteWorkspace: (id: number) => Promise<void>;

    // Projects
    fetchProjectsByWorkspaceId: (workspaceId: number) => Promise<void>;
    createProject: (request: ProjectUpsertRequest) => Promise<Project>;
    updateProject: (id: number, request: ProjectUpsertRequest) => Promise<Project>;
    deleteProject: (id: number) => Promise<void>;

    // Tasks
    fetchTasksByProjectId: (projectId: number) => Promise<void>;
    createTask: (request: TaskUpsertRequest) => Promise<TaskItem>;
    updateTask: (id: number, request: TaskUpsertRequest) => Promise<TaskItem>;
    deleteTask: (id: number) => Promise<void>;
    toggleTaskStatus: (taskId: number) => Promise<TaskItem | null>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

const LS_SELECTED_WORKSPACE = "selectedWorkspaceId";
const LS_SELECTED_PROJECT = "selectedProjectId";

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<TaskItem[]>([]);

    const [selectedWorkspaceId, _setSelectedWorkspaceId] = useState<number | null>(null);
    const [selectedProjectId, _setSelectedProjectId] = useState<number | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const setSelectedWorkspaceId = useCallback((workspaceId: number | null) => {
        _setSelectedWorkspaceId(workspaceId);
        if (workspaceId === null) localStorage.removeItem(LS_SELECTED_WORKSPACE);
        else localStorage.setItem(LS_SELECTED_WORKSPACE, String(workspaceId));
    }, []);

    const setSelectedProjectId = useCallback((projectId: number | null) => {
        _setSelectedProjectId(projectId);
        if (projectId === null) localStorage.removeItem(LS_SELECTED_PROJECT);
        else localStorage.setItem(LS_SELECTED_PROJECT, String(projectId));
    }, []);

    const fetchUsers = useCallback(async () => {
        setError(null);
        const res = await axiosInstance.get<ApiUser[]>("users");
        const mapped: AppUser[] = res.data.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            roleId: u.roleId,
            role: u.role,
        }));
        setUsers(mapped.sort((a, b) => a.name.localeCompare(b.name)));
    }, []);

    const fetchWorkspaces = useCallback(async () => {
        setError(null);
        const res = await axiosInstance.get<ApiWorkspace[]>("workspaces");
        setWorkspaces(res.data.sort((a, b) => a.name.localeCompare(b.name)));
    }, []);

    const createWorkspace = useCallback(async (request: WorkspaceUpsertRequest) => {
        setError(null);
        const payload = {
            name: request.name.trim(),
            description: request.description?.trim() || null,
        };
        const res = await axiosInstance.post<ApiWorkspace>("workspaces", payload);
        setWorkspaces((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
        return res.data;
    }, []);

    const updateWorkspace = useCallback(async (id: number, request: WorkspaceUpsertRequest) => {
        setError(null);
        const payload = {
            name: request.name.trim(),
            description: request.description?.trim() || null,
        };
        const res = await axiosInstance.put<ApiWorkspace>(`workspaces/${id}`, payload);
        setWorkspaces((prev) => prev.map((w) => (w.id === id ? res.data : w)));
        return res.data;
    }, []);

    const deleteWorkspace = useCallback(
        async (id: number) => {
            setError(null);
            await axiosInstance.delete(`workspaces/${id}`);
            setWorkspaces((prev) => prev.filter((w) => w.id !== id));

            if (selectedWorkspaceId === id) {
                setSelectedWorkspaceId(null);
                setSelectedProjectId(null);
                setProjects([]);
                setTasks([]);
            }
        },
        [selectedWorkspaceId, setSelectedProjectId, setSelectedWorkspaceId]
    );

    const fetchProjectsByWorkspaceId = useCallback(async (workspaceId: number) => {
        setError(null);

        // If backend supports ?workspaceId= it will filter; otherwise we still filter client-side.
        const res = await axiosInstance.get<ApiProject[]>("projects", { params: { workspaceId } });
        const filtered = res.data.filter((p) => p.workspaceId === workspaceId);
        setProjects(filtered.sort((a, b) => a.name.localeCompare(b.name)));
    }, []);

    const createProject = useCallback(
        async (request: ProjectUpsertRequest) => {
            setError(null);
            const payload = {
                workspaceId: request.workspaceId,
                name: request.name.trim(),
                description: request.description?.trim() || null,
            };

            const res = await axiosInstance.post<ApiProject>("projects", payload);

            if (selectedWorkspaceId === res.data.workspaceId) {
                setProjects((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
            }

            return res.data;
        },
        [selectedWorkspaceId]
    );

    const updateProject = useCallback(
        async (id: number, request: ProjectUpsertRequest) => {
            setError(null);
            const payload = {
                workspaceId: request.workspaceId,
                name: request.name.trim(),
                description: request.description?.trim() || null,
            };

            const res = await axiosInstance.put<ApiProject>(`projects/${id}`, payload);

            if (selectedWorkspaceId === res.data.workspaceId) {
                setProjects((prev) => prev.map((p) => (p.id === id ? res.data : p)));
            } else {
                setProjects((prev) => prev.filter((p) => p.id !== id));
            }

            return res.data;
        },
        [selectedWorkspaceId]
    );

    const deleteProject = useCallback(
        async (id: number) => {
            setError(null);
            await axiosInstance.delete(`projects/${id}`);
            setProjects((prev) => prev.filter((p) => p.id !== id));

            if (selectedProjectId === id) {
                setSelectedProjectId(null);
                setTasks([]);
            }
        },
        [selectedProjectId, setSelectedProjectId]
    );

    const fetchTasksByProjectId = useCallback(async (projectId: number) => {
        setError(null);

        // If backend supports ?projectId= it will filter; otherwise we still filter client-side.
        const res = await axiosInstance.get<ApiTask[]>("tasks", { params: { projectId } });

        const normalized: TaskItem[] = res.data
            .filter((t) => t.projectId === projectId)
            .map((t) => ({
                id: t.id,
                projectId: t.projectId,
                parentTaskId: t.parentTaskId ?? null,
                title: t.title,
                description: t.description ?? null,
                status: normalizeTaskStatus(t.status),
                priority: normalizePriority(t.priority),
                dueDate: normalizeDueDate(t),
                assigneeId: t.assigneeId ?? null,
                assigneeName: (t.assigneeName ?? "").trim() || null,
            }));

        setTasks(normalized);
    }, []);

    const assignUserToTask = useCallback(async (taskId: number, userId: number) => {
        await axiosInstance.post(`tasks/${taskId}/assign/${userId}`);
    }, []);

    const removeUserFromTask = useCallback(async (taskId: number, userId: number) => {
        try {
            await axiosInstance.delete(`tasks/${taskId}/assign/${userId}`);
        } catch (err: any) {
            // If backend says assignment not found, treat as already removed.
            if (err?.response?.status === 404) return;
            throw err;
        }
    }, []);

    const createTask = useCallback(
        async (request: TaskUpsertRequest) => {
            setError(null);

            const due = request.dueDate ? new Date(request.dueDate) : null;
            const dueIso = due && !Number.isNaN(due.getTime()) ? due.toISOString() : null;

            // IMPORTANT: do NOT send assignee string or assigneeId in task payload.
            const payload: any = {
                projectId: request.projectId,
                parentTaskId: request.parentTaskId ?? null,
                title: request.title.trim(),
                description: request.description?.trim() || null,
                status: toApiStatus(request.status),
                priority: toApiPriority(request.priority),
                dueDate: dueIso,
                targetDate: dueIso, // compatibility with older API DTOs
            };

            const res = await axiosInstance.post<ApiTask>("tasks", payload);

            const created: TaskItem = {
                id: res.data.id,
                projectId: res.data.projectId,
                parentTaskId: res.data.parentTaskId ?? null,
                title: res.data.title,
                description: res.data.description ?? null,
                status: normalizeTaskStatus(res.data.status),
                priority: normalizePriority(res.data.priority),
                dueDate: normalizeDueDate(res.data),
                assigneeId: res.data.assigneeId ?? null,
                assigneeName: (res.data.assigneeName ?? "").trim() || null,
            };

            // If user selected, assign via dedicated endpoint
            const selectedAssigneeId = safeNumber(request.assigneeId);
            if (selectedAssigneeId) {
                await assignUserToTask(created.id, selectedAssigneeId);

                const user = users.find((u) => u.id === selectedAssigneeId) ?? null;
                created.assigneeId = selectedAssigneeId;
                created.assigneeName = user?.name ?? created.assigneeName ?? null;
            }

            setTasks((prev) => [...prev, created]);
            return created;
        },
        [assignUserToTask, users]
    );

    const updateTask = useCallback(
        async (id: number, request: TaskUpsertRequest) => {
            setError(null);

            const existing = tasks.find((t) => t.id === id) ?? null;

            const due = request.dueDate ? new Date(request.dueDate) : null;
            const dueIso = due && !Number.isNaN(due.getTime()) ? due.toISOString() : null;

            // IMPORTANT: do NOT send assignee string or assigneeId in task payload.
            const payload: any = {
                projectId: request.projectId,
                parentTaskId: request.parentTaskId ?? null,
                title: request.title.trim(),
                description: request.description?.trim() || null,
                status: toApiStatus(request.status),
                priority: toApiPriority(request.priority),
                dueDate: dueIso,
                targetDate: dueIso,
            };

            const res = await axiosInstance.put<ApiTask>(`tasks/${id}`, payload);

            const updated: TaskItem = {
                id: res.data.id,
                projectId: res.data.projectId,
                parentTaskId: res.data.parentTaskId ?? null,
                title: res.data.title,
                description: res.data.description ?? null,
                status: normalizeTaskStatus(res.data.status),
                priority: normalizePriority(res.data.priority),
                dueDate: normalizeDueDate(res.data),
                assigneeId: res.data.assigneeId ?? existing?.assigneeId ?? null,
                assigneeName: ((res.data.assigneeName ?? "").trim()) || existing?.assigneeName || null,
            };

            const nextAssigneeId = safeNumber(request.assigneeId);
            const prevAssigneeId = existing?.assigneeId ?? null;

            const assignmentChanged =
                (prevAssigneeId ?? null) !== (nextAssigneeId ?? null);

            if (assignmentChanged) {
                if (prevAssigneeId) {
                    await removeUserFromTask(id, prevAssigneeId);
                }
                if (nextAssigneeId) {
                    await assignUserToTask(id, nextAssigneeId);
                    const user = users.find((u) => u.id === nextAssigneeId) ?? null;
                    updated.assigneeId = nextAssigneeId;
                    updated.assigneeName = user?.name ?? updated.assigneeName ?? null;
                } else {
                    updated.assigneeId = null;
                    updated.assigneeName = null;
                }
            }

            setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
            return updated;
        },
        [assignUserToTask, removeUserFromTask, tasks, users]
    );

    const deleteTask = useCallback(async (id: number) => {
        setError(null);
        await axiosInstance.delete(`tasks/${id}`);
        setTasks((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toggleTaskStatus = useCallback(
        async (taskId: number): Promise<TaskItem | null> => {
            const current = tasks.find((t) => t.id === taskId);
            if (!current) return null;

            const nextStatus: TaskStatus =
                current.status === "To Do"
                    ? "In Progress"
                    : current.status === "In Progress"
                        ? "Done"
                        : "To Do";

            return await updateTask(taskId, {
                projectId: current.projectId,
                parentTaskId: current.parentTaskId ?? null,
                title: current.title,
                description: current.description ?? null,
                status: nextStatus,
                priority: current.priority,
                dueDate: current.dueDate ?? null,
                assigneeId: current.assigneeId ?? null,
            });
        },
        [tasks, updateTask]
    );

    // Initial boot: users + workspaces + select default workspace/project + load tasks
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        let cancelled = false;

        const run = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const [usersRes, workspacesRes] = await Promise.all([
                    axiosInstance.get<ApiUser[]>("users"),
                    axiosInstance.get<ApiWorkspace[]>("workspaces"),
                ]);

                if (cancelled) return;

                const usersData: AppUser[] = usersRes.data
                    .map((u) => ({
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        roleId: u.roleId,
                        role: u.role,
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name));

                const workspacesData: Workspace[] = [...workspacesRes.data].sort((a, b) =>
                    a.name.localeCompare(b.name)
                );

                setUsers(usersData);
                setWorkspaces(workspacesData);

                const storedWsId = safeNumber(localStorage.getItem(LS_SELECTED_WORKSPACE));
                const initialWorkspaceId =
                    (storedWsId && workspacesData.some((w) => w.id === storedWsId) ? storedWsId : null) ??
                    (workspacesData[0]?.id ?? null);

                setSelectedWorkspaceId(initialWorkspaceId);

                if (!initialWorkspaceId) {
                    setProjects([]);
                    setTasks([]);
                    setSelectedProjectId(null);
                    return;
                }

                const projectsRes = await axiosInstance.get<ApiProject[]>("projects", {
                    params: { workspaceId: initialWorkspaceId },
                });

                const projectsData = projectsRes.data
                    .filter((p) => p.workspaceId === initialWorkspaceId)
                    .sort((a, b) => a.name.localeCompare(b.name));

                setProjects(projectsData);

                const storedPrId = safeNumber(localStorage.getItem(LS_SELECTED_PROJECT));
                const initialProjectId =
                    (storedPrId && projectsData.some((p) => p.id === storedPrId) ? storedPrId : null) ??
                    (projectsData[0]?.id ?? null);

                setSelectedProjectId(initialProjectId);

                if (!initialProjectId) {
                    setTasks([]);
                    return;
                }

                const tasksRes = await axiosInstance.get<ApiTask[]>("tasks", {
                    params: { projectId: initialProjectId },
                });

                const tasksData: TaskItem[] = tasksRes.data
                    .filter((t) => t.projectId === initialProjectId)
                    .map((t) => ({
                        id: t.id,
                        projectId: t.projectId,
                        parentTaskId: t.parentTaskId ?? null,
                        title: t.title,
                        description: t.description ?? null,
                        status: normalizeTaskStatus(t.status),
                        priority: normalizePriority(t.priority),
                        dueDate: normalizeDueDate(t),
                        assigneeId: t.assigneeId ?? null,
                        assigneeName: (t.assigneeName ?? "").trim() || null,
                    }));

                setTasks(tasksData);
            } catch (e: any) {
                setError(e?.response?.data?.message ?? e?.message ?? "Failed to initialize app data.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [setSelectedProjectId, setSelectedWorkspaceId]);

    // Workspace change => reload projects, auto-pick project, reload tasks
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        if (!selectedWorkspaceId) return;

        let cancelled = false;

        const run = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const projectsRes = await axiosInstance.get<ApiProject[]>("projects", {
                    params: { workspaceId: selectedWorkspaceId },
                });

                if (cancelled) return;

                const projectsData = projectsRes.data
                    .filter((p) => p.workspaceId === selectedWorkspaceId)
                    .sort((a, b) => a.name.localeCompare(b.name));

                setProjects(projectsData);

                const currentValid =
                    selectedProjectId !== null && projectsData.some((p) => p.id === selectedProjectId);

                const nextProjectId = currentValid ? selectedProjectId : projectsData[0]?.id ?? null;
                setSelectedProjectId(nextProjectId);

                if (!nextProjectId) {
                    setTasks([]);
                    return;
                }

                const tasksRes = await axiosInstance.get<ApiTask[]>("tasks", {
                    params: { projectId: nextProjectId },
                });

                if (cancelled) return;

                const tasksData: TaskItem[] = tasksRes.data
                    .filter((t) => t.projectId === nextProjectId)
                    .map((t) => ({
                        id: t.id,
                        projectId: t.projectId,
                        parentTaskId: t.parentTaskId ?? null,
                        title: t.title,
                        description: t.description ?? null,
                        status: normalizeTaskStatus(t.status),
                        priority: normalizePriority(t.priority),
                        dueDate: normalizeDueDate(t),
                        assigneeId: t.assigneeId ?? null,
                        assigneeName: (t.assigneeName ?? "").trim() || null,
                    }));

                setTasks(tasksData);
            } catch (e: any) {
                setError(e?.response?.data?.message ?? e?.message ?? "Failed to load projects/tasks.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        run();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedWorkspaceId]);

    // Project change => reload tasks
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        if (!selectedProjectId) return;

        let cancelled = false;

        const run = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const res = await axiosInstance.get<ApiTask[]>("tasks", {
                    params: { projectId: selectedProjectId },
                });

                if (cancelled) return;

                const tasksData: TaskItem[] = res.data
                    .filter((t) => t.projectId === selectedProjectId)
                    .map((t) => ({
                        id: t.id,
                        projectId: t.projectId,
                        parentTaskId: t.parentTaskId ?? null,
                        title: t.title,
                        description: t.description ?? null,
                        status: normalizeTaskStatus(t.status),
                        priority: normalizePriority(t.priority),
                        dueDate: normalizeDueDate(t),
                        assigneeId: t.assigneeId ?? null,
                        assigneeName: (t.assigneeName ?? "").trim() || null,
                    }));

                setTasks(tasksData);
            } catch (e: any) {
                setError(e?.response?.data?.message ?? e?.message ?? "Failed to load tasks.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [selectedProjectId]);

    const value = useMemo<AppContextValue>(
        () => ({
            users,
            workspaces,
            projects,
            tasks,

            selectedWorkspaceId,
            selectedProjectId,

            isLoading,
            error,

            setSelectedWorkspaceId,
            setSelectedProjectId,

            fetchWorkspaces,
            createWorkspace,
            updateWorkspace,
            deleteWorkspace,

            fetchProjectsByWorkspaceId,
            createProject,
            updateProject,
            deleteProject,
            fetchUsers,
            fetchTasksByProjectId,
            createTask,
            updateTask,
            deleteTask,
            toggleTaskStatus,
        }),
        [
            users,
            workspaces,
            projects,
            tasks,
            selectedWorkspaceId,
            selectedProjectId,
            isLoading,
            error,
            setSelectedWorkspaceId,
            setSelectedProjectId,
            fetchWorkspaces,
            createWorkspace,
            updateWorkspace,
            deleteWorkspace,
            fetchProjectsByWorkspaceId,
            createProject,
            updateProject,
            deleteProject,
            fetchTasksByProjectId,
            createTask,
            updateTask,
            deleteTask,
            toggleTaskStatus,
            fetchUsers
        ]
    );

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp must be used within AppProvider.");
    return ctx;
}