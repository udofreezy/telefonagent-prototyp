"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Settings, ClipboardList, Sparkles, Calendar, Users } from "lucide-react";

export function Header() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Agent konfigurieren", icon: Settings },
    { href: "/calls", label: "Anrufprotokoll", icon: ClipboardList },
    { href: "/calendar", label: "Kalender", icon: Calendar },
    { href: "/customers", label: "Kundenstamm", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0693e3] to-[#38b2f5] shadow-lg shadow-[#0693e3]/20 transition-transform group-hover:scale-105">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight">Die Zahnärzte Basel</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Telefonassistent</span>
            </div>
          </Link>
          <nav className="flex gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#0693e3]/10 text-[#0693e3]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[#0693e3]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
