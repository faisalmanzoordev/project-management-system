#nullable enable
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Application.Common.Interfaces;
using ProjectManagement.Application.DTOs.Tasks;
using ProjectManagement.Domain.Common;
using ProjectManagement.Domain.Entities;
using TaskEntity = ProjectManagement.Domain.Entities.Tasks;

namespace ProjectManagement.Infrastructure.Services;

public sealed class TaskService : ITaskService
{
    private const string SystemUser = "System_User";
    private readonly IApplicationDbContext _context;

    public TaskService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<TaskResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Tasks
            .AsNoTracking()
            .Where(t => !t.IsDeleted)
            .OrderByDescending(t => t.Id)
            .Select(t => new TaskResponse(
                t.Id,
                t.ProjectId,
                t.ParentTaskId,
                t.Title,
                t.Description,
                t.TargetDate,
                t.Status,
                t.Priority
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<TaskResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Tasks
            .AsNoTracking()
            .Where(t => !t.IsDeleted && t.Id == id)
            .Select(t => new TaskResponse(
                t.Id,
                t.ProjectId,
                t.ParentTaskId,
                t.Title,
                t.Description,
                t.TargetDate,
                t.Status,
                t.Priority
            ))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<TaskResponse> CreateAsync(TaskRequest request, CancellationToken cancellationToken = default)
    {
        var projectExists = await _context.Projects
            .AsNoTracking()
            .AnyAsync(p => !p.IsDeleted && p.Id == request.ProjectId, cancellationToken);

        if (!projectExists)
            throw new InvalidOperationException($"ProjectId '{request.ProjectId}' does not exist.");

        TaskEntity? parentTracked = null;
        if (request.ParentTaskId is not null)
        {
            parentTracked = await _context.Tasks
                .FirstOrDefaultAsync(t => !t.IsDeleted && t.Id == request.ParentTaskId.Value, cancellationToken);

            if (parentTracked is null)
                throw new InvalidOperationException($"ParentTaskId '{request.ParentTaskId.Value}' does not exist.");

            if (parentTracked.ProjectId != request.ProjectId)
                throw new InvalidOperationException("Parent task must belong to the same project.");
        }

        var entity = new TaskEntity(request.ProjectId, request.Title, request.Description);
        entity.SetTargetDate(request.TargetDate);
        entity.SetStatus(request.ParsedStatus);
        entity.SetPriority(request.ParsedPriority);
        entity.SetParent(parentTracked);

        await _context.Tasks.AddAsync(entity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new TaskResponse(
            entity.Id,
            entity.ProjectId,
            entity.ParentTaskId,
            entity.Title,
            entity.Description,
            entity.TargetDate,
            entity.Status,
            entity.Priority
        );
    }

    public async Task<TaskResponse?> UpdateAsync(int id, TaskRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Tasks
            .FirstOrDefaultAsync(t => !t.IsDeleted && t.Id == id, cancellationToken);

        if (entity is null) return null;

        var projectExists = await _context.Projects
            .AsNoTracking()
            .AnyAsync(p => !p.IsDeleted && p.Id == request.ProjectId, cancellationToken);

        if (!projectExists)
            throw new InvalidOperationException($"ProjectId '{request.ProjectId}' does not exist.");

        if (request.ParentTaskId == id)
            throw new InvalidOperationException("A task cannot be its own parent.");

        TaskEntity? parentTracked = null;
        if (request.ParentTaskId is not null)
        {
            parentTracked = await _context.Tasks
                .FirstOrDefaultAsync(t => !t.IsDeleted && t.Id == request.ParentTaskId.Value, cancellationToken);

            if (parentTracked is null)
                throw new InvalidOperationException($"ParentTaskId '{request.ParentTaskId.Value}' does not exist.");

            if (parentTracked.ProjectId != request.ProjectId)
                throw new InvalidOperationException("Parent task must belong to the same project.");
        }

        entity.SetProject(request.ProjectId);
        entity.SetTitle(request.Title);
        entity.SetDescription(request.Description);
        entity.SetTargetDate(request.TargetDate);
        entity.SetStatus(request.ParsedStatus);
        entity.SetPriority(request.ParsedPriority);
        entity.SetParent(parentTracked);

        await _context.SaveChangesAsync(cancellationToken);

        return new TaskResponse(
            entity.Id,
            entity.ProjectId,
            entity.ParentTaskId,
            entity.Title,
            entity.Description,
            entity.TargetDate,
            entity.Status,
            entity.Priority
        );
    }

    public async Task<bool> SoftDeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Tasks
            .FirstOrDefaultAsync(t => !t.IsDeleted && t.Id == id, cancellationToken);

        if (entity is null) return false;

        entity.SoftDelete(SystemUser);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> AssignUserToTaskAsync(int taskId, int userId, CancellationToken cancellationToken = default)
    {
        var taskExists = await _context.Tasks
            .AsNoTracking()
            .AnyAsync(t => !t.IsDeleted && t.Id == taskId, cancellationToken);

        if (!taskExists) return false;

        var userExists = await _context.Users
            .AsNoTracking()
            .AnyAsync(u => !u.IsDeleted && u.Id == userId, cancellationToken);

        if (!userExists) return false;

        var existing = await _context.TaskAssignees
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(a => a.TaskId == taskId && a.UserId == userId, cancellationToken);

        if (existing is null)
        {
            var entity = new TaskAssignee(taskId, userId);

            // If TaskAssignee inherits BaseEntity and supports audit:
            if (entity is BaseEntity auditable)
                auditable.SetCreated(SystemUser);

            await _context.TaskAssignees.AddAsync(entity, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        // If already assigned and not deleted, treat as success
        if (!existing.IsDeleted) return true;

        // Restore soft-deleted assignment (requires BaseEntity.Restore)
        existing.Restore(SystemUser);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RemoveUserFromTaskAsync(int taskId, int userId, CancellationToken cancellationToken = default)
    {
        var existing = await _context.TaskAssignees
            .FirstOrDefaultAsync(a => !a.IsDeleted && a.TaskId == taskId && a.UserId == userId, cancellationToken);

        if (existing is null) return false;

        existing.SoftDelete(SystemUser);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}