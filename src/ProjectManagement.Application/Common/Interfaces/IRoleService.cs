using ProjectManagement.Application.DTOs.Roles;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectManagement.Application.Common.Interfaces
{
    public interface IRoleService
    {
        Task<IReadOnlyList<RoleResponse>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<RoleResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<RoleResponse> CreateAsync(RoleRequest request, CancellationToken cancellationToken = default);
        Task<RoleResponse?> UpdateAsync(int id, RoleRequest request, CancellationToken cancellationToken = default);
        Task<bool> SoftDeleteAsync(int id, CancellationToken cancellationToken = default);
    }
}
