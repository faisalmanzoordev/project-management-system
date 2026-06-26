using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectManagement.Domain.Entities
{
    public class ChatRoom
    {
        public int Id { get; set; }
        public string Name { get; set; } // e.g., "Project - CHMS Chat" ya "Task-102 Discussion"

        // Context tracking taake hum filter kar sakein
        public int? ProjectId { get; set; }
        public int? TaskId { get; set; }

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        // Navigation property for relationships
        public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }
}
