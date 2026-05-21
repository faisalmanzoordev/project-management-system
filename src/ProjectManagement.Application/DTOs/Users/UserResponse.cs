using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectManagement.Application.DTOs.Users
{
    public sealed record UserResponse(int Id, string Name, string Email, int RoleId, string Role);
}
