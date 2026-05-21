using ProjectManagement.Domain.Common;

namespace ProjectManagement.Domain.Entities
{
    public sealed class Project : BaseEntity
    {
        private Project() { } // EF Core

        public Project(string name, int workspaceId, string? description = null)
        {
            SetName(name);
            SetWorkspace(workspaceId);
            SetDescription(description);
        }

        public int WorkspaceId { get; private set; }
        public Workspace Workspace { get; private set; } = default!;

        public string Name { get; private set; } = string.Empty;
        public string? Description { get; private set; }

        public ICollection<Tasks> Tasks { get; private set; } = new HashSet<Tasks>();

        public void SetWorkspace(int workspaceId)
        {
            if (workspaceId <= 0) throw new ArgumentOutOfRangeException(nameof(workspaceId));
            WorkspaceId = workspaceId;
        }

        public void SetName(string name)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(name);
            Name = name.Trim();
        }

        public void SetDescription(string? description)
        {
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        }
    }
}
