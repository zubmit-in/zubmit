"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Plus,
  FileText,
  Wallet,
  User,
  LogOut,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";

const baseNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/order/new", icon: Plus, label: "New Order" },
  { href: "/orders", icon: FileText, label: "My Orders" },
  { href: "/earnings", icon: Wallet, label: "Earnings" },
  { href: "/profile", icon: User, label: "Profile" },
];

const adminNavItem = { href: "/admin", icon: Shield, label: "Admin Panel" };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/login");
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    if (isLoaded && user && !user.unsafeMetadata?.onboardingComplete) {
      router.push("/onboarding");
    }
  }, [isLoaded, user, router]);

  // Fetch user role for admin nav
  useEffect(() => {
    if (isLoaded && user) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.profile?.role) setUserRole(data.profile.role);
        })
        .catch(() => {});
    }
  }, [isLoaded, user]);

  const navItems = userRole === "admin"
    ? [...baseNavItems, adminNavItem]
    : baseNavItems;

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--b1)] border-t-[var(--p)] animate-spin" />
          <p className="text-sm" style={{ color: 'var(--t3)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.firstName || user.fullName || "User";
  const displayEmail = user.emailAddresses[0]?.emailAddress || "";

  return (
    <div className="min-h-screen flex overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 overflow-hidden"
        style={{
          width: '240px',
          background: 'var(--sidebar-bg)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--b1)',
        }}
      >
        {/* Logo Area */}
        <div style={{ padding: '24px 20px 0' }}>
          <Logo size="md" />
        </div>

        {/* Separator */}
        <div style={{ margin: '20px 0 12px', height: '1px', background: 'var(--b1)' }} />

        {/* Nav Items */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex items-center gap-3 rounded-lg overflow-hidden transition-all duration-200"
                style={{
                  padding: '10px 12px',
                  background: isActive ? 'rgba(232,114,42,0.08)' : undefined,
                  border: isActive ? '1px solid rgba(232,114,42,0.15)' : '1px solid transparent',
                }}
              >
                {isActive && (
                  <div
                    className="absolute left-0"
                    style={{
                      top: '20%', height: '60%', width: '2px',
                      background: 'var(--p)',
                      borderRadius: '0 2px 2px 0',
                    }}
                  />
                )}

                <item.icon
                  style={{
                    width: '17px', height: '17px',
                    color: isActive ? 'var(--p)' : 'var(--t3)',
                    transition: 'color 0.2s ease',
                  }}
                  className="group-hover:!text-[var(--p-bright)]"
                />
                <span
                  className="transition-colors duration-200 group-hover:!text-[var(--t1)]"
                  style={{
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--t1)' : 'var(--t3)',
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Section */}
        <div style={{ borderTop: '1px solid var(--b1)' }}>
          <div style={{ padding: '16px 12px 24px' }}>
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: '34px', height: '34px', borderRadius: '10px',
                  background: 'var(--p-dim)', border: '1px solid var(--p-border)',
                }}
              >
                <span className="font-semibold text-white" style={{ fontSize: '14px' }}>
                  {displayName[0]?.toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[13px] truncate" style={{ color: 'var(--t1)' }}>
                  {displayName}
                </p>
                <p className="text-[11px] truncate" style={{ color: 'var(--t3)' }}>
                  {displayEmail}
                </p>
              </div>
              <button
                onClick={() => signOut({ redirectUrl: "/" })}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--t3)' }}
                title="Logout"
              >
                <LogOut className="h-4 w-4 hover:text-[#ff4757]" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4"
        style={{
          height: '56px',
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--b1)',
        }}
      >
        <Link href="/dashboard" className="flex items-center">
          <Logo size="sm" showTagline={false} />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-9 w-9 rounded-full flex items-center justify-center"
            style={{ border: '1px solid var(--b2)', background: 'var(--hover-bg)' }}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'var(--mobile-overlay)' }} />
          <div
            className="absolute top-14 right-0 w-64 h-[calc(100%-3.5rem)] p-3 space-y-1"
            style={{
              background: 'var(--sidebar-bg)',
              borderLeft: '1px solid var(--b1)',
              backdropFilter: 'blur(20px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: isActive ? 'rgba(232,114,42,0.08)' : undefined,
                    color: isActive ? 'var(--t1)' : 'var(--t3)',
                    border: isActive ? '1px solid rgba(232,114,42,0.15)' : '1px solid transparent',
                  }}
                >
                  <item.icon style={{ width: '17px', height: '17px', color: isActive ? 'var(--p)' : 'var(--t3)' }} />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-colors"
              style={{ color: '#ff4757' }}
            >
              <LogOut style={{ width: '17px', height: '17px' }} />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--b1)',
          height: '70px',
        }}
      >
        <div className="flex items-center justify-around h-full px-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-2 py-1 transition-all"
              >
                <item.icon
                  style={{
                    width: '20px', height: '20px',
                    color: isActive ? 'var(--p)' : 'var(--t3)',
                  }}
                />
                <span
                  className="font-medium truncate max-w-[56px] text-center"
                  style={{ fontSize: '9px', color: isActive ? 'var(--p)' : 'var(--t3)' }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 lg:ml-[240px] overflow-x-hidden w-full max-w-full">
        <div className="pt-14 lg:pt-0 pb-24 lg:pb-0 w-full">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-hidden">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
