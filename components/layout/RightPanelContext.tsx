"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { X } from "lucide-react";

interface PanelState {
  title: string;
  content: ReactNode;
}

interface RightPanelContextType {
  panel: PanelState | null;
  setPanel: (title: string, content: ReactNode) => void;
  closePanel: () => void;
}

export const RightPanelContext = createContext<RightPanelContextType>({
  panel: null,
  setPanel: () => {},
  closePanel: () => {},
});

export function RightPanelProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<PanelState | null>(null);
  return (
    <RightPanelContext.Provider
      value={{
        panel,
        setPanel: (title, content) => setPanel({ title, content }),
        closePanel: () => setPanel(null),
      }}
    >
      {children}
    </RightPanelContext.Provider>
  );
}

export const useRightPanel = () => useContext(RightPanelContext);

export function RightPanelSlot() {
  const { panel, closePanel } = useContext(RightPanelContext);
  if (!panel) return null;

  return (
    <>
      {/* overlay on mobile */}
      <div
        className="fixed inset-0 z-20 bg-black/20 md:hidden"
        onClick={closePanel}
      />
      <aside className="fixed md:relative right-0 top-0 h-full w-80 shrink-0 border-l border-border bg-background z-30 flex flex-col shadow-xl md:shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h3 className="text-sm font-semibold truncate">{panel.title}</h3>
          <button
            onClick={closePanel}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {panel.content}
        </div>
      </aside>
    </>
  );
}
