using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Application.DTOs.Comments
{
    public sealed class CommentRequest
    {
        [Required]
        [Range(1, int.MaxValue)]
        public int TaskId { get; set; }

        [Required]
        [StringLength(4000)]
        public string Content { get; set; } = string.Empty;
    }
}
