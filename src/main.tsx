import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./contexts/AuthContext.tsx";
import ErrorPage from "./pages/ErrorPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import ChatsPage from "./pages/ChatsPage.tsx";
import { InvitationProvider } from "./contexts/InvitationContext.tsx";
import { TooltipProvider } from "@/components/ui/tooltip"
import { ChatRoomProvider } from "./contexts/ChatRoomContext.tsx";

/**
 * LESSON: Router Setup with Auth
 *
 * - Public routes: /, /login, /register (anyone can access)
 * - Protected routes: /chats/:id (must be logged in)
 *
 * The ProtectedRoute component checks authentication
 * and redirects to /login if not authenticated.
 */
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <ErrorPage />,
  },
  {
    // Protected route - requires authentication
    path: "/chats/:id",
    element: (
      <ProtectedRoute>
        <ChatsPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
]);

/**
 * LESSON: App Structure
 *
 * AuthProvider wraps everything, so any component can use useAuth()
 *
 * <AuthProvider>          ← Provides auth state to entire app
 *   <RouterProvider>      ← Handles routing
 *     <YourPages />       ← Can all use useAuth()
 *   </RouterProvider>
 * </AuthProvider>
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
    <ChatRoomProvider>
        <InvitationProvider>
          <TooltipProvider>
            <RouterProvider router={router} />
          </TooltipProvider>
        </InvitationProvider>
      </ChatRoomProvider>
    </AuthProvider>
  </StrictMode>,
);
