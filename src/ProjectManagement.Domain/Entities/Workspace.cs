using ProjectManagement.Domain.Common;

namespace ProjectManagement.Domain.Entities
{
    public sealed class Workspace : BaseEntity
    {
        private Workspace() { } // EF Core

        public Workspace(string name, string? description = null)
        {
            SetName(name);
            SetDescription(description);
        }

        public string Name { get; private set; } = string.Empty;
        public string? Description { get; private set; }

        public ICollection<Project> Projects { get; private set; } = new HashSet<Project>();

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
