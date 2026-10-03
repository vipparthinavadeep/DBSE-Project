import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function Payment() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    const [method, setMethod] = useState("UPI");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const makePayment = async () => {

        const token = localStorage.getItem("token");

        if (!token) {
            setMessage("Please login first.");
            return;
        }

        setLoading(true);
        setMessage("");

        try {

            const response = await fetch(
                "http://localhost:5000/api/payments",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        order_id: Number(orderId),
                        amount: Number(amount),
                        payment_method: method,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(
                    data.message || "Payment failed."
                );
                setLoading(false);
                return;
            }

            setMessage(
                "Payment successful! Your order has been placed."
            );

            setTimeout(() => {
                navigate("/");
            }, 2500);

        } catch (error) {

            console.error(error);
            setMessage("Unable to connect to server.");

        }

        setLoading(false);
    };

    return (
        <div className="payment-page">

            <div className="payment-card">

                <div className="payment-icon">
                    💳
                </div>

                <h1>Payment</h1>

                <p className="payment-subtitle">
                    Complete your order securely
                </p>

                <div className="payment-order">

                    <div>
                        <span>Order ID</span>
                        <strong>#{orderId}</strong>
                    </div>

                    <div>
                        <span>Total Amount</span>
                        <strong>₹{amount}</strong>
                    </div>

                </div>

                <h3>Select Payment Method</h3>

                <div className="payment-methods">

                    <button
                        className={
                            method === "UPI"
                                ? "payment-method active"
                                : "payment-method"
                        }
                        onClick={() => setMethod("UPI")}
                    >
                        📱 UPI
                    </button>

                    <button
                        className={
                            method === "CARD"
                                ? "payment-method active"
                                : "payment-method"
                        }
                        onClick={() => setMethod("CARD")}
                    >
                        💳 Card
                    </button>

                    <button
                        className={
                            method === "COD"
                                ? "payment-method active"
                                : "payment-method"
                        }
                        onClick={() => setMethod("COD")}
                    >
                        🚚 Cash on Delivery
                    </button>

                </div>

                <button
                    className="pay-btn"
                    onClick={makePayment}
                    disabled={loading}
                >
                    {loading
                        ? "Processing..."
                        : `Pay ₹${amount}`}
                </button>

                {message && (
                    <div className="payment-message">
                        {message}
                    </div>
                )}

                <button
                    className="back-btn payment-back"
                    onClick={() => navigate("/")}
                >
                    ← Back to Home
                </button>

            </div>

        </div>
    );
}

export default Payment;