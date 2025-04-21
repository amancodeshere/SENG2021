import './App.css'
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Orders from "./pages/Orders";
import Despatches from "./pages/Despatches";
import Invoices from "./pages/Invoices";

export default function App() {
  return (
    <main className="main-content">
      <Routes>
        <Route path="/" element={<Landing />}/>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/despatches" element={<Despatches />} />
      </Routes>
    </main>
  )
}
