import { useState } from "react"
import { Search } from "lucide-react"

export default function LookupDespatch() {
  const [despatchId, setDespatchId] = useState("")
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLookup = async () => {
    if (!despatchId.trim()) {
      setError("Enter a valid ID")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const endpoints = [
        `/v1/despatchAdvice/${despatchId}/orderReference`,
        `/v1/despatchAdvice/${despatchId}/shipment`,
        `/v1/despatchAdvice/${despatchId}/shipment-arrival`,
      ]
      const [ref, ship, arrive] = await Promise.all(
        endpoints.map((e) =>
          fetch(`https://t6r6w5zni9.execute-api.us-east-1.amazonaws.com${e}`).then((r) => r.json())
        )
      )

      setResult({
        orderReference: JSON.stringify(ref.Items, null, 2),
        shipment: JSON.stringify(ship.Items, null, 2),
        arrival: JSON.stringify(arrive.requestedDelivery, null, 2),
      })
    } catch {
      setError("Error fetching despatch details")
    }

    setLoading(false)
  }

  return (
    <div>
      <h2>Lookup Despatch</h2>
      <input
        className="input"
        value={despatchId}
        onChange={(e) => setDespatchId(e.target.value)}
        placeholder="Enter Despatch ID"
      />
      <button className="button button-primary" onClick={handleLookup} disabled={loading}>
        {loading ? "Loading..." : (<><Search className="h-4 w-4 mr-1" />Lookup</>)}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {result && (
        <div className="mt-4 space-y-4">
          <div><h3>Order Reference</h3><pre>{result.orderReference}</pre></div>
          <div><h3>Shipment</h3><pre>{result.shipment}</pre></div>
          <div><h3>Arrival Period</h3><pre>{result.arrival}</pre></div>
        </div>
      )}
    </div>
  )
}
