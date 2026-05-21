using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Application.DTOs.Roles
{
    public sealed class RoleRequest
    {
        [Required]
        [StringLength(100)]
        public string Name { get; init; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; init; }
    }
}
