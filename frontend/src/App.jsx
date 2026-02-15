import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import JoinSession from './pages/JoinSession'
import SessionView from './pages/SessionView'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join" element={<JoinSession />} />
        <Route path="/session/:sessionId" element={<SessionView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
