import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Textarea } from "../ui/textarea";

interface Props {
  onRoomCreate: (name: string, description: string) => Promise<void>;
}

const RoomCreationDialog = ({ onRoomCreate }: Props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onRoomCreate(name, description);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-gray-800 hover:bg-gray-700 cursor-pointer">
          <PlusIcon className="w-4 h-4" /> Create New Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="mb-8">
            <DialogTitle>Creating New Room</DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="name-1">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name-1"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter room name"
                required
              />
            </Field>
            <Field>
              <Label htmlFor="description-1">Description</Label>
              <Textarea
                id="description-1"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter room description"
              />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-8">
            <DialogClose className="flex gap-4">
              <Button variant="outline">Cancel</Button>
              <Button className="hover:cursor-pointer" variant="default" type="submit">Save changes</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoomCreationDialog;
