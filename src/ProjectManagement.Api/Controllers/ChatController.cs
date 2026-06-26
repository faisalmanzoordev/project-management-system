using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Domain.Entities;
using ProjectManagement.Infrastructure.Data;

namespace ProjectManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChatController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Finding Or Creating ChatRoom Based on Task Or Project
        [HttpGet("room")]
        public async Task<IActionResult> GetOrCreateRoom([FromQuery] int? projectId, [FromQuery] int? taskId)
        {
            // ✅ FIX 1: Changed "||" to "&&". It should only error if BOTH are null.
            if (projectId == null && taskId == null)
                return BadRequest("ProjectId or TaskId must be given");

            // ✅ FIX 2: Explicit query parameters filter routing to match correctly
            ChatRoom? room = null;
            if (projectId != null)
            {
                room = await _context.ChatRooms
                    .FirstOrDefaultAsync(r => r.ProjectId == projectId);
            }
            else if (taskId != null)
            {
                room = await _context.ChatRooms
                    .FirstOrDefaultAsync(r => r.TaskId == taskId);
            }

            if (room == null)
            {
                room = new ChatRoom
                {
                    Name = projectId != null ? $"Project-{projectId}-Group" : $"Task-{taskId}-Thread",
                    ProjectId = projectId,
                    TaskId = taskId
                };
                _context.ChatRooms.Add(room);
                await _context.SaveChangesAsync();
            }

            return Ok(room);
        }

        // Fetching old chat history based on Room ID 
        [HttpGet("room/{roomId}/messages")]
        public async Task<IActionResult> GetRoomMessages(int roomId)
        {
            var messages = await _context.ChatMessages
                .Where(m => m.ChatRoomId == roomId)
                .OrderBy(m => m.SentAt)
                .Select(m => new {
                    m.Id,
                    m.ChatRoomId,
                    m.SenderId,
                    m.SenderName,
                    MessageText = m.IsDeleted != null ? "This message was deleted." : m.MessageText,
                    m.SentAt,
                    m.IsDeleted
                })
                .ToListAsync();

            return Ok(messages);
        }
    }
}