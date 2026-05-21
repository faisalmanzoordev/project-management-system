#nullable enable
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Application.Common.Interfaces;
using ProjectManagement.Application.DTOs.Projects;
using ProjectManagement.Domain.Entities;

namespace ProjectManagement.Infrastructure.Services;

public sealed class ProjectService : IProjectService
{
    private const string SystemUser = "System_User";
    private readonly IApplicationDbContext _context;

    public ProjectService(IApplicationDbContext context) => _context = context;

    public async Task<IReadOnlyList<ProjectResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Projects
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Name)
            .Select(x => new ProjectResponse(x.Id, x.WorkspaceId, x.Name, x.Description))
            .ToListAsync(cancellationToken);
    }

    public async Task<ProjectResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Projects
            .AsNoTracking()
            .Where(x => !x.IsDeleted && x.Id == id)
            .Select(x => new ProjectResponse(x.Id, x.WorkspaceId, x.Name, x.Description))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<ProjectResponse> CreateAsync(ProjectRequest request, CancellationToken cancellationToken = default)
    {
        var workspaceExists = await _context.Workspaces
            .AsNoTracking()
            .AnyAsync(w => !w.IsDeleted && w.Id == request.WorkspaceId, cancellationToken);

        if (!workspaceExists)
            throw new InvalidOperationException($"WorkspaceId '{request.WorkspaceId}' does not exist.");

        var entity = new Project(
            request.Name.Trim(),
            request.WorkspaceId,
            string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim()
        );

        await _context.Projects.AddAsync(entity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new ProjectResponse(entity.Id, entity.WorkspaceId, entity.Name, entity.Description);
    }

    public async Task<ProjectResponse?> UpdateAsync(int id, ProjectRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Projects
            .FirstOrDefaultAsync(x => !x.IsDeleted && x.Id == id, cancellationToken);

        if (entity is null) return null;

        var workspaceExists = await _context.Workspaces
            .AsNoTracking()
            .AnyAsync(w => !w.IsDeleted && w.Id == request.WorkspaceId, cancellationToken);

        if (!workspaceExists)
            throw new InvalidOperationException($"WorkspaceId '{request.WorkspaceId}' does not exist.");

        entity.SetWorkspace(request.WorkspaceId);
        entity.SetName(request.Name.Trim());
        entity.SetDescription(string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim());

        await _context.SaveChangesAsync(cancellationToken);

        return new ProjectResponse(entity.Id, entity.WorkspaceId, entity.Name, entity.Description);
    }

    public async Task<bool> SoftDeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Projects
            .FirstOrDefaultAsync(x => !x.IsDeleted && x.Id == id, cancellationToken);

        if (entity is null) return false;

        entity.SoftDelete(SystemUser);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<ProjectWithTasksResponse?> GetProjectWithTasksAsync(int projectId, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Projects
            .AsNoTracking()
            .Where(p => !p.IsDeleted && p.Id == projectId)
            .Include(p => p.Tasks)
            .FirstOrDefaultAsync(cancellationToken);

        if (entity is null) return null;

        var tasks = entity.Tasks
            .Where(t => !t.IsDeleted)
            .OrderBy(t => t.Id)
            .Select(t => new ProjectTaskSummaryResponse(t.Id, t.Title, t.Status))
            .ToList()
            .AsReadOnly();

        return new ProjectWithTasksResponse(
            entity.Id,
            entity.WorkspaceId,
            entity.Name,
            entity.Description,
            tasks
        );
    }
}