import { useEffect, useRef, useState, createContext, useContext } from "react";
import { createSocket } from "../services/socket";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [typingUsers, setTypingUsers] = useState([]);

    const socketRef = useRef();
    const currentConversationRef = useRef();

    const token = localStorage.getItem("token");

    // Tạo socket
    useEffect(() => {
        socketRef.current = createSocket(token);

        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    // Gán conversation id cho useref
    useEffect(() => {
        currentConversationRef.current = currentConversationId;
    }, [currentConversationId]);

    // Lấy danh sách conversation
    useEffect(() => {
        fetch("http://localhost:8000/conversations", {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        .then(res => res.json())
        .then(setConversations);
    }, []);

    // Lắng nghe socket (gửi nhận tin nhắn)
    useEffect(() => {
        const socket = socketRef.current;

        if (!currentConversationId) return;

        setTypingUsers([]);

        socket.emit("join_conversation", currentConversationRef.current);

        fetch(`http://localhost:8000/messages/${currentConversationId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        .then(res => res.json())
        .then(setMessages);

        const handleReceive = (msg) => {
            setMessages(prev => {
                if (msg.conversation_id === currentConversationRef.current) {
                    return [...prev, msg];
                }
                return prev;
            });
    
            setConversations(prev => {
                let updated = prev.map(c => 
                    c.conversation_id === msg.conversation_id
                    ? {
                        ...c,
                        last_message: msg.content,
                        last_time: msg.created_at,
                    } : c
                );
    
                updated.sort(
                    (a, b) => new Date(b.last_time) - new Date(a.last_time)
                );
    
                return updated;
            });
        }
    
        socket.on("receive_message", handleReceive);
    
        return () => {
            socket.off("receive_message");
            socket.emit("leave_conversation", currentConversationRef.current);
            setMessages([]); 
        };
    }, [currentConversationId]);

    const sendMessage = (content) => {
        const socket = socketRef.current;

        if (!socket || !currentConversationRef.current || !content?.trim()) return;

        socket.emit("send_message", {
            conversation_id: currentConversationRef.current,
            content: content.trim(),
        });
    };

    const emitTyping = () => {
        const socket = socketRef.current;

        if (!socket || !currentConversationRef.current) return;

        socket.emit("typing", {
            conversationId: currentConversationRef.current,
        });
    };

    const emitStopTyping = () => {
        const socket = socketRef.current;

        if (!socket || !currentConversationRef.current) return;

        socket.emit("stop_typing", {
            conversationId: currentConversationRef.current,
        });
    };

    useEffect (() => {
        const socket = socketRef.current;
        
        socket.on("typing", ({ userId }) => {
            setTypingUsers(prev => {
                if (prev.includes(userId)) return prev;
                return [...prev, userId];
            });
        });

        socket.on("stop_typing", ({ userId }) => {
            setTypingUsers(prev => prev.filter(id => id !== userId));
        });

        return () => {
            socket.off("typing");
            socket.off("stop_typing");
        }
    }, []);

    return (
        <ChatContext.Provider
        value={{
            conversations,
            setConversations,
            messages,
            setMessages,
            currentConversationId,
            setCurrentConversationId,
            typingUsers,
            sendMessage,
            emitTyping,
            emitStopTyping,
        }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);