import { useAuth } from "@/contexts/AuthContext";
import { useChatRoom } from "@/contexts/ChatRoomContext";
import { useInvitation } from "@/contexts/InvitationContext";
import { auth } from "@/firebase";
import { useState, useEffect, useCallback, useRef } from "react";
/**
 * WebSocket message types matching the backend schema
 * Note: WebSocket messages come directly from the server, so we keep snake_case
 * for the raw message and transform when needed
 */
export interface Message {
  id?: number;
  type: "message" | "typing" | "join" | "leave" | "error" | "userList";
  roomId?: number;
  content?: string;
  senderId?: number;
  senderUsername?: string;
  users?: string[];
  createdAt?: string;
  lastEdited?: string | null;
  hidden?: boolean;
}

export interface WebSocketMessage {
  type: "message" | "typing" | "join" | "leave" | "error" | "userList";
  roomId?: number;
  content?: string;
  senderId?: number;
  senderUsername?: string;
  users?: string[];
  createdAt?: string;
}

// Raw message from WebSocket (snake_case from Python backend)
interface RawWebSocketMessage {
  id?: number;
  type: "message" | "typing" | "join" | "leave" | "error" | "user_list";
  room_id?: number;
  content?: string;
  sender_id?: number;
  sender_username?: string;
  users?: string[];
  created_at?: string;
  last_edited?: string | null;
  last_edited_at?: string | null;
}

/**
 * Transform raw WebSocket message to camelCase
 */
function transformMessage(raw: RawWebSocketMessage): Message {
  return {
    id: raw.id,
    type: raw.type === "user_list" ? "userList" : raw.type,
    roomId: raw.room_id,
    content: raw.content,
    senderId: raw.sender_id,
    senderUsername: raw.sender_username,
    users: raw.users,
    createdAt: raw.created_at,
    lastEdited: raw.last_edited_at ?? raw.last_edited ?? null,
  };
}

export interface UseWebSocketOptions {
  roomId: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (content: string) => void;
  sendTyping: () => void;
  messages: Message[];
  users: string[];
  connect: () => void;
  disconnect: () => void;
}

/**
 * React hook for WebSocket chat connection.
 *
 * This hook manages the WebSocket lifecycle and provides a clean interface
 * for sending/receiving real-time chat messages.
 *
 * Usage:
 * ```tsx
 * const { isConnected, sendMessage, messages, users } = useWebSocket({
 *   roomId: 1,
 *   token: 'jwt-token-here',
 * });
 * ```
 */
export function useWebSocket({
  roomId,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const shouldReconnectRef = useRef(true);
  const generationRef = useRef(0);

  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);
  onMessageRef.current = onMessage;
  onConnectRef.current = onConnect;
  onDisconnectRef.current = onDisconnect;
  onErrorRef.current = onError;

  const { user } = useAuth();

  const closeDeliberately = useCallback(() => {
    shouldReconnectRef.current = false;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    const generation = ++generationRef.current;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    closeDeliberately();

    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      console.error("No token found");
      return;
    }
    if (generation !== generationRef.current) return;

    shouldReconnectRef.current = true;

    // Build WebSocket URL
    const wsUrl = `ws://localhost:8000/ws/${roomId}?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      onConnectRef.current?.();
    };

    ws.onmessage = (event) => {
      const rawMessage: RawWebSocketMessage = JSON.parse(event.data);
      const message = transformMessage(rawMessage);

      // Handle user list updates
      if (message.type === "userList" && message.users) {
        setUsers(message.users);
      }

      // Store all messages except typing indicators
      if (message.type !== "typing") {
        setMessages((prev) => [...prev, message]);
      }

      onMessageRef.current?.(message);
    };

    ws.onclose = (event) => {
      if (wsRef.current !== ws) return;
      if (generation !== generationRef.current) return;

      setIsConnected(false);
      onDisconnectRef.current?.();

      if (!shouldReconnectRef.current) {
        return;
      }

      // 4000-4999 are ours and mean "don't bother retrying".
      if (event.code >= 4000) {
        console.error(`WebSocket rejected: ${event.code} ${event.reason}`);
        return;
      }

      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("Attempting to reconnect...");
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      onErrorRef.current?.(error);
    };
  }, [roomId]);

  const disconnect = useCallback(() => {
    generationRef.current += 1;

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    closeDeliberately();
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          createdAt: new Date().toISOString(),
          content,
        }),
      );
    }
  }, []);

  const sendTyping = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "typing",
        }),
      );
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    setMessages([]);
    if (roomId && user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [roomId, user?.id, connect, disconnect]);

  return {
    isConnected,
    sendMessage,
    sendTyping,
    messages,
    users,
    connect,
    disconnect,
  };
}

export function useRealtime() {
  const { refresh } = useInvitation();
  const { roomId, fetchRooms, selectRoom, refetchAdminIds } = useChatRoom();
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);

  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  const refetchAdminIdsRef = useRef(refetchAdminIds);
  refetchAdminIdsRef.current = refetchAdminIds;

  const connect = useCallback(async () => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      console.error("No token found");
      return;
    }
    const wsUrl = `ws://localhost:8000/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const event = JSON.parse(e.data);
      switch (event.type) {
        case "invite.created":
        case "invite.deleted":
        case "invite.accepted":
          refresh(); // InvitationContext
          if (event.type === "invite.accepted") fetchRooms();
          break;
        case "room.member_added":
        case "room.member_removed":
          fetchRooms();
          if (event.payload?.user_id === user?.id) {
            selectRoom(null, null, []);
          }
          break;
        case "room.admin_added":
        case "room.admin_removed":
          if (event.payload?.room_id === roomIdRef.current)
            refetchAdminIdsRef.current?.();
          break;
      }
    };
    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    return () => {
      ws.close();
    };
  }, []);

  const disconnect = useCallback(async () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [connect, disconnect, user?.id]);
}
