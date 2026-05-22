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

export type TaskItem = {
    id: number;
    projectId: number;
    parentTaskId?: number | null;
    title: string;
    description?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string | null; // ISO or yyyy-mm-dd
    assignee?: string | null;
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
    dueDate?: string | null;
    assignee?: string | null;
};

type ApiWorkspace = Workspace;
type ApiProject = Project;

type ApiTask = {
    id: number;
    projectId: number;
    parentTaskId?: number | null;
    title: string;
    description?: string | null;

    // backend may return different names:
    dueDate?: string | null;
    targetDate?: string | null;

    status: string | number;
    priority?: string | number;

    assignee?: string | null;
};

function normalizeTaskStatus(value: string | number): TaskStatus {
    if (typeof value === "number") {
        // If backend uses enum ints: attempt common mapping
        // 0 Pending -> To Do, 1 InProgress -> In Progress, 2 Done -> Done, others -> To Do
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

    // keep as ISO string
    return d.toISOString();
}

function toApiStatus(status: TaskStatus): string {
    // Use the requested canonical strings
    return status;
}

function toApiPriority(priority: TaskPriority): string {
    return priority;
}

type AppContextValue = {
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
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<TaskItem[]>([]);

    const [selectedWorkspaceId, _setSelectedWorkspaceId] = useState<number | null>(null);
    const [selectedProjectId, _setSelectedProjectId] = useState<number | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const setSelectedWorkspaceId = useCallback((workspaceId: number | null) => {
        _setSelectedWorkspaceId(workspaceId);
        if (workspaceId === null) {
            localStorage.removeItem(LS_SELECTED_WORKSPACE);
        } else {
            localStorage.setItem(LS_SELECTED_WORKSPACE, String(workspaceId));
        }
    }, []);

    const setSelectedProjectId = useCallback((projectId: number | null) => {
        _setSelectedProjectId(projectId);
        if (projectId === null) {
            localStorage.removeItem(LS_SELECTED_PROJECT);
        } else {
            localStorage.setItem(LS_SELECTED_PROJECT, String(projectId));
        }
    }, []);

    const fetchWorkspaces = useCallback(async () => {
        setError(null);
        const res = await axiosInstance.get<ApiWorkspace[]>("workspaces");
        setWorkspaces(res.data);
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

            // Clear selection if needed
            if (selectedWorkspaceId === id) {
                setSelectedWorkspaceId(null);
                setSelectedProjectId(null);
                setProjects([]);
                setTasks([]);
            }
        },
        [selectedWorkspaceId, setSelectedWorkspaceId, setSelectedProjectId]
    );

    const fetchProjectsByWorkspaceId = useCallback(async (workspaceId: number) => {
        setError(null);

        // Prefer server-side filtering (if supported); fallback to client filtering.
        const res = await axiosInstance.get<ApiProject[]>("projects", {
            params: { workspaceId },
        });

        const filtered = res.data.filter((p) => p.workspaceId === workspaceId);
        setProjects(filtered.sort((a, b) => a.name.localeCompare(b.name)));
    }, []);

    const createProject = useCallback(async (request: ProjectUpsertRequest) => {
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
    }, [selectedWorkspaceId]);

    const updateProject = useCallback(async (id: number, request: ProjectUpsertRequest) => {
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
    }, [selectedWorkspaceId]);

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

        // Prefer server-side filtering (if supported); fallback to client filtering.
        const res = await axiosInstance.get<ApiTask[]>("tasks", {
            params: { projectId },
        });

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
                assignee: (t.assignee ?? "").trim() || null,
            }));

        setTasks(normalized);
    }, []);

    const createTask = useCallback(async (request: TaskUpsertRequest) => {
        setError(null);

        const due = request.dueDate ? new Date(request.dueDate) : null;
        const dueIso = due && !Number.isNaN(due.getTime()) ? due.toISOString() : null;

        const payload: any = {
            projectId: request.projectId,
            parentTaskId: request.parentTaskId ?? null,
            title: request.title.trim(),
            description: request.description?.trim() || null,

            // Send both names for compatibility with .NET APIs (it will ignore unknown props)
            dueDate: dueIso,
            targetDate: dueIso,

            status: toApiStatus(request.status),
            priority: toApiPriority(request.priority),
            assignee: request.assignee?.trim() || null,
        };

        const res = await axiosInstance.post<ApiTask>("tasks", payload);

        const normalized: TaskItem = {
            id: res.data.id,
            projectId: res.data.projectId,
            parentTaskId: res.data.parentTaskId ?? null,
            title: res.data.title,
            description: res.data.description ?? null,
            status: normalizeTaskStatus(res.data.status),
            priority: normalizePriority(res.data.priority),
            dueDate: normalizeDueDate(res.data),
            assignee: (res.data.assignee ?? "").trim() || null,
        };

        setTasks((prev) => [...prev, normalized]);
        return normalized;
    }, []);

    const updateTask = useCallback(async (id: number, request: TaskUpsertRequest) => {
        setError(null);

        const due = request.dueDate ? new Date(request.dueDate) : null;
        const dueIso = due && !Number.isNaN(due.getTime()) ? due.toISOString() : null;

        const payload: any = {
            projectId: request.projectId,
            parentTaskId: request.parentTaskId ?? null,
            title: request.title.trim(),
            description: request.description?.trim() || null,
            dueDate: dueIso,
            targetDate: dueIso,
            status: toApiStatus(request.status),
            priority: toApiPriority(request.priority),
            assignee: request.assignee?.trim() || null,
        };

        const res = await axiosInstance.put<ApiTask>(`tasks/${id}`, payload);

        const normalized: TaskItem = {
            id: res.data.id,
            projectId: res.data.projectId,
            parentTaskId: res.data.parentTaskId ?? null,
            title: res.data.title,
            description: res.data.description ?? null,
            status: normalizeTaskStatus(res.data.status),
            priority: normalizePriority(res.data.priority),
            dueDate: normalizeDueDate(res.data),
            assignee: (res.data.assignee ?? "").trim() || null,
        };

        setTasks((prev) => prev.map((t) => (t.id === id ? normalized : t)));
        return normalized;
    }, []);

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

            const updated = await updateTask(taskId, {
                projectId: current.projectId,
                parentTaskId: current.parentTaskId ?? null,
                title: current.title,
                description: current.description ?? null,
                status: nextStatus,
                priority: current.priority,
                dueDate: current.dueDate ?? null,
                assignee: current.assignee ?? null,
            });

            return updated;
        },
        [tasks, updateTask]
    );

    const bootstrap = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        setIsLoading(true);
        setError(null);

        try {
            await fetchWorkspaces();

            const storedWs = localStorage.getItem(LS_SELECTED_WORKSPACE);
            const storedPr = localStorage.getItem(LS_SELECTED_PROJECT);

            const wsId =
                (storedWs ? Number(storedWs) : NaN) &&
                    workspaces.some((w) => w.id === Number(storedWs))
                    ? Number(storedWs)
                    : null;

            const chosenWorkspaceId = wsId ?? (workspaces[0]?.id ?? null);
            setSelectedWorkspaceId(chosenWorkspaceId);

            if (chosenWorkspaceId) {
                await fetchProjectsByWorkspaceId(chosenWorkspaceId);

                const availableProjects = await axiosInstance.get<ApiProject[]>("projects", {
                    params: { workspaceId: chosenWorkspaceId },
                });

                const filteredProjects = availableProjects.data.filter(
                    (p) => p.workspaceId === chosenWorkspaceId
                );

                const prId =
                    (storedPr ? Number(storedPr) : NaN) &&
                        filteredProjects.some((p) => p.id === Number(storedPr))
                        ? Number(storedPr)
                        : null;

                const chosenProjectId = prId ?? (filteredProjects[0]?.id ?? null);
                setSelectedProjectId(chosenProjectId);

                if (chosenProjectId) {
                    await fetchTasksByProjectId(chosenProjectId);
                } else {
                    setTasks([]);
                }
            } else {
                setProjects([]);
                setTasks([]);
                setSelectedProjectId(null);
            }
        } catch (e: any) {
            setError(e?.response?.data?.message ?? e?.message ?? "Failed to initialize data.");
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchProjectsByWorkspaceId, fetchTasksByProjectId, fetchWorkspaces, setSelectedProjectId, setSelectedWorkspaceId]);

    useEffect(() => {
        // If AppProvider is mounted only after auth, this runs once and loads everything.
        // If AppProvider is mounted globally, token might be missing and this will no-op until a refresh.
        bootstrap();
    }, [bootstrap]);

    useEffect(() => {
        const run = async () => {
            if (!selectedWorkspaceId) return;

            setIsLoading(true);
            setError(null);

            try {
                await fetchProjectsByWorkspaceId(selectedWorkspaceId);

                // Pick first project if current selection is invalid
                const res = await axiosInstance.get<ApiProject[]>("projects", {
                    params: { workspaceId: selectedWorkspaceId },
                });

                const filtered = res.data.filter((p) => p.workspaceId === selectedWorkspaceId);
                const currentValid = selectedProjectId
                    ? filtered.some((p) => p.id === selectedProjectId)
                    : false;

                const nextProjectId = currentValid ? selectedProjectId : filtered[0]?.id ?? null;
                setSelectedProjectId(nextProjectId);

                if (nextProjectId) {
                    await fetchTasksByProjectId(nextProjectId);
                } else {
                    setTasks([]);
                }
            } catch (e: any) {
                setError(e?.response?.data?.message ?? e?.message ?? "Failed to load projects/tasks.");
            } finally {
                setIsLoading(false);
            }
        };

        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedWorkspaceId]);

    useEffect(() => {
        const run = async () => {
            if (!selectedProjectId) return;

            setIsLoading(true);
            setError(null);

            try {
                await fetchTasksByProjectId(selectedProjectId);
            } catch (e: any) {
                setError(e?.response?.data?.message ?? e?.message ?? "Failed to load tasks.");
            } finally {
                setIsLoading(false);
            }
        };

        run();
    }, [fetchTasksByProjectId, selectedProjectId]);

    const value = useMemo<AppContextValue>(
        () => ({
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
        }),
        [
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
        ]
    );

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp must be used within AppProvider.");
    return ctx;
}