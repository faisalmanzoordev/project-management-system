#nullable enable
using ProjectManagement.Domain.Common;

namespace ProjectManagement.Domain.Entities;

public class User : BaseEntity
{
    private User() { } // EF Core

    public User(string name, string email, int roleId)
    {
        SetName(name);
        SetEmail(email);
        SetRole(roleId);

        // Because UserRequest currently has no Password property.
        // Existing manually-created DB users can still have PasswordHash values for login.
        PasswordHash = string.Empty;
    }

    public User(string name, string email, string passwordHash, int roleId)
    {
        SetName(name);
        SetEmail(email);
        SetPasswordHash(passwordHash);
        SetRole(roleId);
    }

    public string Name { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;

    public int RoleId { get; private set; }
    public virtual Role? Role { get; private set; }

    public virtual ICollection<TaskAssignee> TaskAssignees { get; private set; } = new HashSet<TaskAssignee>();

    public void SetName(string name)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        Name = name.Trim();
    }

    public void SetEmail(string email)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        Email = email.Trim();
    }

    public void SetPasswordHash(string passwordHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);
        PasswordHash = passwordHash;
    }

    public void SetRole(int roleId)
    {
        if (roleId <= 0)
            throw new ArgumentOutOfRangeException(nameof(roleId));

        RoleId = roleId;
    }
}