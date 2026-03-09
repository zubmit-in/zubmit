"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What is Zubmit?",
    a: "Zubmit is a platform where students can get their college assignments done by verified freelancers from their own university. We handle everything — matching, quality checks, and delivery.",
  },
  {
    q: "How does it work?",
    a: "Place an order with your assignment details, pay a small advance, and a verified freelancer completes it before your deadline. You receive the completed work digitally or physically.",
  },
  {
    q: "Is my identity kept confidential?",
    a: "Absolutely. Your personal details are never shared with the freelancer. Everything is handled securely through the platform.",
  },
  {
    q: "What types of assignments do you handle?",
    a: "Case Studies, Reports, Lab Records, Handwritten Assignments, PPTs, Notes, and more — both digital and physical formats.",
  },
  {
    q: "How is the price calculated?",
    a: "Pricing depends on the service type, number of pages, and delivery urgency. You see the exact price breakdown before placing your order — no hidden charges.",
  },
  {
    q: "How much advance do I need to pay?",
    a: "You pay 50% as advance when placing the order. The remaining 50% is paid after you receive the completed assignment.",
  },
  {
    q: "What if I'm not satisfied with the work?",
    a: "You get up to 3 free revisions per assignment. Our admin reviews every submission before delivery to ensure quality meets your expectations.",
  },
  {
    q: "How do I receive my assignment?",
    a: "Digital assignments are delivered through the platform. Physical assignments are hand-delivered by our delivery team directly to your location.",
  },
  {
    q: "Can I get my assignment done urgently?",
    a: "Yes, we accept urgent orders. Select your deadline while placing the order and pricing adjusts accordingly.",
  },
  {
    q: "How can I earn as a freelancer?",
    a: "Go to the Earnings page, complete your freelancer profile, accept the terms, and start picking up available tasks. Payments are processed after admin approval.",
  },
  {
    q: "When do freelancers get paid?",
    a: "Payment is processed after admin reviews and approves your submission, usually within 24 hours of approval via UPI.",
  },
];

function FAQItem({ q, a, isOpen, onClick }: { q: string; a: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--b1)",
        borderRadius: "14px",
        overflow: "hidden",
        transition: "border-color 0.3s ease",
        borderColor: isOpen ? "var(--p)" : "var(--b1)",
      }}
    >
      <button
        onClick={onClick}
        className="font-outfit"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          gap: "16px",
        }}
      >
        <span
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: isOpen ? "var(--p)" : "var(--t1)",
            transition: "color 0.3s ease",
            lineHeight: 1.4,
          }}
        >
          {q}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ flexShrink: 0 }}
        >
          <ChevronDown
            className="h-5 w-5"
            style={{ color: isOpen ? "var(--p)" : "var(--t3)" }}
          />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <p
              className="font-outfit"
              style={{
                padding: "0 24px 20px",
                fontSize: "14px",
                color: "var(--t2)",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" style={{ padding: "120px 0" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: "center", marginBottom: "56px" }}
        >
          <span
            className="eyebrow"
            style={{
              display: "inline-block",
              marginBottom: "12px",
            }}
          >
            GOT QUESTIONS?
          </span>
          <h2
            className="display"
            style={{ fontSize: "clamp(28px, 5vw, 40px)", color: "var(--t1)" }}
          >
            Frequently Asked Questions
          </h2>
          <p
            className="font-outfit"
            style={{
              marginTop: "12px",
              fontSize: "15px",
              color: "var(--t2)",
              maxWidth: "500px",
              margin: "12px auto 0",
            }}
          >
            Everything you need to know about Zubmit
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <FAQItem
                q={faq.q}
                a={faq.a}
                isOpen={openIndex === i}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
