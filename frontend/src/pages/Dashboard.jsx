import { useNavigate } from "react-router-dom"

export default function Dashboard() {
    const navigate = useNavigate()
    
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <>
        <h2 className="dashboard-heading">Dashboard</h2>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
        </>
    )
}
