import {
  acceptInvitation,
  deleteInvitation,
  getReceivedInvitations,
  getSentInvitations,
  type Invitation,
} from "@/services/api";
import { useEffect, useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    await refresh();
    await fetchRooms();
  }
  
  const onAcceptInvitation = async (invitationId: number, roomId: number) => {
    await acceptInvitation(invitationId, roomId);
    await refresh();
    await fetchRooms();
  }

  return (
    <Card className="w-full max-h-48 overflow-y-auto bg-cyan-800 border-none">
      <CardHeader className="mb-[-16px]">
        <CardTitle className="text-center">
          <h1 className="font-sans text-lg text-cyan-100">
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
                    <p className="text-xs text-zinc-900">
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
                      <span className="font-bold text-zinc-800">
                        {invitation.receiverUsername}
                      </span>{" "}
                      to join room{" "}
                      <span className="font-bold text-zinc-200">
                        {invitation.roomName}
                      </span>
                    </p>
                    <Button
                      variant="ghost"
                      className="border-1 border-red-300 text-zinc-200 w-42 hover:bg-red-300"
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
                    <p className="text-xs text-zinc-900">
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
                      <span className="font-bold text-zinc-800">
                        {invitation.senderUsername}
                      </span>{" "}
                      invites you to join room{" "}
                      <span className="font-bold text-zinc-200">
                        {invitation.roomName}
                      </span>
                    </p>
                    <Button
                      variant="ghost"
                      className="border-1 border-green-300 text-zinc-200 w-32 hover:bg-green-300"
                      onClick={() => onAcceptInvitation(invitation.id, invitation.roomId)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="ghost"
                      className="border-1 border-red-300 text-zinc-200 w-28 hover:bg-red-300"
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
