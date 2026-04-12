"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++nextId;
    setItems((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-20 left-4 right-4 z-[70] flex flex-col gap-2 items-center pointer-events-none">
        {items.map((item) => (
          <div
            key={item.id}
            className={`
              pointer-events-auto px-4 py-2.5 rounded-xl shadow-elevated text-sm font-medium
              animate-slide-up max-w-sm w-full text-center
              ${
                item.type === "success"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }
            `}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
