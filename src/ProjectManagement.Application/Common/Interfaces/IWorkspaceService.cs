using ProjectManagement.Application.DTOs.Workspaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectManagement.Application.Common.Interfaces
{
    public interface IWorkspaceService
    {
        Task<IReadOnlyList<WorkspaceResponse>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<WorkspaceResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<WorkspaceResponse> CreateAsync(WorkspaceRequest request, CancellationToken cancellationToken = default);
        Task<WorkspaceResponse?> UpdateAsync(int id, WorkspaceRequest request, CancellationToken cancellationToken = default);
        Task<bool> SoftDeleteAsync(int id, CancellationToken cancellationToken = default);
        Task<WorkspaceDetailsResponse?> GetWorkspaceDetailsAsync(int workspaceId, CancellationToken cancellationToken = default);
    }
}
