#nullable enable
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Application.Common.Interfaces;
using ProjectManagement.Application.DTOs.Comments;
using ProjectManagement.Domain.Entities;

namespace ProjectManagement.Infrastructure.Services;

public sealed class CommentService : ICommentService
{
    private const string SystemUser = "System_User";

    private readonly IApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CommentService(IApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<IEnumerable<CommentResponse>> GetCommentsByTaskIdAsync(int taskId, CancellationToken cancellationToken = default)
    {
        var taskExists = await _context.Tasks
            .AsNoTracking()
            .AnyAsync(t => !t.IsDeleted && t.Id == taskId, cancellationToken);

        if (!taskExists)
            throw new KeyNotFoundException($"Task '{taskId}' was not found.");

        return await _context.Comments
            .AsNoTracking()
            .Where(c => !c.IsDeleted && c.TaskId == taskId)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentResponse(
                c.Id,
                c.Content,
                c.CreatedAt,
                c.TaskId,
                c.CreatedBy
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<CommentResponse> AddCommentAsync(CommentRequest request, CancellationToken cancellationToken = default)
    {
        var taskExists = await _context.Tasks
            .AsNoTracking()
            .AnyAsync(t => !t.IsDeleted && t.Id == request.TaskId, cancellationToken);

        if (!taskExists)
            throw new KeyNotFoundException($"Task '{request.TaskId}' was not found.");

        var userId = GetCurrentUserIdOrThrow();
        var createdBy = userId.ToString();

        // Assumes your domain Comment supports (taskId, authorId, content).
        // If your Comment entity does not have AuthorId, adjust constructor accordingly.
        var entity = new Comment(request.TaskId, userId, request.Content);

        // If your BaseEntity exposes SetCreated(), this will populate audit fields consistently.
        entity.SetCreated(createdBy);

        await _context.Comments.AddAsync(entity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new CommentResponse(
            entity.Id,
            entity.Content,
            entity.CreatedAt,
            entity.TaskId,
            entity.CreatedBy
        );
    }

    public async Task<bool> DeleteCommentAsync(int commentId, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Comments
            .FirstOrDefaultAsync(c => !c.IsDeleted && c.Id == commentId, cancellationToken);

        if (entity is null) return false;

        entity.SoftDelete(SystemUser);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    private int GetCurrentUserIdOrThrow()
    {
        var httpContext = _httpContextAccessor.HttpContext;

        var claim = httpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(claim, out var userId) && userId > 0)
            return userId;

        throw new UnauthorizedAccessException("Authenticated user id is missing or invalid.");
    }
}