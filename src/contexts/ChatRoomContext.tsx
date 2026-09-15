import { getRoomAdmins, getRooms, type Room } from "@/services/api";
import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

interface ChatRoomContextType {
  roomId: number | null;
  roomName: string | null;
  roomAdminIds: number[];
  selectRoom: (
    id: number | null,
    name: string | null,
    roomAdminIds: number[],
  ) => void;
  refetchAdminIds: () => void;
  rooms: Room[];
  fetchRooms: () => void;
}

const ChatRoomContext = createContext<ChatRoomContextType | undefined>(
  undefined,
);

interface ChatRoomProviderProps {
  children: ReactNode;
}

export function ChatRoomProvider({ children }: ChatRoomProviderProps) {
  const [roomId, setRoomId] = useState<number | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [roomAdminIds, setRoomAdminIds] = useState<number[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const selectRoom = useCallback(
    (id: number | null, name: string | null, roomAdminIds: number[]) => {
      setRoomId(id);
      setRoomName(name);
      setRoomAdminIds(roomAdminIds);
    },
    [],
  );

  const refetchAdminIds = useCallback(async () => {
    if (!roomId) return;
    const adminIds = await getRoomAdmins(roomId);
    setRoomAdminIds(adminIds);
  }, [roomId]);

  const fetchRooms = useCallback(async () => {
    const rooms = await getRooms();
    setRooms(rooms);
  }, []);

  const value: ChatRoomContextType = {
    roomId,
    roomName,
    roomAdminIds,
    selectRoom,
    refetchAdminIds,
    rooms,
    fetchRooms,
  };

  return (
    <ChatRoomContext.Provider value={value}>
      {children}
    </ChatRoomContext.Provider>
  );
}

export function useChatRoom(): ChatRoomContextType {
  const context = useContext(ChatRoomContext);

  if (context === undefined) {
    throw new Error("useChatRoom must be used within a ChatRoomProvider");
  }

  return context;
}
