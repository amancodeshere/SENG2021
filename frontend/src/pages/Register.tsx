import { useState, FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "../css/Register.css"

export default function Register() {
    const [companyName, setCompanyName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const navigate = useNavigate()
    
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        try {
            const res = await axios.post("/api/v1/admin/register", {
                companyName,
                email,
                password,
            })
            localStorage.setItem("token", res.data.sessionId)
            navigate("/dashboard")
        } catch (err: unknown) {
            console.error("Register error:", err)
            setError(
                axios.isAxiosError(err) && err.response?.data?.error 
                    ? err.response.data.error 
                    : "Registration failed."
            )
        }
    }

    return (
        <div className="register-container">
            <img className="register-logo" src="/logo2.png" alt="TradeDocs Navigator Logo" />
            <h2 className="register-heading">Register</h2>
            <form onSubmit={handleSubmit} className="register-form">
                <p className="input-label">Company Name</p>
                <input
                    type="text"
                    placeholder="Enter company name"
                    className="company-name-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                />
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
                <button className="register-button">
                    Register
                </button>
            </form>
            {error && <p className="register-error">{error}</p>}
        </div>
    )
}