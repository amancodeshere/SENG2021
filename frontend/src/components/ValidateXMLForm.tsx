import { useState } from "react"
import { Button } from "../components/ui/button"
import { CheckCircle, AlertTriangle } from "lucide-react"

interface ValidateXMLFormProps {
  sessionId: string
}

export default function ValidateXMLForm({ sessionId }: ValidateXMLFormProps) {
  const [xmlData, setXmlData] = useState("")
  const [loading, setLoading] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    errors?: string[]
    message?: string
  } | null>(null)

  const handleValidate = async () => {
    if (!xmlData.trim()) {
      alert("Please enter XML data to validate")
      return
    }

    setLoading(true)
    setValidationResult(null)

    try {
<<<<<<< HEAD
      const res = await fetch("/api/v1/invoice/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
=======
      const response = await fetch("/v2/invoice/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/xml",
          sessionid: sessionId,
>>>>>>> 32b862a (Frontend changes)
        },
        body: xmlData,
      })

      const data = await response.json()
      setValidationResult(data)
    } catch (error) {
      console.error("Error validating XML:", error)
      setValidationResult({
        valid: false,
        message: "An error occurred while validating. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-ocean-900 mb-2">Validate XML</h3>
        <p className="text-sm text-ocean-600 mb-4">
          Paste your XML document below to validate it against the UBL schema.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="xml-data" className="block text-sm font-medium text-ocean-700">
          XML Data
        </label>
        <textarea
          id="xml-data"
          className="w-full min-h-[300px] p-3 border border-ocean-200 rounded-md focus:border-ocean-500 focus:ring-ocean-500"
          placeholder="Paste XML here for validation"
          value={xmlData}
          onChange={(e) => setXmlData(e.target.value)}
        />
      </div>

      <Button
        className="bg-ocean-600 hover:bg-ocean-700 w-full sm:w-auto"
        disabled={loading}
        onClick={handleValidate}
      >
        {loading ? "Validating..." : "Validate XML"}
      </Button>

      {validationResult && (
        <div className={`mt-6 p-4 rounded-lg ${
          validationResult.valid 
            ? "bg-green-50 border border-green-200" 
            : "bg-red-50 border border-red-200"
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              {validationResult.valid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${
                validationResult.valid ? "text-green-800" : "text-red-800"
              }`}>
                {validationResult.valid ? "XML is valid" : "XML validation failed"}
              </h3>
              {validationResult.message && (
                <p className={`text-sm ${
                  validationResult.valid ? "text-green-700" : "text-red-700"
                }`}>
                  {validationResult.message}
                </p>
              )}
              {validationResult.errors && validationResult.errors.length > 0 && (
                <div className="mt-2">
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}