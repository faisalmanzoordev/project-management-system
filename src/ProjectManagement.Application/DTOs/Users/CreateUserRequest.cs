using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectManagement.Application.DTOs.Users
{
    public sealed class CreateUserRequest
    {
        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(320)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [Range(1, int.MaxValue)]
        public int RoleId { get; set; }
    }
}
