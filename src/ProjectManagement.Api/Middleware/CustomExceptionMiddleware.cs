#nullable enable
using System.Net;
using System.Text.Json;

namespace ProjectManagement.Api.Middleware;

public sealed class CustomExceptionMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly RequestDelegate _next;
    private readonly ILogger<CustomExceptionMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public CustomExceptionMiddleware(
        RequestDelegate next,
        ILogger<CustomExceptionMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred. TraceId: {TraceId}", context.TraceIdentifier);

            var (statusCode, message) = MapException(ex);

            context.Response.Clear();
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";

            var response = new ErrorResponse(
                StatusCode: statusCode,
                Message: message,
                Detail: _environment.IsDevelopment() ? ex.ToString() : null,
                TraceId: context.TraceIdentifier
            );

            await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
        }
    }

    private static (int StatusCode, string Message) MapException(Exception ex)
    {
        return ex switch
        {
            ArgumentException => ((int)HttpStatusCode.BadRequest, ex.Message),
            InvalidOperationException => ((int)HttpStatusCode.BadRequest, ex.Message),
            KeyNotFoundException => ((int)HttpStatusCode.NotFound, ex.Message),
            UnauthorizedAccessException => ((int)HttpStatusCode.Unauthorized, "Unauthorized."),
            _ => ((int)HttpStatusCode.InternalServerError, "An unexpected error occurred.")
        };
    }

    private sealed record ErrorResponse(int StatusCode, string Message, string? Detail, string TraceId);
}