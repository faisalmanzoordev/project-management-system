#nullable enable
using ProjectManagement.Application.DTOs.Users;

namespace ProjectManagement.Application.Common.Interfaces;

public interface IUserService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<IReadOnlyList<UserResponse>> GetAllUsersAsync(CancellationToken cancellationToken = default);
    Task<UserResponse?> GetUserByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<UserResponse> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default);
    Task<UserResponse?> UpdateUserAsync(int id, UpdateUserRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteUserAsync(int id, CancellationToken cancellationToken = default);
}