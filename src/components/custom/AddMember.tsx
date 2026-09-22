import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Field } from "../ui/field";
import { Input } from "../ui/input";
import { inviteUser } from "@/services/api";
import { getErrorMessage } from "@/lib/errorMessages";
import { useState } from "react";
import { useChatRoom } from "@/contexts/ChatRoomContext";
import { CheckCircle2, UserPlus } from "lucide-react";
import { useInvitation } from "@/contexts/InvitationContext";

const AddMember = () => {
  const [email, setEmail] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  // One piece of state: null means "no error". A separate boolean would just
  // be a second copy of the same fact that could drift out of sync.
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { roomId } = useChatRoom();
  const { refresh } = useInvitation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!roomId) return;
    setError(null);
    setPending(true);
    try {
      await inviteUser(email, roomId);
      setEmail("");
      setShowSuccessMessage(true);
      void refresh();
      setTimeout(() => setShowSuccessMessage(false), 1500);
    } catch (err) {
      // The server's message, e.g. "You can't invite yourself."
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        // Don't greet the next invite with the last one's error.
        if (!open) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost">
          <UserPlus /> Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        {showSuccessMessage ? (
          <div className="flex flex-col items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-success" />
            <p className="text-success">Invitation sent successfully</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Invite another user to join the room</DialogTitle>
            </DialogHeader>
            <Field className="mt-4 mb-6" data-invalid={!!error}>
              <Label htmlFor="email-1">Enter their email:</Label>
              <Input
                id="email-1"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  // They're fixing it - stop showing the old complaint.
                  setError(null);
                }}
                aria-invalid={!!error}
                aria-describedby={error ? "invite-error" : undefined}
              />
              {error && (
                <p id="invite-error" role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </Field>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="hover:cursor-pointer">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="hover:cursor-pointer"
                disabled={pending || !email}
              >
                {pending ? "Sending..." : "Send"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddMember;
