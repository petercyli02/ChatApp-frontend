import './App.css'
import { Button } from '@/components/ui/button'
import { BotMessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'

function App() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <BotMessageSquare size={256} className="mb-8" />
      <h1 className="text-4xl font-bold mb-4">
        Chat Application
      </h1>
      <p className="text-gray-400 mb-8">
        Real-time chat with FastAPI + WebSockets
      </p>
      <div className="flex gap-8">
        <Button asChild size="lg" variant="default">
          <Link to="/login">Login</Link>
        </Button>
        <Button asChild size="lg" variant="default">
          <Link to="/register">Register</Link>
        </Button>
      </div>
    </div>
  )
}

export default App
