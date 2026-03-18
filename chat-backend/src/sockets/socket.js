import pool from "../config/db.js";
import { createMessage } from "../models/message.model.js";
import { createUser, findUserById } from "../models/user.model.js";

export const initSocket = (io) => {
    io.on("connection", (socket) => {
        socket.on("start_conversation", async ({  userId, targetId }) => {
            let result = await pool.query(
                `
                SELECT c.id
                FROM conversations c
                JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
                JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
                WHERE cp1.user_id = $1 AND cp2.user_id = $2
                LIMIT 1
                `,
                [userId, targetId]
            );

            let conversationId;

            if (result.rows.length === 0) {
                const newConv = await pool.query(
                    `INSERT INTO conversations DEFAULT VALUES RETURNING id`
                );

                conversationId = newConv.rows[0].id;

                await pool.query(
                    `
                    INSERT INTO conversation_participants (conversation_id, user_id)
                    VALUES ($1, $2), ($1, $3)
                    ` , [conversationId, userId, targetId]
                );
            } else {
                conversationId = result.rows[0].id;
            }

            socket.join(String(conversationId));

            socket.emit("conversation_ready", { conversationId });
        });

        socket.on("join_conversation", async (conversationId, user) => {
            try {
                
                let existingUser = await findUserById(user.id);
                
                if (!existingUser) {
                    await createUser({id: user.id, name: user.name});
                }
                
                socket.join(conversationId);
            } catch (error) {
                console.error("User error:", error);
            }
        });

        socket.on("send_message", async (data) => {
            try {
                console.log("Incoming message:", data);

                const { conversation_id, sender_id, content} = data;

                const saveMessage = await createMessage({
                    conversation_id,
                    sender_id,
                    content,
                });

                io.to(conversation_id).emit("receive_message", saveMessage);
            } catch (error) {
                console.error("Error saving message:", error);
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnect");
        });
    });
};