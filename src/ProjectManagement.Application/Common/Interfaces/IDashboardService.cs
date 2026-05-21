#nullable enable
using ProjectManagement.Application.DTOs.Dashboard;

namespace ProjectManagement.Application.Common.Interfaces;

public interface IDashboardService
{
    Task<TenantMetricsResponse> GetTenantMetricsAsync(CancellationToken cancellationToken = default);
}