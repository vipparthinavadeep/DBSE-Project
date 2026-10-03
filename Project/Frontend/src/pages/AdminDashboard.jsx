import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [message, setMessage] = useState("");

    // ADD MEDICINE FORM
    const [showForm, setShowForm] = useState(false);

    const [medicineForm, setMedicineForm] = useState({
        name: "",
        description: "",
        category: "",
        price: "",
        quantity: "",
        requires_prescription: false,
    });

    const token = localStorage.getItem("token");


    // =====================================================
    // LOAD USERS + MEDICINES
    // =====================================================

    const loadData = async () => {
        try {
            setMessage("");

            // -----------------------------
            // LOAD USERS
            // -----------------------------

            const userResponse = await fetch(
                "http://localhost:5000/api/users/admin",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const userData = await userResponse.json();

            if (!userResponse.ok) {
                setMessage(
                    userData.message || "Admin access denied."
                );
                return;
            }

            const usersArray = Array.isArray(userData)
                ? userData
                : Array.isArray(userData.users)
                ? userData.users
                : [];

            setUsers(usersArray);


            // -----------------------------
            // LOAD MEDICINES
            // -----------------------------

            const medicineResponse = await fetch(
                "http://localhost:5000/api/medicines"
            );

            const medicineData =
                await medicineResponse.json();

            if (!medicineResponse.ok) {
                setMessage(
                    medicineData.message ||
                        "Failed to load medicines."
                );
                return;
            }

            const medicinesArray =
                Array.isArray(medicineData)
                    ? medicineData
                    : Array.isArray(
                          medicineData.medicines
                      )
                    ? medicineData.medicines
                    : [];

            setMedicines(medicinesArray);

        } catch (error) {
            console.error(error);

            setMessage(
                "Unable to connect to server."
            );
        }
    };


    // =====================================================
    // CHECK LOGIN
    // =====================================================

    useEffect(() => {
        const user = localStorage.getItem("user");

        if (!token || !user) {
            navigate("/login");
            return;
        }

        try {
            const currentUser = JSON.parse(user);

            if (currentUser.role !== "ADMIN") {

                if (currentUser.role === "CUSTOMER") {
                    navigate("/");
                }

                else if (
                    currentUser.role === "PHARMACIST"
                ) {
                    navigate("/pharmacist");
                }

                else {
                    navigate("/login");
                }

                return;
            }

        } catch (error) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            navigate("/login");
            return;
        }

        loadData();
    }, []);


    // =====================================================
    // LOGOUT
    // =====================================================

    const logout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem(
            "currentPrescriptionId"
        );

        navigate("/login");
    };


    // =====================================================
    // COUNTS
    // =====================================================

    const pharmacistCount = users.filter(
        (user) =>
            user.role === "PHARMACIST"
    ).length;

    const customerCount = users.filter(
        (user) =>
            user.role === "CUSTOMER"
    ).length;


    // =====================================================
    // FORM INPUT CHANGE
    // =====================================================

    const handleInputChange = (e) => {

        const { name, value, type, checked } =
            e.target;

        setMedicineForm({
            ...medicineForm,

            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        });
    };


    // =====================================================
    // ADD MEDICINE
    // =====================================================

    const addMedicine = async (e) => {

        e.preventDefault();

        try {

            setMessage("");

            if (
                !medicineForm.name ||
                !medicineForm.category ||
                !medicineForm.price ||
                !medicineForm.quantity
            ) {
                setMessage(
                    "Please fill all required fields."
                );

                return;
            }

            const response = await fetch(
                "http://localhost:5000/api/medicines",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        name: medicineForm.name,

                        description:
                            medicineForm.description,

                        category:
                            medicineForm.category,

                        price:
                            Number(
                                medicineForm.price
                            ),

                        quantity:
                            Number(
                                medicineForm.quantity
                            ),

                        requires_prescription:
                            medicineForm.requires_prescription,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                setMessage(
                    data.message ||
                        "Failed to add medicine."
                );

                return;
            }

            setMessage(
                "Medicine added successfully!"
            );

            setMedicineForm({
                name: "",
                description: "",
                category: "",
                price: "",
                quantity: "",
                requires_prescription:
                    false,
            });

            setShowForm(false);

            loadData();

        } catch (error) {

            console.error(error);

            setMessage(
                "Unable to connect to server."
            );
        }
    };


    return (
        <div className="admin-page">

            {/* =================================================
                NAVBAR
            ================================================= */}

            <nav className="dashboard-navbar">

                <div className="logo">
                    💊 PharmaCare Admin
                </div>

                <button
                    className="logout-btn"
                    onClick={logout}
                >
                    Logout
                </button>

            </nav>


            {/* =================================================
                MAIN
            ================================================= */}

            <div className="admin-container">

                {/* HEADING */}

                <div className="admin-heading">

                    <span>
                        ADMIN PORTAL
                    </span>

                    <h1>
                        System Dashboard
                    </h1>

                    <p>
                        Manage users, medicines and
                        pharmacy operations.
                    </p>

                </div>


                {/* MESSAGE */}

                {message && (
                    <div className="dashboard-message">
                        {message}
                    </div>
                )}


                {/* =================================================
                    STATISTICS
                ================================================= */}

                <div className="admin-stats">

                    <div className="admin-stat">

                        <div>👥</div>

                        <p>
                            Total Users
                        </p>

                        <h2>
                            {users.length}
                        </h2>

                    </div>


                    <div className="admin-stat">

                        <div>💊</div>

                        <p>
                            Total Medicines
                        </p>

                        <h2>
                            {medicines.length}
                        </h2>

                    </div>


                    <div className="admin-stat">

                        <div>👨‍⚕️</div>

                        <p>
                            Pharmacists
                        </p>

                        <h2>
                            {pharmacistCount}
                        </h2>

                    </div>


                    <div className="admin-stat">

                        <div>🛒</div>

                        <p>
                            Customers
                        </p>

                        <h2>
                            {customerCount}
                        </h2>

                    </div>

                </div>


                {/* =================================================
                    USER MANAGEMENT
                ================================================= */}

                <div className="admin-section">

                    <div className="admin-section-title">

                        <h2>
                            User Management
                        </h2>

                        <button
                            className="refresh-btn"
                            onClick={loadData}
                        >
                            ↻ Refresh
                        </button>

                    </div>


                    <div className="admin-table">

                        <div className="admin-table-header">

                            <span>ID</span>

                            <span>Name</span>

                            <span>Email</span>

                            <span>Role</span>

                        </div>


                        {users.length === 0 ? (

                            <div className="no-prescriptions">

                                <div>👥</div>

                                <h3>
                                    No Users Found
                                </h3>

                                <p>
                                    No users are available.
                                </p>

                            </div>

                        ) : (

                            users.map((user) => (

                                <div
                                    className="admin-table-row"
                                    key={user.user_id}
                                >

                                    <span>
                                        #{user.user_id}
                                    </span>

                                    <span>
                                        {user.name}
                                    </span>

                                    <span>
                                        {user.email}
                                    </span>

                                    <span className="role-badge">
                                        {user.role}
                                    </span>

                                </div>

                            ))

                        )}

                    </div>

                </div>


                {/* =================================================
                    MEDICINE INVENTORY
                ================================================= */}

                <div className="admin-section">

                    <div className="admin-section-title">

                        <div>
                            <h2>
                                Medicine Inventory
                            </h2>

                            <span>
                                {medicines.length} products
                            </span>
                        </div>

                        <button
                            className="add-medicine-btn"
                            onClick={() =>
                                setShowForm(
                                    !showForm
                                )
                            }
                        >
                            {showForm
                                ? "✕ Close"
                                : "+ Add Medicine"}
                        </button>

                    </div>


                    {/* =================================================
                        ADD MEDICINE FORM
                    ================================================= */}

                    {showForm && (

                        <form
                            className="add-medicine-form"
                            onSubmit={addMedicine}
                        >

                            <div className="form-grid">

                                <div className="form-group">

                                    <label>
                                        Medicine Name *
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="e.g. Dolo 650"
                                        value={
                                            medicineForm.name
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Category *
                                    </label>

                                    <input
                                        type="text"
                                        name="category"
                                        placeholder="e.g. Pain Relief"
                                        value={
                                            medicineForm.category
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        required
                                    />

                                </div>


                                <div className="form-group form-full">

                                    <label>
                                        Description
                                    </label>

                                    <textarea
                                        name="description"
                                        placeholder="Medicine description..."
                                        value={
                                            medicineForm.description
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        rows="3"
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Price (₹) *
                                    </label>

                                    <input
                                        type="number"
                                        name="price"
                                        placeholder="50"
                                        min="0"
                                        step="0.01"
                                        value={
                                            medicineForm.price
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Initial Stock *
                                    </label>

                                    <input
                                        type="number"
                                        name="quantity"
                                        placeholder="100"
                                        min="0"
                                        value={
                                            medicineForm.quantity
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        required
                                    />

                                </div>

                            </div>


                            <label className="prescription-checkbox">

                                <input
                                    type="checkbox"
                                    name="requires_prescription"
                                    checked={
                                        medicineForm.requires_prescription
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                />

                                <span>
                                    Prescription Required
                                </span>

                            </label>


                            <button
                                type="submit"
                                className="save-medicine-btn"
                            >
                                ✓ Add Medicine
                            </button>

                        </form>

                    )}


                    {/* =================================================
                        MEDICINE TABLE
                    ================================================= */}

                    <div className="admin-table">

                        <div className="admin-table-header medicine-admin-header">

                            <span>ID</span>

                            <span>
                                Medicine
                            </span>

                            <span>
                                Category
                            </span>

                            <span>
                                Price
                            </span>

                            <span>
                                Prescription
                            </span>

                        </div>


                        {medicines.length === 0 ? (

                            <div className="no-prescriptions">

                                <div>💊</div>

                                <h3>
                                    No Medicines Found
                                </h3>

                                <p>
                                    No medicines are available.
                                </p>

                            </div>

                        ) : (

                            medicines.map(
                                (medicine) => (

                                    <div
                                        className="admin-table-row medicine-admin-header"
                                        key={
                                            medicine.medicine_id
                                        }
                                    >

                                        <span>
                                            #
                                            {
                                                medicine.medicine_id
                                            }
                                        </span>

                                        <span>
                                            {
                                                medicine.name
                                            }
                                        </span>

                                        <span>
                                            {
                                                medicine.category
                                            }
                                        </span>

                                        <span>
                                            ₹
                                            {
                                                medicine.price
                                            }
                                        </span>

                                        <span>
                                            {
                                                medicine.requires_prescription
                                                    ? "Required"
                                                    : "Not Required"
                                            }
                                        </span>

                                    </div>

                                )
                            )

                        )}

                    </div>

                </div>

            </div>

        </div>
    );
}

export default AdminDashboard;