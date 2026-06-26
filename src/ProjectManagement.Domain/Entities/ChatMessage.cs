using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectManagement.Domain.Entities
{
    public class ChatMessage
    {
        public int Id { get; set; }
        public int ChatRoomId { get; set; }

        public string SenderId { get; set; } // User identifier
        public string SenderName { get; set; } // Frontend pe direct display ke liye
        public string MessageText { get; set; }

        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public bool? IsDeleted { get; set; } = false;
        // Foreign Key Relationship
        public virtual ChatRoom ChatRoom { get; set; }
    }
}
