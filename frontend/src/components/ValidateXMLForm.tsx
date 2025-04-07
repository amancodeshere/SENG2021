import { useState } from "react"
import { Button } from "@/components/ui/button"
import "../css/ValidateXMLForm.css"

export default function ValidateXMLForm({ sessionId }) {
  const [xml, setXml] = useState("")
  const [result, setResult] = useState(null)
  const [isValidating, setIsValidating] = useState(false)

  const handleValidate = async (e) => {
    e.preventDefault()
    setIsValidating(true)
    try {
      const res = await fetch("/v1/invoice/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          sessionid,
        },
        body: JSON.stringify({ invoice: xml }),
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({
        validated: false,
        message: "Validation failed. Please try again.",
      })
    }
    setIsValidating(false)
  }

  return (
    <div className="validate-xml-form">
      <h2>Validate Invoice XML</h2>
      <form onSubmit={handleValidate}>
        <textarea
          placeholder="Paste your XML here..."
          value={xml}
          onChange={(e) => setXml(e.target.value)}
          required
        />
        <Button type="submit" disabled={isValidating} className="validate-button">
          {isValidating ? "Validating..." : "Validate"}
        </Button>
      </form>

      {result && (
        <div className={`validation-result ${result.validated ? "success" : "error"}`}>
          {result.message}
        </div>
      )}
    </div>
  )
}