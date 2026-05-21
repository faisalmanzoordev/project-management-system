#nullable enable
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Application.Common.Interfaces;
using ProjectManagement.Application.DTOs.Workspaces;
using ProjectManagement.Domain.Entities;

namespace ProjectManagement.Infrastructure.Services;

public sealed class WorkspaceService : IWorkspaceService
{
    private const string SystemUser = "System_User";
    private readonly IApplicationDbContext _context;

    public WorkspaceService(IApplicationDbContext context) => _context = context;

    public async Task<IReadOnlyList<WorkspaceResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Workspaces
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Name)
            .Select(x => new WorkspaceResponse(x.Id, x.Name, x.Description))
            .ToListAsync(cancellationToken);
    }

    public async Task<WorkspaceResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Workspaces
            .AsNoTracking()
            .Where(x => !x.IsDeleted && x.Id == id)
            .Select(x => new WorkspaceResponse(x.Id, x.Name, x.Description))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<WorkspaceResponse> CreateAsync(WorkspaceRequest request, CancellationToken cancellationToken = default)
    {
        var entity = new Workspace(request.Name.Trim(),
            string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim());

        await _context.Workspaces.AddAsync(entity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new WorkspaceResponse(entity.Id, entity.Name, entity.Description);
    }

    public async Task<WorkspaceResponse?> UpdateAsync(int id, WorkspaceRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Workspaces
            .FirstOrDefaultAsync(x => !x.IsDeleted && x.Id == id, cancellationToken);

        if (entity is null) return null;

        entity.SetName(request.Name.Trim());
        entity.SetDescription(string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim());

        await _context.SaveChangesAsync(cancellationToken);

        return new WorkspaceResponse(entity.Id, entity.Name, entity.Description);
    }

    public async Task<bool> SoftDeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Workspaces
            .FirstOrDefaultAsync(x => !x.IsDeleted && x.Id == id, cancellationToken);

        if (entity is null) return false;

        entity.SoftDelete(SystemUser);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<WorkspaceDetailsResponse?> GetWorkspaceDetailsAsync(int workspaceId, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Workspaces
            .AsNoTracking()
            .Where(w => !w.IsDeleted && w.Id == workspaceId)
            .Include(w => w.Projects)
            .FirstOrDefaultAsync(cancellationToken);

        if (entity is null) return null;

        var projects = entity.Projects
            .Where(p => !p.IsDeleted)
            .OrderBy(p => p.Name)
            .Select(p => new WorkspaceProjectSummaryResponse(p.Id, p.Name, p.Description))
            .ToList()
            .AsReadOnly();

        return new WorkspaceDetailsResponse(
            entity.Id,
            entity.Name,
            entity.Description,
            projects
        );
    }
}