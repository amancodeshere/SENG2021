import { useNavigate, Link } from "react-router-dom"
import { LogOut, FileText, Truck, MapPin, Facebook, Twitter, Linkedin } from "lucide-react"
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

  const features = [
    {
      icon: <FileText className="feature-icon" />,
      title: "Invoice Generation",
      description:
        "Create professional invoices in seconds with customizable templates and automated calculations.",
      path: "/invoices"
    },
    {
      icon: <Truck className="feature-icon" />,
      title: "Dispatch Advice",
      description:
        "Generate and send dispatch notices automatically when orders are ready to set sail.",
      path: "/despatches"
    },
    {
      icon: <MapPin className="feature-icon" />,
      title: "Order Tracking",
      description:
        "Real-time map view of all orders for both businesses and customers to navigate deliveries.",
      path: "/orders"
    }
  ]

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <div className="dashboard-wrapper flex-grow">
        <header className="dashboard-header">
          <img
            src="/logo2.png"
            alt="Trade Docs Navigator"
            className="header-logo"
          />
          <Button
            variant="ghost"
            className="logout-button"
            onClick={handleLogout}
          >
            <LogOut className="logout-icon" />
            Logout
          </Button>
        </header>

        <section className="features-section">
          <h2 className="features-title">
            Navigate Every Aspect of Your Business
          </h2>
          <p className="max-w-[900px] text-ocean-600 md:text-xl/relaxed">
                  Trade Docs Navigator combines invoicing, dispatch management, and order tracking in one seaworthy
                  solution.
          </p>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card"
                onClick={() => navigate(feature.path)}
              >
                <div className="feature-icon-container">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="dashboard-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <img src="/logo2.png" alt="Trade Docs Navigator Logo" className="footer-logo" />
              <p className="footer-description">
                A unified platform for invoicing and despatches, streamlining the delivery process for SMEs and their
                customers across the seven seas.
              </p>
            </div>
            <div className="footer-links-container">
              <div className="footer-links-column">
                <h3 className="footer-column-title">Ship's Log</h3>
                <nav className="footer-nav">
                  <Link to="#" className="footer-link">Features</Link>
                  <Link to="#" className="footer-link">Pricing</Link>
                  <Link to="#" className="footer-link">Integrations</Link>
                  <Link to="#" className="footer-link">Changelog</Link>
                </nav>
              </div>
              <div className="footer-links-column">
                <h3 className="footer-column-title">Navigation</h3>
                <nav className="footer-nav">
                  <Link to="#" className="footer-link">Documentation</Link>
                  <Link to="#" className="footer-link">Guides</Link>
                  <Link to="#" className="footer-link">Support</Link>
                  <Link to="#" className="footer-link">API Reference</Link>
                </nav>
              </div>
              <div className="footer-links-column">
                <h3 className="footer-column-title">The Crew</h3>
                <nav className="footer-nav">
                  <Link to="#" className="footer-link">About</Link>
                  <Link to="#" className="footer-link">Blog</Link>
                  <Link to="#" className="footer-link">Careers</Link>
                  <Link to="#" className="footer-link">Contact</Link>
                </nav>
              </div>
              <div className="footer-links-column">
                <h3 className="footer-column-title">Maritime Law</h3>
                <nav className="footer-nav">
                  <Link to="#" className="footer-link">Terms</Link>
                  <Link to="#" className="footer-link">Privacy</Link>
                  <Link to="#" className="footer-link">Cookies</Link>
                  <Link to="#" className="footer-link">Licenses</Link>
                </nav>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-copyright">
              © {new Date().getFullYear()} Trade Docs Navigator. All rights reserved.
            </p>
            <div className="footer-social">
              <Link to="#" className="social-link">
                <Facebook className="social-icon" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link to="#" className="social-link">
                <Twitter className="social-icon" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link to="#" className="social-link">
                <Linkedin className="social-icon" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
