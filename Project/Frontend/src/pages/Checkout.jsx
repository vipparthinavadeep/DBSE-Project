import { useEffect, useState } from "react";

function Checkout() {
    const [cart, setCart] = useState([]);
    const [currentPrescription, setCurrentPrescription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        const savedCart = localStorage.getItem("cart");

        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }

        if (!token) {
            setLoading(false);
            return;
        }

        loadCurrentPrescription();
    }, []);

    const loadCurrentPrescription = async () => {
        try {
            const prescriptionId = localStorage.getItem(
                "currentPrescriptionId"
            );

            // No prescription belongs to the current purchase
            if (!prescriptionId) {
                setCurrentPrescription(null);
                setLoading(false);
                return;
            }

            const response = await fetch(
                "http://localhost:5000/api/prescriptions/my",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch prescriptions");
            }

            const prescription = data.find(
                (item) =>
                    Number(item.prescription_id) === Number(prescriptionId)
            );

            setCurrentPrescription(prescription || null);
        } catch (error) {
            console.error(error);
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const hasPrescriptionMedicine = cart.some(
        (item) => item.requires_prescription
    );

    const total = cart.reduce(
        (sum, item) =>
            sum + Number(item.price) * Number(item.cartQuantity),
        0
    );

    const handlePlaceOrder = async () => {
        setMessage("");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        if (cart.length === 0) {
            setMessage("Your cart is empty.");
            return;
        }

        // Prescription-only medicine requires a NEW prescription
        if (hasPrescriptionMedicine) {
            const prescriptionId = localStorage.getItem(
                "currentPrescriptionId"
            );

            if (!prescriptionId) {
                setMessage(
                    "This order contains prescription medicines. Please upload a new prescription first."
                );
                return;
            }

            if (!currentPrescription) {
                setMessage(
                    "Please upload a prescription for this order."
                );
                return;
            }

            if (currentPrescription.status === "PENDING") {
                setMessage(
                    "Your prescription is waiting for pharmacist approval."
                );
                return;
            }

            if (currentPrescription.status !== "APPROVED") {
                setMessage(
                    "Your prescription was rejected. Please upload a new prescription."
                );
                return;
            }
        }

        try {
            const items = cart.map((item) => ({
                medicine_id: item.medicine_id,
                quantity: item.cartQuantity,
            }));

            const prescriptionId = hasPrescriptionMedicine
                ? Number(localStorage.getItem("currentPrescriptionId"))
                : null;

            const response = await fetch(
                "http://localhost:5000/api/orders",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        items,
                        prescription_id: prescriptionId,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to place order"
                );
            }

            // Clear cart
            localStorage.removeItem("cart");

            // IMPORTANT:
            // Remove the prescription from the CURRENT purchase.
            // Old prescriptions remain in the database for history.
            localStorage.removeItem("currentPrescriptionId");

            // Go to payment
            window.location.href =
                `/payment?orderId=${data.order_id}&amount=${total}`;
        } catch (error) {
            console.error(error);
            setMessage(error.message);
        }
    };

    if (loading) {
        return (
            <div className="checkout-page">
                <h2>Loading checkout...</h2>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="checkout-page">
                <h1>Checkout</h1>
                <p>Your cart is empty.</p>

                <button
                    onClick={() => {
                        window.location.href = "/";
                    }}
                >
                    ← Continue Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="checkout-page">

            <button
                onClick={() => {
                    window.location.href = "/";
                }}
            >
                ← Continue Shopping
            </button>

            <h1>Checkout</h1>

            <p>Review your order before placing it.</p>

            <h2>Order Items</h2>

            {cart.map((item) => (
                <div
                    key={item.medicine_id}
                    className="checkout-item"
                >
                    <div>
                        <span>💊</span>

                        <h3>{item.name}</h3>

                        <p>{item.category}</p>

                        <p>
                            Quantity: {item.cartQuantity}
                        </p>

                        {item.requires_prescription ? (
                            <div className="prescription-warning">
                                📋 Prescription Required
                            </div>
                        ) : (
                            <div className="otc-badge">
                                ✓ No Prescription Required
                            </div>
                        )}

                        <strong>
                            ₹
                            {Number(item.price) *
                                Number(item.cartQuantity)}
                        </strong>
                    </div>
                </div>
            ))}

            <h2>Order Summary</h2>

            <p>
                Items: {cart.length}
            </p>

            <p>
                Subtotal: ₹{total}
            </p>

            <p>
                Delivery: FREE
            </p>

            <h3>
                Total: ₹{total}
            </h3>

            {hasPrescriptionMedicine && (
                <div className="prescription-box">

                    {!currentPrescription && (
                        <>
                            <p>
                                📋 This order contains prescription-only
                                medicine.
                            </p>

                            <p>
                                You must upload a <strong>new prescription</strong>
                                for this order.
                            </p>

                            <button
                                onClick={() => {
                                    window.location.href =
                                        "/prescription";
                                }}
                            >
                                Upload New Prescription
                            </button>
                        </>
                    )}

                    {currentPrescription &&
                        currentPrescription.status === "PENDING" && (
                            <div>
                                <p>
                                    ⏳ Prescription submitted successfully.
                                </p>

                                <p>
                                    Waiting for pharmacist approval.
                                </p>

                                <p>
                                    Prescription ID: #
                                    {currentPrescription.prescription_id}
                                </p>
                            </div>
                        )}

                    {currentPrescription &&
                        currentPrescription.status === "APPROVED" && (
                            <div>
                                <p>
                                    ✅ Prescription approved by pharmacist.
                                </p>

                                <p>
                                    Prescription ID: #
                                    {currentPrescription.prescription_id}
                                </p>
                            </div>
                        )}

                    {currentPrescription &&
                        currentPrescription.status === "REJECTED" && (
                            <div>
                                <p>
                                    ❌ Prescription rejected.
                                </p>

                                <button
                                    onClick={() => {
                                        localStorage.removeItem(
                                            "currentPrescriptionId"
                                        );

                                        window.location.href =
                                            "/prescription";
                                    }}
                                >
                                    Upload New Prescription
                                </button>
                            </div>
                        )}

                </div>
            )}

            {message && (
                <p className="error-message">
                    {message}
                </p>
            )}

            <button
                className="checkout-btn"
                onClick={handlePlaceOrder}
            >
                {hasPrescriptionMedicine
                    ? "Place Order"
                    : "Place Order"}
            </button>

        </div>
    );
}

export default Checkout;