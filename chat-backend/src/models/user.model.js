import pool from "../config/db.js";

export const findUserById = async (id) => {
    const result = await pool.query(
        "SELECT * FROM users WHERE id = $1",
        [id]
    );
    return result.rows[0];
};

export const createUser = async ({ id, name }) => {
    const result = await pool.query(
        "INSERT INTO users (id, name) VALUES ($1, $2) RETURNING *",
        [id, name]
    );

    return result.rows[0];
};