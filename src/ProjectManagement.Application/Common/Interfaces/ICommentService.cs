#nullable enable
using ProjectManagement.Application.DTOs.Comments;

namespace ProjectManagement.Application.Common.Interfaces;

public interface ICommentService
{
    Task<IEnumerable<CommentResponse>> GetCommentsByTaskIdAsync(int taskId, CancellationToken cancellationToken = default);
    Task<CommentResponse> AddCommentAsync(CommentRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteCommentAsync(int commentId, CancellationToken cancellationToken = default);
}