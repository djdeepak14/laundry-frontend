import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import washerImg from "../assets/washer.jpg";
import { Eye, EyeOff } from "lucide-react"; // 👁️ password toggle icons

const LoginForm = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [wsMessage, setWsMessage] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValid, setPasswordValid] = useState(true);

  const API_BASE_URL =
    process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

  /* ✅ SERVER CONNECTION CHECK */
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 5000;
    let interval;

    const checkServerStatus = async () => {
      if (wsConnected) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/status`, { timeout: 5000 });
        setWsMessage(`✅ Server connected: ${res.data.status || "OK"}`);
        setWsConnected(true);
        setError("");
        retryCount = 0;
      } catch (err) {
        if (err.response?.status === 404) {
          setWsMessage("⚠️ Server up, but /status endpoint not found.");
          setWsConnected(true);
          setError("");
        } else {
          handleConnectionFailure(err);
        }
      }
    };

    const handleConnectionFailure = (err) => {
      if (err.code === "ERR_NETWORK" || err.response?.status === 0) {
        setWsMessage("❌ Network error: Check backend CORS or if server is running.");
      } else if (retryCount < maxRetries) {
        retryCount++;
        setWsMessage(`Retrying (${retryCount}/${maxRetries})...`);
        setTimeout(checkServerStatus, retryDelay);
      } else {
        setWsMessage("🚫 Cannot connect to server.");
        setWsConnected(false);
        setError("Network error: Server unreachable.");
      }
    };

    checkServerStatus();
    if (!wsConnected) interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, [API_BASE_URL, wsConnected]);

  /* ✅ VALIDATIONS */
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateStrongPassword = (password) => {
    // GDPR-strong password rule: uppercase, lowercase, number, special char, min 8 chars
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
    setEmail("");
    setPassword("");
    setName("");
    setConfirmPassword("");
  };

  /* ✅ HANDLE LOGIN / REGISTER */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password || (isRegistering && (!name || !confirmPassword))) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError("Invalid email format.");
      setLoading(false);
      return;
    }

    if (isRegistering && !validateStrongPassword(password)) {
      setError(
        "Password must include at least 8 characters, one uppercase, one lowercase, one number, and one special symbol."
      );
      setPasswordValid(false);
      setLoading(false);
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const url = isRegistering
      ? `${API_BASE_URL}/user/register`
      : `${API_BASE_URL}/user/login`;

    const payload = isRegistering
      ? {
          email: email.trim(),
          password: password.trim(),
          name: name.trim(),
          confirmPassword: confirmPassword.trim(),
        }
      : { email: email.trim(), password: password.trim() };

    try {
      const response = await axios.post(url, payload, {
        withCredentials: true,
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      });

      const data = response.data;

      if (isRegistering) {
        alert("✅ Registration successful! Please log in.");
        toggleMode();
      } else if (data.data?.accessToken) {
        const token = data.data.accessToken;
        localStorage.setItem("token", token);

        try {
          const decoded = jwtDecode(token);
          if (decoded._id) localStorage.setItem("userId", decoded._id);
          if (decoded.role) localStorage.setItem("role", decoded.role);
          onLoginSuccess(token, decoded._id, decoded.role);
        } catch (decodeError) {
          console.error("❌ Failed to decode token:", decodeError);
          onLoginSuccess(token);
        }
      } else {
        setError("Login failed: No token received.");
      }
    } catch (err) {
      // ✅ Show backend message if available
      if (err.response?.status === 400 || err.response?.status === 500) {
        setError(
          err.response?.data?.message ||
            "Server error occurred. Please check backend logs."
        );
      } else if (err.code === "ERR_NETWORK") {
        setError("Network error: Server unreachable.");
      } else if (err.response?.status === 404) {
        setError("Endpoint not found.");
      } else {
        setError(err.response?.data?.message || "Request failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ✅ STYLES */
  const backgroundStyle = {
    backgroundImage: `url(${washerImg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  const formStyle = {
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: "2rem 3rem",
    borderRadius: "12px",
    boxShadow: "0 0 20px rgba(0,0,0,0.3)",
    width: "400px",
    maxWidth: "95%",
    textAlign: "center",
    position: "relative",
  };

  const inputContainer = {
    position: "relative",
    width: "100%",
  };

  const eyeIconStyle = {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    color: "#555",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    margin: "12px 0",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "1rem",
    boxSizing: "border-box",
  };

  const buttonStyle = {
    width: "100%",
    padding: "12px",
    backgroundColor: "#007bff",
    color: "white",
    fontSize: "1.1rem",
    border: "none",
    borderRadius: "6px",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.6 : 1,
    transition: "opacity 0.2s",
  };

  const errorStyle = {
    color: "#d32f2f",
    margin: "10px 0",
    fontSize: "0.9rem",
  };

  const wsMessageStyle = {
    color: wsConnected ? "#2e7d32" : "#d32f2f",
    margin: "10px 0",
    fontSize: "0.9rem",
  };

  const toggleLinkStyle = {
    marginTop: "12px",
    cursor: "pointer",
    color: "#007bff",
    fontSize: "0.9rem",
    textDecoration: "underline",
  };

  /* ✅ RENDER */
  return (
    <div style={backgroundStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "1.5rem" }}>
          {isRegistering ? "Register" : "Login"}
        </h2>

        {isRegistering && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            required
            disabled={loading}
            autoComplete="name"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          required
          disabled={loading}
          autoComplete="email"
        />

        {/* ✅ Password field with eye toggle */}
        <div style={inputContainer}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (isRegistering)
                setPasswordValid(validateStrongPassword(e.target.value));
            }}
            style={{
              ...inputStyle,
              borderColor:
                isRegistering && !passwordValid ? "#d32f2f" : "#ccc",
            }}
            required
            disabled={loading}
            autoComplete="current-password"
          />
          {showPassword ? (
            <EyeOff
              size={20}
              style={eyeIconStyle}
              onClick={() => setShowPassword(false)}
            />
          ) : (
            <Eye
              size={20}
              style={eyeIconStyle}
              onClick={() => setShowPassword(true)}
            />
          )}
        </div>

        {isRegistering && !passwordValid && (
          <p style={{ ...errorStyle, fontSize: "0.8rem", marginTop: "-5px" }}>
            Must include uppercase, lowercase, number, and special symbol.
          </p>
        )}

        {isRegistering && (
          <div style={inputContainer}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              required
              disabled={loading}
              autoComplete="new-password"
            />
            {showConfirmPassword ? (
              <EyeOff
                size={20}
                style={eyeIconStyle}
                onClick={() => setShowConfirmPassword(false)}
              />
            ) : (
              <Eye
                size={20}
                style={eyeIconStyle}
                onClick={() => setShowConfirmPassword(true)}
              />
            )}
          </div>
        )}

        {/* ✅ GDPR text moved below Confirm Password */}
        {isRegistering && (
          <p
            style={{
              fontSize: "0.8rem",
              color: "#555",
              margin: "6px 0 12px",
              textAlign: "left",
            }}
          >
            🔒 Your password is handled securely according to EU GDPR standards.
          </p>
        )}

        {error && <p style={errorStyle}>{error}</p>}
        {wsMessage && <p style={wsMessageStyle}>{wsMessage}</p>}

        <button
          type="submit"
          style={buttonStyle}
          disabled={loading || !wsConnected}
        >
          {loading
            ? isRegistering
              ? "Registering..."
              : "Logging in..."
            : isRegistering
            ? "Register"
            : "Login"}
        </button>

        <p style={toggleLinkStyle} onClick={toggleMode}>
          {isRegistering
            ? "Already have an account? Login"
            : "No account? Register"}
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
