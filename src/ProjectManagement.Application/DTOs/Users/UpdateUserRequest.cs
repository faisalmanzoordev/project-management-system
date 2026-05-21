using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Application.DTOs.Users
{
    public sealed class UpdateUserRequest
    {
        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(320)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Range(1, int.MaxValue)]
        public int RoleId { get; set; }
    }
}
