#nullable enable
using ProjectManagement.Domain.Enums;
using System;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Application.DTOs.Tasks;

public sealed class TaskRequest
{
    [Required]
    [Range(1, int.MaxValue)]
    public int ProjectId { get; set; }

    public int? ParentTaskId { get; set; }

    [Required]
    [StringLength(300)]
    public string Title { get; set; } = string.Empty;

    [StringLength(4000)]
    public string? Description { get; set; }

    public DateTime? TargetDate { get; set; }

    // 1. Accept the raw string from the frontend payload
    [Required]
    public string Status { get; set; } = "To Do";

    // 2. Add a helper property for your service layer to read the real Enum value
    public TaskItemStatus ParsedStatus
    {
        get
        {
            // Clean up the frontend string to match your backend Enum naming rules
            var normalizedStatus = Status.Replace(" ", ""); // Converts "To Do" to "ToDo"

            if (Enum.TryParse<TaskItemStatus>(normalizedStatus, true, out var result))
            {
                return result;
            }
            return TaskItemStatus.Pending; // Fallback default state
        }
    }

    // 1. Accept the raw string from the frontend payload
    [Required]
    public string Priority { get; set; } = "Medium";

    // 2. Add a helper property for your service layer to read the real Enum value
    public TaskPriority ParsedPriority
    {
        get
        {
            // Clean up the frontend string to match your backend Enum naming rules
            var normalizedPriority = Priority.Replace(" ", ""); 

            if (Enum.TryParse<TaskPriority>(normalizedPriority, true, out var result))
            {
                return result;
            }
            return TaskPriority.Medium; // Fallback default state
        }
    }
}