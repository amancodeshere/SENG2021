import { useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import { Button } from "../components/ui/button"
import { logout } from "../lib/api.ts"
import "../css/Dashboard.css"

export default function Dashboard() {
  const navigate = useNavigate()

  const handleLogout = () => {
    const sessionId = localStorage.getItem("token")
    if (sessionId) {
      try {
        const res = logout(sessionId)
        console.log(res)
        localStorage.removeItem("token")
        navigate("/")
      } catch (err) {
        console.error(err)
      }
    }
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="dashboard-wrapper">
        <header className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <Button
            variant="ghost"
            className="logout-button"
            onClick={handleLogout}
          >
            <LogOut className="logout-icon" />
            Logout
          </Button>
        </header>

        <main className="dashboard-main">
          <div className="dashboard-card">
            <div className="dashboard-content">
              <div className="dashboard-logo-section">
                <img src="/logo2.png" alt="Trade Docs Navigator" className="dashboard-logo" />
                <h2 className="dashboard-subtitle">Your Trade Hub</h2>
              </div>

              <div className="dashboard-grid">
                <Button
                  className="dashboard-button"
                  onClick={() => navigate("/orders")}
                >
                  Tracking
                </Button>
                <Button
                  className="dashboard-button"
                  onClick={() => navigate("/invoices")}
                >
                  Invoices
                </Button>
                <Button
                  className="dashboard-button"
                  onClick={() => navigate("/despatches")}
                >
                  Despatches
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
