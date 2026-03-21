import { useEffect, useRef, useState, createContext, useContext } from "react";
import { createSocket } from "../services/socket";
import { AuthContext } from "./AuthContext";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { user } = useContext(AuthContext);

    const [conversations, setConversations] = useState([]);

    const [messages, setMessages] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [cursor, setCursor] = useState(null);
    const chatRef = useRef();
    const lastScrollTopRef = useRef(0);

    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [typingUsers, setTypingUsers] = useState([]);

    const socketRef = useRef();
    const currentConversationRef = useRef();
    const lastSeenEmittedMessageIdRef = useRef(null);

    const token = localStorage.getItem("token");

    // Tạo socket
    useEffect(() => {
        socketRef.current = createSocket(token);
        const socket = socketRef.current;

        socket.emit("join_user_room");

        return () => {
            socket.disconnect();
        };
    }, []);

    // Gán conversation id cho useref
    useEffect(() => {
        currentConversationRef.current = currentConversationId;
        lastSeenEmittedMessageIdRef.current = null;
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

        loadInitial(currentConversationId);

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

    const loadInitial = async (currentConversationId) => {
        const res = await fetch(`http://localhost:8000/messages/${currentConversationId}?limit=20`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        const data = await res.json();

        const msgs = data.messages.reverse();

        setMessages(msgs);
        setHasMore(data.hasMore);
        setCursor(msgs.length > 0 ? msgs[0].created_at : null);

        requestAnimationFrame(() => {
            const el = chatRef.current;
            if (!el) return;
            el.scrollTop = el.scrollHeight;
            lastScrollTopRef.current = el.scrollTop;
        });
    };

    const loadMore = async () => {
        if (!hasMore || loadingMore || !cursor) return;

        const el = chatRef.current;
        const previousScrollHeight = el?.scrollHeight ?? 0;

        setLoadingMore(true);

        const res = await fetch(`http://localhost:8000/messages/${currentConversationId}?before=${cursor}&limit=20`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        const data = await res.json();
        const newMsgs = data.messages.reverse();

        setMessages(prev => [...newMsgs, ...prev]);
        setHasMore(data.hasMore);

        if (newMsgs.length > 0) {
            setCursor(newMsgs[0].created_at);
        }

        if (el && newMsgs.length > 0) {
            requestAnimationFrame(() => {
                const newScrollHeight = el.scrollHeight;
                el.scrollTop = newScrollHeight - previousScrollHeight;
            });
        }

        setLoadingMore(false);
    };

    const handleScroll = (e) => {
        const el = e.target;
        const currentScrollTop = el.scrollTop;
        const isScrollingUp = currentScrollTop < lastScrollTopRef.current;

        if (isScrollingUp && currentScrollTop <= 10 && hasMore && !loadingMore) {
            loadMore();
        }

        lastScrollTopRef.current = currentScrollTop;
    };

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

    const emitSeenMessage = () => {
        const socket = socketRef.current;

        if (!socket || !currentConversationRef.current || messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];

        if (!lastMessage || !user?.id) return;
        if (lastMessage.sender_id === user.id) return;
        if ((lastMessage.seenBy || []).includes(user.id)) return;

        if (lastSeenEmittedMessageIdRef.current === lastMessage.id) return;

        socket.emit("mark_seen", {
            messageId: lastMessage.id
        });

        lastSeenEmittedMessageIdRef.current = lastMessage.id;
    };

    // Lắng nghe socket (typing/ stop typing)
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

    // Lắng nghe socket (seen tin nhắn)
    useEffect(() => {
        const socket = socketRef.current;

        socket.on("message_seen", ({ messageId, userId }) => {
            setMessages(prev => 
                prev.map(msg =>
                    msg.id === messageId ?
                    {
                        ...msg,
                        seenBy: (msg.seenBy || []).includes(userId)
                            ? (msg.seenBy || [])
                            : [...(msg.seenBy || []), userId]
                    } : msg
                )
            );
        });

        return () => {
            socket.off("message_seen");
        };
    }, []);

    // Lắng nghe socket (tin nhắn global)
    useEffect(() => {
        const socket = socketRef.current;

        socket.on("new_message", (msg) => {
            setConversations(prev => {
                let updated = prev.map(c => 
                    c.conversation_id === msg.conversation_id
                    ? {
                        ...c,
                        last_message: msg.content,
                        last_time: msg.created_at,
                    }
                    : c
                );

                updated.sort(
                    (a, b) => new Date(b.last_time) - new Date(a.last_time)
                );

                return updated;
            });
        });

        return () => {
            socket.off("new_message");
        };
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
            emitSeenMessage,
            chatRef,
            handleScroll,
        }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);