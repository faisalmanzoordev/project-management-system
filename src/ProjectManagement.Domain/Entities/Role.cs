using ProjectManagement.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectManagement.Domain.Entities
{
    public sealed class Role : BaseEntity
    {
        private Role() { } // EF Core

        public Role(string name, string? description = null)
        {
            SetName(name);
            SetDescription(description);
        }

        public string Name { get; private set; } = string.Empty;
        public string? Description { get; private set; }

        public ICollection<User> Users { get; private set; } = new HashSet<User>();

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
