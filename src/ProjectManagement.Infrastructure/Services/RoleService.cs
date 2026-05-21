#nullable enable
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Application.Common.Interfaces;
using ProjectManagement.Application.DTOs.Roles;
using ProjectManagement.Domain.Entities;

namespace ProjectManagement.Infrastructure.Services;

public sealed class RoleService : IRoleService
{
    private const string SystemUser = "System_User";
    private readonly IApplicationDbContext _context;

    public RoleService(IApplicationDbContext context) => _context = context;

    public async Task<IReadOnlyList<RoleResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Roles
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Name)
            .Select(x => new RoleResponse(x.Id, x.Name, x.Description))
            .ToListAsync(cancellationToken);
    }

    public async Task<RoleResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Roles
            .AsNoTracking()
            .Where(x => !x.IsDeleted && x.Id == id)
            .Select(x => new RoleResponse(x.Id, x.Name, x.Description))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<RoleResponse> CreateAsync(RoleRequest request, CancellationToken cancellationToken = default)
    {
        var name = request.Name.Trim();
        var description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

        var exists = await _context.Roles
            .AsNoTracking()
            .AnyAsync(x => !x.IsDeleted && x.Name == name, cancellationToken);

        if (exists)
            throw new InvalidOperationException($"Role '{name}' already exists.");

        var entity = new Role(name, description);

        await _context.Roles.AddAsync(entity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new RoleResponse(entity.Id, entity.Name, entity.Description);
    }

    public async Task<RoleResponse?> UpdateAsync(int id, RoleRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Roles
            .FirstOrDefaultAsync(x => !x.IsDeleted && x.Id == id, cancellationToken);

        if (entity is null) return null;

        var name = request.Name.Trim();
        var description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

        var nameTaken = await _context.Roles
            .AsNoTracking()
            .AnyAsync(x => !x.IsDeleted && x.Id != id && x.Name == name, cancellationToken);

        if (nameTaken)
            throw new InvalidOperationException($"Role '{name}' already exists.");

        entity.SetName(name);
        entity.SetDescription(description);

        await _context.SaveChangesAsync(cancellationToken);

        return new RoleResponse(entity.Id, entity.Name, entity.Description);
    }

    public async Task<bool> SoftDeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Roles
            .FirstOrDefaultAsync(x => !x.IsDeleted && x.Id == id, cancellationToken);

        if (entity is null) return false;

        entity.SoftDelete(SystemUser);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}