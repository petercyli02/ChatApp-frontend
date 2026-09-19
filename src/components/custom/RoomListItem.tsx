import { Card, CardContent } from "@/components/ui/card";
import { type Room } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Archive, DoorOpen, EllipsisVertical, VolumeOff } from "lucide-react";
import { useChatRoom } from "@/contexts/ChatRoomContext";

interface Props {
  room: Room;
  onLeaveRoom: (roomId: number) => Promise<void>;
}

const RoomListItem = ({ room, onLeaveRoom }: Props) => {
  const { selectRoom } = useChatRoom();
  const { name, description, createdAt, memberCount } = room;
  
  return (
    <Card className="hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer py-1 relative min-w-0 overflow-hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 hover:cursor-pointer"
          >
            <EllipsisVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <VolumeOff /> Mute
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Archive /> Archive
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onLeaveRoom(room.id)}
            className="hover:cursor-pointer"
          >
            <DoorOpen /> Leave Room
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CardContent
        className="p-4 pr-12"
        onClick={() => selectRoom(room.id, room.name, room.adminIds)}
      >
        <h3 className="font-semibold truncate">{name}</h3>
        {description && (
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
          <span>{memberCount} members</span>
          <span>Created {new Date(createdAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomListItem;
