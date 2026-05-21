#nullable enable
using ProjectManagement.Domain.Common;
using ProjectManagement.Domain.Enums;

namespace ProjectManagement.Domain.Entities;

public class Tasks : BaseEntity
{
    private Tasks() { } // EF Core

    public Tasks(int projectId, string title, string? description = null)
    {
        SetProject(projectId);
        SetTitle(title);
        SetDescription(description);

        Priority = TaskPriority.Medium;
        Status = TaskItemStatus.Pending;
    }
   
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }

    // Planned schedule
    public DateTime? StartDate { get; private set; }
    public DateTime? TargetDate { get; private set; }

    // Actual timeline
    public DateTime? StartedOn { get; private set; }
    public DateTime? CompletedOn { get; private set; }

    public int ProjectId { get; private set; }
    public Project Project { get; private set; } = default!;

    public TaskPriority Priority { get; private set; }
    public TaskItemStatus Status { get; private set; }

    /// <summary>
    /// RRULE data (string or JSON) for recurrence. Keep in sync with your chosen recurrence library/format.
    /// </summary>
    public string? RecurrenceRule { get; private set; }

    /// <summary>
    /// Materialized path for efficient subtree queries (e.g., "/12/58/102/").
    /// Maintain this from application layer or domain methods as needed.
    /// </summary>
    public string? TreePath { get; private set; }

    // Self-referencing for infinite nesting
    public int? ParentTaskId { get; private set; }
    public Tasks? ParentTask { get; private set; }
    public ICollection<Tasks> SubTasks { get; private set; } = new HashSet<Tasks>();

    // Many-to-many via junction entity
    public ICollection<TaskAssignee> Assignees { get; private set; } = new HashSet<TaskAssignee>();

    // Comments
    public ICollection<Comment> Comments { get; private set; } = new HashSet<Comment>();

    public void SetProject(int projectId)
    {
        if (projectId <= 0) throw new ArgumentOutOfRangeException(nameof(projectId));
        ProjectId = projectId;
    }

    public void SetTitle(string title)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        Title = title.Trim();
    }

    public void SetDescription(string? description)
    {
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
    }

    /// <summary>
    /// Updates only TargetDate without touching StartDate.
    /// </summary>
    public void SetTargetDate(DateTime? targetDateUtc)
    {
        if (StartDate is not null && targetDateUtc is not null && targetDateUtc < StartDate)
            throw new ArgumentException("TargetDate cannot be earlier than StartDate.");

        TargetDate = targetDateUtc;
    }

    public void PlanDates(DateTime? startDateUtc, DateTime? targetDateUtc)
    {
        if (startDateUtc is not null && targetDateUtc is not null && targetDateUtc < startDateUtc)
            throw new ArgumentException("TargetDate cannot be earlier than StartDate.");

        StartDate = startDateUtc;
        TargetDate = targetDateUtc;
    }

    public void SetPriority(TaskPriority priority) => Priority = priority;

    public void SetStatus(TaskItemStatus status)
    {
        Status = status;
    }

    public void Start(DateTime? startedOnUtc = null)
    {
        var now = startedOnUtc ?? DateTime.UtcNow;

        if (CompletedOn is not null)
            throw new InvalidOperationException("Cannot start a task that is already completed.");

        StartedOn ??= now;

        if (Status is TaskItemStatus.Pending or TaskItemStatus.OnHold or TaskItemStatus.Overdue)
            Status = TaskItemStatus.InProgress;
    }

    public void Complete(DateTime? completedOnUtc = null)
    {
        var now = completedOnUtc ?? DateTime.UtcNow;

        if (StartedOn is not null && now < StartedOn)
            throw new ArgumentException("CompletedOn cannot be earlier than StartedOn.");

        CompletedOn = now;
        Status = TaskItemStatus.Done;
    }

    public void Cancel()
    {
        if (Status == TaskItemStatus.Done)
            throw new InvalidOperationException("Cannot cancel a completed task.");

        Status = TaskItemStatus.Cancelled;
    }

    public void SetRecurrenceRule(string? recurrenceRule)
    {
        RecurrenceRule = string.IsNullOrWhiteSpace(recurrenceRule) ? null : recurrenceRule.Trim();
    }

    public void SetTreePath(string? treePath)
    {
        TreePath = string.IsNullOrWhiteSpace(treePath) ? null : treePath.Trim();
    }

    public void SetParent(Tasks? parent)
    {
        if (parent is not null && parent.Id == Id && Id != 0)
            throw new InvalidOperationException("A task cannot be its own parent.");

        if (parent is not null && CreatesCycle(parent))
            throw new InvalidOperationException("Cannot set parent task because it would create a cycle.");

        ParentTask = parent;
        ParentTaskId = parent?.Id == 0 ? ParentTaskId : parent?.Id;
    }

    public void AddSubTask(Tasks subTask)
    {
        ArgumentNullException.ThrowIfNull(subTask);

        subTask.SetParent(this);
        SubTasks.Add(subTask);
    }

    public void RemoveSubTask(Tasks subTask)
    {
        ArgumentNullException.ThrowIfNull(subTask);

        if (SubTasks.Remove(subTask))
            subTask.SetParent(null);
    }

    private bool CreatesCycle(Tasks proposedParent)
    {
        Tasks? current = proposedParent;
        while (current is not null)
        {
            if (ReferenceEquals(current, this)) return true;
            current = current.ParentTask;
        }
        return false;
    }
}