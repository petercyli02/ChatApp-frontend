import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

interface Props {
    roomId: number;
    className?: string;
    onMessageSend: (message: string) => void;
}

const ChatInput = ({ className, onMessageSend }: Props) => {    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const input = e.currentTarget.elements[0] as HTMLInputElement;
        onMessageSend(input.value);
        input.value = '';
    }

    return (
        <div className={cn("flex gap-2", className)}>
            <form onSubmit={handleSubmit} className="flex gap-2 grow">
                <Input className="flex-1" type="text" placeholder="Message" />
                <Button className="hover:cursor-pointer" variant="secondary" type="submit">Send</Button>
            </form>
        </div>
    )
}

export default ChatInput;
