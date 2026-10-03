import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function MyOrders() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        fetch("http://localhost:5000/api/orders/my", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(async (response) => {
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to load orders"
                    );
                }

                return data;
            })
            .then((data) => {
                const orderList = Array.isArray(data)
                    ? data
                    : Array.isArray(data.orders)
                    ? data.orders
                    : [];

                setOrders(orderList);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Orders error:", err);
                setError(err.message);
                setLoading(false);
            });
    }, [navigate, token]);

    const getStatusClass = (status) => {
        return `order-status ${String(status)
            .toLowerCase()
            .replace(/\s+/g, "-")}`;
    };

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className="orders-page">

            {/* HEADER */}
            <header className="orders-header">

                <div className="orders-brand">
                    <div className="orders-logo">
                        💊
                    </div>

                    <div>
                        <div className="orders-brand-name">
                            PharmaCare
                        </div>

                        <div className="orders-brand-subtitle">
                            Your trusted online pharmacy
                        </div>
                    </div>
                </div>

                <button
                    className="orders-home-btn"
                    onClick={() => navigate("/")}
                >
                    ← Home
                </button>

            </header>


            {/* HERO */}
            <section className="orders-hero">

                <div className="orders-hero-icon">
                    📦
                </div>

                <div>
                    <span className="orders-eyebrow">
                        MY ACCOUNT
                    </span>

                    <h1>
                        My Orders
                    </h1>

                    <p>
                        Track your pharmacy orders and view
                        your purchase history.
                    </p>
                </div>

            </section>


            {/* CONTENT */}
            <main className="orders-container">

                {loading && (
                    <div className="orders-state">
                        <div className="loading-spinner"></div>
                        <h3>Loading your orders...</h3>
                        <p>Please wait a moment.</p>
                    </div>
                )}


                {!loading && error && (
                    <div className="orders-state error-state">
                        <div className="state-icon">
                            ⚠️
                        </div>

                        <h3>
                            Unable to load orders
                        </h3>

                        <p>
                            {error}
                        </p>

                        <button
                            className="orders-home-btn"
                            onClick={() => navigate("/")}
                        >
                            ← Back to Home
                        </button>
                    </div>
                )}


                {!loading &&
                    !error &&
                    orders.length === 0 && (
                        <div className="orders-state">
                            <div className="state-icon">
                                🛒
                            </div>

                            <h3>
                                No Orders Yet
                            </h3>

                            <p>
                                Your completed pharmacy orders
                                will appear here.
                            </p>

                            <button
                                className="shop-orders-btn"
                                onClick={() => navigate("/")}
                            >
                                Browse Medicines →
                            </button>
                        </div>
                    )}


                {!loading &&
                    !error &&
                    orders.length > 0 && (
                        <>
                            {/* SUMMARY */}
                            <div className="orders-summary">

                                <div className="orders-summary-card">

                                    <div className="summary-icon">
                                        📦
                                    </div>

                                    <div>
                                        <span>
                                            Total Orders
                                        </span>

                                        <strong>
                                            {orders.length}
                                        </strong>
                                    </div>

                                </div>


                                <div className="orders-summary-card">

                                    <div className="summary-icon">
                                        ✅
                                    </div>

                                    <div>
                                        <span>
                                            Confirmed
                                        </span>

                                        <strong>
                                            {
                                                orders.filter(
                                                    (order) =>
                                                        String(
                                                            order.status
                                                        ).toUpperCase() ===
                                                        "CONFIRMED"
                                                ).length
                                            }
                                        </strong>
                                    </div>

                                </div>


                                <div className="orders-summary-card">

                                    <div className="summary-icon">
                                        💰
                                    </div>

                                    <div>
                                        <span>
                                            Total Spent
                                        </span>

                                        <strong>
                                            ₹
                                            {orders
                                                .reduce(
                                                    (
                                                        total,
                                                        order
                                                    ) =>
                                                        total +
                                                        Number(
                                                            order.total_amount ||
                                                            0
                                                        ),
                                                    0
                                                )
                                                .toFixed(2)}
                                        </strong>
                                    </div>

                                </div>

                            </div>


                            {/* ORDER LIST */}
                            <div className="orders-list">

                                {orders.map((order) => (
                                    <article
                                        className="order-card-new"
                                        key={order.order_id}
                                    >

                                        {/* CARD HEADER */}
                                        <div className="order-card-header">

                                            <div>
                                                <span className="order-label">
                                                    ORDER
                                                </span>

                                                <h2>
                                                    #{order.order_id}
                                                </h2>
                                            </div>

                                            <span
                                                className={getStatusClass(
                                                    order.status
                                                )}
                                            >
                                                {order.status}
                                            </span>

                                        </div>


                                        {/* ORDER INFO */}
                                        <div className="order-info-grid">

                                            <div className="order-info-item">

                                                <span>
                                                    Order Date
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        order.order_date
                                                    )}
                                                </strong>

                                            </div>


                                            <div className="order-info-item">

                                                <span>
                                                    Total Amount
                                                </span>

                                                <strong className="order-amount">
                                                    ₹
                                                    {Number(
                                                        order.total_amount ||
                                                        0
                                                    ).toFixed(2)}
                                                </strong>

                                            </div>


                                            <div className="order-info-item">

                                                <span>
                                                    Prescription
                                                </span>

                                                <strong>
                                                    {order.prescription_id
                                                        ? `#${order.prescription_id}`
                                                        : "Not Required"}
                                                </strong>

                                            </div>

                                        </div>


                                        {/* FOOTER */}
                                        <div className="order-card-footer">

                                            <div className="order-protection">
                                                <span>
                                                    🔒
                                                </span>

                                                Secure pharmacy order
                                            </div>

                                            <button
                                                className="order-home-link"
                                                onClick={() =>
                                                    navigate("/")
                                                }
                                            >
                                                Continue Shopping →
                                            </button>

                                        </div>

                                    </article>
                                ))}

                            </div>
                        </>
                    )}

            </main>

        </div>
    );
}

export default MyOrders;