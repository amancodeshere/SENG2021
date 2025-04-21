<<<<<<< HEAD
import { useState, FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
=======
import { useState } from "react"
import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom"
>>>>>>> 32b862a (Frontend changes)
import axios from "axios"
import "../css/Login.css"

export default function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const navigate = useNavigate()
    
    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const res = await axios.post("/api/v1/admin/login", {
              email,
              password,
            })
            localStorage.setItem("token", res.data.sessionId)
            navigate("/dashboard")
<<<<<<< HEAD
        } catch (err: any) {
=======
        } catch (err) {
>>>>>>> 32b862a (Frontend changes)
            setError(err.response.data.error || "Login failed.")
        }
    }
    
    return (
        <div className="login-container">
            <img className="login-logo" src="/logo1.png" alt="TradeDocs Navigator Logo" />
            <h2 className="login-heading">Login</h2>
            <form onSubmit={handleSubmit} className="login-form">
                <p className="input-label">Email</p>
                <input
                    type="text"
                    placeholder="Enter email"
                    className="email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <p className="input-label">Password</p>
                <input
                    type="password"
                    placeholder="Enter password"
                    className="password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button className="login-button">
                    Login
                </button>
            </form>
            {error && <p className="login-error">{error}</p>}
            <p className="register-text">Don't have an account?</p>
            <Link to="/register" className="register-link">
                Register
            </Link>
        </div>
    )
}