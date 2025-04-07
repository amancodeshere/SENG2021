import { useEffect, useState } from "react"

export default function DespatchList() {
  const [despatches, setDespatches] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("https://t6r6w5zni9.execute-api.us-east-1.amazonaws.com/v1/despatchAdvice")
      .then((res) => res.json())
      .then((data) => {
        setDespatches(data.despatchAdvices?.despatchAdvicesIDs || [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h2>Despatch List</h2>
      {loading ? (
        <p>Loading...</p>
      ) : despatches.length > 0 ? (
        <ul>
          {despatches.map((id, i) => (
            <li key={i}>{id}</li>
          ))}
        </ul>
      ) : (
        <p>No despatches found.</p>
      )}
    </div>
  )
}