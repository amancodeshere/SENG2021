import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, Edit, Download } from 'lucide-react'
import "../css/InvoicesPage.css"
import ValidateXMLForm from "../components/ValidateXMLForm"
import CreateInvoiceForm from "../components/CreateInvoiceForm"


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
    <div className="container">
      <h1>Invoice Hub</h1>
      
      <div className="tabs-container">
        <div className="tabs-list">
          <button
            className="tab-trigger"
            data-state={activeTab === "invoice-list" ? "active" : "inactive"}
            onClick={() => setActiveTab("invoice-list")}
          >
            Invoice List
          </button>
          <button
            className="tab-trigger"
            data-state={activeTab === "create-invoice" ? "active" : "inactive"}
            onClick={() => setActiveTab("create-invoice")}
          >
            Create Invoice
          </button>
          <button
            className="tab-trigger"
            data-state={activeTab === "validate-xml" ? "active" : "inactive"}
            onClick={() => setActiveTab("validate-xml")}
          >
            Validate XML
          </button>
        </div>

        {activeTab === "invoice-list" && (
          <div className="tab-content">
            <div className="space-y-6">
              <div>
                <h2>Filter Invoices</h2>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label htmlFor="buyer-name">
                      Buyer Party Name
                    </label>
                    <input
                      id="buyer-name"
                      className="input"
                      placeholder="Enter buyer name to filter"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <button onClick={fetchInvoices} className="button button-primary">
                      Filter
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h2>Invoices</h2>
                <div className="table-container">
                  <table>
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
                      {isLoading ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                              <div className="spinner"></div>
                            </div>
                          </td>
                        </tr>
                      ) : invoices.length > 0 ? (
                        invoices.map((invoice) => (
                          <tr key={invoice.invoiceId}>
                            <td>{invoice.invoiceId}</td>
                            <td>{new Date(invoice.issueDate).toLocaleDateString()}</td>
                            <td>{invoice.partyNameBuyer}</td>
                            <td>{invoice.payableAmount}</td>
                            <td>
                              <div className="flex gap-2">
                                <button
                                  className="button button-outline button-icon"
                                  onClick={() => navigate(`/invoices/${invoice.invoiceId}`)}
                                  title="View Invoice"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  className="button button-outline button-icon"
                                  onClick={() => navigate(`/invoices/${invoice.invoiceId}/edit`)}
                                  title="Edit Invoice"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  className="button button-outline button-icon"
                                  onClick={() => handleDownload(invoice.invoiceId)}
                                  title="Download XML"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center' }}>
                            No invoices found. Try adjusting your filter or create a new invoice.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "create-invoice" && (
          <div className="tab-content">
            <CreateInvoiceForm setActiveTab={setActiveTab} sessionId={sessionId} />
          </div>
        )}

        {activeTab === "validate-xml" && (
          <div className="tab-content">
            <ValidateXMLForm sessionId={sessionId} />
          </div>
        )}
      </div>
    </div>
  )

  function handleDownload(id) {
    fetch(`/v2/invoice/${id}/xml`, {
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
