import "./App.css";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/custom/ThemeToggle";
import { BotMessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { Spinner } from "./components/ui/spinner";

function App() {
  const { user, loading, logout } = useAuth();
  return (
    <div className="relative flex flex-col items-center justify-center h-screen">
      <ThemeToggle className="absolute top-6 right-6" />
      <BotMessageSquare size={256} className="mb-8 text-primary" />
      <h1 className="text-4xl font-bold mb-4">ChatApp</h1>
      <p className="text-muted-foreground mb-8">
        Real-time chat with FastAPI + WebSockets
      </p>
      {loading ? (
        <Spinner />
      ) : user ? (
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="font-sans text-xl">Welcome {user.username} ! </h1>
          <div className="flex gap-6">
            <Button asChild size="lg" variant="secondary">
              <Link to="/" onClick={logout}>
                Logout
              </Link>
            </Button>
            <Button asChild size="lg" variant="default">
              <Link to={`/chats/${user.id}`}>Go to chats</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-8">
          <Button asChild size="lg" variant="default">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild size="lg" variant="default">
            <Link to="/register">Register</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default App;
