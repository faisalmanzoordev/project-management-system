export interface IChatRoom {
    id: number;
    name: string;
    projectId?: number;
    taskId?: number;
    createdOn: string;
}

export interface IChatMessage {
    id?: number;
    chatRoomId: number;
    senderId: string;
    senderName: string;
    messageText: string;
    sentAt: string;
    isDeleted?: boolean;
}