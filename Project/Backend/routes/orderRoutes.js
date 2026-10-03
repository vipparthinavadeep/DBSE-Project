const express = require("express");
const db = require("../config/db");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();


// CREATE ORDER
router.post(
    "/",
    authenticateToken,
    authorizeRoles("CUSTOMER"),
    (req, res) => {

        const { items, prescription_id } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                message: "Order must contain at least one medicine"
            });
        }

        let totalAmount = 0;

        const medicineIds = items.map(item => item.medicine_id);

        const placeholders = medicineIds.map(() => "?").join(",");

        const medicineSql = `
            SELECT
                m.medicine_id,
                m.name,
                m.price,
                m.requires_prescription,
                i.quantity
            FROM medicines m
            JOIN inventory i
            ON m.medicine_id = i.medicine_id
            WHERE m.medicine_id IN (${placeholders})
        `;

        db.query(medicineSql, medicineIds, (err, medicines) => {

            if (err) {
                return res.status(500).json({
                    message: "Failed to check medicines"
                });
            }

            if (medicines.length !== items.length) {
                return res.status(400).json({
                    message: "One or more medicines not found"
                });
            }

            for (const item of items) {

                const medicine = medicines.find(
                    m => m.medicine_id === item.medicine_id
                );

                if (item.quantity <= 0) {
                    return res.status(400).json({
                        message: "Quantity must be greater than zero"
                    });
                }

                if (item.quantity > medicine.quantity) {
                    return res.status(400).json({
                        message: `Insufficient stock for ${medicine.name}`
                    });
                }

                totalAmount +=
                    Number(medicine.price) * item.quantity;
            }

            const prescriptionRequired = medicines.some(
                medicine => medicine.requires_prescription
            );

            if (prescriptionRequired && !prescription_id) {
                return res.status(400).json({
                    message: "Prescription is required for this order"
                });
            }

            const createOrderSql = `
                INSERT INTO orders
                (user_id, prescription_id, total_amount, status)
                VALUES (?, ?, ?, 'CONFIRMED')
            `;

            db.query(
                createOrderSql,
                [
                    req.user.user_id,
                    prescription_id || null,
                    totalAmount
                ],
                (err, orderResult) => {

                    if (err) {
                        return res.status(500).json({
                            message: "Failed to create order"
                        });
                    }

                    const orderId = orderResult.insertId;

                    let completed = 0;

                    for (const item of items) {

                        const medicine = medicines.find(
                            m => m.medicine_id === item.medicine_id
                        );

                        const itemSql = `
                            INSERT INTO order_items
                            (order_id, medicine_id, quantity, price)
                            VALUES (?, ?, ?, ?)
                        `;

                        db.query(
                            itemSql,
                            [
                                orderId,
                                item.medicine_id,
                                item.quantity,
                                medicine.price
                            ],
                            (err) => {

                                if (err) {
                                    console.error(err.message);
                                    return;
                                }

                                const stockSql = `
                                    UPDATE inventory
                                    SET quantity = quantity - ?
                                    WHERE medicine_id = ?
                                `;

                                db.query(
                                    stockSql,
                                    [
                                        item.quantity,
                                        item.medicine_id
                                    ],
                                    (err) => {

                                        if (err) {
                                            console.error(
                                                err.message
                                            );
                                        }

                                        completed++;

                                        if (
                                            completed === items.length
                                        ) {
                                            res.status(201).json({
                                                message:
                                                    "Order placed successfully",
                                                order_id: orderId,
                                                total_amount:
                                                    totalAmount
                                            });
                                        }
                                    }
                                );
                            }
                        );
                    }
                }
            );
        });
    }
);


// GET MY ORDERS
router.get(
    "/my",
    authenticateToken,
    authorizeRoles("CUSTOMER"),
    (req, res) => {

        const sql = `
            SELECT
                order_id,
                prescription_id,
                total_amount,
                status,
                order_date
            FROM orders
            WHERE user_id = ?
            ORDER BY order_date DESC
        `;

        db.query(
            sql,
            [req.user.user_id],
            (err, results) => {

                if (err) {
                    return res.status(500).json({
                        message: "Failed to fetch orders"
                    });
                }

                res.status(200).json(results);
            }
        );
    }
);


module.exports = router;