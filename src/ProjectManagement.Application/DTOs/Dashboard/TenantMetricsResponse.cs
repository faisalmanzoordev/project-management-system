#nullable enable
namespace ProjectManagement.Application.DTOs.Dashboard;

public sealed record TenantMetricsResponse(
    int TotalProjects,
    int TotalOpenTasks,
    int TotalCompletedTasks,
    int TotalUsers
);