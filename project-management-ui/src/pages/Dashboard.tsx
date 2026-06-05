import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { IconChart, IconCheckCircle, IconClipboard, IconUsers } from "../components/ui/icons";

type TenantMetricsResponse = {
    totalProjects: number;
    totalOpenTasks: number;
    totalCompletedTasks: number;
    totalUsers: number;
};

type MetricCardProps = {
    title: string;
    value: number;
    icon: React.ReactNode;
    gradientClassName: string;
};

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, gradientClassName }) => {
    return (
        <div
            className={[
                "relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
                "p-5 sm:p-6",
            ].join(" ")}
        >
            <div className={["absolute inset-0 opacity-30", gradientClassName].join(" ")} />
            <div className="relative flex items-start justify-between gap-4">
                <div>
                    <div className="text-sm font-semibold text-slate-700">{title}</div>
                    <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                        {value.toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Updated live</div>
                </div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 ring-1 ring-inset ring-slate-200 text-slate-900 shadow-sm">
                    {icon}
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<TenantMetricsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setError(null);
            try {
                const res = await axiosInstance.get<TenantMetricsResponse>("dashboard/metrics");
                setMetrics(res.data);
            } catch (err: any) {
                setError(err?.response?.data?.message ?? "Failed to load metrics.");
            }
        };
        load();
    }, []);

    const cards = useMemo(() => {
        const m = metrics ?? {
            totalProjects: 0,
            totalUsers: 0,
            totalOpenTasks: 0,
            totalCompletedTasks: 0,
        };

        return [
            {
                title: "Total Projects",
                value: m.totalProjects,
                icon: <IconChart />,
                gradientClassName: "bg-gradient-to-br from-indigo-100 to-transparent",
            },
            {
                title: "Total Users",
                value: m.totalUsers,
                icon: <IconUsers />,
                gradientClassName: "bg-gradient-to-br from-emerald-100 to-transparent",
            },
            {
                title: "Open Tasks",
                value: m.totalOpenTasks,
                icon: <IconClipboard />,
                gradientClassName: "bg-gradient-to-br from-amber-100 to-transparent",
            },
            {
                title: "Completed Tasks",
                value: m.totalCompletedTasks,
                icon: <IconCheckCircle />,
                gradientClassName: "bg-gradient-to-br from-sky-100 to-transparent",
            },
        ];
    }, [metrics]);

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
                        <p className="mt-1 text-sm text-slate-600">
                            High-level overview of your tenant metrics.
                        </p>
                    </div>
                    <div className="text-xs text-slate-500">
                        Metrics refresh automatically based on server data.
                    </div>
                </div>
            </div>

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
                    {error}
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((c) => (
                    <MetricCard
                        key={c.title}
                        title={c.title}
                        value={c.value}
                        icon={c.icon}
                        gradientClassName={c.gradientClassName}
                    />
                ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="text-sm font-semibold text-slate-900">Next Steps</div>
                <p className="mt-2 text-sm text-slate-600">
                    Go to <span className="font-semibold text-slate-900">Workspaces</span> to manage projects and tasks in
                    Table, Kanban, and Calendar views with subtasks and assignments.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;