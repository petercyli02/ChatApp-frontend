/**
 * API service for communicating with the FastAPI backend.
 */

import { auth } from "@/firebase";
import type { Message } from "@/hooks/useWebSocket";

const API_BASE = import.meta.env.VITE_API_URL + "/api";

/**
 * Convert snake_case keys to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Transform object keys from snake_case to camelCase
 */
function transformKeys<T>(obj: unknown): T {
  if (obj === null || obj === undefined) {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeys(item)) as T;
  }

  if (typeof obj === "object") {
    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      transformed[snakeToCamel(key)] = transformKeys(value);
    }
    return transformed as T;
  }

  return obj as T;
}

/**
 * Make an authenticated API request
 */
async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await auth.currentUser?.getIdToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 - token expired
  if (response.status === 401) {
    console.log("EXPRED");
  }

  return response;
}

// ==================== Auth API ====================

export interface User {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
  isOnline: boolean;
  createdAt: string;
  lastSeen: string;
}

export async function getCurrentUser(): Promise<User> {
  const response = await fetchWithAuth("/auth/me");

  if (!response.ok) {
    throw new Error("Failed to get user");
  }

  const data = await response.json();
  return transformKeys<User>(data);
}

export async function logout(): Promise<void> {
  await fetchWithAuth("/auth/logout", { method: "POST" });
}

// ==================== User API ====================

export interface Invitation {
  id: number;
  senderId: number;
  senderUsername: string;
  receiverId: number;
  receiverUsername: string;
  roomId: number;
  roomName: string;
  createdAt: string;
}

export interface InvitationAnswerResponse {
  message: string;
}

export async function updateUser(username: string): Promise<void> {
  const response = await fetchWithAuth("/users/update", {
    method: "POST",
    body: JSON.stringify({ username }),
  });

  if (!response.ok) {
    throw new Error("Failed to update user.");
  }

  const data = await response.json();
  console.log({ response: data });
  return transformKeys<void>(data);
}

export async function inviteUser(
  email: string,
  room_id: number,
): Promise<void> {
  const response = await fetchWithAuth("/users/invite", {
    method: "POST",
    body: JSON.stringify({ email, room_id }),
  });

  if (!response.ok) {
    throw new Error("Failed to invite user");
  }

  const data = await response.json();
  return transformKeys<void>(data);
}

export async function getReceivedInvitations(): Promise<Invitation[]> {
  const response = await fetchWithAuth("/users/invitations/received", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to get received invitations");
  }

  const data = await response.json();
  return transformKeys<Invitation[]>(data);
}

export async function getSentInvitations(): Promise<Invitation[]> {
  const response = await fetchWithAuth("/users/invitations/sent", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to get sent invitations");
  }

  const data = await response.json();
  return transformKeys<Invitation[]>(data);
}

export async function deleteInvitation(
  invitationId: number,
): Promise<InvitationAnswerResponse> {
  const response = await fetchWithAuth(
    `/users/invitations/delete/${invitationId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to delete invitation");
  }

  const data = await response.json();
  return transformKeys<InvitationAnswerResponse>(data);
}

export async function acceptInvitation(
  invitationId: number,
  roomId: number,
): Promise<InvitationAnswerResponse> {
  const response = await fetchWithAuth("/users/invitations/accept", {
    method: "POST",
    body: JSON.stringify({ invitation_id: invitationId, room_id: roomId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to accept invitation");
  }

  const data = await response.json();
  return transformKeys<InvitationAnswerResponse>(data);
}

// ==================== Rooms API ====================

export interface Room {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  createdById: number;
  memberCount: number;
  adminIds: number[];
}

export async function getRooms(): Promise<Room[]> {
  const response = await fetchWithAuth(`/rooms`);

  if (!response.ok) {
    throw new Error("Failed to get rooms");
  }

  const data = await response.json();
  console.log({ getRoomsData: data });
  return transformKeys<Room[]>(data);
}

export async function createRoom(
  name: string,
  description?: string,
): Promise<Room> {
  const response = await fetchWithAuth("/rooms", {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create room");
  }

  const data = await response.json();
  return transformKeys<Room>(data);
}

export async function getRoomMembers(roomId: number): Promise<User[]> {
  const response = await fetchWithAuth(`/rooms/${roomId}/members`);
  if (!response.ok) {
    throw new Error("Failed to get room members");
  }

  const data = await response.json();
  console.log({ data });
  return transformKeys<User[]>(data);
}

export async function addMemberToRoom(
  roomId: number,
  email: string,
): Promise<void> {
  console.log("#3");
  const response = await fetchWithAuth(
    `/rooms/${roomId}/add?email=${encodeURIComponent(email)}`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to add member to room");
  }
}

export async function joinRoom(roomId: number): Promise<void> {
  const response = await fetchWithAuth(`/rooms/${roomId}/join`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to join room");
  }
}

export async function leaveRoom(roomId: number): Promise<void> {
  const response = await fetchWithAuth(`/rooms/${roomId}/leave`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to leave room");
  }

  const data = await response.json();
  return transformKeys<void>(data);
}

export async function removeMemberFromRoom(
  roomId: number,
  userId: number,
): Promise<void> {
  const response = await fetchWithAuth(`/rooms/${roomId}/remove/${userId}`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to remove member from room");
  }
  const data = await response.json();
  return transformKeys<void>(data);
}

export async function getRoomAdmins(roomId: number): Promise<number[]> {
  const response = await fetchWithAuth(`/rooms/${roomId}/admins`);
  if (!response.ok) {
    throw new Error("Failed to get room admins");
  }
  const data = await response.json();
  return transformKeys<number[]>(data);
}

export async function addAdminToRoom(
  roomId: number,
  userId: number,
): Promise<void> {
  const response = await fetchWithAuth(`/rooms/${roomId}/add_admin/${userId}`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to add admin to room");
  }
  const data = await response.json();
  console.log({ addAdminToRoomData: data });
  return transformKeys<void>(data);
}

export async function removeAdminFromRoom(
  roomId: number,
  userId: number,
): Promise<void> {
  const response = await fetchWithAuth(`/rooms/${roomId}/remove_admin/${userId}`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to remove admin from room");
  }
  const data = await response.json();
  return transformKeys<void>(data);
}

// ==================== Messages API ====================

export async function getRoomMessages(
  roomId: number,
  limit = 50,
  offset = 0,
): Promise<Message[]> {
  const response = await fetchWithAuth(
    `/messages/room/${roomId}?limit=${limit}&offset=${offset}`,
  );

  if (!response.ok) {
    throw new Error("Failed to get messages");
  }

  const data = await response.json();
  return transformKeys<Message[]>(data).map((message) => ({
    ...message,
    type: message.type ?? "message",
  }));
}

async function throwIfNotOk(
  response: Response,
  fallback: string,
): Promise<void> {
  if (response.ok) return;
  let message = fallback;
  try {
    const error = await response.json();
    if (typeof error?.detail === "string") {
      message = error.detail;
    }
  } catch {
    // Keep the fallback if the body is not JSON.
  }
  throw new Error(message);
}

export async function editMessage(
  messageId: number,
  content: string,
): Promise<void> {
  const response = await fetchWithAuth(`/messages/edit`, {
    method: "POST",
    body: JSON.stringify({ messageId, content }),
  });
  await throwIfNotOk(response, "Failed to edit message");
}

export async function deleteMessage(messageId: number): Promise<void> {
  const response = await fetchWithAuth(`/messages/delete`, {
    method: "POST",
    body: JSON.stringify({ messageId }),
  });
  await throwIfNotOk(response, "Failed to delete message");
}

export async function hideMessage(messageId: number): Promise<void> {
  const response = await fetchWithAuth(`/messages/hide`, {
    method: "POST",
    body: JSON.stringify({ messageId }),
  });
  await throwIfNotOk(response, "Failed to hide message");
}

export async function unhideMessage(messageId: number): Promise<void> {
  const response = await fetchWithAuth(`/messages/unhide`, {
    method: "POST",
    body: JSON.stringify({ messageId }),
  });
  await throwIfNotOk(response, "Failed to unhide message");
}
