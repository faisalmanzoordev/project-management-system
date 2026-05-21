using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectManagement.Application.DTOs.Projects
{
    public sealed record ProjectResponse(int Id, int WorkspaceId, string Name, string? Description);
}
