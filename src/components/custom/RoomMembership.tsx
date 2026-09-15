import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSubTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChatRoom } from "@/contexts/ChatRoomContext";
import { EllipsisVertical, Users, UserStar } from "lucide-react";
import { useState } from "react";
import {
  addAdminToRoom,
  getRoomMembers,
  removeAdminFromRoom,
  removeMemberFromRoom,
} from "@/services/api";
import type { User } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const RoomMembership = () => {
  const { roomId, roomAdminIds, refetchAdminIds, fetchRooms } = useChatRoom();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();

  const handleOpenChange = (open: boolean) => {
    if (open && roomId) {
      setLoading(true);
      getRoomMembers(roomId)
        .then(setMembers)
        .finally(() => setLoading(false));
    }
  };

  const onMakeAdmin = (memberId: number) => {
    if (!roomId) return;
    addAdminToRoom(roomId, memberId)
      .then(() => {
        refetchAdminIds();
        getRoomMembers(roomId)
          .then(setMembers)
          .finally(() => setLoading(false));
      })
      .catch((error) => {
        console.error(error.message);
      });
  };

  const onRemoveAdmin = (memberId: number) => {
    if (!roomId) return;
    removeAdminFromRoom(roomId, memberId)
      .then(() => {
        refetchAdminIds();
        getRoomMembers(roomId)
          .then(setMembers)
          .finally(() => setLoading(false));
      })
      .catch((error) => {
        console.error(error.message);
      });
  };

  const onRemoveMember = (memberId: number) => {
    if (!roomId) return;
    removeMemberFromRoom(roomId, memberId)
      .then(() => {
        getRoomMembers(roomId)
          .then(setMembers)
          .finally(() => setLoading(false));
        fetchRooms();
      })
      .catch((error) => {
        console.error(error.message);
      });
  };

  const rowClass =
    "relative flex min-w-48 cursor-default items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground";

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <Users /> View Members
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {loading ? (
          <DropdownMenuItem>Loading...</DropdownMenuItem>
        ) : (
          members.map((member) => {
            console.log({ roomAdminIds });
            const isAdmin = roomAdminIds.includes(member.id);
            if (user?.id !== member.id) {
              return (
                <div key={member.id} className={rowClass}>
                  <div className="flex items-center place-content-between">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger chevron={false}>
                        <EllipsisVertical className="mr-3" />
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent collisionPadding={{ right: 1e6 }}>
                        {isAdmin ? (
                          <DropdownMenuItem
                            onClick={() => onRemoveAdmin(member.id)}
                          >
                            Remove admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => onMakeAdmin(member.id)}
                          >
                            Make admin
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onRemoveMember(member.id)}
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <p>{member.username}</p>
                  </div>
                  {isAdmin && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <UserStar />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="z-50">
                        <p>Admin</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              );
            }
            return (
              <DropdownMenuItem
                key={member.id}
                className="min-w-48 flex place-content-between"
              >
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground w-9 text-center">You</p>
                  <p>{member.username}</p>
                </div>
                {isAdmin && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <UserStar />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="z-50">
                      <p>Admin</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RoomMembership;
