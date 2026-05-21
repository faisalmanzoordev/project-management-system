using ProjectManagement.Domain.Common;

namespace ProjectManagement.Domain.Entities
{
    public class TaskAssignee : BaseEntity
    {
        private TaskAssignee() { } // EF Core

        public TaskAssignee(int taskId, int userId)
        {
            if (taskId <= 0) throw new ArgumentOutOfRangeException(nameof(taskId));
            if (userId <= 0) throw new ArgumentOutOfRangeException(nameof(userId));

            TaskId = taskId;
            UserId = userId;
        }

        public int TaskId { get; private set; }
        public Tasks Task { get; private set; } = default!;

        public int UserId { get; private set; }
        public User User { get; private set; } = default!;
    }
}
