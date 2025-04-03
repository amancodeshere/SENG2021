import './App.css'
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'

export default function App() {
  return (
    <main className="main-content">
      <Routes>
        <Route path="/" element={<Landing />}/>
      </Routes>
    </main>
  )
}
