"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300"
      style={{
        background: scrolled ? 'var(--nav-bg)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--nav-border)' : '1px solid transparent',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center justify-between" style={{ height: '72px' }}>
          <Link href="/" className="flex items-center">
            <Logo size="md" />
          </Link>

          <div className="hidden md:flex items-center" style={{ gap: '32px' }}>
            {[
              { href: "/#how-it-works", label: "How It Works" },
              { href: "/#services", label: "Services" },
              { href: "/#earn", label: "Earn" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors duration-200"
                style={{ fontSize: '14px', fontWeight: 400, color: 'var(--link-color)' }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <SignedIn>
              <Link href="/dashboard">
                <button className="btn btn-ghost" style={{ padding: '8px 20px', fontSize: '13px' }}>Dashboard</button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <Link href="/login">
                <button className="transition-colors duration-200" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--link-color)', padding: '8px 16px' }}>Login</button>
              </Link>
              <Link href="/signup">
                <button className="btn btn-p" style={{ padding: '9px 22px', fontSize: '13px' }}>Get Started</button>
              </Link>
            </SignedOut>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="h-9 w-9 rounded-full flex items-center justify-center"
              style={{ border: '1px solid var(--b2)', background: 'var(--hover-bg)' }}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--b1)' }}>
          <div className="px-4 py-4 space-y-1">
            {[
              { href: "/#how-it-works", label: "How It Works" },
              { href: "/#services", label: "Services" },
              { href: "/#earn", label: "Earn" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 px-3 rounded-lg text-sm transition-colors"
                style={{ color: 'var(--link-color)' }}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-2 flex gap-2" style={{ borderTop: '1px solid var(--b1)' }}>
              <SignedIn>
                <Link href="/dashboard" className="w-full">
                  <button className="btn btn-p w-full justify-center" style={{ padding: '10px', fontSize: '13px' }}>Dashboard</button>
                </Link>
              </SignedIn>
              <SignedOut>
                <Link href="/login" className="flex-1">
                  <button className="btn btn-ghost w-full justify-center" style={{ padding: '10px', fontSize: '13px' }}>Login</button>
                </Link>
                <Link href="/signup" className="flex-1">
                  <button className="btn btn-p w-full justify-center" style={{ padding: '10px', fontSize: '13px' }}>Get Started</button>
                </Link>
              </SignedOut>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
