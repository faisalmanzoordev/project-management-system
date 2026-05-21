namespace ProjectManagement.Application.DTOs.Roles
{
    public sealed record RoleResponse(
    int Id,
    string Name,
    string? Description
    );
}
