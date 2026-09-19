import { acceptInvitation, deleteInvitation } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";
import { useInvitation } from "@/contexts/InvitationContext";
import { useChatRoom } from "@/contexts/ChatRoomContext";

interface Props {
  sentOrReceived: "sent" | "received";
}

const InvitationList = ({ sentOrReceived }: Props) => {
  const { sentInvitations, receivedInvitations, refresh } = useInvitation();
  const { fetchRooms } = useChatRoom();
  const invitations =
    sentOrReceived === "sent" ? sentInvitations : receivedInvitations;

  const onDeleteInvitation = async (invitationId: number) => {
    await deleteInvitation(invitationId);
    console.log("Invitation deleted");
    await refresh();
    console.log("Invitations refreshed");
    console.log({ sentInvitations, receivedInvitations });
    await fetchRooms();
  };

  const onAcceptInvitation = async (invitationId: number, roomId: number) => {
    await acceptInvitation(invitationId, roomId);
    console.log("Invitation accepted");
    await refresh();
    console.log("Invitations refreshed");
    console.log({ sentInvitations, receivedInvitations });
    await fetchRooms();
  };

  return (
    <Card className="w-full max-h-48 overflow-y-auto bg-info text-info-foreground border-none">
      <CardHeader className="mb-[-16px]">
        <CardTitle className="text-center">
          <h1 className="font-sans text-lg">
            {sentOrReceived === "sent"
              ? "Sent Invitations"
              : "Received Invitations"}
          </h1>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {sentOrReceived === "sent"
            ? invitations.map((invitation) => {
                return (
                  <li
                    key={invitation.id}
                    className="flex gap-6 items-center place-content-around"
                  >
                    <p className="text-xs opacity-70">
                      {new Date(invitation.createdAt).toLocaleString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                    <p>
                      You invited{" "}
                      <span className="font-bold">
                        {invitation.receiverUsername}
                      </span>{" "}
                      to join room{" "}
                      <span className="font-bold">
                        {invitation.roomName}
                      </span>
                    </p>
                    <Button
                      variant="ghost"
                      className="border border-destructive text-current w-42 hover:bg-destructive hover:text-white"
                      onClick={() => onDeleteInvitation(invitation.id)}
                    >
                      Withdraw
                    </Button>
                  </li>
                );
              })
            : invitations.map((invitation) => {
                return (
                  <li
                    key={invitation.id}
                    className="flex gap-6 items-center place-content-around"
                  >
                    <p className="text-xs opacity-70">
                      {new Date(invitation.createdAt).toLocaleString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                    <p>
                      <span className="font-bold">
                        {invitation.senderUsername}
                      </span>{" "}
                      invites you to join room{" "}
                      <span className="font-bold">
                        {invitation.roomName}
                      </span>
                    </p>
                    <Button
                      variant="ghost"
                      className="border border-success text-current w-32 hover:bg-success hover:text-success-foreground"
                      onClick={() =>
                        onAcceptInvitation(invitation.id, invitation.roomId)
                      }
                    >
                      Accept
                    </Button>
                    <Button
                      variant="ghost"
                      className="border border-destructive text-current w-28 hover:bg-destructive hover:text-white"
                      onClick={() => onDeleteInvitation(invitation.id)}
                    >
                      Reject
                    </Button>
                  </li>
                );
              })}
        </ul>
      </CardContent>
    </Card>
  );
};

export default InvitationList;
