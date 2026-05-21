#nullable enable
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Application.Common.Interfaces;
using ProjectManagement.Application.DTOs.Dashboard;
using ProjectManagement.Domain.Enums;

namespace ProjectManagement.Infrastructure.Services;

public sealed class DashboardService : IDashboardService
{
    private readonly IApplicationDbContext _context;

    public DashboardService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TenantMetricsResponse> GetTenantMetricsAsync(CancellationToken cancellationToken = default)
    {
        // Awaiting each database call sequentially prevents thread concurrency issues on Entity Framework Core
        var totalProjects = await _context.Projects
            .AsNoTracking()
            .CountAsync(p => !p.IsDeleted, cancellationToken);

        var totalUsers = await _context.Users
            .AsNoTracking()
            .CountAsync(u => !u.IsDeleted, cancellationToken);

        var totalCompletedTasks = await _context.Tasks
            .AsNoTracking()
            .CountAsync(t => !t.IsDeleted && t.Status == TaskItemStatus.Done, cancellationToken);

        var totalOpenTasks = await _context.Tasks
            .AsNoTracking()
            .CountAsync(t => !t.IsDeleted && t.Status != TaskItemStatus.Done && t.Status != TaskItemStatus.Cancelled, cancellationToken);

        // Safely map directly to your positional record constructor parameters
        return new TenantMetricsResponse(
            TotalProjects: totalProjects,
            TotalOpenTasks: totalOpenTasks,
            TotalCompletedTasks: totalCompletedTasks,
            TotalUsers: totalUsers
        );
    }
}