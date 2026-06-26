using Microsoft.AspNetCore.SignalR;
using ProjectManagement.Domain.Entities;
using ProjectManagement.Infrastructure.Data;
using System;

namespace ProjectManagement.Api.Hubs
{
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;

        public ChatHub(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Jion User to a specific Chat Room Group
        public async Task JoinRoom(string roomName)
        {
            // SignalR built-in method that binds this connection into group
            await Groups.AddToGroupAsync(Context.ConnectionId, roomName);

            // Optional: System notification may be send to other peoples
            await Clients.Group(roomName).SendAsync("ReceiveSystemMessage", $"{Context.ConnectionId} has joined the room.");
        }

        // 2. Remove User from a specific Chat Room Group
        public async Task LeaveRoom(string roomName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomName);
        }

        // 3. Real-time Message receiving & Saving in Database
        public async Task SendMessageToRoom(int chatRoomId, string roomName, string senderId, string senderName, string messageText)
        {
            if (string.IsNullOrWhiteSpace(messageText)) return;

            var newMessage = new ChatMessage
            {
                ChatRoomId = chatRoomId,
                SenderId = senderId,
                SenderName = senderName,
                MessageText = messageText,
                SentAt = DateTime.Now
            };

            _context.ChatMessages.Add(newMessage);
            await _context.SaveChangesAsync();

            await Clients.Group(roomName).SendAsync("ReceiveMessage", new
            {
                id = newMessage.Id,
                chatRoomId = newMessage.ChatRoomId,
                senderId = newMessage.SenderId,
                senderName = newMessage.SenderName,
                messageText = newMessage.MessageText,
                sentAt = newMessage.SentAt
            });
        }

        public async Task DeleteMessage(int messageId, string roomName, string requesterId)
        {
            var message = await _context.ChatMessages.FindAsync(messageId);

            if (message == null) return;

            if (message.SenderId != requesterId)
            {
                await Clients.Caller.SendAsync("DeleteMessageError", "You can only delete your own messages.");
                return;
            }

            message.IsDeleted = true;
            await _context.SaveChangesAsync();

            await Clients.Group(roomName).SendAsync("MessageDeleted", messageId);
        }
    }
}
