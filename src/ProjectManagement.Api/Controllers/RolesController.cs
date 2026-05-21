using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Application.Common.Interfaces;
using ProjectManagement.Application.DTOs.Roles;

namespace ProjectManagement.Api.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public sealed class RolesController : ControllerBase
    {
        private readonly IRoleService _service;

        public RolesController(IRoleService service)
        {
            _service = service;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IReadOnlyList<RoleResponse>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IReadOnlyList<RoleResponse>>> GetAll(CancellationToken cancellationToken)
            => Ok(await _service.GetAllAsync(cancellationToken));

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(RoleResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<RoleResponse>> GetById(int id, CancellationToken cancellationToken)
        {
            var role = await _service.GetByIdAsync(id, cancellationToken);
            return role is null ? NotFound() : Ok(role);
        }

        [HttpPost]
        [ProducesResponseType(typeof(RoleResponse), StatusCodes.Status201Created)]
        public async Task<ActionResult<RoleResponse>> Create([FromBody] RoleRequest request, CancellationToken cancellationToken)
        {
            var created = await _service.CreateAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(RoleResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<RoleResponse>> Update(int id, [FromBody] RoleRequest request, CancellationToken cancellationToken)
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
}
