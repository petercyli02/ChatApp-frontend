import { getReceivedInvitations, getSentInvitations, type Invitation } from "@/services/api";
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface InvitationContextType {
    sentInvitations: Invitation[];
    receivedInvitations: Invitation[];
    refresh: () => Promise<void>;
}

interface InvitationProviderProps {
    children: ReactNode;
}

const InvitationContext = createContext<InvitationContextType | undefined>(undefined);

export function InvitationProvider({ children }: InvitationProviderProps) {
    const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
    const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);

    const refresh = async () => {
        const sentInvitations = await getSentInvitations();
        const receivedInvitations = await getReceivedInvitations();
        setSentInvitations(sentInvitations);
        setReceivedInvitations(receivedInvitations);
    }
    
    const value: InvitationContextType = {
        sentInvitations,
        receivedInvitations,
        refresh,
    }

    return (
        <InvitationContext.Provider value={value}>{children}</InvitationContext.Provider>
    )
}

export function useInvitation(): InvitationContextType {
    const context = useContext(InvitationContext);
    if (!context) {
        throw new Error("useInvitation must be used within an InvitationProvider");
    }
    return context;
}