#nullable enable
namespace ProjectManagement.Application.DTOs.Workspaces;

public sealed record WorkspaceProjectSummaryResponse(int Id, string Name, string? Description);

public sealed record WorkspaceDetailsResponse(
    int Id,
    string Name,
    string? Description,
    IReadOnlyList<WorkspaceProjectSummaryResponse> Projects
);