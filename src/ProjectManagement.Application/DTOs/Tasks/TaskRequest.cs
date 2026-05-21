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

    [Required]
    public TaskItemStatus Status { get; set; } = TaskItemStatus.Pending;
}