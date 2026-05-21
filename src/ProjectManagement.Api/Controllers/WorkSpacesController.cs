#nullable enable
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Application.Common.Interfaces;
using ProjectManagement.Application.DTOs.Workspaces;

namespace ProjectManagement.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class WorkspacesController : ControllerBase
{
    private readonly IWorkspaceService _service;

    public WorkspacesController(IWorkspaceService service)
    {
        _service = service;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<WorkspaceResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<WorkspaceResponse>>> GetAll(CancellationToken cancellationToken)
        => Ok(await _service.GetAllAsync(cancellationToken));

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(WorkspaceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkspaceResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var workspace = await _service.GetByIdAsync(id, cancellationToken);
        return workspace is null ? NotFound() : Ok(workspace);
    }

    [HttpGet("{id:int}/details")]
    [ProducesResponseType(typeof(WorkspaceDetailsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkspaceDetailsResponse>> GetDetails(int id, CancellationToken cancellationToken)
    {
        var result = await _service.GetWorkspaceDetailsAsync(id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(WorkspaceResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<WorkspaceResponse>> Create([FromBody] WorkspaceRequest request, CancellationToken cancellationToken)
    {
        var created = await _service.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(WorkspaceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkspaceResponse>> Update(int id, [FromBody] WorkspaceRequest request, CancellationToken cancellationToken)
    {
        var updated = await _service.UpdateAsync(id, request, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var deleted = await _service.SoftDeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}