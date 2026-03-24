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

    const [participants, setParticipants] = useState([]);
    const [globalSearchResults, setGlobalSearchResults] = useState([]);
    const [activeSearchUser, setActiveSearchUser] = useState(null);

    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [typingUsers, setTypingUsers] = useState([]);

    const socketRef = useRef();
    const currentConversationRef = useRef();
    const lastSeenEmittedMessageIdRef = useRef(null);

    const token = localStorage.getItem("token");

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            const el = chatRef.current;
            if (!el) return;
            el.scrollTop = el.scrollHeight;
            lastScrollTopRef.current = el.scrollTop;
        });
    };

    const getLastMessagePreview = (msg) => {
        if (!msg) {
            return "";
        }

        if (msg.type === "file") {
            return msg.file_name ? `${msg.file_name}` : "Tệp đính kèm";
        }

        return msg.content;
    };

    // Tạo socket khi đã có token/user
    useEffect(() => {
        if (!token || !user?.id) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        const socket = createSocket(token);
        socketRef.current = socket;

        socket.emit("join_user_room");

        return () => {
            socket.disconnect();
            if (socketRef.current === socket) {
                socketRef.current = null;
            }
        };
    }, [token, user?.id]);

    // Gán conversation id cho useref
    useEffect(() => {
        currentConversationRef.current = currentConversationId;
        lastSeenEmittedMessageIdRef.current = null;
    }, [currentConversationId]);

    // Lấy danh sách conversation khi đã đăng nhập
    useEffect(() => {
        if (!token || !user?.id) {
            setConversations([]);
            return;
        }

        fetch("http://localhost:8000/conversations", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(setConversations);
    }, [token, user?.id]);

    useEffect(() => {
        if (currentConversationId) {
            setActiveSearchUser(null);
        }
    }, [currentConversationId]);

    // Lắng nghe socket (gửi nhận tin nhắn)
    useEffect(() => {
        const socket = socketRef.current;

        if (!socket || !currentConversationId) return;

        setTypingUsers([]);

        socket.emit("join_conversation", currentConversationRef.current);

        loadInitial(currentConversationId);

        const handleReceive = (msg) => {
            setMessages((prev) => {
                if (String(msg.conversation_id) !== String(currentConversationRef.current)) {
                    return prev;
                }

                const pendingMessageIndex = msg.client_temp_id
                    ? prev.findIndex(
                        (message) => message.pending && message.client_temp_id === msg.client_temp_id,
                    )
                    : -1;

                if (pendingMessageIndex >= 0) {
                    const nextMessages = [...prev];
                    nextMessages[pendingMessageIndex] = {
                        ...msg,
                        pending: false,
                    };
                    return nextMessages;
                }

                const alreadyExists = prev.some((message) => String(message.id) === String(msg.id));
                if (alreadyExists) {
                    return prev;
                }

                return [...prev, { ...msg, pending: false }];
            });

            if (String(msg.conversation_id) === String(currentConversationRef.current) && msg.sender_id === user?.id) {
                scrollToBottom();
            }
    
            setConversations(prev => {
                let updated = prev.map(c => 
                    c.conversation_id === msg.conversation_id
                    ? {
                        ...c,
                        last_message: getLastMessagePreview(msg),
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
            setParticipants([]); 
        };
    }, [currentConversationId, user?.id]);

    const loadInitial = async (currentConversationId) => {
        const res = await fetch(`http://localhost:8000/messages/${currentConversationId}?limit=20`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        const resParticipants = await fetch(`http://localhost:8000/conversations/${currentConversationId}/participants`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        const data = await res.json();
        const dataParticipants = await resParticipants.json();

        const msgs = data.messages.reverse();

        setMessages(msgs);
        setParticipants(dataParticipants);
        setHasMore(data.hasMore);
        setCursor(msgs.length > 0 ? msgs[0].created_at : null);

        scrollToBottom();
    };

    const refreshConversations = async () => {
        if (!token) {
            return;
        }

        const res = await fetch("http://localhost:8000/conversations", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) {
            return;
        }

        const data = await res.json();
        setConversations(data);
    };

    const createConversation = async (receiveId) => {
        if (!token || !receiveId) {
            return null;
        }

        const res = await fetch("http://localhost:8000/conversations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ receiveId })
        });

        if (!res.ok) {
            return null;
        }

        const data = await res.json();
        const createdConversationId = data.id;

        if (!createdConversationId) {
            return null;
        }

        await refreshConversations();

        return createdConversationId;
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

    const sendMessage = async (content, options = {}) => {
        const socket = socketRef.current;

        if (!socket || !content?.trim()) {
            return false;
        }

        let conversationIdToSend = currentConversationRef.current;

        if (!conversationIdToSend && options.draftUserId) {
            const createdConversationId = await createConversation(options.draftUserId);

            if (!createdConversationId) {
                return false;
            }

            conversationIdToSend = createdConversationId;
            currentConversationRef.current = createdConversationId;
            setCurrentConversationId(createdConversationId);
            socket.emit("join_conversation", createdConversationId);
        }

        if (!conversationIdToSend) {
            return false;
        }

        socket.emit("send_message", {
            conversation_id: conversationIdToSend,
            content: content.trim(),
        });

        return true;
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

        if (!socket || !user?.id) return;
        
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
    }, [token, user?.id]);

    // Lắng nghe socket (seen tin nhắn)
    useEffect(() => {
        const socket = socketRef.current;

        if (!socket || !user?.id) return;

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
    }, [token, user?.id]);

    // Lắng nghe socket (tin nhắn global)
    useEffect(() => {
        const socket = socketRef.current;

        if (!socket || !user?.id) return;

        socket.on("new_message", (msg) => {
            setConversations(prev => {
                let updated = prev.map(c => 
                    c.conversation_id === msg.conversation_id
                    ? {
                        ...c,
                        last_message: getLastMessagePreview(msg),
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
    }, [token, user?.id]);

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
            participants,
            globalSearchResults,
            setGlobalSearchResults,
            activeSearchUser,
            setActiveSearchUser,
        }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);