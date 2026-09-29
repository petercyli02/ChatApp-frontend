import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import ChatsList from "./ChatsList";
import {
  deleteMessage,
  editMessage,
  getRoomMessages,
  hideMessage,
  unhideMessage,
} from "@/services/api";
import { useWebSocket, type Message } from "@/hooks/useWebSocket";
import { useChatRoom } from "@/contexts/ChatRoomContext";
import AddMember from "./AddMember";
import RoomMembership from "./RoomMembership";
import { Button } from "../ui/button";
import { MoveDown } from "lucide-react";

const SIDEBAR_DEFAULT = 340;
const SIDEBAR_MIN = 260;
const SIDEBAR_MAX = 560;
const SIDEBAR_STORAGE_KEY = "chat-sidebar-width";

function loadSidebarWidth(): number {
  if (typeof window === "undefined") return SIDEBAR_DEFAULT;
  const raw = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
  const parsed = raw ? Number(raw) : SIDEBAR_DEFAULT;
  if (!Number.isFinite(parsed)) return SIDEBAR_DEFAULT;
  return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, parsed));
}

const ChatArea = () => {
  const { roomId, roomName } = useChatRoom();
  const effectiveRoomId = roomId ?? 0;
  const [existingMessages, setExistingMessages] = useState<Message[]>([]);
  const [messageOffset, setMessageOffset] = useState(0);
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const [edits, setEdits] = useState<
    Record<number, { content: string; lastEdited: string }>
  >({});
  const [sidebarWidth, setSidebarWidth] = useState(loadSidebarWidth);
  const [showJumpToLatestButton, setShowJumpToLatestButton] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    setRemovedIds(new Set());
    setHiddenIds(new Set());
    setEdits({});
    if (effectiveRoomId) {
      getRoomMessages(effectiveRoomId).then((messages) => {
        setExistingMessages(messages);
        setMessageOffset(messageOffset + messages.length);
        setHiddenIds(
          new Set(
            messages
              .filter((message) => message.hidden && message.id != null)
              .map((message) => message.id as number),
          ),
        );
      });
    } else {
      setExistingMessages([]);
    }
  }, [effectiveRoomId]);

  const { messages: wsMessages, sendMessage } = useWebSocket({
    roomId: effectiveRoomId,
  });

  const messages: Message[] = useMemo(() => {
    const rest = new Set<string>();
    existingMessages.forEach((message) =>
      rest.add(`${message.createdAt}-${message.senderId}`),
    );
    const fromWs = wsMessages.filter(
      (message) =>
        message.type === "message" &&
        message.roomId === effectiveRoomId &&
        !rest.has(`${message.createdAt}-${message.senderId}`),
    );
    return [...existingMessages, ...fromWs]
      .filter((message) => message.id != null && !removedIds.has(message.id))
      .map((message) => {
        const edit = message.id != null ? edits[message.id] : undefined;
        const hidden = message.id != null && hiddenIds.has(message.id);
        return {
          ...message,
          ...(edit ?? {}),
          hidden,
        };
      });
  }, [
    existingMessages,
    wsMessages,
    effectiveRoomId,
    removedIds,
    edits,
    hiddenIds,
  ]);

  const onEditMessage = async (messageId: number, content: string) => {
    await editMessage(messageId, content);
    setEdits((prev) => ({
      ...prev,
      [messageId]: { content, lastEdited: new Date().toISOString() },
    }));
  };

  const onDeleteMessage = async (messageId: number) => {
    await deleteMessage(messageId);
    setRemovedIds((prev) => new Set(prev).add(messageId));
  };

  const onHideMessage = async (messageId: number) => {
    await hideMessage(messageId);
    setHiddenIds((prev) => new Set(prev).add(messageId));
  };

  const onUnhideMessage = async (messageId: number) => {
    await unhideMessage(messageId);
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(messageId);
      return next;
    });
  };

  const clampWidth = useCallback((clientX: number) => {
    const left = containerRef.current?.getBoundingClientRect().left ?? 0;
    return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, clientX - left));
  }, []);

  const onResizeStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      draggingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [],
  );

  const onResizeMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      setSidebarWidth(clampWidth(event.clientX));
    },
    [clampWidth],
  );

  const onResizeEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    },
    [],
  );

  const scrollerRef = useRef<HTMLDivElement>(null!);
  const loadingRef = useRef(false);
  const doneRef = useRef(false);
  const restoreHeightRef = useRef<number | null>(null);

  function onScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    setShowJumpToLatestButton(el.scrollTop < el.scrollHeight - 1500);
    if (el.scrollTop <= 80) loadOlder();
  }

  function onWheel(e: React.WheelEvent) {
    const el = scrollerRef.current;
    if (!el) return;
    if (el.scrollTop <= 0 && e.deltaY < 0) loadOlder();
  }

  async function loadOlder() {
    if (loadingRef.current || doneRef.current) return;
    loadingRef.current = true;
    try {
      restoreHeightRef.current = scrollerRef.current?.scrollHeight ?? 0;
      const older = await getRoomMessages(effectiveRoomId, 50, messageOffset);
      setExistingMessages((prev) => [...older, ...prev]);
      setMessageOffset(messageOffset + older.length);
      doneRef.current = older.length < 50;
    } catch (error) {
      console.error(error);
    } finally {
      loadingRef.current = false;
    }
  }

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    const prevHeight = restoreHeightRef.current;
    if (!el || prevHeight === null) return;
    el.scrollTop += el.scrollHeight - prevHeight;
    restoreHeightRef.current = null;
  }, [existingMessages]);

  return (
    <div ref={containerRef} className="flex h-full min-h-0">
      <div
        style={{ width: sidebarWidth }}
        className="shrink-0 min-w-0 h-full overflow-y-auto pr-2"
      >
        <ChatsList />
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize chat list"
        aria-valuemin={SIDEBAR_MIN}
        aria-valuemax={SIDEBAR_MAX}
        aria-valuenow={Math.round(sidebarWidth)}
        title="Drag to resize. Double-click to reset."
        onPointerDown={onResizeStart}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeEnd}
        onPointerCancel={onResizeEnd}
        onDoubleClick={() => setSidebarWidth(SIDEBAR_DEFAULT)}
        className="group relative w-3 shrink-0 cursor-col-resize touch-none"
      >
        <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 rounded-full bg-border transition-colors group-hover:bg-muted-foreground group-active:bg-primary" />
      </div>
      <div className="flex flex-col flex-1 min-w-0 bg-surface text-surface-foreground rounded-3xl px-4 pt-4">
        {effectiveRoomId ? (
          <>
            <div className="flex place-content-between items-center">
              <h1 className="text-xl font-bold mx-6 mb-4">
                {roomName ?? `Chat Room ${effectiveRoomId}`}
              </h1>
              <RoomMembership />
              <AddMember />
            </div>
            <ChatMessages
              scrollerRef={scrollerRef}
              loadingRef={loadingRef}
              onScroll={onScroll}
              onWheel={onWheel}
              className="grow-20"
              messages={messages}
              onEditMessage={onEditMessage}
              onDeleteMessage={onDeleteMessage}
              onHideMessage={onHideMessage}
              onUnhideMessage={onUnhideMessage}
            />
            <div className="relative">
              {showJumpToLatestButton && (
                <Button
                  className="absolute bottom-16 left-1/2 w-fit self-center -translate-x-1/2"
                  size="lg"
                  variant="secondary"
                  onClick={() => {
                    scrollerRef.current?.scrollTo({
                      top: scrollerRef.current?.scrollHeight,
                      behavior: "smooth",
                    });
                  }}
                >
                  <MoveDown /> Scroll to latest
                </Button>
              )}
              <ChatInput
                className="grow-1 mt-4 ml-4"
                roomId={effectiveRoomId}
                onMessageSend={sendMessage}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center font-semibold text-muted-foreground">
            No chat selected
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatArea;
