#nullable enable
using ProjectManagement.Domain.Enums;

namespace ProjectManagement.Application.DTOs.Projects;

public sealed record ProjectTaskSummaryResponse(int Id, string Title, TaskItemStatus Status);

public sealed record ProjectWithTasksResponse(
    int Id,
    int WorkspaceId,
    string Name,
    string? Description,
    IReadOnlyList<ProjectTaskSummaryResponse> Tasks
);