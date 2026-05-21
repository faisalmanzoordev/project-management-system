namespace ProjectManagement.Application.DTOs.Comments
{
    public sealed record CommentResponse(
    int Id,
    string Content,
    DateTime CreatedAt,
    int TaskId,
    string CreatedBy
);
}
