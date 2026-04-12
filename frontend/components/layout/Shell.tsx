"use client";

import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-slate-50 min-h-screen max-w-lg mx-auto relative">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
