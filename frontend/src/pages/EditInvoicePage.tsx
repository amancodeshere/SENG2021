import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, ArrowLeft } from "lucide-react"
import "@/css/EditInvoicePage.css"

interface Invoice {
  invoiceId: number;
  payableAmount: string;
  [key: string]: any;
}

export default function EditInvoicePage() {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [payableAmount, setPayableAmount] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const sessionId = localStorage.getItem("sessionId")

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!sessionId) {
        navigate('/login');
        return;
      }
      
      setIsLoading(true)
      try {
        const res = await fetch(`/v2/invoice/${invoiceId}`, {
          headers: {
            sessionid: sessionId,
          },
        })
        const data = await res.json()
        if (res.ok) {
          setInvoice(data)
          setPayableAmount(data.payableAmount.replace(/[^0-9.]/g, ""))
        } else {
          console.error(data.error)
        }
      } catch (err) {
        console.error("Error fetching invoice:", err)
      }
      setIsLoading(false)
    }

    fetchInvoice()
  }, [invoiceId, sessionId, navigate])

  const handleSave = async () => {
    if (!sessionId) {
      navigate('/login');
      return;
    }
    
    setIsSaving(true)
    try {
      const res = await fetch(`/v1/invoice/${invoiceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          sessionid: sessionId,
        },
        body: JSON.stringify({
          toUpdate: "payableAmount",
          newData: `$${payableAmount}`,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        navigate(`/invoices/${invoiceId}`)
      } else {
        console.error(data.error)
        alert(data.error)
      }
    } catch (err) {
      console.error("Error updating invoice:", err)
      alert("Failed to update invoice.")
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="edit-invoice-container">
        <p>Loading invoice...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="edit-invoice-container">
        <p>Invoice not found.</p>
        <Button onClick={() => navigate("/invoices")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
      </div>
    )
  }

  return (
    <div className="edit-invoice-container">
      <div className="edit-invoice-header">
        <Button variant="outline" onClick={() => navigate(`/invoices/${invoiceId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="edit-invoice-title">Edit Invoice #{invoice.invoiceId}</h1>
      </div>

      <div className="edit-invoice-card">
        <div className="input-group">
          <label>Payable Amount</label>
          <Input
            type="text"
            value={payableAmount}
            onChange={(e) => setPayableAmount(e.target.value)}
            placeholder="100.00"
          />
          <p className="input-hint">Enter numeric amount only (e.g., 130.00)</p>
        </div>

        <div className="edit-invoice-actions">
          <Button variant="outline" onClick={() => navigate(`/invoices/${invoiceId}`)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !payableAmount}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
