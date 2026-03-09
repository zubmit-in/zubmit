"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { degreeList, getSpecializations, getMaxSemester } from "@/lib/curriculum";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    collegeName: "",
    degree: "",
    specialization: "",
    semester: "",
    rollNo: "",
    phone: "",
  });

  const [specializations, setSpecializations] = useState<string[]>([]);
  const [maxSemester, setMaxSemester] = useState(0);

  // Redirect if already onboarded
  useEffect(() => {
    if (isLoaded && user?.unsafeMetadata?.onboardingComplete) {
      router.push("/dashboard");
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    if (form.degree) {
      const specs = getSpecializations(form.degree);
      setSpecializations(specs);
      setMaxSemester(getMaxSemester(form.degree));
      setForm((prev) => ({ ...prev, specialization: "", semester: "" }));
    }
  }, [form.degree]);

  // Auto-select if only one specialization
  useEffect(() => {
    if (specializations.length === 1) {
      setForm((prev) => ({ ...prev, specialization: specializations[0] }));
    }
  }, [specializations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.collegeName || !form.degree || !form.semester || !form.phone) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collegeName: form.collegeName,
          degree: form.degree,
          specialization: form.specialization || null,
          semester: parseInt(form.semester),
          rollNo: form.rollNo || null,
          phone: form.phone,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Mark onboarding complete in Clerk metadata
        await user?.update({
          unsafeMetadata: { onboardingComplete: true },
        });
        toast({
          title: "Welcome to Zubmit!",
          description: "Your profile has been set up successfully.",
        });
        router.push("/dashboard");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to complete onboarding.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--p)' }} />
      </div>
    );
  }

  const inputStyle = {
    padding: '12px 16px',
    fontSize: '14px',
    borderRadius: '12px',
    border: '1px solid var(--b2)',
    background: 'var(--input-bg)',
    color: 'var(--t1)',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    width: '100%',
  } as React.CSSProperties;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Warm ambient */}
      <div
        className="fixed pointer-events-none z-0"
        style={{
          bottom: '-25%', right: '-10%', width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(232,114,42,0.1) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
      />

      <motion.div
        className="relative z-10 w-full max-w-md mx-auto px-4 py-8"
        initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="card" style={{ padding: '36px 32px' }}>
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center mb-5">
              <Logo size="md" />
            </div>
            <h1 className="display" style={{ fontSize: '28px', color: 'var(--t1)' }}>Complete Your Profile</h1>
            <p className="mt-2" style={{ fontSize: '14px', color: 'var(--t2)' }}>
              Hey {user?.firstName || "there"}! Tell us about your college
            </p>
          </div>

          <div className="gradient-sep mb-7" />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="collegeName" className="field-label">College Name *</label>
              <input
                id="collegeName"
                placeholder="e.g. Woxsen University, IIT Delhi..."
                value={form.collegeName}
                onChange={(e) => setForm({ ...form, collegeName: e.target.value })}
                required
                className="font-outfit"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--p)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--b2)'}
              />
            </div>

            <div>
              <label className="field-label">Degree *</label>
              <Select
                value={form.degree}
                onValueChange={(val) => setForm({ ...form, degree: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your degree" />
                </SelectTrigger>
                <SelectContent>
                  {degreeList.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {specializations.length > 1 && (
              <div>
                <label className="field-label">Specialization</label>
                <Select
                  value={form.specialization}
                  onValueChange={(val) => setForm({ ...form, specialization: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {maxSemester > 0 && (
              <div>
                <label className="field-label">Current Semester *</label>
                <Select
                  value={form.semester}
                  onValueChange={(val) => setForm({ ...form, semester: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: maxSemester }, (_, i) => i + 1).map(
                      (sem) => (
                        <SelectItem key={sem} value={sem.toString()}>
                          Semester {sem}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label htmlFor="rollNo" className="field-label">Roll Number (Optional)</label>
              <input
                id="rollNo"
                placeholder="e.g. 22BCS10045"
                value={form.rollNo}
                onChange={(e) => setForm({ ...form, rollNo: e.target.value })}
                className="font-outfit"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--p)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--b2)'}
              />
            </div>

            <div>
              <label htmlFor="phone" className="field-label">Phone Number *</label>
              <input
                id="phone"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                className="font-outfit"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--p)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--b2)'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-p w-full justify-center mt-2"
              style={{
                padding: '14px',
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Continue to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
