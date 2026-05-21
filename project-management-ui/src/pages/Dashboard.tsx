import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance.js";
import { useAuth } from "../context/AuthContext";

type TenantMetricsResponse = {
  totalProjects: number;
  totalOpenTasks: number;
  totalCompletedTasks: number;
  totalUsers: number;
};

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
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

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Dashboard</h1>
        <div>
          <span style={{ marginRight: 12 }}>
            {user?.name} ({user?.roleName})
          </span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {error && <div style={{ color: "crimson" }}>{error}</div>}

      {!metrics ? (
        <div>Loading metrics...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          <div style={{ border: "1px solid #ddd", padding: 12 }}>
            <strong>Total Projects</strong>
            <div>{metrics.totalProjects}</div>
          </div>

          <div style={{ border: "1px solid #ddd", padding: 12 }}>
            <strong>Total Users</strong>
            <div>{metrics.totalUsers}</div>
          </div>

          <div style={{ border: "1px solid #ddd", padding: 12 }}>
            <strong>Open Tasks</strong>
            <div>{metrics.totalOpenTasks}</div>
          </div>

          <div style={{ border: "1px solid #ddd", padding: 12 }}>
            <strong>Completed Tasks</strong>
            <div>{metrics.totalCompletedTasks}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;