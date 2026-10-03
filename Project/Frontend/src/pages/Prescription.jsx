import { useState } from "react";

function Prescription() {

    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const token =
        localStorage.getItem("token");


    const handleUpload = async (e) => {

        e.preventDefault();

        if (!token) {
            window.location.href = "/login";
            return;
        }

        if (!file) {
            setMessage(
                "Please select a prescription file."
            );
            return;
        }

        setLoading(true);
        setMessage("");


        try {

            const formData = new FormData();

            formData.append(
                "prescription",
                file
            );


            const response = await fetch(
                "http://localhost:5000/api/prescriptions",
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: formData,
                }
            );


            const data =
                await response.json();


            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to upload prescription"
                );
            }


            // Store prescription ID
            // for the current order
            localStorage.setItem(
                "currentPrescriptionId",
                data.prescription_id
            );


            setMessage(
                `Prescription uploaded successfully. Prescription ID: #${data.prescription_id}`
            );

            setFile(null);


        } catch (error) {

            console.error(error);

            setMessage(
                error.message
            );

        } finally {

            setLoading(false);

        }
    };


    return (

        <div className="prescription-page">

            <button
                onClick={() => {
                    window.location.href = "/";
                }}
            >
                ← Home
            </button>


            <h1>
                Prescription Upload
            </h1>


            <p>
                Upload your prescription
                for prescription-only medicines.
            </p>


            <form
                onSubmit={handleUpload}
            >

                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {

                        setFile(
                            e.target.files[0]
                        );

                        setMessage("");

                    }}
                />


                {file && (

                    <p>
                        Selected file:
                        {" "}
                        <strong>
                            {file.name}
                        </strong>
                    </p>

                )}


                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading
                        ? "Uploading..."
                        : "Upload Prescription"}
                </button>

            </form>


            {message && (

                <div className="prescription-message">

                    <p>
                        {message}
                    </p>


                    <button
                        onClick={() => {
                            window.location.href =
                                "/checkout";
                        }}
                    >
                        ← Back to Checkout
                    </button>

                </div>

            )}

        </div>
    );
}

export default Prescription;