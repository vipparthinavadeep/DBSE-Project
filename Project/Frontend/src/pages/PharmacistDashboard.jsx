import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function PharmacistDashboard() {

    const navigate = useNavigate();

    const [prescriptions, setPrescriptions] =
        useState([]);

    const [message, setMessage] =
        useState("");

    const token =
        localStorage.getItem("token");


    const loadPrescriptions =
        async () => {

            try {

                const response =
                    await fetch(
                        "http://localhost:5000/api/prescriptions/pending",
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    setMessage(
                        data.message ||
                        "Unable to load prescriptions."
                    );

                    return;
                }


                setPrescriptions(data);


            } catch (error) {

                console.error(error);

                setMessage(
                    "Unable to connect to server."
                );
            }
        };


    useEffect(() => {

        if (!token) {

            navigate("/login");

            return;
        }

        loadPrescriptions();

    }, []);


    const updatePrescription =
        async (id, action) => {

            try {

                const response =
                    await fetch(
                        `http://localhost:5000/api/prescriptions/${id}/${action}`,
                        {
                            method: "PUT",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    setMessage(
                        data.message ||
                        "Operation failed."
                    );

                    return;
                }


                setMessage(

                    action === "approve"

                        ? "Prescription approved successfully."

                        : "Prescription rejected successfully."

                );


                loadPrescriptions();


            } catch (error) {

                console.error(error);

                setMessage(
                    "Unable to connect to server."
                );

            }
        };


    const viewPrescription =
        (fileName) => {

            const fileUrl =
                `http://localhost:5000/uploads/${fileName}`;

            window.open(
                fileUrl,
                "_blank"
            );
        };


    return (

        <div className="dashboard-page">


            {/* NAVBAR */}

            <nav className="dashboard-navbar">

                <div className="logo">
                    💊 PharmaCare
                </div>


                <button
                    className="logout-btn"
                    onClick={() => {

                        localStorage.removeItem(
                            "token"
                        );

                        localStorage.removeItem(
                            "user"
                        );

                        localStorage.removeItem(
                            "currentPrescriptionId"
                        );

                        navigate("/login");

                    }}
                >
                    Logout
                </button>

            </nav>


            <div className="dashboard-container">


                {/* HEADING */}

                <div className="dashboard-heading">

                    <div>

                        <span>
                            PHARMACIST PORTAL
                        </span>

                        <h1>
                            Prescription Verification
                        </h1>

                        <p>
                            Review customer prescriptions
                            before approving or rejecting
                            them.
                        </p>

                    </div>


                    <button
                        className="refresh-btn"
                        onClick={
                            loadPrescriptions
                        }
                    >
                        ↻ Refresh
                    </button>

                </div>


                {/* MESSAGE */}

                {message && (

                    <div className="dashboard-message">
                        {message}
                    </div>

                )}


                {/* STATS */}

                <div className="stats-card">

                    <div className="stat-icon">
                        📋
                    </div>

                    <div>

                        <p>
                            Pending Prescriptions
                        </p>

                        <h2>
                            {prescriptions.length}
                        </h2>

                    </div>

                </div>


                {/* TABLE */}

                <div className="prescription-table">


                    <div className="table-header">

                        <span>
                            ID
                        </span>

                        <span>
                            Customer
                        </span>

                        <span>
                            Email
                        </span>

                        <span>
                            Prescription
                        </span>

                        <span>
                            Uploaded
                        </span>

                        <span>
                            Action
                        </span>

                    </div>


                    {prescriptions.length === 0 ? (

                        <div className="no-prescriptions">

                            <div>
                                ✓
                            </div>

                            <h3>
                                No Pending Prescriptions
                            </h3>

                            <p>
                                All prescriptions
                                have been reviewed.
                            </p>

                        </div>

                    ) : (

                        prescriptions.map(
                            (prescription) => (

                                <div
                                    className="table-row"
                                    key={
                                        prescription.prescription_id
                                    }
                                >


                                    <span>
                                        #
                                        {
                                            prescription.prescription_id
                                        }
                                    </span>


                                    <span>
                                        {
                                            prescription.name
                                        }
                                    </span>


                                    <span>
                                        {
                                            prescription.email
                                        }
                                    </span>


                                    <span>

                                        📄{" "}
                                        {
                                            prescription.prescription_file
                                        }

                                        <br />

                                        <button
                                            className="view-btn"
                                            onClick={() =>
                                                viewPrescription(
                                                    prescription.prescription_file
                                                )
                                            }
                                        >
                                            👁 View Prescription
                                        </button>

                                    </span>


                                    <span>
                                        {
                                            new Date(
                                                prescription.uploaded_at
                                            ).toLocaleDateString()
                                        }
                                    </span>


                                    <span className="action-buttons">

                                        <button
                                            className="approve-btn"
                                            onClick={() =>
                                                updatePrescription(
                                                    prescription.prescription_id,
                                                    "approve"
                                                )
                                            }
                                        >
                                            ✓ Approve
                                        </button>


                                        <button
                                            className="reject-btn"
                                            onClick={() =>
                                                updatePrescription(
                                                    prescription.prescription_id,
                                                    "reject"
                                                )
                                            }
                                        >
                                            ✕ Reject
                                        </button>

                                    </span>

                                </div>

                            )
                        )

                    )}

                </div>

            </div>

        </div>
    );
}

export default PharmacistDashboard;