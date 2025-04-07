import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from 'lucide-react'

interface CreateDespatchFormProps {
  setActiveTab: (tab: string) => void
  sessionId: string | null
  onSuccess: () => void
}

export default function CreateDespatchForm({ setActiveTab, sessionId, onSuccess }: CreateDespatchFormProps) {
  const [formData, setFormData] = useState({
    orderId: "",
    issueDate: new Date().toISOString().split("T")[0],
    supplierName: "",
    customerName: "",
    deliveryAddress: "",
    items: [{
      itemId: "",
      description: "",
      quantity: "",
      unit: "KGM"
    }]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...formData.items]
    newItems[index] = {
      ...newItems[index],
      [field]: value
    }
    setFormData(prev => ({
      ...prev,
      items: newItems
    }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { itemId: "", description: "", quantity: "", unit: "KGM" }
      ]
    }))
  }

  const removeItem = (index: number) => {
    if (formData.items.length <= 1) return
    const newItems = [...formData.items]
    newItems.splice(index, 1)
    setFormData(prev => ({
      ...prev,
      items: newItems
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // Format the data to match your API requirements
      const requestBody = {
        Order: {
          "@xmlns": "urn:oasis:names:specification:ubl:schema:xsd:Order-2",
          "@xmlns:cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
          "@xmlns:cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
          "cbc:UBLVersionID": "2.0",
          "cbc:CustomizationID": "urn:oasis:names:specification:ubl:xpath:Order-2.0:samples-2.0-draft",
          "cbc:ProfileID": "bpid:urn:oasis:names:draft:bpss:ubl-2-sample-international-scenario",
          "cbc:ID": formData.orderId,
          "cbc:CopyIndicator": "false",
          "cbc:UUID": crypto.randomUUID(),
          "cbc:IssueDate": formData.issueDate,
          "cbc:Note": "Created via portal",
          "cac:BuyerCustomerParty": {
            "cbc:CustomerAssignedAccountID": "CUST001",
            "cac:Party": {
              "cac:PartyName": {
                "cbc:Name": formData.customerName
              },
              "cac:PostalAddress": {
                "cbc:StreetName": formData.deliveryAddress.split(",")[0] || "",
                "cbc:CityName": formData.deliveryAddress.split(",")[1] || "",
                "cac:Country": {
                  "cbc:IdentificationCode": "GB"
                }
              }
            }
          },
          "cac:SellerSupplierParty": {
            "cbc:CustomerAssignedAccountID": "SUPP001",
            "cac:Party": {
              "cac:PartyName": {
                "cbc:Name": formData.supplierName
              }
            }
          },
          "cac:OrderLine": {
            "cac:LineItem": {
              "cbc:ID": "1",
              "cbc:Quantity": {
                "@unitCode": "KGM",
                "#text": formData.items[0].quantity
              },
              "cac:Item": {
                "cbc:Description": formData.items[0].description,
                "cbc:Name": formData.items[0].itemId
              }
            }
          }
        },
        "cac:Shipment": {
          "cbc:ID": "1",
          "cac:Delivery": {
            "cac:DeliveryAddress": {
              "cbc:StreetName": formData.deliveryAddress.split(",")[0] || "",
              "cbc:CityName": formData.deliveryAddress.split(",")[1] || "",
              "cac:Country": {
                "cbc:IdentificationCode": "GB"
              }
            }
          }
        }
      }

      if (!sessionId) {
        throw new Error("No session ID found. Please login again.");
      }

      const response = await fetch(
        "https://t6r6w5zni9.execute-api.us-east-1.amazonaws.com/v1/despatchAdvice",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            sessionid: sessionId,
          },
          body: JSON.stringify(requestBody)
        }
      )

      if (!response.ok) {
        throw new Error("Failed to create despatch advice")
      }

      const data = await response.json()
      console.log("Created despatch:", data)
      onSuccess()
      setActiveTab("despatch-list")
    } catch (err) {
      console.error("Error creating despatch:", err)
      setError(err instanceof Error ? err.message : "Failed to create despatch advice")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="create-despatch-form">
      <h2>Create New Despatch Advice</h2>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-group">
            <label>Order ID</label>
            <Input
              name="orderId"
              value={formData.orderId}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Issue Date</label>
            <Input
              type="date"
              name="issueDate"
              value={formData.issueDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Parties</h3>
          <div className="form-group">
            <label>Supplier Name</label>
            <Input
              name="supplierName"
              value={formData.supplierName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Customer Name</label>
            <Input
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Delivery Address</label>
            <Input
              name="deliveryAddress"
              value={formData.deliveryAddress}
              onChange={handleChange}
              placeholder="Street, City"
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Items</h3>
          {formData.items.map((item, index) => (
            <div key={index} className="item-group">
              <div className="form-row">
                <div className="form-group">
                  <label>Item ID</label>
                  <Input
                    value={item.itemId}
                    onChange={(e) => handleItemChange(index, "itemId", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <Input
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity</label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select
                    value={item.unit}
                    onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="KGM">Kilograms</option>
                    <option value="EA">Each</option>
                    <option value="LTR">Liters</option>
                  </select>
                </div>
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    className="button button-danger"
                    onClick={() => removeItem(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            className="button button-outline"
            onClick={addItem}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Item
          </button>
        </div>

        <div className="form-actions">
          <Button
            type="button"
            variant="outline"
            onClick={() => setActiveTab("despatch-list")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-black text-white hover:bg-gray-800"
          >
            {isSubmitting ? "Creating..." : "Create Despatch Advice"}
          </Button>
        </div>
      </form>
    </div>
  )
}