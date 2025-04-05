import "../css/Landing.css"
import { useNavigate } from "react-router-dom";

export default function Landing() {
    const navigate = useNavigate();

    return (
    <>
        <img className="landing-logo" src="/logo2.png" alt="TradeDocs Navigator Logo" />
        <p className="landing-text">A unified platform for invoicing and despatches, streamlining the delivery process.</p>
        <button className="login-button" onClick={() => navigate("/login")}>Login</button>
    </>
    )
}
