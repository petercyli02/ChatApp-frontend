import { createRoom, leaveRoom } from "@/services/api";
import { useEffect } from "react";
import RoomListItem from "./RoomListItem";
import { cn } from "@/lib/utils";
import RoomCreationDialog from "./RoomCreationDialog";
import { useChatRoom } from "@/contexts/ChatRoomContext";

interface Props {
  className?: string;
}

const ChatsList = ({ className }: Props) => {
  const { selectRoom } = useChatRoom();
  const { rooms, fetchRooms } = useChatRoom();

  useEffect(() => {
    fetchRooms();
  }, []);

  const onRoomCreate = async (name: string, description: string) => {
    await createRoom(name, description);
    await fetchRooms();
  };

  const onLeaveRoom = async (roomId: number) => {
    selectRoom(null, null, []);
    await leaveRoom(roomId);
    await fetchRooms();
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-6">
        <h1 className="text-center text-2xl font-bold">Chats</h1>
        <RoomCreationDialog onRoomCreate={onRoomCreate} />
      </div>
      {rooms.length > 0 ? (
        rooms.map((room) => (
          <RoomListItem
            key={room.id}
            room={room}
            onLeaveRoom={onLeaveRoom}
          />
        ))
      ) : (
        <div className="flex justify-center items-center h-full text-center text-muted-foreground">
          <p>No chats found</p>
        </div>
      )}
    </div>
  );
};

export default ChatsList;
