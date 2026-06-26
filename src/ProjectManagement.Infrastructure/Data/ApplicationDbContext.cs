using Microsoft.EntityFrameworkCore;
using ProjectManagement.Domain.Common;
using ProjectManagement.Domain.Entities;
using ProjectManagement.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ProjectManagement.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext, IApplicationDbContext
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        // Inject IHttpContextAccessor alongside your standard options
        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options,
            IHttpContextAccessor httpContextAccessor) : base(options)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Workspace> Workspaces => Set<Workspace>();
        public DbSet<Project> Projects => Set<Project>();
        public DbSet<Tasks> Tasks => Set<Tasks>();
        public DbSet<TaskAssignee> TaskAssignees => Set<TaskAssignee>();
        public DbSet<Comment> Comments => Set<Comment>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<ChatRoom> ChatRooms { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<TaskAssignee>(entity =>
            {
                entity.ToTable("TaskAssignees");
                entity.HasKey(ta => new { ta.TaskId, ta.UserId, ta.Id });

                entity.HasOne(ta => ta.Task)
                      .WithMany(t => t.Assignees)
                      .HasForeignKey(ta => ta.TaskId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ta => ta.User)
                      .WithMany(u => u.TaskAssignees)
                      .HasForeignKey(ta => ta.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.Property(e => e.Id)
                      .ValueGeneratedOnAdd();
            });

            modelBuilder.Entity<Tasks>(entity =>
            {
                entity.HasOne(t => t.ParentTask)
                      .WithMany(p => p.SubTasks)
                      .HasForeignKey(t => t.ParentTaskId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(t => t.Status);
                entity.HasIndex(t => t.TargetDate);
            });

            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
                {
                    modelBuilder.Entity(entityType.ClrType)
                                .HasQueryFilter(ConvertFilterExpression(entityType.ClrType));
                }
            }
        }

        private static System.Linq.Expressions.LambdaExpression ConvertFilterExpression(Type type)
        {
            var parameter = System.Linq.Expressions.Expression.Parameter(type, "e");
            var property = System.Linq.Expressions.Expression.Property(parameter, nameof(BaseEntity.IsDeleted));
            var falseConstant = System.Linq.Expressions.Expression.Constant(false);
            var comparison = System.Linq.Expressions.Expression.Equal(property, falseConstant);

            return System.Linq.Expressions.Expression.Lambda(comparison, parameter);
        }

        public override int SaveChanges()
        {
            ApplyAuditAndSoftDeleteLogics();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            ApplyAuditAndSoftDeleteLogics();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void ApplyAuditAndSoftDeleteLogics()
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.Entity is BaseEntity && (e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted));

            // Extract the user identity email directly from the active JWT claim context
            var userContext = _httpContextAccessor.HttpContext?.User;
            string currentLoggedInUser = userContext?.FindFirstValue(ClaimTypes.Email)
                                 ?? userContext?.FindFirstValue("email")
                                 ?? "System_User";

            foreach (var entry in entries)
            {
                var entity = (BaseEntity)entry.Entity;
                var now = DateTime.UtcNow;

                if (entry.State == EntityState.Added)
                {
                    entity.SetCreated(currentLoggedInUser, now);
                }
                else if (entry.State == EntityState.Modified)
                {
                    entity.SetUpdated(currentLoggedInUser, now);
                }
                else if (entry.State == EntityState.Deleted)
                {
                    entry.State = EntityState.Modified;
                    entity.SoftDelete(currentLoggedInUser, now);
                }
            }
        }
    }
}