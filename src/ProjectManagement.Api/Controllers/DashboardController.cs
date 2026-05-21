#nullable enable
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Application.Common.Interfaces;
using ProjectManagement.Application.DTOs.Dashboard;

namespace ProjectManagement.Api.Controllers;

[Authorize(Roles = "Admin,Project Manager")]
[ApiController]
[Route("api/dashboard")]
public sealed class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;

    public DashboardController(IDashboardService service)
    {
        _service = service;
    }

    [HttpGet("metrics")]
    [ProducesResponseType(typeof(TenantMetricsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TenantMetricsResponse>> GetMetrics(CancellationToken cancellationToken)
        => Ok(await _service.GetTenantMetricsAsync(cancellationToken));
}