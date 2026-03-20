import { useEffect, useRef, useState, createContext, useContext } from "react";
import { createSocket } from "../services/socket";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);

    const socketRef = useRef();
    const currentConversationRef = useRef();

    const token = localStorage.getItem("token");

    useEffect(() => {
        socketRef.current = createSocket(token);

        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    useEffect(() => {
        currentConversationRef.current = currentConversationId;
    }, [currentConversationId]);

    useEffect(() => {
        fetch("http://localhost:8000/conversations", {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        .then(res => res.json())
        .then(setConversations);
    }, []);

    useEffect(() => {
        const socket = socketRef.current;

        if (!currentConversationId) return;

        fetch(`http://localhost:8000/messages/${currentConversationId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        .then(res => res.json())
        .then(setMessages);

        socket.emit("join_conversation", currentConversationId);

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
            socket.emit("leave_conversation", currentConversationId);
            setMessages([]); 
        };
    }, [currentConversationId]);

    return (
        <ChatContext.Provider
        value={{
            conversations,
            setConversations,
            messages,
            setMessages,
            currentConversationId,
            setCurrentConversationId,
        }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);