import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, Edit, Download } from "lucide-react"
import "../css/InvoicesPage.css"

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState("invoice-list")
  const [buyerName, setBuyerName] = useState("")
  const [invoices, setInvoices] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const sessionId = localStorage.getItem("sessionId")
  const navigate = useNavigate()

  const fetchInvoices = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/v2/invoices/list?partyNameBuyer=${encodeURIComponent(buyerName)}`,
        {
          headers: {
            sessionid: sessionId,
          },
        }
      )
      const data = await res.json()
      setInvoices(data.invoices || [])
    } catch (err) {
      console.error("Error:", err)
      setInvoices([])
    }
    setIsLoading(false)
  }

  return (
    <div className="invoices-dashboard">
      <h1 className="page-title">Invoice Hub</h1>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "invoice-list" ? "active" : ""}`}
          onClick={() => setActiveTab("invoice-list")}
        >
          Invoice List
        </button>
        <button
          className={`tab ${activeTab === "create-invoice" ? "active" : ""}`}
          onClick={() => setActiveTab("create-invoice")}
        >
          Create Invoice
        </button>
        <button
          className={`tab ${activeTab === "validate-xml" ? "active" : ""}`}
          onClick={() => setActiveTab("validate-xml")}
        >
          Validate XML
        </button>
      </div>

      {activeTab === "invoice-list" && (
        <div className="tab-content">
          <h2 className="filter-section-header">Filter Invoices</h2>
          
          <div className="filter-box">
            <label htmlFor="buyer-filter" className="label">
              Buyer Party Name
            </label>
            <div className="filter-input">
              <Input
                id="buyer-filter"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Enter buyer name to filter"
              />
              <Button onClick={fetchInvoices} className="filter-button">Filter</Button>
            </div>
          </div>

          <div className="invoice-table-container">
            <h2 className="table-title">Invoices</h2>

            {isLoading ? (
              <p className="loading-text">Loading invoices...</p>
            ) : invoices.length === 0 ? (
              <p className="no-results-text">No invoices found.</p>
            ) : (
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Issue Date</th>
                    <th>Buyer</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.invoiceId}>
                      <td>{inv.invoiceId}</td>
                      <td>{new Date(inv.issueDate).toLocaleDateString()}</td>
                      <td>{inv.partyNameBuyer}</td>
                      <td>${parseFloat(inv.payableAmount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}</td>
                      <td>
                        <div className="action-buttons">
                          <Button
                            size="icon"
                            variant="outline"
                            title="View"
                            onClick={() =>
                              navigate(`/invoices/${inv.invoiceId}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            title="Edit"
                            onClick={() =>
                              navigate(`/invoices/${inv.invoiceId}/edit`)
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            title="Download XML"
                            onClick={() => handleDownload(inv.invoiceId)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === "create-invoice" && (
        <div className="tab-content">
          <p>[TODO: CreateInvoiceForm goes here]</p>
        </div>
      )}

      {activeTab === "validate-xml" && (
        <div className="tab-content">
          <p>[TODO: ValidateXMLForm goes here]</p>
        </div>
      )}
    </div>
  )

  function handleDownload(id) {
    fetch(`/api/v2/invoice/${id}/xml`, {
      headers: {
        sessionid: sessionId,
      },
    })
      .then((res) => res.text())
      .then((xml) => {
        const blob = new Blob([xml], { type: "application/xml" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `invoice-${id}.xml`
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch((err) => console.error("Failed to download XML:", err))
  }
}
