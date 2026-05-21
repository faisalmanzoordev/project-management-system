#nullable enable
using ProjectManagement.Application.DTOs.Tasks;

namespace ProjectManagement.Application.Common.Interfaces;

public interface ITaskService
{
    Task<IReadOnlyList<TaskResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<TaskResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<TaskResponse> CreateAsync(TaskRequest request, CancellationToken cancellationToken = default);
    Task<TaskResponse?> UpdateAsync(int id, TaskRequest request, CancellationToken cancellationToken = default);
    Task<bool> SoftDeleteAsync(int id, CancellationToken cancellationToken = default);

    Task<bool> AssignUserToTaskAsync(int taskId, int userId, CancellationToken cancellationToken = default);
    Task<bool> RemoveUserFromTaskAsync(int taskId, int userId, CancellationToken cancellationToken = default);
}