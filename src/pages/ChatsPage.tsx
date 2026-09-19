import { useAuth } from "@/contexts/AuthContext";
import { ChatRoomProvider } from "@/contexts/ChatRoomContext";
import { Button } from "@/components/ui/button";
import ChatArea from "@/components/custom/ChatArea";
import { Pencil, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { updateUser } from "@/services/api";
import InvitationList from "@/components/custom/InvitationList";
import { useInvitation } from "@/contexts/InvitationContext";
import { useRealtime } from "@/hooks/useWebSocket";
import ThemeToggle from "@/components/custom/ThemeToggle";

/**
 * LESSON: Using Auth Context in a Protected Page
 *
 * This page is wrapped with <ProtectedRoute> in main.tsx,
 * so we're guaranteed to have a user when this renders.
 *
 * We can access user info and logout function from useAuth().
 */
const ChatsPage = () => {
  const { user, logout, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || "");

  const { refresh } = useInvitation();
  useRealtime();

  useEffect(() => {
    if (user?.id) {
      refresh();
    }
  }, [user?.id]);

  const saveEdit = async () => {
    await updateUser(newUsername);
    setIsEditing(false);
    await refreshUser();
  };

  console.log({ user });

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 shrink-0">
        <Button
          onClick={logout}
          variant="secondary"
          size="lg"
          className="cursor-pointer"
        >
          Logout
        </Button>
        <ThemeToggle />
      </header>
      <main className="px-6 pb-4 grow min-h-0">
        <ChatArea />
      </main>

      {/* User info card */}
      <aside className="px-6 pb-6 shrink-0">
        <div className="bg-surface text-surface-foreground rounded-lg p-4 flex gap-8">
          <ul className="text-sm text-muted-foreground space-y-2 min-w-72">
            <li className="flex justify-between">
              <h2 className="font-semibold text-foreground align-middle mt-2">
                Your Profile
              </h2>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    size="icon-lg"
                    variant="ghost"
                    className="hover:bg-accent hover:text-accent-foreground cursor-pointer items-center"
                    onClick={() => setIsEditing(false)}
                  >
                    <X />
                  </Button>
                  <Button
                    size="icon-lg"
                    variant="ghost"
                    className="hover:bg-accent hover:text-accent-foreground cursor-pointer items-center"
                    onClick={saveEdit}
                  >
                    <Save />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="ghost"
                  size="icon-lg"
                  className="hover:bg-accent hover:text-accent-foreground cursor-pointer items-center"
                >
                  <Pencil />
                </Button>
              )}
            </li>
            <li className="flex justify-between">
              Username:{" "}
              {isEditing ? (
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="bg-background text-foreground border border-input rounded-md p-2"
                />
              ) : (
                <span className="font-semibold text-foreground">
                  {user?.username}
                </span>
              )}
            </li>
            <li className="flex justify-between">
              Email:{" "}
              <span className="font-semibold text-foreground">{user?.email}</span>
            </li>
            <li className="flex justify-between">
              Member since:{" "}
              <span className="font-semibold text-foreground">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "N/A"}
              </span>
            </li>
          </ul>
          <InvitationList sentOrReceived="sent" />
          <InvitationList sentOrReceived="received" />
        </div>
      </aside>
    </div>
  );
};

export default ChatsPage;
