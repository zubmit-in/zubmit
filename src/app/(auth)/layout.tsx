import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  // If already signed in, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Warm ambient */}
      <div
        className="fixed pointer-events-none z-0"
        style={{
          bottom: '-30%', right: '-15%', width: '700px', height: '700px',
          background: 'radial-gradient(circle, rgba(232,114,42,0.1) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 transition-colors"
        style={{ fontSize: '13px', color: 'var(--t3)' }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <Logo size="lg" />
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
