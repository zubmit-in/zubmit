"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  UserPlus,
  BookOpen,
  CreditCard,
  CheckCircle2,
  FileText,
  Presentation,
  PenTool,
  BookMarked,
  StickyNote,
  Globe,
  ArrowRight,
  MessageCircle,
  FileEdit,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getStartingPrice, serviceLabels, serviceDescriptions } from "@/lib/pricing";
import type { ServiceType } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const serviceIcons: Record<string, React.ReactNode> = {
  CASE_STUDY: <FileText className="h-5 w-5" />,
  REPORT: <FileEdit className="h-5 w-5" />,
  PPT: <Presentation className="h-5 w-5" />,
  LAB_MANUAL: <BookMarked className="h-5 w-5" />,
  HANDWRITTEN_ASSIGNMENT: <PenTool className="h-5 w-5" />,
  NOTES: <StickyNote className="h-5 w-5" />,
  PROTOTYPE_FULL_STACK_WEBSITE: <Globe className="h-5 w-5" />,
};

const displayServices: ServiceType[] = [
  "CASE_STUDY",
  "REPORT",
  "PPT",
  "LAB_MANUAL",
  "HANDWRITTEN_ASSIGNMENT",
  "NOTES",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ==================== HERO ==================== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ paddingTop: '72px' }}>
        {/* Hero ambient glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-40%', right: '-20%',
            width: '900px', height: '900px',
            background: 'radial-gradient(circle, rgba(232,114,42,0.15) 0%, rgba(200,80,20,0.04) 50%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />

        <div className="max-w-[900px] mx-auto px-6 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp}>
              <span className="eyebrow justify-center" style={{ marginBottom: '24px' }}>
                INDIA&apos;S #1 ASSIGNMENT PLATFORM
              </span>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h1 className="display" style={{ fontSize: 'clamp(40px, 7vw, 72px)', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
                Your Deadline.
                <br />
                <span style={{ color: 'var(--p)' }}>Our Problem.</span>
              </h1>
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="mt-6 mx-auto max-w-[520px]"
              style={{ fontSize: '17px', fontWeight: 400, color: 'var(--t2)', lineHeight: 1.7 }}
            >
              Assignments, PPTs, lab manuals, case studies done right, delivered before your deadline. Trusted by thousands of college students.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3 mt-10">
              <Link href="/signup">
                <button className="btn btn-p" style={{ padding: '14px 32px', fontSize: '15px' }}>
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="#how-it-works">
                <button className="btn btn-ghost" style={{ padding: '14px 32px', fontSize: '15px' }}>How It Works</button>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-6 mt-8">
              {["No upfront payment", "40% advance only", "Quality guaranteed"].map((text) => (
                <div key={text} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'var(--g)' }} />
                  <span className="text-xs" style={{ color: 'var(--t3)' }}>{text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section id="how-it-works" style={{ padding: '120px 0' }}>
        <div className="max-w-[1100px] mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp}>
              <span className="eyebrow justify-center">THE PROCESS</span>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-4">
              <h2 className="display" style={{ fontSize: 'clamp(36px, 5vw, 52px)' }}>How It Works</h2>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { icon: <UserPlus className="h-5 w-5" />, num: "01", title: "Sign Up", desc: "Create your account with your college email in under a minute" },
              { icon: <BookOpen className="h-5 w-5" />, num: "02", title: "Choose Subject", desc: "Select your degree, semester, subject and type of assignment" },
              { icon: <CreditCard className="h-5 w-5" />, num: "03", title: "Pay 40% Advance", desc: "Secure your order with just 40% upfront via UPI or card" },
              { icon: <CheckCircle2 className="h-5 w-5" />, num: "04", title: "Get Delivered", desc: "Receive your completed assignment before your deadline" },
            ].map((step, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="relative rounded-2xl p-7 transition-all duration-300 hover:bg-[var(--hover-bg-subtle)]"
                style={{ border: '1px solid var(--b1)' }}
              >
                <span
                  className="display absolute pointer-events-none select-none"
                  style={{ fontSize: '120px', fontWeight: 800, color: 'rgba(232,114,42,0.08)', top: '-16px', right: '12px', zIndex: 0 }}
                >
                  {step.num}
                </span>

                <div className="relative z-[1]">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: 'var(--p-dim)', border: '1px solid var(--p-border)',
                    }}
                  >
                    <span style={{ color: 'var(--p-bright)' }}>{step.icon}</span>
                  </div>
                  <h3 className="font-semibold text-base mt-5" style={{ color: 'var(--t1)' }}>{step.title}</h3>
                  <p className="text-sm mt-2" style={{ color: 'var(--t3)', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== SERVICES ==================== */}
      <section id="services" style={{ padding: '120px 0' }}>
        <div className="max-w-[1100px] mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp}>
              <span className="eyebrow justify-center">WHAT WE DELIVER</span>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-4">
              <h2 className="display" style={{ fontSize: 'clamp(36px, 5vw, 52px)' }}>Our Services</h2>
            </motion.div>
            <motion.p variants={fadeUp} className="mt-4 mx-auto max-w-[440px] text-sm" style={{ color: 'var(--t3)' }}>
              From case studies to lab manuals, every assignment type covered with quality and speed.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {displayServices.map((serviceKey) => (
              <motion.div
                key={serviceKey}
                variants={fadeUp}
                className="group flex flex-col rounded-2xl p-6 transition-all duration-300 hover:bg-[var(--hover-bg-subtle)] cursor-pointer"
                style={{ border: '1px solid var(--b1)' }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'var(--p-dim)', border: '1px solid var(--p-border)',
                  }}
                >
                  <span style={{ color: 'var(--p-bright)' }}>
                    {serviceIcons[serviceKey]}
                  </span>
                </div>

                <h3 className="font-semibold text-base mt-4" style={{ color: 'var(--t1)' }}>
                  {serviceLabels[serviceKey]}
                </h3>
                <p className="text-sm mt-1.5 flex-1" style={{ color: 'var(--t3)', lineHeight: 1.6 }}>
                  {serviceDescriptions[serviceKey]}
                </p>

                <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: '1px solid var(--b1)' }}>
                  <span className="font-semibold text-sm" style={{ color: 'var(--p)' }}>
                    From {formatPrice(getStartingPrice(serviceKey))}
                  </span>
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    style={{ color: 'var(--t3)' }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== EARN ==================== */}
      <section id="earn" style={{ padding: '120px 0' }}>
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={stagger}
            >
              <motion.div variants={fadeUp}>
                <span className="eyebrow">FOR STUDENTS</span>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-5">
                <h2 className="display" style={{ fontSize: 'clamp(40px, 5vw, 56px)' }}>
                  Earn While
                  <br />
                  <span style={{ color: 'var(--p)' }}>You Study.</span>
                </h2>
              </motion.div>

              <motion.p variants={fadeUp} className="mt-5 max-w-[440px]" style={{ fontSize: '16px', fontWeight: 400, color: 'var(--t2)', lineHeight: 1.7 }}>
                Earn &#8377;90 to &#8377;150 per assignment as a Zubmit freelancer. No experience needed, just quality work and meeting deadlines.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8">
                <span className="display" style={{ fontSize: '52px', color: 'var(--t1)' }}>
                  &#8377;90 - ₹150
                </span>
                <p className="eyebrow mt-2">PER ASSIGNMENT</p>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-8">
                <Link href="/signup">
                  <button className="btn btn-p">
                    Join as Freelancer
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={stagger}
              className="space-y-4"
            >
              {[
                { num: "01", text: "Sign up as a freelancer and join our WhatsApp broadcast for task notifications" },
                { num: "02", text: "Accept available tasks that match your skills and deliver before the deadline" },
                { num: "03", text: "Get paid directly after your work is verified and delivered to the student" },
              ].map((card) => (
                <motion.div
                  key={card.num}
                  variants={fadeUp}
                  className="flex items-start gap-5 rounded-2xl p-5"
                  style={{ border: '1px solid var(--b1)', background: 'var(--hover-bg-subtle)' }}
                >
                  <span className="display shrink-0" style={{ fontSize: '32px', color: 'var(--p)', opacity: 0.4 }}>{card.num}</span>
                  <p className="text-sm" style={{ color: 'var(--t2)', lineHeight: 1.7 }}>{card.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="relative overflow-hidden" style={{ padding: '140px 0', textAlign: 'center' }}>
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(232,114,42,0.06), transparent 60%)' }}
        />

        <div className="relative z-[1] max-w-[700px] mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <span className="eyebrow justify-center">GET STARTED TODAY</span>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-6">
              <h2 className="display" style={{ fontSize: 'clamp(40px, 7vw, 64px)' }}>
                Ready to Beat
                <br />
                Your <span style={{ color: 'var(--p)' }}>Deadline?</span>
              </h2>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-5 mx-auto max-w-[480px]" style={{ fontSize: '16px', fontWeight: 400, color: 'var(--t2)', lineHeight: 1.7 }}>
              Join thousands of Indian college students who trust Zubmit. Sign up today and place your first order in under 5 minutes.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3 mt-10">
              <Link href="/signup">
                <button className="btn btn-p" style={{ padding: '14px 32px', fontSize: '15px' }}>
                  Get Started for Free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "91XXXXXXXXXX"}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="btn btn-green" style={{ padding: '14px 32px', fontSize: '15px' }}>
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
