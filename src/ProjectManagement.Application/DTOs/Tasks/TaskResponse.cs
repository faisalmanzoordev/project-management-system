#nullable enable
using ProjectManagement.Domain.Enums;

namespace ProjectManagement.Application.DTOs.Tasks;

public sealed record TaskResponse(
    int Id,
    int ProjectId,
    int? ParentTaskId,
    string Title,
    string? Description,
    DateTime? TargetDate,
    TaskItemStatus Status,
    TaskPriority Priority
);