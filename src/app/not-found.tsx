"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";


export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Warm ambient */}
      <div
        className="fixed pointer-events-none z-0"
        style={{
          bottom: '-20%', right: '-10%', width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(232,114,42,0.08) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
      />

      <motion.div
        className="relative z-10 text-center px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-10">
          <Logo size="md" />
        </div>

        {/* 404 */}
        <h1
          className="display"
          style={{
            fontSize: 'clamp(100px, 18vw, 180px)',
            color: 'var(--p)',
            lineHeight: '0.9',
          }}
        >
          404
        </h1>

        <h2 className="display mt-4" style={{ fontSize: '28px', color: 'var(--t1)' }}>Page Not Found</h2>

        <p className="mt-3" style={{ fontSize: '15px', color: 'var(--t3)', maxWidth: '400px', margin: '12px auto 0' }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link href="/">
            <button className="btn btn-p">
              <Home className="h-4 w-4" />
              Back to Home
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="btn btn-ghost">
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
