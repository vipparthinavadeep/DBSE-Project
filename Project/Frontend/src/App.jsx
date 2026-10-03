import { useEffect, useState } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import Prescription from "./pages/Prescription";
import PharmacistDashboard from "./pages/PharmacistDashboard";
import Payment from "./pages/Payment";
import MyOrders from "./pages/MyOrders";
import AdminDashboard from "./pages/AdminDashboard";

import "./App.css";


// ======================================================
// GET CURRENT USER
// ======================================================

function getCurrentUser() {
    const user = localStorage.getItem("user");

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch {
        return null;
    }
}


// ======================================================
// LOGOUT
// ======================================================

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentPrescriptionId");
    localStorage.removeItem("cart");

    window.location.href = "/login";
}


// ======================================================
// PROTECTED ROUTE
// ======================================================

function ProtectedRoute({ allowedRoles, children }) {

    const token = localStorage.getItem("token");
    const user = getCurrentUser();

    // Not logged in
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Wrong role
    if (!allowedRoles.includes(user.role)) {

        if (user.role === "CUSTOMER") {
            return <Navigate to="/" replace />;
        }

        if (user.role === "PHARMACIST") {
            return (
                <Navigate
                    to="/pharmacist"
                    replace
                />
            );
        }

        if (user.role === "ADMIN") {
            return (
                <Navigate
                    to="/admin"
                    replace
                />
            );
        }

        return <Navigate to="/login" replace />;
    }

    return children;
}


// ======================================================
// CUSTOMER HOME
// ======================================================

function Home() {

    const [medicines, setMedicines] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");

    const [cart, setCart] = useState(() => {

        const savedCart =
            localStorage.getItem("cart");

        return savedCart
            ? JSON.parse(savedCart)
            : [];
    });


    // Get user INSIDE component
    const currentUser = getCurrentUser();

    const isCustomer =
        currentUser &&
        currentUser.role === "CUSTOMER";


    // ==================================================
    // LOAD MEDICINES
    // ==================================================

    useEffect(() => {

        fetch(
            "http://localhost:5000/api/medicines"
        )
            .then((response) =>
                response.json()
            )
            .then((data) => {
                setMedicines(data);
            })
            .catch((error) => {
                console.error(
                    "Error fetching medicines:",
                    error
                );
            });

    }, []);


    // ==================================================
    // SAVE CART
    // ==================================================

    useEffect(() => {

        localStorage.setItem(
            "cart",
            JSON.stringify(cart)
        );

    }, [cart]);


    // ==================================================
    // CATEGORIES
    // ==================================================

    const categories = [
        "All",
        ...new Set(
            medicines.map(
                (medicine) =>
                    medicine.category
            )
        ),
    ];


    // ==================================================
    // FILTER MEDICINES
    // ==================================================

    const filteredMedicines =
        medicines.filter((medicine) => {

            const matchesSearch =
                medicine.name
                    .toLowerCase()
                    .includes(
                        search.toLowerCase()
                    );

            const matchesCategory =
                category === "All" ||
                medicine.category ===
                    category;

            return (
                matchesSearch &&
                matchesCategory
            );
        });


    // ==================================================
    // ADD TO CART
    // ==================================================

    const addToCart = (medicine) => {

        if (!isCustomer) {
            alert(
                "Please login as a customer to buy medicines."
            );
            return;
        }


        if (medicine.quantity <= 0) {
            alert(
                "Medicine is out of stock."
            );
            return;
        }


        const existingItem =
            cart.find(
                (item) =>
                    item.medicine_id ===
                    medicine.medicine_id
            );


        if (existingItem) {

            setCart(

                cart.map((item) =>

                    item.medicine_id ===
                    medicine.medicine_id

                        ? {
                            ...item,
                            cartQuantity:
                                item.cartQuantity +
                                1,
                        }

                        : item
                )
            );

        } else {

            setCart([
                ...cart,
                {
                    ...medicine,
                    cartQuantity: 1,
                },
            ]);
        }
    };


    // ==================================================
    // REMOVE FROM CART
    // ==================================================

    const removeFromCart =
        (medicineId) => {

            setCart(

                cart.filter(
                    (item) =>
                        item.medicine_id !==
                        medicineId
                )
            );
        };


    // ==================================================
    // CART TOTAL
    // ==================================================

    const cartTotal =
        cart.reduce(

            (total, item) =>

                total +
                Number(item.price) *
                item.cartQuantity,

            0
        );


    // ==================================================
    // HOME PAGE
    // ==================================================

    return (

        <div className="app">


            {/* =================================================
                NAVBAR
            ================================================= */}

            <nav className="navbar">

                <div className="logo">
                    💊 PharmaCare
                </div>


                <div className="nav-links">

                    <a href="#home">
                        Home
                    </a>

                    <a href="#medicines">
                        Medicines
                    </a>

                    <a href="#about">
                        About
                    </a>


                    {/* MY ORDERS - CUSTOMER ONLY */}

                    {isCustomer && (

                        <button
                            className="nav-link-button"
                            onClick={() => {
                                window.location.href =
                                    "/orders";
                            }}
                        >
                            My Orders
                        </button>

                    )}

                </div>


                <div className="nav-actions">


                    {/* PRESCRIPTION - CUSTOMER ONLY */}

                    {isCustomer && (

                        <button
                            className="prescription-nav-btn"
                            onClick={() => {
                                window.location.href =
                                    "/prescription";
                            }}
                        >
                            📋 Prescription
                        </button>

                    )}


                    {/* LOGIN / LOGOUT */}

                    {!localStorage.getItem("token") ? (

                        <button
                            className="login-btn"
                            onClick={() => {
                                window.location.href =
                                    "/login";
                            }}
                        >
                            Login
                        </button>

                    ) : (

                        <button
                            className="login-btn"
                            onClick={logout}
                        >
                            Logout
                        </button>

                    )}


                    {/* CART - CUSTOMER ONLY */}

                    {isCustomer && (

                        <button
                            className="cart-btn"
                            onClick={() => {

                                const cartElement =
                                    document.getElementById(
                                        "cart"
                                    );

                                if (cartElement) {

                                    cartElement.scrollIntoView(
                                        {
                                            behavior:
                                                "smooth",
                                        }
                                    );
                                }

                            }}
                        >
                            🛒 Cart ({cart.length})
                        </button>

                    )}

                </div>

            </nav>


            {/* =================================================
                HERO
            ================================================= */}

            <section
                className="hero"
                id="home"
            >

                <div className="hero-content">

                    <span className="hero-tag">
                        🏥 Trusted Online Pharmacy
                    </span>

                    <h1>
                        Your Health,
                        <br />
                        <span>
                            Our Priority
                        </span>
                    </h1>

                    <p>
                        Buy medicines online
                        with secure prescription
                        validation and reliable
                        delivery.
                    </p>


                    {isCustomer && (

                        <button
                            className="shop-btn"
                            onClick={() =>
                                document
                                    .getElementById(
                                        "medicines"
                                    )
                                    .scrollIntoView({
                                        behavior:
                                            "smooth",
                                    })
                            }
                        >
                            Shop Medicines →
                        </button>

                    )}

                </div>


                <div className="hero-icon">
                    💊
                </div>

            </section>


            {/* =================================================
                FEATURES
            ================================================= */}

            <section className="features">

                <div className="feature">

                    <div className="feature-icon">
                        🚚
                    </div>

                    <div>

                        <h3>
                            Fast Delivery
                        </h3>

                        <p>
                            Quick and reliable
                            delivery
                        </p>

                    </div>

                </div>


                <div className="feature">

                    <div className="feature-icon">
                        🔒
                    </div>

                    <div>

                        <h3>
                            Secure
                        </h3>

                        <p>
                            Protected customer
                            information
                        </p>

                    </div>

                </div>


                <div className="feature">

                    <div className="feature-icon">
                        👨‍⚕️
                    </div>

                    <div>

                        <h3>
                            Pharmacist Verified
                        </h3>

                        <p>
                            Prescription medicines
                            are verified
                        </p>

                    </div>

                </div>

            </section>


            {/* =================================================
                MEDICINES
            ================================================= */}

            <section
                className="medicines-section"
                id="medicines"
            >

                <div className="section-heading">

                    <span>
                        OUR PRODUCTS
                    </span>

                    <h2>
                        Browse Medicines
                    </h2>

                    <p>
                        Find the medicines and
                        healthcare products you need.
                    </p>

                </div>


                {/* SEARCH */}

                <div className="search-area">

                    <input
                        type="text"
                        placeholder="🔍 Search medicines..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />


                    <select
                        value={category}
                        onChange={(e) =>
                            setCategory(
                                e.target.value
                            )
                        }
                    >

                        {categories.map(
                            (cat) => (

                                <option
                                    key={cat}
                                    value={cat}
                                >
                                    {cat}
                                </option>

                            )
                        )}

                    </select>

                </div>


                {/* MEDICINE CARDS */}

                <div className="medicine-grid">

                    {filteredMedicines.length ===
                    0 ? (

                        <div className="no-results">

                            <h3>
                                No medicines found
                            </h3>

                            <p>
                                Try another
                                medicine name
                                or category.
                            </p>

                        </div>

                    ) : (

                        filteredMedicines.map(
                            (medicine) => (

                                <div
                                    className="medicine-card"
                                    key={
                                        medicine.medicine_id
                                    }
                                >

                                    <div className="medicine-image">
                                        💊
                                    </div>


                                    <div className="medicine-info">

                                        <div className="category">
                                            {
                                                medicine.category
                                            }
                                        </div>

                                        <h3>
                                            {
                                                medicine.name
                                            }
                                        </h3>

                                        <p className="description">
                                            {
                                                medicine.description ||
                                                "Quality healthcare product"
                                            }
                                        </p>


                                        <div className="medicine-bottom">

                                            <div>

                                                <span className="price">
                                                    ₹
                                                    {
                                                        medicine.price
                                                    }
                                                </span>

                                                <span className="stock">
                                                    Stock:
                                                    {
                                                        medicine.quantity
                                                    }
                                                </span>

                                            </div>

                                        </div>


                                        {medicine.requires_prescription ? (

                                            <div className="prescription-warning">
                                                📋 Prescription
                                                Required
                                            </div>

                                        ) : (

                                            <div className="otc-badge">
                                                ✓ No Prescription
                                                Required
                                            </div>

                                        )}


                                        {isCustomer && (

                                            <button
                                                className="add-btn"
                                                onClick={() =>
                                                    addToCart(
                                                        medicine
                                                    )
                                                }
                                                disabled={
                                                    medicine.quantity <=
                                                    0
                                                }
                                            >
                                                {medicine.quantity <=
                                                0
                                                    ? "Out of Stock"
                                                    : "Add to Cart"}
                                            </button>

                                        )}

                                    </div>

                                </div>

                            )
                        )
                    )}

                </div>

            </section>


            {/* =================================================
                CART
            ================================================= */}

            {isCustomer && (

                <section
                    className="cart-section"
                    id="cart"
                >

                    <div className="section-heading">

                        <span>
                            YOUR ORDER
                        </span>

                        <h2>
                            Shopping Cart
                        </h2>

                    </div>


                    {cart.length === 0 ? (

                        <div className="empty-cart">

                            🛒

                            <h3>
                                Your cart is empty
                            </h3>

                            <p>
                                Add medicines from
                                above to continue.
                            </p>

                        </div>

                    ) : (

                        <div className="cart-container">

                            <div className="cart-items">

                                {cart.map(
                                    (item) => (

                                        <div
                                            className="cart-item"
                                            key={
                                                item.medicine_id
                                            }
                                        >

                                            <div>

                                                <h3>
                                                    {
                                                        item.name
                                                    }
                                                </h3>

                                                <p>
                                                    ₹
                                                    {
                                                        item.price
                                                    }
                                                    {" × "}
                                                    {
                                                        item.cartQuantity
                                                    }
                                                </p>

                                            </div>


                                            <div className="cart-item-right">

                                                <strong>
                                                    ₹
                                                    {
                                                        Number(
                                                            item.price
                                                        ) *
                                                        item.cartQuantity
                                                    }
                                                </strong>


                                                <button
                                                    onClick={() =>
                                                        removeFromCart(
                                                            item.medicine_id
                                                        )
                                                    }
                                                >
                                                    Remove
                                                </button>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>


                            <div className="cart-summary">

                                <h3>
                                    Order Summary
                                </h3>


                                <div className="summary-row">

                                    <span>
                                        Items
                                    </span>

                                    <span>
                                        {
                                            cart.length
                                        }
                                    </span>

                                </div>


                                <div className="summary-row total">

                                    <span>
                                        Total
                                    </span>

                                    <span>
                                        ₹{cartTotal}
                                    </span>

                                </div>


                                <button
                                    className="checkout-btn"
                                    onClick={() => {
                                        window.location.href =
                                            "/checkout";
                                    }}
                                >
                                    Proceed to Checkout
                                </button>

                            </div>

                        </div>

                    )}

                </section>

            )}


            {/* =================================================
                ABOUT
            ================================================= */}

            <section
                className="about"
                id="about"
            >

                <div>

                    <span>
                        ABOUT OUR SYSTEM
                    </span>

                    <h2>
                        Safe & Convenient
                        <br />
                        Online Pharmacy
                    </h2>

                    <p>
                        Our Pharmacy E-Commerce
                        system allows customers
                        to browse medicines, add
                        products to their cart,
                        and place orders online.
                    </p>

                    <p>
                        Prescription medicines
                        are handled through a
                        pharmacist validation
                        process to provide safer
                        online medicine purchasing.
                    </p>

                </div>

            </section>
            {/* =================================================
                FOOTER
            ================================================= */}

            <footer>

                <h3>
                    💊 PharmaCare
                </h3>

                <p>
                    Pharmacy E-Commerce with
                    Prescription Validation
                </p>

                <p>
                    © 2026 PharmaCare.
                    All rights reserved.
                </p>

            </footer>

        </div>
    );
}


// ======================================================
// APP ROUTES
// ======================================================

function App() {

    return (

        <BrowserRouter>

            <Routes>


                {/* LOGIN */}

                <Route
                    path="/login"
                    element={<Login />}
                />


                {/* REGISTER */}

                <Route
                    path="/register"
                    element={<Register />}
                />


                {/* CUSTOMER HOME */}

{/* PUBLIC HOME / HERO */}

                <Route
                    path="/"
                    element={<Home />}
                />


                {/* CUSTOMER CHECKOUT */}

                <Route
                    path="/checkout"
                    element={

                        <ProtectedRoute
                            allowedRoles={[
                                "CUSTOMER",
                            ]}
                        >

                            <Checkout />

                        </ProtectedRoute>

                    }
                />


                {/* CUSTOMER PRESCRIPTION */}

                <Route
                    path="/prescription"
                    element={

                        <ProtectedRoute
                            allowedRoles={[
                                "CUSTOMER",
                            ]}
                        >

                            <Prescription />

                        </ProtectedRoute>

                    }
                />


                {/* CUSTOMER PAYMENT */}

                <Route
                    path="/payment"
                    element={

                        <ProtectedRoute
                            allowedRoles={[
                                "CUSTOMER",
                            ]}
                        >

                            <Payment />

                        </ProtectedRoute>

                    }
                />


                {/* CUSTOMER ORDERS */}

                <Route
                    path="/orders"
                    element={

                        <ProtectedRoute
                            allowedRoles={[
                                "CUSTOMER",
                            ]}
                        >

                            <MyOrders />

                        </ProtectedRoute>

                    }
                />


                {/* PHARMACIST */}

                <Route
                    path="/pharmacist"
                    element={

                        <ProtectedRoute
                            allowedRoles={[
                                "PHARMACIST",
                            ]}
                        >

                            <PharmacistDashboard />

                        </ProtectedRoute>

                    }
                />


                {/* ADMIN */}

                <Route
                    path="/admin"
                    element={

                        <ProtectedRoute
                            allowedRoles={[
                                "ADMIN",
                            ]}
                        >

                            <AdminDashboard />

                        </ProtectedRoute>

                    }
                />


                {/* UNKNOWN URL */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}


export default App;