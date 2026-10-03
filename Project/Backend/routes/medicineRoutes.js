const express = require("express");
const db = require("../config/db");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// GET ALL MEDICINES
// Public
// =====================================================

router.get("/", (req, res) => {

    const sql = `
        SELECT 
            m.medicine_id,
            m.name,
            m.description,
            m.category,
            m.price,
            m.requires_prescription,
            i.quantity
        FROM medicines m
        JOIN inventory i
            ON m.medicine_id = i.medicine_id
        ORDER BY m.medicine_id ASC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(
                "Error fetching medicines:",
                err.message
            );

            return res.status(500).json({
                message: "Failed to fetch medicines"
            });
        }

        res.status(200).json(results);
    });
});


// =====================================================
// ADD MEDICINE
// ADMIN ONLY
// =====================================================

router.post(
    "/",
    authenticateToken,
    authorizeRoles("ADMIN"),
    (req, res) => {

        const {
            name,
            description,
            category,
            price,
            requires_prescription,
            quantity
        } = req.body;


        // -----------------------------
        // VALIDATION
        // -----------------------------

        if (
            !name ||
            !category ||
            price === undefined ||
            quantity === undefined
        ) {
            return res.status(400).json({
                message:
                    "Name, category, price and quantity are required"
            });
        }


        // -----------------------------
        // INSERT MEDICINE
        // -----------------------------

        const medicineSql = `
            INSERT INTO medicines
            (
                name,
                description,
                category,
                price,
                requires_prescription
            )
            VALUES (?, ?, ?, ?, ?)
        `;

        const medicineValues = [
            name,
            description || "",
            category,
            Number(price),
            requires_prescription ? 1 : 0
        ];


        db.query(
            medicineSql,
            medicineValues,
            (err, result) => {

                if (err) {

                    console.error(
                        "Error adding medicine:",
                        err.message
                    );

                    return res.status(500).json({
                        message:
                            "Failed to add medicine"
                    });
                }


                const medicineId =
                    result.insertId;


                // -----------------------------
                // INSERT INVENTORY
                // -----------------------------

                const inventorySql = `
                    INSERT INTO inventory
                    (
                        medicine_id,
                        quantity
                    )
                    VALUES (?, ?)
                `;


                db.query(
                    inventorySql,
                    [
                        medicineId,
                        Number(quantity)
                    ],
                    (inventoryErr) => {

                        if (inventoryErr) {

                            console.error(
                                "Error adding inventory:",
                                inventoryErr.message
                            );

                            return res.status(500).json({
                                message:
                                    "Medicine added but inventory failed"
                            });
                        }


                        res.status(201).json({
                            message:
                                "Medicine added successfully",

                            medicine_id:
                                medicineId
                        });

                    }
                );

            }
        );
    }
);


// =====================================================
// GET ONE MEDICINE
// Public
// =====================================================

router.get("/:id", (req, res) => {

    const medicineId = req.params.id;


    const sql = `
        SELECT 
            m.medicine_id,
            m.name,
            m.description,
            m.category,
            m.price,
            m.requires_prescription,
            i.quantity
        FROM medicines m
        JOIN inventory i
            ON m.medicine_id = i.medicine_id
        WHERE m.medicine_id = ?
    `;


    db.query(
        sql,
        [medicineId],
        (err, results) => {

            if (err) {

                console.error(
                    "Error fetching medicine:",
                    err.message
                );

                return res.status(500).json({
                    message:
                        "Failed to fetch medicine"
                });
            }


            if (results.length === 0) {

                return res.status(404).json({
                    message:
                        "Medicine not found"
                });
            }


            res.status(200).json(
                results[0]
            );

        }
    );
});


// =====================================================
// UPDATE MEDICINE
// ADMIN ONLY
// =====================================================

router.put(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN"),
    (req, res) => {

        const medicineId =
            req.params.id;


        const {
            name,
            description,
            category,
            price,
            requires_prescription,
            quantity
        } = req.body;


        const medicineSql = `
            UPDATE medicines
            SET
                name = ?,
                description = ?,
                category = ?,
                price = ?,
                requires_prescription = ?
            WHERE medicine_id = ?
        `;


        const medicineValues = [
            name,
            description || "",
            category,
            Number(price),
            requires_prescription ? 1 : 0,
            medicineId
        ];


        db.query(
            medicineSql,
            medicineValues,
            (err, result) => {

                if (err) {

                    console.error(
                        "Error updating medicine:",
                        err.message
                    );

                    return res.status(500).json({
                        message:
                            "Failed to update medicine"
                    });
                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({
                        message:
                            "Medicine not found"
                    });
                }


                const inventorySql = `
                    UPDATE inventory
                    SET quantity = ?
                    WHERE medicine_id = ?
                `;


                db.query(
                    inventorySql,
                    [
                        Number(quantity),
                        medicineId
                    ],
                    (inventoryErr) => {

                        if (inventoryErr) {

                            console.error(
                                "Error updating inventory:",
                                inventoryErr.message
                            );

                            return res.status(500).json({
                                message:
                                    "Medicine updated but inventory failed"
                            });
                        }


                        res.status(200).json({
                            message:
                                "Medicine updated successfully"
                        });

                    }
                );

            }
        );
    }
);


// =====================================================
// DELETE MEDICINE
// ADMIN ONLY
// =====================================================

router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN"),
    (req, res) => {

        const medicineId =
            req.params.id;


        const sql = `
            DELETE FROM medicines
            WHERE medicine_id = ?
        `;


        db.query(
            sql,
            [medicineId],
            (err, result) => {

                if (err) {

                    console.error(
                        "Error deleting medicine:",
                        err.message
                    );

                    return res.status(500).json({
                        message:
                            "Failed to delete medicine"
                    });
                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({
                        message:
                            "Medicine not found"
                    });
                }


                res.status(200).json({
                    message:
                        "Medicine deleted successfully"
                });

            }
        );
    }
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;