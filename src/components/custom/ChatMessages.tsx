import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import type { Message } from "@/hooks/useWebSocket";
import { useAuth } from "@/contexts/AuthContext";
import { MessagePopover } from "./MessagePopover";
import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { EyeOff } from "lucide-react";

interface Props {
  className?: string;
  messages: Message[];
  onEditMessage: (messageId: number, content: string) => Promise<void>;
  onDeleteMessage: (messageId: number) => Promise<void>;
  onHideMessage: (messageId: number) => Promise<void>;
  onUnhideMessage: (messageId: number) => Promise<void>;
}

const ChatMessages = ({
  className,
  messages,
  onEditMessage,
  onDeleteMessage,
  onHideMessage,
  onUnhideMessage,
}: Props) => {
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const startEdit = (message: Message) => {
    if (message.id == null) return;
    setEditingId(message.id);
    setEditedContent(message.content ?? "");
  };

  const saveEdit = async () => {
    if (editingId == null) return;
    const content = editedContent.trim();
    if (!content) return;
    setSaving(true);
    setActionError(null);
    try {
      await onEditMessage(editingId, content);
      setEditingId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to edit message");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (messageId: number) => {
    setActionError(null);
    try {
      await onDeleteMessage(messageId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete message");
      throw err;
    }
  };

  const handleHide = async (messageId: number) => {
    setActionError(null);
    try {
      await onHideMessage(messageId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to hide message");
      throw err;
    }
  };

  const handleUnhide = async (messageId: number) => {
    setActionError(null);
    try {
      await onUnhideMessage(messageId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to unhide message");
      throw err;
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 overflow-y-auto min-h-0 flex-1 p-6",
        className,
      )}
    >
      {actionError && (
        <p className="text-sm text-destructive">{actionError}</p>
      )}
      {messages.map((message) => {
        const fromSelf = message.senderId === user?.id;
        const isEditing = editingId === message.id;
        const isHidden = Boolean(message.hidden);

        if (isHidden) {
          return (
            <Card
              key={message.id ?? message.createdAt}
              className={cn(
                "gap-2 py-2 w-fit max-w-[75%] border-none bg-muted/70 shadow-none",
                fromSelf && "ml-auto",
              )}
            >
              <CardContent className="text-sm text-muted-foreground flex items-center gap-2 py-1">
                <EyeOff className="h-4 w-4 shrink-0" />
                <span className="italic">You hid this message</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => void handleUnhide(message.id!).catch(() => undefined)}
                >
                  Unhide
                </Button>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground self-end py-0">
                {new Date(message.createdAt ?? "").toLocaleString()}
                <MessagePopover
                  fromSelf={fromSelf}
                  hidden
                  onEdit={() => startEdit(message)}
                  onDelete={() => handleDelete(message.id!)}
                  onHide={() => handleHide(message.id!)}
                  onUnhide={() => handleUnhide(message.id!)}
                />
              </CardFooter>
            </Card>
          );
        }

        return (
          <Card
            key={message.id ?? message.createdAt}
            className={cn(
              "bg-bubble text-bubble-foreground gap-2 py-3 w-3/4 border-none",
              fromSelf && "ml-auto bg-bubble-self text-bubble-self-foreground",
            )}
          >
            <CardHeader className="text-sm font-semibold flex space-between">
              {!fromSelf && <p>{message.senderUsername}</p>}
            </CardHeader>
            <CardContent className="text-md">
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <Input
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="bg-background text-foreground"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void saveEdit();
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={saving}
                      onClick={() => void saveEdit()}
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p>{message.content}</p>
              )}
            </CardContent>
            <CardFooter className="text-xs opacity-70 self-end">
              {new Date(message.createdAt ?? "").toLocaleString()}
              {message.lastEdited && (
                <span className="ml-2 italic">(edited)</span>
              )}
              <MessagePopover
                fromSelf={fromSelf}
                onEdit={() => startEdit(message)}
                onDelete={() => handleDelete(message.id!)}
                onHide={() => handleHide(message.id!)}
                onUnhide={() => handleUnhide(message.id!)}
              />
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default ChatMessages;
