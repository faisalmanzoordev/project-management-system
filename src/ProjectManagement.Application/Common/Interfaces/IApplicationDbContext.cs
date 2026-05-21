using Microsoft.EntityFrameworkCore;
using ProjectManagement.Domain.Entities;

namespace ProjectManagement.Application.Common.Interfaces
{
    public interface IApplicationDbContext
    {
        DbSet<User> Users { get; }
        DbSet<Workspace> Workspaces { get; }
        DbSet<Project> Projects { get; }
        DbSet<Tasks> Tasks { get; }
        DbSet<TaskAssignee> TaskAssignees { get; }
        DbSet<Comment> Comments { get; }
        DbSet<Role> Roles { get; }
        int SaveChanges();
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
