import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Ellipsis, Eye, EyeOff, Pencil, Trash } from "lucide-react";

interface Props {
  fromSelf: boolean;
  hidden?: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onHide: () => Promise<void>;
  onUnhide: () => Promise<void>;
}

export function MessagePopover({
  fromSelf,
  hidden,
  onEdit,
  onDelete,
  onHide,
  onUnhide,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => void | Promise<void>) => {
    setBusy(true);
    try {
      await action();
      setOpen(false);
    } catch {
      // ChatMessages surfaces the error; keep the menu open.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="ml-4">
          <Ellipsis />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-40 flex-col p-1">
        {hidden ? (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => void run(onUnhide)}
          >
            <div className="flex w-full items-center justify-between">
              <span>Unhide</span>
              <Eye />
            </div>
          </Button>
        ) : (
          <>
            {fromSelf && (
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => void run(onEdit)}
              >
                <div className="flex w-full items-center justify-between">
                  <span>Edit</span>
                  <Pencil />
                </div>
              </Button>
            )}
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => void run(fromSelf ? onDelete : onHide)}
            >
              <div className="flex w-full items-center justify-between">
                <span>{fromSelf ? "Delete" : "Hide"}</span>
                {fromSelf ? <Trash /> : <EyeOff />}
              </div>
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
