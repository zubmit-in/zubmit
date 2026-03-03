"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Clock,
  FileText,
  Loader2,
  Shield,
  ArrowRight,
  CheckCircle,
  X,
  Upload,
  Building,
  Home,
  Lock,
  FileSearch,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pageEnter, fadeUp, staggerContainer } from "@/lib/motion";
import { degreeList, getSpecializations } from "@/lib/curriculum";
import { useCountUp } from "@/hooks/useCountUp";
import { DeadlineTimer } from "@/components/DeadlineTimer";
import { createClient } from "@supabase/supabase-js";

// =============================================
// TYPES
// =============================================

interface WorkerProfile {
  role: string;
  worker_agreed: boolean;
  worker_profile_complete: boolean;
  worker_full_name?: string;
  worker_contact?: string;
  worker_university?: string;
  worker_roll_no?: string;
  worker_degree?: string;
  worker_specialization?: string;
  accommodation_type?: string;
  tower_no?: number;
  tower_room_no?: string;
  block_no?: string;
  block_room_no?: string;
  upi_qr_url?: string;
  worker_banned?: boolean;
}

interface AvailableTask {
  id: string;
  title: string;
  subject: string;
  degree: string;
  specialization: string;
  semester: string;
  service_type: string;
  delivery_type: string;
  description?: string;
  page_count?: number;
  worker_pay: number;
  status: string;
  assigned_worker_id?: string;
  assigned_at?: string;
  revision_count: number;
  created_at: string;
  updated_at: string;
  deadline: string; // already -8h from view
}

interface ReviewStage {
  id: string;
  task_id: string;
  worker_id: string;
  stage: string;
  message: string;
  admin_note?: string;
  created_at: string;
}

interface EarningsSummary {
  total_earned: number;
  pending_amount: number;
  tasks_completed: number;
  tasks_in_progress: number;
}

interface EarningsRecord {
  id: string;
  amount: number;
  status: string;
  upi_transaction_id?: string;
  paid_at?: string;
  created_at: string;
  task_title?: string;
  task_subject?: string;
}

// =============================================
// HELPERS
// =============================================

const serviceLabelsMap: Record<string, string> = {
  case_study: "Case Study",
  report: "Report",
  ppt: "Presentation",
  lab_manual: "Lab Manual",
  handwritten_assignment: "Handwritten",
  notes: "Notes",
  other: "Other",
};

const serviceColorMap: Record<string, string> = {
  case_study: "var(--p)",
  report: "var(--s)",
  ppt: "#818cf8",
  lab_manual: "var(--g)",
  handwritten_assignment: "var(--r)",
  notes: "#f472b6",
  other: "var(--t3)",
};

function formatIST(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// =============================================
// RULES
// =============================================

const rules = [
  "You must complete accepted tasks before the submission deadline. Missing the deadline results in permanent ban.",
  "All submitted work must be original. Plagiarism or copy-paste results in immediate ban and no payment.",
  "You may be asked for up to 3 free revisions per assignment after review. All revisions must be done promptly.",
  "Payment is processed only after admin reviews and approves your submission.",
  "Never contact the client. Never share assignment details with anyone outside the platform.",
  "Once you accept a task you cannot abandon it. Abandoning accepted tasks results in permanent ban.",
  "Your details (name, room, UPI) are used only for task coordination and payment.",
  "Zubmit can withhold payment for unsatisfactory work.",
  "For physical assignments, be available in your room when our team comes to collect.",
  "By joining you agree to all these terms fully.",
];

// =============================================
// STAGE DEFINITIONS FOR STEPPER
// =============================================

const allStages = [
  "task_accepted",
  "digital_submitted",
  "physical_completed",
  "under_review",
  "revision_required",
  "revision_submitted",
  "approved",
  "payment_processing",
  "paid",
];

const stageLabels: Record<string, string> = {
  task_accepted: "Task Accepted",
  digital_submitted: "Assignment Submitted",
  physical_completed: "Marked Complete",
  under_review: "Under Review",
  revision_required: "Revision Required",
  revision_submitted: "Revision Submitted",
  approved: "Approved",
  payment_processing: "Payment Processing",
  paid: "Paid",
};

// =============================================
// MAIN COMPONENT
// =============================================

export default function EarningsPage() {
  const { toast } = useToast();

  // Profile state
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Rules state
  const [agreed, setAgreed] = useState(false);
  const [joining, setJoining] = useState(false);

  // Dashboard state
  const [availableTasks, setAvailableTasks] = useState<AvailableTask[]>([]);
  const [myTasks, setMyTasks] = useState<AvailableTask[]>([]);
  const [stats, setStats] = useState<EarningsSummary>({
    total_earned: 0,
    pending_amount: 0,
    tasks_completed: 0,
    tasks_in_progress: 0,
  });
  const [earnings, setEarnings] = useState<EarningsRecord[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Task stages
  const [taskStages, setTaskStages] = useState<Record<string, ReviewStage[]>>(
    {}
  );

  // Modal state
  const [acceptModal, setAcceptModal] = useState<AvailableTask | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState("");

  // File upload state for submissions
  const [uploadingTask, setUploadingTask] = useState<string | null>(null);
  const [submitFiles, setSubmitFiles] = useState<Record<string, File>>({});

  // Physical complete confirm
  const [physicalConfirm, setPhysicalConfirm] = useState<string | null>(null);
  const [completingPhysical, setCompletingPhysical] = useState(false);

  // Determine page state
  const isAgreed = profile?.worker_agreed === true;
  const isProfileComplete = profile?.worker_profile_complete === true;
  const isDashboard = isAgreed && isProfileComplete;

  // =============================================
  // DATA FETCHING
  // =============================================

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.profile) setProfile(data.profile);
    } catch {
      // ignore
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const fetchAvailableTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?filter=available");
      const data = await res.json();
      if (data.tasks) setAvailableTasks(data.tasks);
    } catch {
      // ignore
    }
  }, []);

  const fetchMyTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?filter=mine");
      const data = await res.json();
      if (data.tasks) setMyTasks(data.tasks);
    } catch {
      // ignore
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/earnings/summary");
      const data = await res.json();
      if (data.total_earned !== undefined) setStats(data);
    } catch {
      // ignore
    }
  }, []);

  const fetchEarnings = useCallback(async () => {
    try {
      const res = await fetch("/api/earnings/summary");
      const data = await res.json();
      if (data.total_earned !== undefined) {
        setEarnings([]);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchStagesForTask = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/stages`);
      const data = await res.json();
      if (data.stages) {
        setTaskStages((prev) => ({ ...prev, [taskId]: data.stages }));
      }
    } catch {
      // ignore
    }
  }, []);

  // =============================================
  // INITIAL LOAD + REALTIME
  // =============================================

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!isDashboard) return;

    setTasksLoading(true);
    Promise.all([
      fetchAvailableTasks(),
      fetchMyTasks(),
      fetchStats(),
      fetchEarnings(),
    ]).finally(() => setTasksLoading(false));
  }, [isDashboard, fetchAvailableTasks, fetchMyTasks, fetchStats, fetchEarnings]);

  // Fetch stages for each of my tasks
  useEffect(() => {
    myTasks.forEach((task) => {
      fetchStagesForTask(task.id);
    });
  }, [myTasks, fetchStagesForTask]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!isDashboard) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) return;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const channel = supabase
      .channel("worker-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "available_tasks" },
        () => {
          fetchAvailableTasks();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "task_review_stages" },
        (payload) => {
          const newStage = payload.new as ReviewStage;
          setTaskStages((prev) => ({
            ...prev,
            [newStage.task_id]: [
              ...(prev[newStage.task_id] || []),
              newStage,
            ],
          }));
          fetchMyTasks();
          fetchStats();
          toast({
            title: "Task Update",
            description: newStage.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isDashboard, fetchAvailableTasks, fetchMyTasks, fetchStats, toast]);

  // =============================================
  // HANDLERS
  // =============================================

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch("/api/worker/apply", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Terms accepted!",
          description: "Now complete your profile to start earning.",
        });
        setProfile((prev) =>
          prev ? { ...prev, worker_agreed: true } : prev
        );
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to join.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  const handleAcceptTask = async (task: AvailableTask) => {
    setAccepting(true);
    setAcceptError("");
    try {
      const res = await fetch(`/api/tasks/${task.id}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        // Immediately update local state
        setAvailableTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: "assigned" } : t
          )
        );
        setAcceptModal(null);
        toast({
          title: "Task accepted!",
          description: "Check My Tasks below.",
        });
        fetchMyTasks();
        fetchStats();
        // Scroll to my tasks
        setTimeout(() => {
          document
            .getElementById("my-tasks-section")
            ?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      } else {
        setAcceptError(
          data.error || "This task was just accepted by someone else."
        );
      }
    } catch {
      setAcceptError("Something went wrong. Try again.");
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}/decline`, { method: "POST" });
      setAvailableTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast({ title: "Task skipped" });
    } catch {
      // ignore
    }
  };

  const handleDigitalSubmit = async (taskId: string) => {
    const file = submitFiles[taskId];
    if (!file) return;

    setUploadingTask(taskId);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/tasks/${taskId}/submit`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Assignment submitted!",
          description: "Your work is now under review.",
        });
        setSubmitFiles((prev) => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
        fetchMyTasks();
        fetchStagesForTask(taskId);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to submit.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Upload failed.",
        variant: "destructive",
      });
    } finally {
      setUploadingTask(null);
    }
  };

  const handlePhysicalComplete = async (taskId: string) => {
    setCompletingPhysical(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/physical-complete`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Marked as complete!",
          description: "Our team will collect shortly.",
        });
        setPhysicalConfirm(null);
        fetchMyTasks();
        fetchStagesForTask(taskId);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setCompletingPhysical(false);
    }
  };

  // =============================================
  // ANIMATED STATS
  // =============================================

  const totalEarned = useCountUp(stats.total_earned, 1400, isDashboard);
  const tasksCompleted = useCountUp(stats.tasks_completed, 1200, isDashboard);
  const activeTasks = useCountUp(stats.tasks_in_progress, 1200, isDashboard);
  const pendingAmount = useCountUp(stats.pending_amount, 1400, isDashboard);

  // =============================================
  // LOADING STATE
  // =============================================

  if (profileLoading) {
    return (
      <motion.div {...pageEnter}>
        <div className="space-y-6 mt-10">
          <div className="skel h-8 w-48" style={{ borderRadius: "8px" }} />
          <div className="skel h-4 w-64" style={{ borderRadius: "6px" }} />
          <div className="skel h-64 w-full" style={{ borderRadius: "16px" }} />
        </div>
      </motion.div>
    );
  }

  // =============================================
  // STATE 1: RULES PAGE
  // =============================================

  if (!isAgreed) {
    return (
      <motion.div {...pageEnter}>
        <div>
          <span className="eyebrow">FREELANCER PROGRAM</span>
          <h1
            className="display mt-2"
            style={{ fontSize: "52px", color: "var(--t1)" }}
          >
            Earn While You Study
          </h1>
          <p
            className="font-outfit mt-1"
            style={{ fontSize: "14px", fontWeight: 300, color: "var(--t2)" }}
          >
            Complete assignments for students and earn ₹90–₹150 per task
          </p>
        </div>

        <div className="space-y-8 mt-10">
          {/* Earning highlights */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {[
              {
                top: "₹90–₹150",
                mid: "Per Task",
                bot: "Pay via UPI",
                accent: "s",
              },
              {
                top: "Same Day",
                mid: "Payment",
                bot: "After Review",
                accent: "g",
              },
              {
                top: "Work From",
                mid: "Your Room",
                bot: "No commute",
                accent: "p",
              },
            ].map((item) => (
              <motion.div
                key={item.mid}
                variants={fadeUp}
                className="text-center"
                style={{
                  padding: "24px 16px",
                  borderRadius: "14px",
                  background: "var(--hover-bg-subtle)",
                  border: "1px solid var(--b1)",
                }}
              >
                <p
                  className="display"
                  style={{
                    fontSize: "28px",
                    color: `var(--${item.accent})`,
                  }}
                >
                  {item.top}
                </p>
                <p
                  className="font-outfit mt-1"
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--t1)",
                  }}
                >
                  {item.mid}
                </p>
                <p
                  className="font-outfit"
                  style={{
                    fontSize: "11px",
                    color: "var(--t3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {item.bot}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Rules */}
          <div className="card" style={{ padding: "32px" }}>
            <div className="flex items-center gap-3 mb-6">
              <div
                className="flex items-center justify-center"
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "11px",
                  background: "rgba(255,71,87,0.08)",
                  border: "1px solid rgba(255,71,87,0.2)",
                }}
              >
                <Shield
                  className="h-5 w-5"
                  style={{ color: "var(--r)" }}
                />
              </div>
              <h2
                className="font-outfit font-bold text-lg"
                style={{ color: "var(--t1)" }}
              >
                Program Rules — Read Before Joining
              </h2>
            </div>

            <div
              className="space-y-3"
              style={{
                padding: "20px",
                borderRadius: "12px",
                background: "rgba(255,71,87,0.03)",
                border: "1px solid rgba(255,71,87,0.1)",
              }}
            >
              {rules.map((rule, i) => (
                <div key={i} className="flex gap-3">
                  <span
                    className="display shrink-0"
                    style={{
                      fontSize: "16px",
                      color: "var(--r)",
                      width: "28px",
                    }}
                  >
                    {i + 1}.
                  </span>
                  <p
                    className="font-outfit"
                    style={{
                      fontSize: "13px",
                      color: "var(--t2)",
                      lineHeight: "1.7",
                    }}
                  >
                    {rule}
                  </p>
                </div>
              ))}
            </div>

            {/* Agreement */}
            <label
              htmlFor="agree"
              className="flex items-center gap-3 mt-6 cursor-pointer"
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid var(--b1)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "20px",
                  height: "20px",
                  flexShrink: 0,
                }}
              >
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "6px",
                    border: `2px solid ${agreed ? "var(--p)" : "var(--b2)"}`,
                    background: agreed ? "var(--p)" : "transparent",
                    appearance: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                />
                {agreed && (
                  <svg
                    viewBox="0 0 12 12"
                    style={{
                      position: "absolute",
                      top: "4px",
                      left: "4px",
                      width: "12px",
                      height: "12px",
                      pointerEvents: "none",
                    }}
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="white"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span
                className="font-outfit"
                style={{ fontSize: "13px", color: "var(--t2)" }}
              >
                I have read and agree to all the terms above
              </span>
            </label>

            <div className="flex justify-end mt-5">
              <button
                onClick={handleJoin}
                disabled={!agreed || joining}
                className="btn btn-p"
                style={{
                  padding: "10px 24px",
                  fontSize: "13px",
                  opacity: !agreed || joining ? 0.4 : 1,
                  cursor: !agreed || joining ? "not-allowed" : "pointer",
                }}
              >
                {joining ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    Continue to Profile Setup
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // =============================================
  // STATE 2: PROFILE SETUP FORM
  // =============================================

  if (isAgreed && !isProfileComplete) {
    return <ProfileSetupForm onSuccess={() => fetchProfile()} />;
  }

  // =============================================
  // STATE 3: EARNINGS DASHBOARD
  // =============================================

  return (
    <motion.div {...pageEnter}>
      <div>
        <span className="eyebrow">FREELANCER</span>
        <h1
          className="display mt-2"
          style={{ fontSize: "52px", color: "var(--t1)" }}
        >
          Earnings
        </h1>
        <p
          className="font-outfit mt-1"
          style={{ fontSize: "14px", fontWeight: 300, color: "var(--t2)" }}
        >
          Manage your tasks and earnings
        </p>
      </div>

      <div className="space-y-10 mt-10">
        {/* SECTION A: Stats */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            {
              value: `₹${totalEarned}`,
              label: "TOTAL EARNED",
              color: "var(--g)",
            },
            {
              value: String(tasksCompleted),
              label: "TASKS COMPLETED",
              color: "var(--p-bright)",
            },
            {
              value: String(activeTasks),
              label: "ACTIVE TASKS",
              color: "var(--s)",
            },
            {
              value: `₹${pendingAmount}`,
              label: "PENDING PAYOUT",
              color: "#818cf8",
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="card text-center"
              style={{ padding: "28px 20px" }}
            >
              <p
                className="display"
                style={{ fontSize: "42px", color: stat.color }}
              >
                {stat.value}
              </p>
              <p
                className="font-outfit font-semibold uppercase mt-1"
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  color: "var(--t3)",
                }}
              >
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* SECTION B: Available Tasks */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <span className="eyebrow">OPEN ASSIGNMENTS</span>
              <h2
                className="font-outfit font-bold text-[22px] mt-1.5"
                style={{ color: "var(--t1)" }}
              >
                Available Tasks
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "var(--g)",
                  animation: "dotPulse 2s ease infinite",
                }}
              />
              <span
                className="font-outfit font-semibold text-xs uppercase"
                style={{
                  color: "var(--g)",
                  letterSpacing: "0.1em",
                }}
              >
                LIVE
              </span>
            </div>
          </div>
          <p
            className="font-outfit mt-1"
            style={{ fontSize: "13px", color: "var(--t3)" }}
          >
            Accept a task before someone else does. Tasks update in real-time.
          </p>

          {tasksLoading ? (
            <div className="space-y-3 mt-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card" style={{ padding: "24px" }}>
                  <div
                    className="skel h-20 w-full"
                    style={{ borderRadius: "10px" }}
                  />
                </div>
              ))}
            </div>
          ) : availableTasks.length === 0 ? (
            <div
              className="card mt-5 text-center"
              style={{ padding: "60px 40px" }}
            >
              <FileSearch
                className="h-10 w-10 mx-auto mb-3"
                style={{ color: "var(--t3)" }}
              />
              <p
                className="font-outfit font-semibold"
                style={{ color: "var(--t1)" }}
              >
                No tasks available right now
              </p>
              <p
                className="font-outfit text-sm mt-1"
                style={{ color: "var(--t3)" }}
              >
                New assignments are posted regularly. Check back soon or refresh
                the page.
              </p>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-3 mt-5"
            >
              {availableTasks.map((task) => (
                <motion.div key={task.id} variants={fadeUp}>
                  <div
                    className="card card-hover relative overflow-hidden"
                    style={{ padding: "24px" }}
                  >
                    {/* Already assigned overlay */}
                    {task.status === "assigned" && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(4,3,13,0.75)",
                          backdropFilter: "blur(3px)",
                          borderRadius: "inherit",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 10,
                        }}
                      >
                        <div
                          style={{
                            background: "rgba(255,71,87,0.15)",
                            border: "1px solid rgba(255,71,87,0.3)",
                            borderRadius: "10px",
                            padding: "12px 24px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Lock
                            className="h-5 w-5"
                            style={{ color: "var(--r)" }}
                          />
                          <span
                            className="font-outfit font-bold text-sm"
                            style={{ color: "var(--r)" }}
                          >
                            ALREADY ASSIGNED
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Header row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-outfit font-semibold text-xs px-2.5 py-1 rounded-md"
                          style={{
                            background: `${serviceColorMap[task.service_type] || "var(--t3)"}15`,
                            color:
                              serviceColorMap[task.service_type] || "var(--t3)",
                            border: `1px solid ${serviceColorMap[task.service_type] || "var(--t3)"}30`,
                          }}
                        >
                          {serviceLabelsMap[task.service_type] ||
                            task.service_type}
                        </span>
                        <span
                          className="font-outfit font-semibold text-xs px-2.5 py-1 rounded-md"
                          style={{
                            background:
                              task.delivery_type === "digital"
                                ? "rgba(96,165,250,0.1)"
                                : "rgba(251,191,36,0.1)",
                            color:
                              task.delivery_type === "digital"
                                ? "#60a5fa"
                                : "#fbbf24",
                            border: `1px solid ${task.delivery_type === "digital" ? "rgba(96,165,250,0.25)" : "rgba(251,191,36,0.25)"}`,
                          }}
                        >
                          {task.delivery_type === "digital"
                            ? "DIGITAL"
                            : "PHYSICAL"}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className="display"
                          style={{
                            fontSize: "32px",
                            color: "var(--g)",
                          }}
                        >
                          ₹{task.worker_pay}
                        </p>
                        <p
                          className="font-outfit"
                          style={{
                            fontSize: "10px",
                            color: "var(--t3)",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                          }}
                        >
                          Your earning
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="mt-3">
                      <p
                        className="font-outfit font-bold text-lg"
                        style={{ color: "var(--t1)" }}
                      >
                        {task.title}
                      </p>
                      <p
                        className="font-outfit mt-0.5"
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "var(--t2)",
                        }}
                      >
                        {task.subject} &middot; {task.degree} &middot; Sem{" "}
                        {task.semester}
                      </p>
                      {task.description && (
                        <p
                          className="font-outfit mt-2"
                          style={{
                            fontSize: "14px",
                            color: "var(--t3)",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {task.description}
                        </p>
                      )}
                      {task.page_count && (
                        <span
                          className="font-outfit text-xs px-2 py-0.5 rounded mt-2 inline-block"
                          style={{
                            background: "var(--hover-bg)",
                            color: "var(--t2)",
                            border: "1px solid var(--b1)",
                          }}
                        >
                          ~{task.page_count} pages
                        </span>
                      )}
                    </div>

                    {/* Deadline */}
                    <div className="mt-4">
                      <p
                        className="font-outfit font-semibold text-xs uppercase mb-1"
                        style={{
                          color: "var(--t3)",
                          letterSpacing: "0.1em",
                        }}
                      >
                        SUBMISSION DEADLINE
                      </p>
                      <DeadlineTimer
                        deadline={task.deadline}
                        size="md"
                      />
                      <p
                        className="font-outfit mt-1"
                        style={{
                          fontSize: "11px",
                          color: "var(--t4)",
                        }}
                      >
                        Submit before this time to avoid ban
                      </p>
                    </div>

                    {/* Actions */}
                    {task.status === "available" && (
                      <div className="flex items-center justify-end gap-3 mt-5">
                        <button
                          onClick={() => handleDeclineTask(task.id)}
                          className="btn btn-ghost"
                          style={{
                            fontSize: "13px",
                            padding: "8px 16px",
                          }}
                        >
                          <X className="h-3.5 w-3.5" /> Decline
                        </button>
                        <button
                          onClick={() => setAcceptModal(task)}
                          className="btn btn-p"
                          style={{
                            fontSize: "13px",
                            padding: "8px 20px",
                          }}
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Accept
                          Task
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Posted time */}
                    <p
                      className="font-outfit mt-4"
                      style={{
                        fontSize: "11px",
                        color: "var(--t4)",
                      }}
                    >
                      Posted {timeAgo(task.created_at)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* SECTION C: My Tasks */}
        <div id="my-tasks-section">
          <span className="eyebrow">MY ASSIGNMENTS</span>
          <h2
            className="font-outfit font-bold text-[22px] mt-1.5"
            style={{ color: "var(--t1)" }}
          >
            My Tasks
          </h2>

          {myTasks.length === 0 ? (
            <div
              className="card mt-5 text-center"
              style={{ padding: "48px 40px" }}
            >
              <p
                className="font-outfit font-semibold"
                style={{ color: "var(--t1)" }}
              >
                You haven&apos;t accepted any tasks yet
              </p>
              <p
                className="font-outfit text-sm mt-1"
                style={{ color: "var(--t3)" }}
              >
                Accept a task from Available Tasks below to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4 mt-5">
              {myTasks.map((task) => {
                const stages = taskStages[task.id] || [];
                const statusBorderColor =
                  task.status === "assigned"
                    ? "var(--p)"
                    : task.status === "submitted" ||
                        task.status === "under_review"
                      ? "var(--s)"
                      : task.status === "revision_required"
                        ? "var(--r)"
                        : "var(--g)";

                const deadlineDiff =
                  new Date(task.deadline).getTime() - Date.now();
                const isUrgentDeadline =
                  deadlineDiff < 6 * 3600000 && deadlineDiff > 0;
                const canSubmitDigital =
                  task.delivery_type === "digital" &&
                  (task.status === "assigned" ||
                    task.status === "revision_required") &&
                  deadlineDiff > 0;
                const canCompletePhysical =
                  task.delivery_type === "physical" &&
                  task.status === "assigned";

                return (
                  <motion.div key={task.id} variants={fadeUp}>
                    <div
                      className="card"
                      style={{
                        padding: "28px",
                        borderLeft: `3px solid ${statusBorderColor}`,
                      }}
                    >
                      {/* Task summary */}
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <p
                            className="font-outfit font-bold text-lg"
                            style={{ color: "var(--t1)" }}
                          >
                            {task.title}
                          </p>
                          <p
                            className="font-outfit mt-0.5"
                            style={{
                              fontSize: "14px",
                              color: "var(--t2)",
                            }}
                          >
                            {task.subject} &middot; {task.degree} &middot; Sem{" "}
                            {task.semester}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span
                              className="font-outfit font-semibold text-xs px-2.5 py-1 rounded-md"
                              style={{
                                background: `${serviceColorMap[task.service_type] || "var(--t3)"}15`,
                                color:
                                  serviceColorMap[task.service_type] ||
                                  "var(--t3)",
                                border: `1px solid ${serviceColorMap[task.service_type] || "var(--t3)"}30`,
                              }}
                            >
                              {serviceLabelsMap[task.service_type] ||
                                task.service_type}
                            </span>
                            <span
                              className="font-outfit font-semibold text-xs px-2.5 py-1 rounded-md"
                              style={{
                                background:
                                  task.delivery_type === "digital"
                                    ? "rgba(96,165,250,0.1)"
                                    : "rgba(251,191,36,0.1)",
                                color:
                                  task.delivery_type === "digital"
                                    ? "#60a5fa"
                                    : "#fbbf24",
                                border: `1px solid ${task.delivery_type === "digital" ? "rgba(96,165,250,0.25)" : "rgba(251,191,36,0.25)"}`,
                              }}
                            >
                              {task.delivery_type === "digital"
                                ? "DIGITAL"
                                : "PHYSICAL"}
                            </span>
                          </div>
                        </div>
                        <p
                          className="font-outfit font-bold"
                          style={{ fontSize: "14px", color: "var(--g)" }}
                        >
                          Your earning: ₹{task.worker_pay}
                        </p>
                      </div>

                      {/* Deadline */}
                      <div className="mt-5">
                        <DeadlineTimer
                          deadline={task.deadline}
                          size="lg"
                        />
                      </div>

                      {/* Urgent warning */}
                      {isUrgentDeadline &&
                        task.status !== "submitted" &&
                        task.status !== "under_review" &&
                        task.status !== "approved" &&
                        task.status !== "payment_processing" &&
                        task.status !== "paid" && (
                          <div
                            className="mt-3 animate-pulse"
                            style={{
                              background: "var(--r-dim)",
                              border: "1px solid var(--r-border)",
                              borderRadius: "10px",
                              padding: "10px 16px",
                            }}
                          >
                            <p
                              className="font-outfit font-bold text-sm"
                              style={{ color: "var(--r)" }}
                            >
                              URGENT: Submit before deadline or risk permanent
                              ban
                            </p>
                          </div>
                        )}

                      {/* Review Stages Stepper */}
                      {stages.length > 0 && (
                        <div className="mt-6">
                          <p
                            className="font-outfit font-semibold text-xs uppercase mb-4"
                            style={{
                              color: "var(--t3)",
                              letterSpacing: "0.1em",
                            }}
                          >
                            PROGRESS
                          </p>
                          <div className="space-y-0">
                            {stages.map((stage, idx) => {
                              const isLast = idx === stages.length - 1;
                              const isRevision =
                                stage.stage === "revision_required";
                              const isPaid = stage.stage === "paid";
                              const isApproved = stage.stage === "approved";

                              return (
                                <div
                                  key={stage.id}
                                  className="flex gap-3"
                                >
                                  {/* Timeline */}
                                  <div className="flex flex-col items-center">
                                    <div
                                      style={{
                                        width: "12px",
                                        height: "12px",
                                        borderRadius: "50%",
                                        background: isLast
                                          ? isRevision
                                            ? "var(--r)"
                                            : "var(--p)"
                                          : "var(--g)",
                                        border: isLast
                                          ? "none"
                                          : "none",
                                        flexShrink: 0,
                                        marginTop: "4px",
                                        animation: isLast
                                          ? "dotPulse 2s ease infinite"
                                          : "none",
                                      }}
                                    />
                                    {idx < stages.length - 1 && (
                                      <div
                                        style={{
                                          width: "2px",
                                          flex: 1,
                                          minHeight: "24px",
                                          background: "var(--b2)",
                                        }}
                                      />
                                    )}
                                  </div>
                                  {/* Content */}
                                  <div
                                    style={{
                                      paddingBottom:
                                        idx < stages.length - 1
                                          ? "16px"
                                          : "0",
                                    }}
                                  >
                                    <p
                                      className="font-outfit font-semibold"
                                      style={{
                                        fontSize: "15px",
                                        color: isLast
                                          ? isRevision
                                            ? "var(--r)"
                                            : isApproved || isPaid
                                              ? "var(--g)"
                                              : "var(--p-bright)"
                                          : "var(--t1)",
                                      }}
                                    >
                                      {stageLabels[stage.stage] ||
                                        stage.stage}
                                    </p>
                                    <p
                                      className="font-outfit mt-0.5"
                                      style={{
                                        fontSize: isLast
                                          ? "14px"
                                          : "13px",
                                        color: isLast
                                          ? "var(--t1)"
                                          : "var(--t2)",
                                        fontWeight: isLast ? 500 : 400,
                                      }}
                                    >
                                      {stage.message}
                                    </p>
                                    {isRevision &&
                                      task.revision_count > 0 && (
                                        <p
                                          className="font-outfit mt-1"
                                          style={{
                                            fontSize: "12px",
                                            color: "var(--r)",
                                          }}
                                        >
                                          Revision {task.revision_count} of
                                          3
                                        </p>
                                      )}
                                    <p
                                      className="mono mt-1"
                                      style={{
                                        fontSize: "11px",
                                        color: "var(--t3)",
                                      }}
                                    >
                                      {formatIST(stage.created_at)}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Digital Upload */}
                      {canSubmitDigital && (
                        <div
                          className="mt-6"
                          style={{
                            border: "2px dashed var(--p-border)",
                            borderRadius: "14px",
                            padding: "28px",
                          }}
                        >
                          <p
                            className="font-outfit font-bold text-base"
                            style={{ color: "var(--t1)" }}
                          >
                            {task.status === "revision_required"
                              ? "Upload Revised Assignment"
                              : "Upload Your Assignment"}
                          </p>
                          <p
                            className="font-outfit text-sm mt-1"
                            style={{ color: "var(--t3)" }}
                          >
                            {task.status === "revision_required"
                              ? `Revision ${task.revision_count} of 3 — Upload your corrected work`
                              : "PDF, DOCX, PPTX, ZIP accepted"}
                          </p>

                          <div className="flex items-center gap-3 mt-4">
                            <label
                              className="btn btn-ghost flex-1 justify-center cursor-pointer"
                              style={{ fontSize: "13px" }}
                            >
                              <Upload className="h-4 w-4" />
                              {submitFiles[task.id]
                                ? submitFiles[task.id].name
                                : "Choose File"}
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.docx,.pptx,.zip,.doc,.ppt"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f)
                                    setSubmitFiles((prev) => ({
                                      ...prev,
                                      [task.id]: f,
                                    }));
                                }}
                              />
                            </label>
                            <button
                              className="btn btn-p"
                              style={{
                                fontSize: "13px",
                                padding: "10px 20px",
                              }}
                              disabled={
                                !submitFiles[task.id] ||
                                uploadingTask === task.id
                              }
                              onClick={() => handleDigitalSubmit(task.id)}
                            >
                              {uploadingTask === task.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  Submit Assignment
                                  <ArrowRight className="h-4 w-4" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Physical Complete */}
                      {canCompletePhysical && (
                        <div
                          className="mt-6"
                          style={{
                            background: "var(--g-dim)",
                            border: "1px solid var(--g-border)",
                            borderRadius: "14px",
                            padding: "24px",
                          }}
                        >
                          <p
                            className="font-outfit font-bold text-base"
                            style={{ color: "var(--t1)" }}
                          >
                            Done writing the assignment?
                          </p>
                          <p
                            className="font-outfit text-sm mt-1"
                            style={{ color: "var(--t2)" }}
                          >
                            Press the button when your handwritten assignment is
                            complete and ready for collection.
                          </p>
                          <p
                            className="font-outfit text-xs mt-2"
                            style={{ color: "var(--s)" }}
                          >
                            Be in your room after pressing this. Our team will
                            come to collect within a few hours.
                          </p>

                          {physicalConfirm === task.id ? (
                            <div className="mt-4 flex items-center gap-3">
                              <p
                                className="font-outfit text-sm font-semibold"
                                style={{ color: "var(--t1)" }}
                              >
                                Is your assignment fully complete?
                              </p>
                              <button
                                className="btn btn-ghost"
                                style={{
                                  fontSize: "12px",
                                  padding: "8px 14px",
                                }}
                                onClick={() => setPhysicalConfirm(null)}
                              >
                                Not yet
                              </button>
                              <button
                                className="btn btn-green"
                                style={{
                                  fontSize: "12px",
                                  padding: "8px 14px",
                                }}
                                disabled={completingPhysical}
                                onClick={() =>
                                  handlePhysicalComplete(task.id)
                                }
                              >
                                {completingPhysical ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Yes, collect it"
                                )}
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn btn-green mt-4"
                              style={{
                                fontSize: "13px",
                                padding: "10px 20px",
                              }}
                              onClick={() =>
                                setPhysicalConfirm(task.id)
                              }
                            >
                              <CheckCircle className="h-4 w-4" /> Mark as
                              Completed
                            </button>
                          )}
                        </div>
                      )}

                      {/* Payment status */}
                      {(task.status === "approved" ||
                        task.status === "payment_processing") && (
                        <div
                          className="mt-6"
                          style={{
                            background: "var(--g-dim)",
                            border: "1px solid var(--g-border)",
                            borderRadius: "14px",
                            padding: "24px",
                            textAlign: "center",
                          }}
                        >
                          <p
                            className="font-outfit font-bold text-lg"
                            style={{ color: "var(--g)" }}
                          >
                            Assignment Approved!
                          </p>
                          <p
                            className="font-outfit text-sm mt-1"
                            style={{ color: "var(--t2)" }}
                          >
                            Payment of ₹{task.worker_pay} is being sent to your
                            UPI. Usually within 24 hours.
                          </p>
                        </div>
                      )}

                      {task.status === "paid" && (
                        <div
                          className="mt-6"
                          style={{
                            background: "var(--g-dim)",
                            border: "1px solid var(--g-border)",
                            borderRadius: "14px",
                            padding: "24px",
                            textAlign: "center",
                            boxShadow: "0 0 40px rgba(34,217,138,0.1)",
                          }}
                        >
                          <p
                            className="font-outfit font-bold text-lg"
                            style={{ color: "var(--g)" }}
                          >
                            Payment Complete!
                          </p>
                          <p
                            className="font-outfit text-sm mt-1"
                            style={{ color: "var(--t2)" }}
                          >
                            ₹{task.worker_pay} has been sent to your UPI
                            account.
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION D: Task Activity */}
        <div>
          <span className="eyebrow">TRACK RECORD</span>
          <h2
            className="font-outfit font-bold text-[22px] mt-1.5"
            style={{ color: "var(--t1)" }}
          >
            Task Activity
          </h2>

          {myTasks.length === 0 ? (
            <div
              className="card mt-5 text-center"
              style={{ padding: "48px 40px" }}
            >
              <Wallet
                className="h-8 w-8 mx-auto mb-2"
                style={{ color: "var(--t3)" }}
              />
              <p
                className="font-outfit font-semibold"
                style={{ color: "var(--t1)" }}
              >
                No task activity yet
              </p>
              <p
                className="font-outfit text-sm mt-1"
                style={{ color: "var(--t3)" }}
              >
                Accept a task to see your activity here
              </p>
            </div>
          ) : (
            <div className="space-y-2 mt-5">
              {myTasks.map((task) => {
                const statusConfig: Record<string, { label: string; bg: string; color: string; border: string }> = {
                  assigned: { label: "In Progress", bg: "rgba(232,114,42,0.08)", color: "var(--p)", border: "rgba(232,114,42,0.2)" },
                  submitted: { label: "Submitted", bg: "rgba(96,165,250,0.08)", color: "#60a5fa", border: "rgba(96,165,250,0.2)" },
                  under_review: { label: "Under Review", bg: "rgba(244,149,78,0.08)", color: "var(--s)", border: "rgba(244,149,78,0.2)" },
                  revision_required: { label: "Revision", bg: "rgba(255,71,87,0.08)", color: "var(--r)", border: "rgba(255,71,87,0.2)" },
                  approved: { label: "Approved", bg: "rgba(34,217,138,0.08)", color: "var(--g)", border: "rgba(34,217,138,0.2)" },
                  payment_processing: { label: "Processing", bg: "rgba(244,149,78,0.08)", color: "var(--s)", border: "rgba(244,149,78,0.2)" },
                  paid: { label: "Paid", bg: "rgba(34,217,138,0.08)", color: "var(--g)", border: "rgba(34,217,138,0.2)" },
                };
                const cfg = statusConfig[task.status] || { label: task.status, bg: "var(--hover-bg)", color: "var(--t3)", border: "var(--b1)" };

                return (
                  <div
                    key={task.id}
                    className="card flex items-center justify-between gap-3"
                    style={{ padding: "16px 20px" }}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="font-outfit font-semibold text-sm truncate"
                        style={{ color: "var(--t1)" }}
                      >
                        {task.title}
                      </p>
                      <p
                        className="font-outfit text-xs truncate"
                        style={{ color: "var(--t3)" }}
                      >
                        {task.subject} &middot; {serviceLabelsMap[task.service_type] || task.service_type}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className="font-outfit font-semibold text-xs px-2.5 py-1 rounded-md"
                        style={{
                          background: cfg.bg,
                          color: cfg.color,
                          border: `1px solid ${cfg.border}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cfg.label}
                      </span>
                      <p
                        className="font-outfit font-bold"
                        style={{
                          fontSize: "15px",
                          color: task.status === "paid" ? "var(--g)" : "var(--t2)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ₹{task.worker_pay}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ACCEPT CONFIRMATION MODAL — rendered via portal to escape transform context */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {acceptModal && (
              <AcceptModal
                task={acceptModal}
                profile={profile!}
                accepting={accepting}
                error={acceptError}
                onAccept={() => handleAcceptTask(acceptModal)}
                onClose={() => {
                  setAcceptModal(null);
                  setAcceptError("");
                }}
              />
            )}
          </AnimatePresence>,
          document.body
        )}
    </motion.div>
  );
}

// =============================================
// PROFILE SETUP FORM COMPONENT
// =============================================

function ProfileSetupForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form fields
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [university, setUniversity] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [degree, setDegree] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [accommodationType, setAccommodationType] = useState<
    "tower" | "block" | ""
  >("");
  const [towerNo, setTowerNo] = useState<number | null>(null);
  const [towerRoomNo, setTowerRoomNo] = useState("");
  const [blockNo, setBlockNo] = useState("");
  const [blockRoomNo, setBlockRoomNo] = useState("");
  const [upiFile, setUpiFile] = useState<File | null>(null);
  const [upiPreview, setUpiPreview] = useState<string | null>(null);

  // Pre-fill from existing profile
  useEffect(() => {
    async function prefill() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (data.profile) {
          if (data.profile.college_name && !university) {
            setUniversity(data.profile.college_name);
          }
          if (data.profile.full_name && !fullName) {
            setFullName(data.profile.full_name);
          }
        }
      } catch {
        // ignore
      }
    }
    prefill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cascading specializations
  const specializations = degree ? getSpecializations(degree) : [];

  const handleDegreeChange = (val: string) => {
    setDegree(val);
    setSpecialization("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          upi_qr: "File must be under 5MB",
        }));
        return;
      }
      setUpiFile(file);
      setUpiPreview(URL.createObjectURL(file));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.upi_qr;
        return next;
      });
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.full_name = "Full name is required";
    if (!contact.trim() || !/^\d{10}$/.test(contact.replace(/\D/g, "")))
      errs.contact = "Valid 10-digit phone number required";
    if (!university.trim()) errs.university = "University is required";
    if (!rollNo.trim()) errs.roll_no = "Roll number is required";
    if (!degree) errs.degree = "Select your degree";
    if (!specialization) errs.specialization = "Select specialization";
    if (!accommodationType)
      errs.accommodation = "Select your accommodation type";
    if (accommodationType === "tower") {
      if (!towerNo) errs.tower_no = "Select your tower";
      if (!towerRoomNo.trim()) errs.tower_room = "Room number is required";
    }
    if (accommodationType === "block") {
      if (!blockNo.trim()) errs.block_no = "Block number is required";
      if (!blockRoomNo.trim()) errs.block_room = "Room number is required";
    }
    if (!upiFile) errs.upi_qr = "Upload your UPI QR code";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("worker_full_name", fullName.trim());
      formData.append("worker_contact", contact.trim());
      formData.append("worker_university", university.trim());
      formData.append("worker_roll_no", rollNo.trim());
      formData.append("worker_degree", degree);
      formData.append("worker_specialization", specialization);
      formData.append("accommodation_type", accommodationType);

      if (accommodationType === "tower") {
        formData.append("tower_no", String(towerNo));
        formData.append("tower_room_no", towerRoomNo.trim());
      } else {
        formData.append("block_no", blockNo.trim());
        formData.append("block_room_no", blockRoomNo.trim());
      }

      formData.append("upi_qr", upiFile!);

      const res = await fetch("/api/worker/setup-profile", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Profile saved!",
          description: "Welcome to the Freelancer Program",
        });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save profile.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div {...pageEnter}>
      <div>
        <span className="eyebrow">ONE-TIME SETUP</span>
        <h1
          className="display mt-2"
          style={{ fontSize: "44px", color: "var(--t1)" }}
        >
          Complete Your Freelancer Profile
        </h1>
        <p
          className="font-outfit mt-1"
          style={{ fontSize: "14px", fontWeight: 300, color: "var(--t2)" }}
        >
          Fill in your details once. Used for task delivery and payment.
        </p>
      </div>

      <div className="card mt-8" style={{ padding: "40px" }}>
        {/* Group 1: Personal Information */}
        <p
          className="eyebrow mb-6"
          style={{ fontSize: "11px", letterSpacing: "0.15em" }}
        >
          PERSONAL INFORMATION
        </p>

        <div className="space-y-5">
          <FieldInput
            label="FULL NAME"
            value={fullName}
            onChange={setFullName}
            placeholder="Your full name as on college ID"
            error={errors.full_name}
          />
          <FieldInput
            label="CONTACT NUMBER"
            type="tel"
            value={contact}
            onChange={setContact}
            placeholder="+91 XXXXX XXXXX"
            error={errors.contact}
          />
          <FieldInput
            label="UNIVERSITY / COLLEGE NAME"
            value={university}
            onChange={setUniversity}
            placeholder="Full name of your institution"
            error={errors.university}
            readOnly={!!university}
          />
          <FieldInput
            label="ROLL NUMBER"
            value={rollNo}
            onChange={setRollNo}
            placeholder="Your university roll number"
            error={errors.roll_no}
          />
        </div>

        {/* Group 2: Academic Details */}
        <p
          className="eyebrow mb-6 mt-10"
          style={{ fontSize: "11px", letterSpacing: "0.15em" }}
        >
          ACADEMIC DETAILS
        </p>

        <div className="space-y-5">
          {/* Degree dropdown */}
          <div>
            <label className="field-label">DEGREE PROGRAM</label>
            <Select
              value={degree}
              onValueChange={(val) => handleDegreeChange(val)}
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
            {errors.degree && (
              <p
                className="font-outfit text-xs mt-1"
                style={{ color: "var(--r)" }}
              >
                {errors.degree}
              </p>
            )}
          </div>

          {/* Specialization dropdown */}
          <div>
            <label className="field-label">SPECIALIZATION</label>
            <Select
              value={specialization}
              onValueChange={(val) => setSpecialization(val)}
              disabled={!degree}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    degree ? "Select specialization" : "Select degree first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {specializations.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.specialization && (
              <p
                className="font-outfit text-xs mt-1"
                style={{ color: "var(--r)" }}
              >
                {errors.specialization}
              </p>
            )}
          </div>
        </div>

        {/* Group 3: Location */}
        <p
          className="eyebrow mb-2 mt-10"
          style={{ fontSize: "11px", letterSpacing: "0.15em" }}
        >
          YOUR LOCATION
        </p>
        <p
          className="font-outfit mb-6"
          style={{ fontSize: "12px", color: "var(--t3)" }}
        >
          Required for physical assignment pickup/delivery
        </p>

        {/* Accommodation type radio cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              value: "tower" as const,
              icon: Building,
              title: "I live in a Tower",
              sub: "Tower 1, 2, 3, 4 or 5",
            },
            {
              value: "block" as const,
              icon: Home,
              title: "I live in a Block or Off-campus",
              sub: "Block number + room",
            },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAccommodationType(opt.value)}
              style={{
                padding: "20px",
                borderRadius: "14px",
                border: `1px solid ${accommodationType === opt.value ? "var(--p)" : "var(--b2)"}`,
                background:
                  accommodationType === opt.value
                    ? "var(--p-dim)"
                    : "transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
                boxShadow:
                  accommodationType === opt.value
                    ? "0 0 20px var(--p-glow)"
                    : "none",
              }}
            >
              <opt.icon
                className="h-6 w-6 mb-2"
                style={{
                  color:
                    accommodationType === opt.value
                      ? "var(--p)"
                      : "var(--t3)",
                }}
              />
              <p
                className="font-outfit font-semibold text-sm"
                style={{ color: "var(--t1)" }}
              >
                {opt.title}
              </p>
              <p
                className="font-outfit text-xs mt-0.5"
                style={{ color: "var(--t3)" }}
              >
                {opt.sub}
              </p>
            </button>
          ))}
        </div>
        {errors.accommodation && (
          <p
            className="font-outfit text-xs mt-1"
            style={{ color: "var(--r)" }}
          >
            {errors.accommodation}
          </p>
        )}

        {/* Tower fields */}
        {accommodationType === "tower" && (
          <div className="space-y-5 mt-5">
            <div>
              <label className="field-label">SELECT TOWER</label>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTowerNo(num)}
                    style={{
                      padding: "12px 20px",
                      borderRadius: "10px",
                      border: `1px solid ${towerNo === num ? "var(--p)" : "var(--b2)"}`,
                      background:
                        towerNo === num ? "var(--p)" : "transparent",
                      color: towerNo === num ? "white" : "var(--t1)",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 600,
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow:
                        towerNo === num
                          ? "0 0 20px var(--p-glow)"
                          : "none",
                    }}
                  >
                    Tower {num}
                  </button>
                ))}
              </div>
              {errors.tower_no && (
                <p
                  className="font-outfit text-xs mt-1"
                  style={{ color: "var(--r)" }}
                >
                  {errors.tower_no}
                </p>
              )}
            </div>
            <FieldInput
              label="ROOM NUMBER"
              value={towerRoomNo}
              onChange={setTowerRoomNo}
              placeholder="e.g. 304, 112A, B-205"
              error={errors.tower_room}
            />
          </div>
        )}

        {/* Block fields */}
        {accommodationType === "block" && (
          <div className="space-y-5 mt-5">
            <FieldInput
              label="BLOCK NUMBER / NAME"
              value={blockNo}
              onChange={setBlockNo}
              placeholder="e.g. A, B, Block 3, Lotus Block"
              error={errors.block_no}
            />
            <FieldInput
              label="ROOM NUMBER"
              value={blockRoomNo}
              onChange={setBlockRoomNo}
              placeholder="e.g. 204, G-12, Room 15"
              error={errors.block_room}
            />
          </div>
        )}

        {/* Group 4: Payment */}
        <p
          className="eyebrow mb-2 mt-10"
          style={{ fontSize: "11px", letterSpacing: "0.15em" }}
        >
          PAYMENT DETAILS
        </p>

        <div>
          <label className="field-label">YOUR UPI QR CODE SCREENSHOT</label>
          <p
            className="font-outfit mb-3"
            style={{ fontSize: "12px", color: "var(--t3)" }}
          >
            Upload a clear screenshot of your UPI QR from GPay, PhonePe, Paytm,
            or any UPI app. We use this to send your payment.
          </p>

          <label
            className="block cursor-pointer"
            style={{
              border: `2px dashed ${errors.upi_qr ? "var(--r-border)" : "var(--b2)"}`,
              borderRadius: "14px",
              padding: "40px",
              textAlign: "center",
              transition: "all 0.25s",
            }}
          >
            {upiPreview ? (
              <div className="flex flex-col items-center gap-3">
                <img
                  src={upiPreview}
                  alt="UPI QR Preview"
                  style={{
                    width: "120px",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "10px",
                    border: "1px solid var(--b2)",
                  }}
                />
                <p
                  className="font-outfit text-sm"
                  style={{ color: "var(--g)" }}
                >
                  {upiFile?.name}
                </p>
                <p
                  className="font-outfit text-xs"
                  style={{ color: "var(--t3)" }}
                >
                  Click to change
                </p>
              </div>
            ) : (
              <>
                <Upload
                  className="h-8 w-8 mx-auto mb-2"
                  style={{ color: "var(--t3)" }}
                />
                <p
                  className="font-outfit text-sm"
                  style={{ color: "var(--t2)" }}
                >
                  Tap or drag to upload QR code
                </p>
                <p
                  className="font-outfit text-xs mt-1"
                  style={{ color: "var(--t4)" }}
                >
                  PNG, JPG, JPEG accepted &middot; Max 5MB
                </p>
              </>
            )}
            <input
              type="file"
              className="hidden"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
            />
          </label>
          {errors.upi_qr && (
            <p
              className="font-outfit text-xs mt-1"
              style={{ color: "var(--r)" }}
            >
              {errors.upi_qr}
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end mt-8">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-p"
            style={{
              padding: "10px 24px",
              fontSize: "13px",
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save Profile & Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================
// FIELD INPUT COMPONENT
// =============================================

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => !readOnly && onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: "10px",
          background: readOnly ? "var(--hover-bg-subtle)" : "var(--input-bg)",
          border: `1px solid ${error ? "var(--r)" : "var(--b2)"}`,
          color: readOnly ? "var(--t3)" : "var(--t1)",
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          outline: "none",
          transition: "border-color 0.2s",
          cursor: readOnly ? "not-allowed" : "text",
        }}
      />
      {error && (
        <p
          className="font-outfit text-xs mt-1"
          style={{ color: "var(--r)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// =============================================
// ACCEPT CONFIRMATION MODAL
// =============================================

function AcceptModal({
  task,
  profile,
  accepting,
  error,
  onAccept,
  onClose,
}: {
  task: AvailableTask;
  profile: WorkerProfile;
  accepting: boolean;
  error: string;
  onAccept: () => void;
  onClose: () => void;
}) {
  const location =
    profile.accommodation_type === "tower"
      ? `Tower ${profile.tower_no} — Room ${profile.tower_room_no}`
      : `Block ${profile.block_no} — Room ${profile.block_room_no}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col"
        style={{
          maxWidth: "440px",
          width: "100%",
          maxHeight: "85vh",
          background: "var(--surface)",
          border: "1px solid var(--b2)",
          borderRadius: "16px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        {/* Fixed Header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--b1)",
          }}
        >
          <div>
            <h2
              className="display"
              style={{ fontSize: "18px", color: "var(--t1)" }}
            >
              Confirm Acceptance
            </h2>
            <p
              className="font-outfit"
              style={{ fontSize: "12px", color: "var(--t3)", marginTop: "2px" }}
            >
              Once accepted, this task is yours.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center shrink-0"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "var(--hover-bg)",
              border: "1px solid var(--b1)",
              cursor: "pointer",
            }}
          >
            <X className="h-3.5 w-3.5" style={{ color: "var(--t3)" }} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: "16px 20px" }}
        >
          {/* Task summary */}
          <div
            style={{
              background: "var(--p-dim)",
              border: "1px solid var(--p-border)",
              borderRadius: "10px",
              padding: "14px 16px",
            }}
          >
            <p
              className="font-outfit font-bold"
              style={{ fontSize: "14px", color: "var(--t1)" }}
            >
              {task.title}
            </p>
            <p
              className="font-outfit"
              style={{ fontSize: "12px", color: "var(--t2)", marginTop: "2px" }}
            >
              {task.subject}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className="font-outfit font-semibold"
                style={{
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: `${serviceColorMap[task.service_type] || "var(--t3)"}15`,
                  color: serviceColorMap[task.service_type] || "var(--t3)",
                }}
              >
                {serviceLabelsMap[task.service_type] || task.service_type}
              </span>
              <span
                className="font-outfit font-semibold"
                style={{
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background:
                    task.delivery_type === "digital"
                      ? "rgba(96,165,250,0.1)"
                      : "rgba(251,191,36,0.1)",
                  color:
                    task.delivery_type === "digital"
                      ? "#60a5fa"
                      : "#fbbf24",
                }}
              >
                {task.delivery_type === "digital" ? "DIGITAL" : "PHYSICAL"}
              </span>
              <span
                className="font-outfit font-bold"
                style={{ fontSize: "13px", color: "var(--g)", marginLeft: "auto" }}
              >
                ₹{task.worker_pay}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <DeadlineTimer deadline={task.deadline} size="sm" />
              <p
                className="font-outfit font-semibold"
                style={{ fontSize: "11px", color: "var(--r)" }}
              >
                Miss = permanent ban
              </p>
            </div>
          </div>

          {/* Worker details */}
          <p
            className="font-outfit font-semibold mt-4 mb-2"
            style={{ fontSize: "11px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em" }}
          >
            Your assigned details
          </p>
          <div
            style={{
              borderRadius: "10px",
              border: "1px solid var(--b1)",
              overflow: "hidden",
            }}
          >
            {[
              { label: "Name", value: profile.worker_full_name },
              { label: "Contact", value: profile.worker_contact },
              { label: "University", value: profile.worker_university },
              { label: "Roll No", value: profile.worker_roll_no },
              {
                label: "Degree",
                value: `${profile.worker_degree} — ${profile.worker_specialization}`,
              },
              { label: "Location", value: location },
            ].map((row, i) => (
              <div
                key={row.label}
                className="flex justify-between items-center"
                style={{
                  padding: "8px 14px",
                  borderTop: i > 0 ? "1px solid var(--b1)" : undefined,
                  background: i % 2 === 0 ? "var(--hover-bg-subtle)" : "transparent",
                }}
              >
                <span
                  className="font-outfit"
                  style={{ fontSize: "12px", color: "var(--t3)" }}
                >
                  {row.label}
                </span>
                <span
                  className="font-outfit font-medium text-right"
                  style={{ fontSize: "12px", color: "var(--t1)", maxWidth: "60%" }}
                >
                  {row.value || "—"}
                </span>
              </div>
            ))}
          </div>

          {/* Rules reminder */}
          <div
            className="mt-4"
            style={{
              background: "rgba(255,71,87,0.04)",
              border: "1px solid rgba(255,71,87,0.1)",
              borderRadius: "8px",
              padding: "10px 14px",
            }}
          >
            <p
              className="font-outfit font-semibold mb-1"
              style={{ fontSize: "11px", color: "var(--t2)" }}
            >
              By accepting you confirm:
            </p>
            {[
              "Complete and submit before the deadline",
              "Available for up to 3 revisions if needed",
              "Will not share this assignment with anyone",
            ].map((rule, i) => (
              <p
                key={i}
                className="font-outfit"
                style={{
                  fontSize: "11px",
                  color: "var(--t3)",
                  paddingLeft: "8px",
                  marginTop: "2px",
                }}
              >
                &bull; {rule}
              </p>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div
              className="mt-3"
              style={{
                background: "var(--r-dim)",
                border: "1px solid var(--r-border)",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
            >
              <p
                className="font-outfit"
                style={{ fontSize: "12px", color: "var(--r)" }}
              >
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Fixed Footer Actions */}
        <div
          className="flex gap-3 shrink-0"
          style={{
            padding: "14px 20px",
            borderTop: "1px solid var(--b1)",
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ fontSize: "13px", padding: "8px 18px" }}
          >
            Cancel
          </button>
          <button
            onClick={onAccept}
            disabled={accepting}
            className="btn btn-p"
            style={{ fontSize: "13px", padding: "8px 20px", marginLeft: "auto" }}
          >
            {accepting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                Accept & Confirm
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
