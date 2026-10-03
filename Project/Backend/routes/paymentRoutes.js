const express = require("express");
const db = require("../config/db");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();


// CREATE PAYMENT
router.post(
    "/",
    authenticateToken,
    authorizeRoles("CUSTOMER"),
    (req, res) => {

        const {
            order_id,
            amount,
            payment_method
        } = req.body;

        if (!order_id || !amount || !payment_method) {
            return res.status(400).json({
                message:
                    "Order ID, amount and payment method are required"
            });
        }

        const sql = `
            INSERT INTO payments
            (order_id, amount, payment_method, payment_status)
            VALUES (?, ?, ?, 'SUCCESS')
        `;

        db.query(
            sql,
            [order_id, amount, payment_method],
            (err, result) => {

                if (err) {
                    console.error(err.message);

                    return res.status(500).json({
                        message: "Payment failed"
                    });
                }

                res.status(201).json({
                    message: "Payment successful",
                    payment_id: result.insertId
                });
            }
        );
    }
);


module.exports = router;