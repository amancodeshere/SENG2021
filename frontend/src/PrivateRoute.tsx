import { Navigate } from "react-router-dom"
import { ReactNode } from "react"

export default function PrivateRoute({ children }: { children: ReactNode }) {
  return localStorage.getItem("token") ? children : <Navigate to="/" />
}
