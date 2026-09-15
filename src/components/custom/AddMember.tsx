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
import { useState } from "react";
import { useChatRoom } from "@/contexts/ChatRoomContext";
import { CheckCircle2, UserPlus } from "lucide-react";
import { useInvitation } from "@/contexts/InvitationContext";

const AddMember = () => {
  const [email, setEmail] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { roomId } = useChatRoom();
  const { refresh } = useInvitation();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!roomId) return;
    console.log("inviting user:", email, "to room:", roomId);
    await inviteUser(email, roomId);
    setEmail("");
    setShowSuccessMessage(true);
    await refresh();
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 1500);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <UserPlus /> Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        {showSuccessMessage ? (
          <div className="flex flex-col items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <p className="text-emerald-400">Invitation sent successfully</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite another user to join the room</DialogTitle>
          </DialogHeader>
          <Field className="mt-4 mb-6">
            <Label htmlFor="email-1">Enter their email:</Label>
            <Input
              id="email-1"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="hover:cursor-pointer">Cancel</Button>
            </DialogClose>
            <Button type="submit" className="hover:cursor-pointer">Send</Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddMember;
