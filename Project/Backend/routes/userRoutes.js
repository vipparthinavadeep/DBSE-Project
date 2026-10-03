const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../config/db");

const router = express.Router();


// LOGIN
router.post("/login", (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    const sql = `
        SELECT user_id, name, email, password, role
        FROM users
        WHERE email = ?
    `;

    db.query(sql, [email], async (err, results) => {

        if (err) {
            console.error("Login database error:", err.message);

            return res.status(500).json({
                message: "Database error"
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = results[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                role: user.role
            },
            "pharmacy_secret_key",
            {
                expiresIn: "1h"
            }
        );

        res.status(200).json({
            message: "Login successful",
            token: token,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    });
});

// REGISTER
router.post("/register", async (req, res) => {

    try {

        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const checkSql = `
            SELECT user_id
            FROM users
            WHERE email = ?
        `;

        db.query(checkSql, [email], async (err, results) => {

            if (err) {
                console.error(err.message);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length > 0) {
                return res.status(409).json({
                    message: "Email already registered"
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const sql = `
                INSERT INTO users
                (name, email, password, role)
                VALUES (?, ?, ?, ?)
            `;

            const userRole = role || "CUSTOMER";

            db.query(
                sql,
                [name, email, hashedPassword, userRole],
                (err, result) => {

                    if (err) {
                        console.error(err.message);

                        return res.status(500).json({
                            message: "Failed to register user"
                        });
                    }

                    res.status(201).json({
                        message: "User registered successfully",
                        user_id: result.insertId
                    });
                }
            );
        });

    } catch (error) {

        res.status(500).json({
            message: "Server error"
        });
    }
});


// GET ALL USERS
router.get("/", (req, res) => {

    const sql = `
        SELECT
            user_id,
            name,
            email,
            role,
            created_at
        FROM users
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                message: "Failed to fetch users"
            });
        }

        res.status(200).json(results);
    });
});

router.get("/profile", authenticateToken, (req, res) => {

    res.status(200).json({
        message: "You are authenticated",
        user: req.user
    });

});

router.get(
    "/admin",
    authenticateToken,
    authorizeRoles("ADMIN"),
    (req, res) => {

        const sql = `
            SELECT
                user_id,
                name,
                email,
                role,
                created_at
            FROM users
            ORDER BY user_id ASC
        `;

        db.query(sql, (err, results) => {

            if (err) {
                console.error(
                    "Admin users query error:",
                    err.message
                );

                return res.status(500).json({
                    message: "Failed to fetch users"
                });
            }

            res.status(200).json({
                message: "Users fetched successfully",
                users: results
            });
        });
    }
);

module.exports = router;
