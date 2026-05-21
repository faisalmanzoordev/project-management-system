using ProjectManagement.Application.DTOs.Projects;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectManagement.Application.Common.Interfaces
{
    public interface IProjectService
    {
        Task<IReadOnlyList<ProjectResponse>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<ProjectResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<ProjectResponse> CreateAsync(ProjectRequest request, CancellationToken cancellationToken = default);
        Task<ProjectResponse?> UpdateAsync(int id, ProjectRequest request, CancellationToken cancellationToken = default);
        Task<bool> SoftDeleteAsync(int id, CancellationToken cancellationToken = default);
        Task<ProjectWithTasksResponse?> GetProjectWithTasksAsync(int projectId, CancellationToken cancellationToken = default);
    }
}
