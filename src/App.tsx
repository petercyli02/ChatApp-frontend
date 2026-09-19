import './App.css'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/custom/ThemeToggle'
import { BotMessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'

function App() {
  return (
    <div className="relative flex flex-col items-center justify-center h-screen">
      <ThemeToggle className="absolute top-6 right-6" />
      <BotMessageSquare size={256} className="mb-8 text-primary" />
      <h1 className="text-4xl font-bold mb-4">
        Chat Application
      </h1>
      <p className="text-muted-foreground mb-8">
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
