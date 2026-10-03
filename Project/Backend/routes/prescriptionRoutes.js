const express = require("express");
const path = require("path");
const multer = require("multer");

const db = require("../config/db");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// MULTER STORAGE
// ======================================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads"));
    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});


// ======================================================
// FILE FILTER
// ======================================================

const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only JPG, JPEG, PNG and PDF files are allowed."
            )
        );
    }
};


const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});


// ======================================================
// CUSTOMER - UPLOAD PRESCRIPTION
// ======================================================

router.post(
    "/",
    authenticateToken,
    authorizeRoles("CUSTOMER"),
    upload.single("prescription"),
    (req, res) => {

        if (!req.file) {
            return res.status(400).json({
                message: "Please upload a prescription file."
            });
        }

        const sql = `
            INSERT INTO prescriptions
            (user_id, prescription_file)
            VALUES (?, ?)
        `;

        db.query(
            sql,
            [req.user.user_id, req.file.filename],
            (err, result) => {

                if (err) {

                    console.error(
                        "Error saving prescription:",
                        err.message
                    );

                    return res.status(500).json({
                        message:
                            "Failed to save prescription."
                    });
                }

                res.status(201).json({

                    message:
                        "Prescription uploaded successfully.",

                    prescription_id:
                        result.insertId,

                    file_name:
                        req.file.filename
                });
            }
        );
    }
);


// ======================================================
// CUSTOMER - VIEW OWN PRESCRIPTIONS
// ======================================================

router.get(
    "/my",
    authenticateToken,
    authorizeRoles("CUSTOMER"),
    (req, res) => {

        const sql = `
            SELECT
                prescription_id,
                prescription_file,
                status,
                uploaded_at,
                reviewed_at
            FROM prescriptions
            WHERE user_id = ?
            ORDER BY uploaded_at DESC
        `;

        db.query(
            sql,
            [req.user.user_id],
            (err, results) => {

                if (err) {

                    return res.status(500).json({
                        message:
                            "Failed to fetch prescriptions"
                    });
                }

                res.status(200).json(results);
            }
        );
    }
);


// ======================================================
// PHARMACIST - VIEW PENDING PRESCRIPTIONS
// ======================================================

router.get(
    "/pending",
    authenticateToken,
    authorizeRoles("PHARMACIST"),
    (req, res) => {

        const sql = `
            SELECT
                p.prescription_id,
                p.user_id,
                u.name AS name,
                u.email,
                p.prescription_file,
                p.status,
                p.uploaded_at
            FROM prescriptions p
            JOIN users u
                ON p.user_id = u.user_id
            WHERE p.status = 'PENDING'
            ORDER BY p.uploaded_at ASC
        `;

        db.query(
            sql,
            (err, results) => {

                if (err) {

                    return res.status(500).json({
                        message:
                            "Failed to fetch pending prescriptions"
                    });
                }

                res.status(200).json(results);
            }
        );
    }
);


// ======================================================
// PHARMACIST - APPROVE
// ======================================================

router.put(
    "/:id/approve",
    authenticateToken,
    authorizeRoles("PHARMACIST"),
    (req, res) => {

        const prescriptionId =
            req.params.id;

        const sql = `
            UPDATE prescriptions
            SET
                status = 'APPROVED',
                reviewed_by = ?,
                reviewed_at = CURRENT_TIMESTAMP
            WHERE prescription_id = ?
              AND status = 'PENDING'
        `;

        db.query(
            sql,
            [
                req.user.user_id,
                prescriptionId
            ],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        message:
                            "Failed to approve prescription"
                    });
                }

                if (result.affectedRows === 0) {

                    return res.status(404).json({
                        message:
                            "Pending prescription not found"
                    });
                }

                res.status(200).json({
                    message:
                        "Prescription approved successfully"
                });
            }
        );
    }
);


// ======================================================
// PHARMACIST - REJECT
// ======================================================

router.put(
    "/:id/reject",
    authenticateToken,
    authorizeRoles("PHARMACIST"),
    (req, res) => {

        const prescriptionId =
            req.params.id;

        const sql = `
            UPDATE prescriptions
            SET
                status = 'REJECTED',
                reviewed_by = ?,
                reviewed_at = CURRENT_TIMESTAMP
            WHERE prescription_id = ?
              AND status = 'PENDING'
        `;

        db.query(
            sql,
            [
                req.user.user_id,
                prescriptionId
            ],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        message:
                            "Failed to reject prescription"
                    });
                }

                if (result.affectedRows === 0) {

                    return res.status(404).json({
                        message:
                            "Pending prescription not found"
                    });
                }

                res.status(200).json({
                    message:
                        "Prescription rejected successfully"
                });
            }
        );
    }
);


module.exports = router;