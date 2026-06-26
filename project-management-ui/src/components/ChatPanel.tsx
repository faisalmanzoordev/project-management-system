import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext'; // 1. Import your custom authentication hook
import type { IChatRoom, IChatMessage } from '../types/chat';
import axiosInstance from "../api/axiosInstance";

interface ChatPanelProps {
    projectId?: number;
    taskId?: number;
    roomName: string;
    onClose: () => void;
}

function formatMessageTime(sentAt: string | Date | null | undefined): string {
    if (!sentAt) return "";
    const d = sentAt instanceof Date ? sentAt : new Date(sentAt);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ projectId, taskId, roomName, onClose }) => {
    const { hubConnection, isChatConnected } = useApp();
    const { user } = useAuth(); // 2. Extract the authenticated user object state

    const [room, setRoom] = useState<IChatRoom | null>(null);
    const [messages, setMessages] = useState<IChatMessage[]>([]);
    const [typedMessage, setTypedMessage] = useState<string>('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // 1. Load Room Configuration and Historical Data from Backend APIs
    useEffect(() => {
        const queryParam = projectId ? `projectId=${projectId}` : `taskId=${taskId}`;

        // Use your configured axios instance instead of hardcoded fetch URLs
        axiosInstance.get<IChatRoom>(`chat/room?${queryParam}`)
            .then(res => {
                const roomData = res.data;
                setRoom(roomData);

                // Fetch room history texts
                return axiosInstance.get<IChatMessage[]>(`chat/room/${roomData.id}/messages`);
            })
            .then(res => {
                setMessages(res.data);
                scrollToBottom();
            })
            .catch(err => {
                console.error("Error loading chat context profiles:", err);
            });
    }, [projectId, taskId]);

    // 2. Bind Active SignalR Live Group Stream Channel Listeners
    useEffect(() => {
        if (!hubConnection || !isChatConnected) return;

        // Join the context group room on the SignalR server
        hubConnection.invoke("JoinRoom", roomName)
            .catch((err: any) => console.error("Failed to execute JoinRoom pipeline invoke:", err));

        // Handle streaming real-time messages received over the open socket connection
        hubConnection.on("ReceiveMessage", (incomingMessage: IChatMessage) => {
            setMessages(prev => [...prev, incomingMessage]);
        });

        // ✅ LISTEN FOR SOFT DELETE: Catch the real-time delete signal from the server Hub
        hubConnection.on("MessageDeleted", (deletedMessageId: number) => {
            setMessages(prev => prev.map(msg =>
                msg.id === deletedMessageId
                    ? { ...msg, messageText: "This message was deleted.", isDeleted: true }
                    : msg
            ));
        });

        // Detach handlers cleanly when switching chat contexts or closing the panel
        return () => {
            hubConnection.off("ReceiveMessage");
            hubConnection.off("MessageDeleted"); // ✅ Clean up the listener
            hubConnection.invoke("LeaveRoom", roomName)
                .catch((err: any) => console.error("Failed to execute LeaveRoom channel invocation:", err));
        };
    }, [hubConnection, isChatConnected, roomName]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 3. Dispatch new live message out to the server
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent action if text is empty, socket isn't ready, or user context isn't loaded
        if (!typedMessage.trim() || !hubConnection || !isChatConnected || !room || !user) return;

        try {
            // Invoke server-side Hub pipeline using explicit dynamic user profile data contracts
            await hubConnection.invoke(
                "SendMessageToRoom",
                room.id,
                roomName,
                user.id.toString(), // Convert numerical identification to string format
                user.name,
                typedMessage.trim()
            );
            setTypedMessage('');
        } catch (error) {
            console.error("Transmission failed across active websocket channel:", error);
        }
    };

    // ✅ TRIGGER HUB DELETE PIPELINE: Request the server to soft-delete a specific message
    const handleDeleteAction = async (messageId: number) => {
        if (!hubConnection || !isChatConnected || !user) return;
        try {
            await hubConnection.invoke("DeleteMessage", messageId, roomName, user.id.toString());
        } catch (err) {
            console.error("Could not issue delete invoke operation command:", err);
        }
    };

    const canSend = Boolean(typedMessage.trim() && hubConnection && isChatConnected && room && user);

    return (
        <div className="fixed right-0 top-0 z-50 h-full w-85 border-l border-slate-200 bg-white shadow-xl flex flex-col animate-slide-in">
            {/* Header Toolbar */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                    <h3 className="text-sm font-semibold text-slate-800">Live Team Discussion</h3>
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                        {isChatConnected ? 'Active Connection' : 'Reconnecting...'}
                    </p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs font-semibold">Close</button>
            </div>

            {/* Chat Messages Display Frame Viewport */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                {messages.map((msg, idx) => {
                    // Check ownership dynamically matching against authenticated user state
                    const isMe = user ? msg.senderId === user.id.toString() : false;

                    return (
                        <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                            <span className="flex items-center gap-1.5 px-1 mb-0.5 text-[10px] text-slate-400">
                                <span>{isMe ? "You" : msg.senderName}</span>
                                <span className="text-slate-300">•</span>
                                <span>{formatMessageTime(msg.sentAt)}</span>
                            </span>

                            <div className="flex items-center gap-1.5 max-w-[85%]">
                                {/* ✅ RENDER DELETE TRASH ICON: Show only on message hover, if it belongs to current user, and isn't already deleted */}
                                {/* ✅ TWO-STEP CONFIRMATION DELETE ACTIONS */}
                                {isMe && !msg.isDeleted && msg.id !== undefined && (
                                    <div className="flex items-center gap-1.5 h-6">
                                        {deleteConfirmId === msg.id ? (
                                            <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-lg border border-slate-200 shadow-sm animate-fade-in">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        handleDeleteAction(msg.id!); // Added non-null assertion operator !
                                                        setDeleteConfirmId(null);
                                                    }}
                                                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline px-0.5"
                                                >
                                                    Confirm
                                                </button>
                                                <span className="text-[10px] text-slate-300">|</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteConfirmId(null)}
                                                    className="text-[10px] font-medium text-slate-500 hover:text-slate-700 px-0.5"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setDeleteConfirmId(msg.id!)} // Added non-null assertion operator !
                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all rounded-lg hover:bg-slate-100 text-[11px]"
                                                title="Delete message"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className={`rounded-xl px-3 py-2 text-xs shadow-sm ${msg.isDeleted
                                    ? 'bg-slate-100 text-slate-400 border border-slate-200 italic' // Variant styling for a deleted entry
                                    : isMe
                                        ? 'bg-slate-900 text-white rounded-br-none'
                                        : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                                    }`}>
                                    <p className="break-words leading-relaxed">{msg.messageText}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Action Triggers Form Box Section */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex gap-2">
                <input
                    type="text"
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    placeholder={isChatConnected ? "Type a team message..." : "Connecting to chat..."}
                    disabled={!isChatConnected}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                    type="submit"
                    disabled={!canSend}
                    className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-900"
                >
                    Send
                </button>
            </form>
        </div>
    );
};