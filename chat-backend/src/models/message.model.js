import pool from "../config/db.js";

export const createMessage = async ({ conversation_id, sender_id, content }) => {
    const result = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, content)
        VALUES ($1, $2, $3)
        RETURNING *`, 
        [conversation_id, sender_id, content]
    );

    return result.rows[0];
};

export const getMessagesByConversation = async (conversation_id) => {
    const result = await pool(
        `SELECT * FROM messages
        WHERE conversation_id = $1
        ORDER BY created_at ASC`,
        [conversation_id]
    );

    return result.rows;
}