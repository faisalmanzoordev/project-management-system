using System;

namespace ProjectManagement.Domain.Common
{
    public abstract class BaseEntity
    {
        public int Id { get; protected set; }
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
        public string CreatedBy { get; private set; } = "System";
        public DateTime? UpdatedAt { get; private set; }
        public string? UpdatedBy { get; private set; }
        public bool IsDeleted { get; private set; } = false;

        public void SetCreated(string createdBy, DateTime? createdAtUtc = null)
        {
            if (string.IsNullOrWhiteSpace(createdBy))
                throw new ArgumentException("Creator identity cannot be empty.", nameof(createdBy));

            CreatedBy = createdBy.Trim();
            CreatedAt = createdAtUtc ?? DateTime.UtcNow;
        }

        public void SetUpdated(string updatedBy, DateTime? updatedAtUtc = null)
        {
            if (string.IsNullOrWhiteSpace(updatedBy))
                throw new ArgumentException("Modifier identity cannot be empty.", nameof(updatedBy));

            UpdatedBy = updatedBy.Trim();
            UpdatedAt = updatedAtUtc ?? DateTime.UtcNow;
        }

        public void SoftDelete(string deletedBy, DateTime? deletedAtUtc = null)
        {
            if (IsDeleted) return;

            IsDeleted = true;
            SetUpdated(deletedBy, deletedAtUtc);
        }

        public void Restore(string restoredBy, DateTime? restoredAtUtc = null)
        {
            if (!IsDeleted) return;

            IsDeleted = false;
            SetUpdated(restoredBy, restoredAtUtc);
        }
    }
}