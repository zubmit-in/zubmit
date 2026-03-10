"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Building, GraduationCap, Calendar, Loader2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { pageEnter, fadeUp, staggerContainer } from "@/lib/motion";

interface ProfileData {
  full_name: string;
  email: string;
  phone: string | null;
  college_name: string;
  degree: string;
  specialization: string | null;
  semester: number | null;
  role: string;
  roll_no: string | null;
}

export default function ProfilePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    collegeName: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setForm({
          name: data.profile.full_name || "",
          phone: data.profile.phone || "",
          collegeName: data.profile.college_name || "",
        });
      }
    } catch {
      // silently fail
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          collegeName: form.collegeName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Profile Updated", description: "Your changes have been saved." });
        fetchProfile();
      } else {
        toast({ title: "Error", description: data.error || "Failed to update.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.fullName || profile?.full_name || "User";
  const displayEmail = user?.emailAddresses[0]?.emailAddress || profile?.email || "";

  const roleColor = profile?.role === "worker"
    ? { bg: 'rgba(34,217,138,0.1)', border: 'rgba(34,217,138,0.25)', color: 'var(--g)' }
    : profile?.role === "admin"
    ? { bg: 'var(--p-dim)', border: 'var(--p-border)', color: 'var(--p-bright)' }
    : { bg: 'rgba(232,114,42,0.06)', border: 'rgba(232,114,42,0.15)', color: 'var(--p-bright)' };

  return (
    <motion.div {...pageEnter} className="max-w-2xl min-w-0 overflow-x-hidden">
      {/* Header */}
      <div>
        <span className="eyebrow">ACCOUNT</span>
        <h1 className="display mt-2" style={{ fontSize: 'clamp(32px, 7vw, 52px)', color: 'var(--t1)' }}>Profile</h1>
        <p className="mt-1" style={{ fontSize: '14px', fontWeight: 300, color: 'var(--t2)' }}>
          Manage your account settings
        </p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-6 mt-10"
      >
        {/* Avatar & Role */}
        <motion.div variants={fadeUp} className="card" style={{ padding: '28px 32px' }}>
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: '64px', height: '64px', borderRadius: '16px',
                background: 'linear-gradient(135deg, var(--p), var(--s))',
              }}
            >
              <span className="display" style={{ fontSize: '28px', color: '#fff' }}>
                {displayName[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-bold text-lg" style={{ color: 'var(--t1)' }}>{displayName}</h2>
              <p className="text-sm" style={{ color: 'var(--t3)' }}>{displayEmail}</p>
              <div className="mt-2">
                <span
                  className="mono"
                  style={{
                    fontSize: '10px',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    background: roleColor.bg,
                    color: roleColor.color,
                    border: `1px solid ${roleColor.border}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {profile?.role || "student"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Editable Fields */}
        <motion.div variants={fadeUp} className="card" style={{ padding: '28px 32px' }}>
          <h3 className="font-bold text-[15px] mb-5" style={{ color: 'var(--t1)' }}>
            Personal Information
          </h3>
          <div className="gradient-sep mb-5" />

          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="field-label">Full Name</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full"
                style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--b2)',
                  background: 'var(--input-bg)',
                  color: 'var(--t1)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--p)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--b2)'}
              />
            </div>

            <div>
              <label htmlFor="collegeName" className="field-label">College Name</label>
              <input
                id="collegeName"
                type="text"
                value={form.collegeName}
                onChange={(e) => setForm({ ...form, collegeName: e.target.value })}
                className="w-full"
                style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--b2)',
                  background: 'var(--input-bg)',
                  color: 'var(--t1)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--p)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--b2)'}
              />
            </div>

            <div>
              <label htmlFor="phone" className="field-label">Phone Number</label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
                className="w-full"
                style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--b2)',
                  background: 'var(--input-bg)',
                  color: 'var(--t1)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--p)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--b2)'}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-p mt-6"
            style={{
              opacity: saving ? 0.5 : 1,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </motion.div>

        {/* Academic Info */}
        <motion.div variants={fadeUp} className="card" style={{ padding: '28px 32px' }}>
          <h3 className="font-bold text-[15px] mb-5" style={{ color: 'var(--t1)' }}>
            Academic Information
          </h3>
          <div className="gradient-sep mb-5" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: Mail, label: "Email", value: displayEmail },
              { icon: GraduationCap, label: "Degree", value: profile?.degree || "Not set" },
              { icon: Building, label: "Specialization", value: profile?.specialization || "Not set" },
              { icon: Calendar, label: "Semester", value: profile?.semester ? `Semester ${profile.semester}` : "Not set" },
            ].map((item) => (
              <div key={item.label}>
                <p className="flex items-center gap-1.5" style={{ fontSize: '11px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <item.icon className="h-3 w-3" />
                  {item.label}
                </p>
                <p className="font-medium text-sm mt-1" style={{ color: 'var(--t1)' }}>{item.value}</p>
              </div>
            ))}
          </div>

          <p className="mt-5" style={{ fontSize: '12px', color: 'var(--t3)' }}>
            Contact support to change academic details.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
