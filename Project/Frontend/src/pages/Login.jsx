import { useState } from "react";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setMessage("");
        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/users/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Login failed"
                );
            }

            // Save login information
            localStorage.setItem("token", data.token);
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            // Remove any old current prescription
            localStorage.removeItem("currentPrescriptionId");

            // Get logged-in user's role
            const role = data.user.role;

            // ROLE-BASED REDIRECTION
            if (role === "CUSTOMER") {
                window.location.href = "/";
            } else if (role === "PHARMACIST") {
                window.location.href = "/pharmacist";
            } else if (role === "ADMIN") {
                window.location.href = "/admin";
            } else {
                window.location.href = "/";
            }

        } catch (error) {
            console.error(error);
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">

            <div className="auth-card">

                <h1>Login</h1>

                <p>
                    Login to access your PharmaCare account.
                </p>

                <form onSubmit={handleLogin}>

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                </form>

                {message && (
                    <p className="error-message">
                        {message}
                    </p>
                )}

                <p>
                    Don't have an account?{" "}
                    <button
                        type="button"
                        onClick={() => {
                            window.location.href =
                                "/register";
                        }}
                    >
                        Register
                    </button>
                </p>

            </div>

        </div>
    );
}

export default Login;