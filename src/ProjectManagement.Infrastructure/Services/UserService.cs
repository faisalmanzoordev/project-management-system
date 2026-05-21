#nullable enable
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ProjectManagement.Application.Common.Interfaces;
using ProjectManagement.Application.DTOs.Users;
using ProjectManagement.Domain.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ProjectManagement.Infrastructure.Services;

public sealed class UserService : IUserService
{
    private const string SystemUser = "System_User";
    private const string DefaultRole = "User";
    private readonly IApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public UserService(IApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        // 1. Authenticate the User
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => !u.IsDeleted && u.Email == request.Email);

        if (user is null || user.PasswordHash != request.Password)
            return null;

        var roleName = user.Role?.Name ?? DefaultRole;

        // 2. Generate the Token via private helper method
        var tokenString = GenerateJwtToken(user, roleName);

        // 3. Return response payload cleanly
        return new AuthResponse
        {
            Token = tokenString,
            User = new UserResponse(user.Id, user.Name, user.Email, user.RoleId, roleName)
        };
    }

    // Private helper handles the heavy cryptographic configuration details
    private string GenerateJwtToken(User user, string roleName)
    {
        var secret = _configuration["JwtSettings:Secret"];
        if (string.IsNullOrWhiteSpace(secret))
            throw new InvalidOperationException("JWT Secret missing: JwtSettings:Secret");

        var key = Encoding.UTF8.GetBytes(secret);

        var claims = new List<Claim>
    {
        new(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new(ClaimTypes.Email, user.Email), // Perfectly captured for your audit logic!
        new(ClaimTypes.Role, roleName)
    };

        if (!double.TryParse(_configuration["JwtSettings:ExpiryInMinutes"], out var expiryMinutes))
            expiryMinutes = 60;

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),
            Issuer = _configuration["JwtSettings:Issuer"],
            Audience = _configuration["JwtSettings:Audience"],
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }

    public async Task<IReadOnlyList<UserResponse>> GetAllUsersAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .AsNoTracking()
            .Include(u => u.Role)
            .Where(u => !u.IsDeleted)
            .OrderBy(u => u.Name)
            .Select(u => new UserResponse(
                u.Id,
                u.Name,
                u.Email,
                u.RoleId,
                u.Role != null ? u.Role.Name : DefaultRole
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<UserResponse?> GetUserByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .AsNoTracking()
            .Include(u => u.Role)
            .Where(u => !u.IsDeleted && u.Id == id)
            .Select(u => new UserResponse(
                u.Id,
                u.Name,
                u.Email,
                u.RoleId,
                u.Role != null ? u.Role.Name : DefaultRole
            ))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<UserResponse> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        var role = await _context.Roles
            .AsNoTracking()
            .FirstOrDefaultAsync(r => !r.IsDeleted && r.Id == request.RoleId, cancellationToken);

        if (role is null)
            throw new InvalidOperationException($"RoleId '{request.RoleId}' does not exist.");

        var emailExists = await _context.Users
            .AsNoTracking()
            .AnyAsync(u => !u.IsDeleted && u.Email == request.Email, cancellationToken);

        if (emailExists)
            throw new InvalidOperationException("A user with this email already exists.");

        var user = new User(
            request.Name,
            request.Email,
            request.Password,
            request.RoleId
        );

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        return new UserResponse(
            user.Id,
            user.Name,
            user.Email,
            user.RoleId,
            role.Name
        );
    }

    public async Task<UserResponse?> UpdateUserAsync(int id, UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => !u.IsDeleted && u.Id == id, cancellationToken);

        if (existingUser is null) return null;

        var role = await _context.Roles
            .AsNoTracking()
            .FirstOrDefaultAsync(r => !r.IsDeleted && r.Id == request.RoleId, cancellationToken);

        if (role is null)
            throw new InvalidOperationException($"RoleId '{request.RoleId}' does not exist.");

        existingUser.SetName(request.Name);
        existingUser.SetEmail(request.Email);
        existingUser.SetRole(request.RoleId);

        await _context.SaveChangesAsync(cancellationToken);

        return new UserResponse(
            existingUser.Id,
            existingUser.Name,
            existingUser.Email,
            existingUser.RoleId,
            role.Name
        );
    }

    public async Task<bool> DeleteUserAsync(int id, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => !u.IsDeleted && u.Id == id, cancellationToken);

        if (user is null) return false;

        user.SoftDelete(SystemUser);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}