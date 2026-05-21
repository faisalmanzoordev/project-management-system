#nullable enable
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Application.Common.Interfaces;
using ProjectManagement.Application.DTOs.Comments;

namespace ProjectManagement.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class CommentsController : ControllerBase
{
    private readonly ICommentService _service;

    public CommentsController(ICommentService service)
    {
        _service = service;
    }

    [HttpGet("task/{taskId:int}")]
    [ProducesResponseType(typeof(IEnumerable<CommentResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<CommentResponse>>> GetByTaskId(int taskId, CancellationToken cancellationToken)
        => Ok(await _service.GetCommentsByTaskIdAsync(taskId, cancellationToken));

    [HttpPost]
    [ProducesResponseType(typeof(CommentResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<CommentResponse>> Create([FromBody] CommentRequest request, CancellationToken cancellationToken)
    {
        var created = await _service.AddCommentAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetByTaskId), new { taskId = created.TaskId }, created);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var deleted = await _service.DeleteCommentAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}