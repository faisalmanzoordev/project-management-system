using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectManagement.Application.DTOs.Workspaces
{
    public sealed record WorkspaceResponse(int Id, string Name, string? Description);
}
