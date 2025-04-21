import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, Download, Trash2 } from 'lucide-react'
import "../css/DespatchesPage.css"
import CreateDespatchForm from "../components/CreateDespatchForm"

interface DespatchAdvice {
  despatchId: string;
  issueDate: string;
  supplierName: string;
  customerName: string;
  status: string;
}

export default function Despatches() {
  const [activeTab, setActiveTab] = useState("despatch-list")
  const [despatches, setDespatches] = useState<DespatchAdvice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const sessionId = localStorage.getItem("token")
  const navigate = useNavigate()

  const fetchDespatches = async () => {
    setIsLoading(true)
    try {
      if (!sessionId) {
        throw new Error("No session ID found. Please login again.");
      }
      
      const res = await fetch(
        "https://t6r6w5zni9.execute-api.us-east-1.amazonaws.com/v1/despatchAdvice",
        {
          headers: {
            sessionid: sessionId,
          },
        }
      )
      const data = await res.json()
      if (data.despatchAdvices?.despatchAdvicesIDs) {
        // Transform the API response into our DespatchAdvice format
        const formattedDespatches = data.despatchAdvices.despatchAdvicesIDs.map((idStr: string) => {
          const id = idStr.replace("ID: ", "")
          return {
            despatchId: id,
            issueDate: "", // Will be fetched in details
            supplierName: "", // Will be fetched in details
            customerName: "", // Will be fetched in details
            status: "Pending" // Default status
          }
        })
        setDespatches(formattedDespatches)
      } else {
        setDespatches([])
      }
    } catch (err) {
      console.error("Error:", err)
      setDespatches([])
    }
    setIsLoading(false)
  }

  const handleDelete = async (despatchId: string) => {
    if (!window.confirm("Are you sure you want to delete this despatch advice?")) return
    
    try {
      if (!sessionId) {
        throw new Error("No session ID found. Please login again.");
      }
      
      const res = await fetch(
        `https://t6r6w5zni9.execute-api.us-east-1.amazonaws.com/v1/despatchAdvice/${despatchId}`,
        {
          method: "DELETE",
          headers: {
            sessionid: sessionId,
          },
        }
      )
      
      if (res.ok) {
        fetchDespatches() // Refresh the list
      } else {
        console.error("Failed to delete despatch advice")
      }
    } catch (err) {
      console.error("Error deleting despatch:", err)
    }
  }

  useEffect(() => {
    fetchDespatches()
  }, [])

  const filteredDespatches = despatches.filter(despatch => 
    despatch.despatchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    despatch.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    despatch.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container">
      <h1>Despatch Advice Hub</h1>
      
      <div className="tabs-container">
        <div className="tabs-list">
          <button
            className="tab-trigger"
            data-state={activeTab === "despatch-list" ? "active" : "inactive"}
            onClick={() => setActiveTab("despatch-list")}
          >
            Despatch List
          </button>
          <button
            className="tab-trigger"
            data-state={activeTab === "create-despatch" ? "active" : "inactive"}
            onClick={() => setActiveTab("create-despatch")}
          >
            Create Despatch
          </button>
        </div>

        {activeTab === "despatch-list" && (
          <div className="tab-content">
            <div className="space-y-6">
              <div>
                <h2>Filter Despatches</h2>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      className="input"
                      placeholder="Search by ID, customer or supplier"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <button onClick={fetchDespatches} className="button button-primary">
                      Refresh
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h2>Despatch Advices</h2>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Despatch ID</th>
                        <th>Issue Date</th>
                        <th>Supplier</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                              <div className="spinner"></div>
                            </div>
                          </td>
                        </tr>
                      ) : filteredDespatches.length > 0 ? (
                        filteredDespatches.map((despatch) => (
                          <tr key={despatch.despatchId}>
                            <td>{despatch.despatchId}</td>
                            <td>{despatch.issueDate || "N/A"}</td>
                            <td>{despatch.supplierName || "N/A"}</td>
                            <td>{despatch.customerName || "N/A"}</td>
                            <td>
                              <span className={`status-badge ${despatch.status.toLowerCase()}`}>
                                {despatch.status}
                              </span>
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <button
                                  className="button button-outline button-icon"
                                  onClick={() => navigate(`/despatches/${despatch.despatchId}`)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  className="button button-outline button-icon"
                                  onClick={() => handleDownload(despatch.despatchId)}
                                  title="Download XML"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                <button
                                  className="button button-outline button-icon button-danger"
                                  onClick={() => handleDelete(despatch.despatchId)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center' }}>
                            No despatch advices found. {searchTerm ? "Try adjusting your search" : "Create a new despatch advice"}
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

        {activeTab === "create-despatch" && (
          <div className="tab-content">
            <CreateDespatchForm 
              setActiveTab={setActiveTab} 
              sessionId={sessionId}
              onSuccess={fetchDespatches}
            />
          </div>
        )}
      </div>
    </div>
  )

  function handleDownload(despatchId: string) {
    // This would need to be implemented based on your API
    // For now, we'll just show an alert
    alert(`Downloading despatch ${despatchId} XML`)
    
    // Actual implementation might look like:
    /*
    fetch(`https://t6r6w5zni9.execute-api.us-east-1.amazonaws.com/v1/despatchAdvice/${despatchId}/xml`, {
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
        a.download = `despatch-${despatchId}.xml`
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch((err) => console.error("Failed to download XML:", err))
    */
  }
} 