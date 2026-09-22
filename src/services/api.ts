/**
 * API service for communicating with the FastAPI backend.
 */

import { auth } from "@/firebase";
import type { Message } from "@/hooks/useWebSocket";
import { ApiError } from "@/lib/apiError";

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

/**
 * LESSON: One function owns every request's error handling.
 *
 * Every endpoint below goes through here, so errors are handled identically
 * everywhere:
 *   - network failure (offline, server down) -> ApiError, code "network_error"
 *   - non-2xx response                       -> ApiError with the server's code/message
 *   - success                                -> parsed, camelCased body
 *
 * Note what's missing: no try/catch "to show the error". This layer only
 * *translates* failures into ApiError. Deciding what the user sees is the
 * component's job - see getErrorMessage() in lib/errorMessages.ts.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetchWithAuth(endpoint, options);
  } catch {
    // fetch only rejects when there's no response at all.
    throw new ApiError(0, "network_error", "Couldn't reach the server.");
  }

  if (!response.ok) {
    throw await toApiError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return transformKeys<T>(await response.json());
}

/** Reads the backend's {"error": {code, message, details}} body. */
async function toApiError(response: Response): Promise<ApiError> {
  try {
    const { error } = await response.json();
    if (typeof error?.code === "string") {
      return new ApiError(response.status, error.code, error.message, error.details);
    }
  } catch {
    // Body wasn't JSON (a proxy error page, a crashed server...). Fall through.
  }
  return new ApiError(
    response.status,
    `http_${response.status}`,
    "Something went wrong. Please try again.",
  );
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

export function getCurrentUser(): Promise<User> {
  return request<User>("/auth/me");
}

export async function logout(): Promise<void> {
  // Best effort: signing out locally must succeed even if this call fails.
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
  await request("/users/update", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export function inviteUser(email: string, roomId: number): Promise<Invitation> {
  return request<Invitation>("/users/invite", {
    method: "POST",
    body: JSON.stringify({ email, room_id: roomId }),
  });
}

export function getReceivedInvitations(): Promise<Invitation[]> {
  return request<Invitation[]>("/users/invitations/received");
}

export function getSentInvitations(): Promise<Invitation[]> {
  return request<Invitation[]>("/users/invitations/sent");
}

export function deleteInvitation(
  invitationId: number,
): Promise<InvitationAnswerResponse> {
  return request<InvitationAnswerResponse>(
    `/users/invitations/delete/${invitationId}`,
    { method: "DELETE" },
  );
}

/** The server reads the room from the invitation, so only the id is sent. */
export function acceptInvitation(
  invitationId: number,
): Promise<InvitationAnswerResponse> {
  return request<InvitationAnswerResponse>("/users/invitations/accept", {
    method: "POST",
    body: JSON.stringify({ invitation_id: invitationId }),
  });
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

export function getRooms(): Promise<Room[]> {
  return request<Room[]>("/rooms");
}

export function createRoom(name: string, description?: string): Promise<Room> {
  return request<Room>("/rooms", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

export function getRoomMembers(roomId: number): Promise<User[]> {
  return request<User[]>(`/rooms/${roomId}/members`);
}

export async function addMemberToRoom(roomId: number, email: string): Promise<void> {
  await request(`/rooms/${roomId}/add?email=${encodeURIComponent(email)}`, {
    method: "POST",
  });
}

export async function joinRoom(roomId: number): Promise<void> {
  await request(`/rooms/${roomId}/join`, { method: "POST" });
}

export async function leaveRoom(roomId: number): Promise<void> {
  await request(`/rooms/${roomId}/leave`, { method: "POST" });
}

export async function removeMemberFromRoom(roomId: number, userId: number): Promise<void> {
  await request(`/rooms/${roomId}/remove/${userId}`, { method: "POST" });
}

export function getRoomAdmins(roomId: number): Promise<number[]> {
  return request<number[]>(`/rooms/${roomId}/admins`);
}

export async function addAdminToRoom(roomId: number, userId: number): Promise<void> {
  await request(`/rooms/${roomId}/add_admin/${userId}`, { method: "POST" });
}

export async function removeAdminFromRoom(roomId: number, userId: number): Promise<void> {
  await request(`/rooms/${roomId}/remove_admin/${userId}`, { method: "POST" });
}

// ==================== Messages API ====================

export async function getRoomMessages(
  roomId: number,
  limit = 50,
  offset = 0,
): Promise<Message[]> {
  const messages = await request<Message[]>(
    `/messages/room/${roomId}?limit=${limit}&offset=${offset}`,
  );
  return messages.map((message) => ({
    ...message,
    type: message.type ?? "message",
  }));
}

export async function editMessage(messageId: number, content: string): Promise<void> {
  await request("/messages/edit", {
    method: "POST",
    body: JSON.stringify({ messageId, content }),
  });
}

export async function deleteMessage(messageId: number): Promise<void> {
  await request("/messages/delete", {
    method: "POST",
    body: JSON.stringify({ messageId }),
  });
}

export async function hideMessage(messageId: number): Promise<void> {
  await request("/messages/hide", {
    method: "POST",
    body: JSON.stringify({ messageId }),
  });
}

export async function unhideMessage(messageId: number): Promise<void> {
  await request("/messages/unhide", {
    method: "POST",
    body: JSON.stringify({ messageId }),
  });
}
