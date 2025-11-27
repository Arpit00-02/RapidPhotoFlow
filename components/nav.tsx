"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload, Loader2, Image, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Nav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { href: "/", label: "Upload", icon: Upload },
    { href: "/processing", label: "Processing", icon: Loader2 },
    { href: "/gallery", label: "Gallery", icon: Image },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <Link href="/" aria-label="RapidPhotoFlow home" className="hover:opacity-80 transition-opacity flex items-center gap-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 100 100" 
              width="24"
              height="24"
              className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0"
              aria-hidden="true"
              style={{minWidth: '24px', minHeight: '24px'}}
            >
              <defs>
                <linearGradient id="navGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:"#2563eb",stopOpacity:1}} />
                  <stop offset="100%" style={{stopColor:"#9333ea",stopOpacity:1}} />
                </linearGradient>
              </defs>
              <rect width="100" height="100" rx="20" fill="url(#navGradient)"/>
              <circle cx="50" cy="35" r="12" fill="white" opacity="0.9"/>
              <path d="M 30 60 Q 30 50 40 50 L 60 50 Q 70 50 70 60 L 70 75 Q 70 80 65 80 L 35 80 Q 30 80 30 75 Z" fill="white" opacity="0.9"/>
              <circle cx="50" cy="60" r="6" fill="url(#navGradient)"/>
            </svg>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer">
              RapidPhotoFlow
            </h1>
          </Link>
        </div>
        <div className="flex items-center gap-1 sm:gap-2" role="menubar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className="gap-1 sm:gap-2 min-h-[44px] px-2 sm:px-4"
                  size="sm"
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  <span className="hidden md:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Moon className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}

