"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--b1)' }}>
      <div className="max-w-[1100px] mx-auto px-6" style={{ padding: '60px 24px 40px' }}>
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center mb-4">
              <Logo size="sm" />
            </Link>
            <p className="text-sm max-w-xs mb-4" style={{ color: 'var(--t3)', lineHeight: 1.6 }}>
              Your Deadline. Our Problem. India&apos;s trusted academic assignment assistance platform for college students.
            </p>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "91XXXXXXXXXX"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm transition-colors hover:text-[var(--link-hover)]"
              style={{ color: 'var(--g)' }}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Support
            </a>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            <div>
              <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--t1)' }}>Quick Links</h4>
              <ul className="space-y-2.5">
                {[
                  { href: "/", label: "Home" },
                  { href: "/#how-it-works", label: "How It Works" },
                  { href: "/#services", label: "Services" },
                  { href: "/#earn", label: "Earn Money" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:text-[var(--link-hover)]"
                      style={{ color: 'var(--t3)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--t1)' }}>Account</h4>
              <ul className="space-y-2.5">
                {[
                  { href: "/login", label: "Login" },
                  { href: "/signup", label: "Sign Up" },
                  { href: "/dashboard", label: "Dashboard" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:text-[var(--link-hover)]"
                      style={{ color: 'var(--t3)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid var(--b1)' }}>
          <p className="text-xs" style={{ color: 'var(--t3)' }}>
            Made for Indian college students
          </p>
          <p className="text-xs" style={{ color: 'var(--t3)' }}>
            &copy; {new Date().getFullYear()} Zubmit. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
