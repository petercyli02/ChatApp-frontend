# Chat Client

React 19 + TypeScript client for a real-time chat product. Pair with the [FastAPI backend](https://github.com/petercyli02/ChatApp-backend).

Firebase Auth on the client. The API is the product: rooms, invitations, message policy, and the WebSocket overlay. This repo is the UI and the hard parts of keeping that overlay honest.

## Stack

| Layer | Choice | Why |
|---|---|---|
| UI | React 19, Vite 7, TypeScript | Fast refresh, typed boundaries |
| Routing | React Router 7 | Public vs protected trees |
| Auth | Firebase JS SDK | Email/password; ID token on every API call and the socket |
| Style | Tailwind 4 + shadcn/ui | Composition over a custom design system |
| Forms | react-hook-form + Zod | Client validation that matches the wire |

## What it does

- Register / login, then a protected chat shell
- Room list, create room, invite by email, accept / reject invitations
- Live messages over WebSocket, hydrated from REST history so a refresh is not a blank room
- Edit / delete own messages; hide / unhide others (WhatsApp-style placeholder, not a vanish)
- Presence, membership, admin-aware room chrome
- Resizable sidebar, width persisted in `localStorage`

## Architecture

```
AuthProvider            Firebase session → GET /auth/me
  InvitationProvider    sent / received lists, single refresh()
    Router
      ProtectedRoute    wait for auth, else bounce
        ChatRoomProvider
          ChatArea      REST history ∪ WS stream
```

One provider per concern, mounted once. Nested providers of the same type split state; the lists and the load-fetch have to share a store.

`fetchWithAuth` attaches a fresh Firebase ID token. Snake_case from Python is mapped to camelCase at the API boundary so components never see both.

## WebSocket hook

`useWebSocket` is the interesting file.

Connecting is async (`getIdToken()`). React Strict Mode, room switches, and unmount all race that await. A **generation counter** invalidates stale `connect()` runs so a leftover attempt cannot open `/ws/1` after you already moved to `/ws/2`.

- `close()` is not instant — `wsRef` is nulled so `onclose` of a dying socket cannot schedule a retry.
- Application close codes `4000–4999` (bad token, missing user, auth outage) do **not** reconnect.
- Callbacks live in refs so the socket is not torn down every render.

History comes from `GET /messages/room/{id}`. The socket only appends. Edits, deletes, and hides are REST, then the local view is patched — the wire does not need a full resync for a one-line change.

## Scripts

```bash
npm install
npm run dev      # Vite, http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint
```

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Backend must be running; CORS is origin-locked to this Vite port.

## Layout

```
src/
  pages/                 login, register, chats
  contexts/              auth, invitations, current room
  hooks/useWebSocket.ts  connection lifecycle
  services/api.ts        typed REST + token injection
  components/custom/     chat surface, lists, dialogs
  components/ui/         shadcn primitives
```

## Honest limits

- WebSocket URL is the local backend (`ws://localhost:8000`). Env-driven WS host is the obvious next cut.
- No test runner in this snapshot; the reconnect and provider bugs were found in the real client, which is the point.
