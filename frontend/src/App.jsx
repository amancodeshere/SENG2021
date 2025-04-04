import './App.css'
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'

export default function App() {
  return (
    <main className="main-content">
      <Routes>
        <Route path="/" element={<Landing />}/>
        <Route path="/login" element={<Login />} />
      </Routes>
    </main>
  )
}
