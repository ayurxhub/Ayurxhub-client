"use client";

import { createContext, useContext, useState } from "react";
import ProModal from "../components/ProModal";

const ProModalContext = createContext(null);

export function ProModalProvider({ children }) {
    const [open, setOpen] = useState(false);

    return (
        <ProModalContext.Provider value={{ openProModal: () => setOpen(true) }}>
            {children}
            {open && <ProModal onClose={() => setOpen(false)} />}
        </ProModalContext.Provider>
    );
}

export function useProModal() {
    return useContext(ProModalContext);
}