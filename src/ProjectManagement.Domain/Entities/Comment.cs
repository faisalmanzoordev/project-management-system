using ProjectManagement.Domain.Common;

namespace ProjectManagement.Domain.Entities
{
    public class Comment : BaseEntity
    {
        private Comment() { } // EF Core

        public Comment(int taskId, int authorId, string content)
        {
            if (taskId <= 0) throw new ArgumentOutOfRangeException(nameof(taskId));
            if (authorId <= 0) throw new ArgumentOutOfRangeException(nameof(authorId));

            TaskId = taskId;
            AuthorId = authorId;
            SetContent(content);
        }

        public int TaskId { get; private set; }
        public Tasks Task { get; private set; } = default!;

        public int AuthorId { get; private set; }
        public User Author { get; private set; } = default!;

        public string Content { get; private set; } = string.Empty;

        public void SetContent(string content)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(content);
            Content = content.Trim();
        }
    }
}
