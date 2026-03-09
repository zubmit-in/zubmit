"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Plus,
  ClipboardList,
  Users,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  AlertTriangle,
  Eye,
  Ban,
  ShieldCheck,
  FileText,
  Send,
  ChevronDown,
  ChevronUp,
  X,
  Download,
  ExternalLink,
  Upload,
  Paperclip,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pageEnter, fadeUp } from "@/lib/motion";
import {
  degreeList,
  getSpecializations,
  getSubjects,
  getMaxSemester,
} from "@/lib/curriculum";

// =============================================
// TYPES
// =============================================

interface AdminStats {
  totalTasks: number;
  availableTasks: number;
  assignedTasks: number;
  submittedTasks: number;
  paidTasks: number;
  totalWorkers: number;
  totalPaid: number;
  pendingPayments: number;
}

interface Task {
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
  real_deadline: string;
  worker_pay: number;
  status: string;
  assigned_worker_id?: string;
  assigned_at?: string;
  order_id?: string;
  admin_notes?: string;
  revision_count: number;
  is_physical_complete?: boolean;
  created_at: string;
  updated_at: string;
}

interface Worker {
  id: string;
  full_name: string;
  email: string;
  worker_full_name?: string;
  worker_contact?: string;
  worker_university?: string;
  worker_degree?: string;
  worker_specialization?: string;
  worker_roll_no?: string;
  accommodation_type?: string;
  tower_no?: number;
  tower_room_no?: string;
  block_no?: string;
  block_room_no?: string;
  upi_qr_url?: string;
  worker_profile_complete?: boolean;
  worker_banned?: boolean;
  worker_ban_reason?: string;
}

interface Earning {
  id: string;
  worker_id: string;
  task_id: string;
  amount: number;
  status: string;
  upi_transaction_id?: string;
  paid_at?: string;
  created_at: string;
}

interface Submission {
  id: string;
  task_id: string;
  worker_id: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  is_physical_complete?: boolean;
  physical_completed_at?: string;
  review_status?: string;
  revision_count?: number;
  reviewer_notes?: string;
  submitted_at?: string;
}

interface Order {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  degree: string;
  specialization?: string;
  semester: number;
  service_type: string;
  delivery_type: string;
  roll_no: string;
  deadline: string;
  total_price: number;
  advance_amount: number;
  final_amount: number;
  advance_paid: boolean;
  final_paid: boolean;
  status: string;
  description?: string;
  front_page_info?: string;
  material_note?: string;
  reference_file_url?: string;
  created_at: string;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  college_name: string;
  degree: string;
  specialization?: string;
  semester: number;
  roll_no?: string;
}

// =============================================
// HELPERS
// =============================================

const serviceLabels: Record<string, string> = {
  case_study: "Case Study",
  CASE_STUDY: "Case Study",
  report: "Report",
  REPORT: "Report Writing",
  ppt: "Presentation",
  PPT: "Presentation",
  lab_records: "Lab Records",
  LAB_MANUAL: "Lab Manual",
  handwritten_assignment: "Handwritten",
  HANDWRITTEN: "Handwritten",
  notes: "Notes",
  NOTES: "Notes",
  other: "Other",
  OTHER: "Other",
};

const statusColors: Record<string, string> = {
  available: "var(--g)",
  assigned: "var(--s)",
  submitted: "#818cf8",
  under_review: "#818cf8",
  revision_required: "var(--r)",
  approved: "var(--g)",
  payment_processing: "var(--p)",
  paid: "var(--g)",
  cancelled: "var(--t3)",
};

const orderStatusColors: Record<string, string> = {
  pending: "#f59e0b",
  PENDING: "#f59e0b",
  ASSIGNED: "var(--s)",
  IN_PROGRESS: "var(--p)",
  DELIVERED: "#818cf8",
  COMPLETED: "var(--g)",
  CANCELLED: "var(--t3)",
  cancelled: "var(--t3)",
};

function formatIST(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// =============================================
// MAIN COMPONENT
// =============================================

type Tab = "overview" | "create" | "tasks" | "workers" | "orders";

export default function AdminPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [stats, setStats] = useState<AdminStats>({
    totalTasks: 0,
    availableTasks: 0,
    assignedTasks: 0,
    submittedTasks: 0,
    paidTasks: 0,
    totalWorkers: 0,
    totalPaid: 0,
    pendingPayments: 0,
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.status === 403) {
        setAuthorized(false);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.stats) {
        setAuthorized(true);
        setStats(data.stats);
        setTasks(data.tasks || []);
        setWorkers(data.workers || []);
        setEarnings(data.earnings || []);
        setSubmissions(data.submissions || []);
        setOrders(data.orders || []);
        setStudents(data.students || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: "var(--p)" }}
        />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <ShieldCheck
            className="h-16 w-16 mx-auto mb-4"
            style={{ color: "var(--r)" }}
          />
          <h1
            className="display text-2xl mb-2"
            style={{ color: "var(--t1)" }}
          >
            Access Denied
          </h1>
          <p style={{ color: "var(--t3)", fontSize: "14px" }}>
            You do not have admin privileges.
          </p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "create", label: "Create Task", icon: Plus },
    { id: "tasks", label: "Manage Tasks", icon: ClipboardList },
    { id: "workers", label: "Workers", icon: Users },
    { id: "orders", label: "All Orders", icon: FileText },
  ];

  return (
    <motion.div variants={pageEnter} initial="hidden" animate="visible">
      {/* Header */}
      <div className="mb-6">
        <p
          className="eyebrow mb-1"
          style={{ fontSize: "11px", letterSpacing: "0.15em" }}
        >
          ADMIN PANEL
        </p>
        <h1 className="display text-3xl" style={{ color: "var(--t1)" }}>
          Task Management
        </h1>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-8 overflow-x-auto"
        style={{
          padding: "4px",
          borderRadius: "12px",
          background: "var(--hover-bg-subtle)",
          border: "1px solid var(--b1)",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 whitespace-nowrap transition-all"
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 400,
                background: isActive ? "var(--surface)" : "transparent",
                color: isActive ? "var(--t1)" : "var(--t3)",
                border: isActive
                  ? "1px solid var(--b2)"
                  : "1px solid transparent",
              }}
            >
              <tab.icon style={{ width: "14px", height: "14px" }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab stats={stats} tasks={tasks} earnings={earnings} />
      )}
      {activeTab === "create" && (
        <CreateTaskTab
          onCreated={() => {
            fetchData();
            setActiveTab("tasks");
          }}
        />
      )}
      {activeTab === "tasks" && (
        <ManageTasksTab
          tasks={tasks}
          workers={workers}
          submissions={submissions}
          orders={orders}
          students={students}
          onRefresh={fetchData}
        />
      )}
      {activeTab === "workers" && (
        <WorkersTab workers={workers} onRefresh={fetchData} />
      )}
      {activeTab === "orders" && (
        <OrdersTab orders={orders} students={students} onRefresh={fetchData} />
      )}
    </motion.div>
  );
}

// =============================================
// OVERVIEW TAB
// =============================================

function OverviewTab({
  stats,
  tasks,
  earnings,
}: {
  stats: AdminStats;
  tasks: Task[];
  earnings: Earning[];
}) {
  const statCards = [
    {
      label: "Total Tasks",
      value: stats.totalTasks,
      icon: ClipboardList,
      color: "var(--p)",
    },
    {
      label: "Available",
      value: stats.availableTasks,
      icon: Clock,
      color: "var(--g)",
    },
    {
      label: "Assigned",
      value: stats.assignedTasks,
      icon: FileText,
      color: "var(--s)",
    },
    {
      label: "Submitted",
      value: stats.submittedTasks,
      icon: Eye,
      color: "#818cf8",
    },
    {
      label: "Paid",
      value: stats.paidTasks,
      icon: CheckCircle,
      color: "var(--g)",
    },
    {
      label: "Workers",
      value: stats.totalWorkers,
      icon: Users,
      color: "var(--p)",
    },
    {
      label: "Total Paid",
      value: `₹${stats.totalPaid}`,
      icon: IndianRupee,
      color: "var(--g)",
    },
    {
      label: "Pending Pay",
      value: `₹${stats.pendingPayments}`,
      icon: AlertTriangle,
      color: "var(--r)",
    },
  ];

  const recentTasks = tasks.slice(0, 5);
  const recentEarnings = earnings.slice(0, 5);

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="card"
            style={{ padding: "16px 20px" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <s.icon
                style={{ width: "14px", height: "14px", color: s.color }}
              />
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--t3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {s.label}
              </span>
            </div>
            <p
              className="display"
              style={{ fontSize: "22px", color: s.color }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Tasks */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card" style={{ padding: "24px" }}>
          <h3
            className="font-outfit font-bold mb-4"
            style={{ color: "var(--t1)", fontSize: "15px" }}
          >
            Recent Tasks
          </h3>
          <div className="space-y-3">
            {recentTasks.length === 0 && (
              <p style={{ color: "var(--t3)", fontSize: "13px" }}>
                No tasks yet
              </p>
            )}
            {recentTasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between"
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "var(--hover-bg-subtle)",
                }}
              >
                <div>
                  <p
                    className="font-outfit font-medium"
                    style={{ fontSize: "13px", color: "var(--t1)" }}
                  >
                    {t.title}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--t3)" }}>
                    {t.subject} · ₹{t.worker_pay}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: `${statusColors[t.status] || "var(--t3)"}15`,
                    color: statusColors[t.status] || "var(--t3)",
                    textTransform: "capitalize",
                  }}
                >
                  {t.status.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: "24px" }}>
          <h3
            className="font-outfit font-bold mb-4"
            style={{ color: "var(--t1)", fontSize: "15px" }}
          >
            Recent Payments
          </h3>
          <div className="space-y-3">
            {recentEarnings.length === 0 && (
              <p style={{ color: "var(--t3)", fontSize: "13px" }}>
                No payments yet
              </p>
            )}
            {recentEarnings.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between"
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "var(--hover-bg-subtle)",
                }}
              >
                <div>
                  <p
                    className="font-outfit font-medium"
                    style={{ fontSize: "13px", color: "var(--t1)" }}
                  >
                    ₹{e.amount}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--t3)" }}>
                    {formatIST(e.created_at)}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background:
                      e.status === "paid"
                        ? "rgba(34,217,138,0.1)"
                        : "rgba(232,114,42,0.1)",
                    color:
                      e.status === "paid" ? "var(--g)" : "var(--p)",
                    textTransform: "capitalize",
                  }}
                >
                  {e.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================
// CREATE TASK TAB
// =============================================

function CreateTaskTab({ onCreated }: { onCreated: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [degree, setDegree] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [semester, setSemester] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [deliveryType, setDeliveryType] = useState("");
  const [description, setDescription] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [realDeadline, setRealDeadline] = useState("");
  const [workerPay, setWorkerPay] = useState("");
  const [orderId, setOrderId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [referenceFiles, setReferenceFiles] = useState<{ name: string; url: string }[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const specializations = degree ? getSpecializations(degree) : [];
  const maxSemester = degree ? getMaxSemester(degree) : 0;
  const subjects =
    degree && specialization && semester
      ? getSubjects(
          degree,
          specialization || "General",
          parseInt(semester)
        )
      : [];

  const handleDegreeChange = (val: string) => {
    setDegree(val);
    setSpecialization("");
    setSemester("");
    setSubject("");
  };

  const handleSpecChange = (val: string) => {
    setSpecialization(val);
    setSubject("");
  };

  const handleSemesterChange = (val: string) => {
    setSemester(val);
    setSubject("");
  };

  const handleSubmit = async () => {
    if (
      !title ||
      !subject ||
      !degree ||
      !specialization ||
      !semester ||
      !serviceType ||
      !deliveryType ||
      !realDeadline ||
      !workerPay
    ) {
      toast({
        title: "Missing fields",
        description: "Fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (new Date(realDeadline) <= new Date()) {
      toast({
        title: "Invalid deadline",
        description: "Deadline must be in the future.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          degree,
          specialization,
          semester,
          service_type: serviceType,
          delivery_type: deliveryType,
          description: description || null,
          page_count: pageCount ? parseInt(pageCount) : null,
          real_deadline: new Date(realDeadline).toISOString(),
          worker_pay: parseFloat(workerPay),
          order_id: orderId || null,
          admin_notes: adminNotes || null,
          reference_files: referenceFiles.length > 0 ? referenceFiles : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: "Task created", description: `Task ID: ${data.taskId}` });
        // Reset form
        setTitle("");
        setSubject("");
        setDegree("");
        setSpecialization("");
        setSemester("");
        setServiceType("");
        setDeliveryType("");
        setDescription("");
        setPageCount("");
        setRealDeadline("");
        setWorkerPay("");
        setOrderId("");
        setAdminNotes("");
        setReferenceFiles([]);
        onCreated();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <div className="card" style={{ padding: "32px" }}>
        <h2
          className="font-outfit font-bold text-lg mb-6"
          style={{ color: "var(--t1)" }}
        >
          Create New Task
        </h2>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="field-label">TASK TITLE *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Marketing Case Study - Amul"
              className="font-outfit"
              style={inputStyle}
            />
          </div>

          {/* Degree & Specialization */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="field-label">DEGREE *</label>
              <Select value={degree} onValueChange={handleDegreeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select degree" />
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
            <div>
              <label className="field-label">SPECIALIZATION *</label>
              <Select
                value={specialization}
                onValueChange={handleSpecChange}
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
            </div>
          </div>

          {/* Semester & Subject */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="field-label">SEMESTER *</label>
              <Select
                value={semester}
                onValueChange={handleSemesterChange}
                disabled={!degree}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxSemester }, (_, i) => i + 1).map(
                    (s) => (
                      <SelectItem key={s} value={s.toString()}>
                        Semester {s}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="field-label">SUBJECT *</label>
              {subjects.length > 0 ? (
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Type subject name"
                  className="font-outfit"
                  style={inputStyle}
                />
              )}
            </div>
          </div>

          {/* Service type & Delivery */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="field-label">SERVICE TYPE *</label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="case_study">Case Study</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="ppt">Presentation</SelectItem>
                  <SelectItem value="lab_records">Lab Records</SelectItem>
                  <SelectItem value="handwritten_assignment">
                    Handwritten
                  </SelectItem>
                  <SelectItem value="notes">Notes</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="field-label">DELIVERY TYPE *</label>
              <Select value={deliveryType} onValueChange={setDeliveryType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deadline & Pay */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="field-label">REAL DEADLINE (CLIENT) *</label>
              <input
                type="datetime-local"
                value={realDeadline}
                onChange={(e) => setRealDeadline(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="font-outfit"
                style={inputStyle}
              />
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--t3)",
                  marginTop: "4px",
                }}
              >
                Worker sees this minus 8 hours
              </p>
            </div>
            <div>
              <label className="field-label">WORKER PAY (₹) *</label>
              <input
                type="number"
                value={workerPay}
                onChange={(e) => setWorkerPay(e.target.value)}
                placeholder="e.g. 200"
                className="font-outfit"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="field-label">PAGE COUNT</label>
              <input
                type="number"
                value={pageCount}
                onChange={(e) => setPageCount(e.target.value)}
                placeholder="Optional"
                className="font-outfit"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="field-label">DESCRIPTION</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task details and instructions..."
              rows={3}
              className="font-outfit"
              style={{ ...inputStyle, resize: "vertical" as const }}
            />
          </div>

          {/* Order ID & Admin Notes */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="field-label">ORDER ID (LINK)</label>
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Optional - link to customer order"
                className="font-outfit"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="field-label">ADMIN NOTES</label>
              <input
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes (not visible to workers)"
                className="font-outfit"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Reference Files (Optional) */}
          <div>
            <label className="field-label">REFERENCE FILES (OPTIONAL)</label>
            <p style={{ fontSize: "11px", color: "var(--t3)", marginBottom: "8px" }}>
              Attach reference materials for workers. PDF, DOCX, PPTX, ZIP, images accepted.
            </p>
            <div
              style={{
                border: "2px dashed var(--border)",
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <label
                className="font-outfit"
                style={{
                  cursor: uploadingFiles ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  fontSize: "13px",
                  color: "var(--t2)",
                  opacity: uploadingFiles ? 0.5 : 1,
                }}
              >
                {uploadingFiles ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploadingFiles ? "Uploading..." : "Choose Files"}
                <input
                  type="file"
                  className="hidden"
                  multiple
                  disabled={uploadingFiles}
                  accept=".pdf,.docx,.pptx,.zip,.doc,.ppt,.jpg,.jpeg,.png,.webp"
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    setUploadingFiles(true);
                    try {
                      const formData = new FormData();
                      for (let i = 0; i < files.length; i++) {
                        formData.append("files", files[i]);
                      }
                      const res = await fetch("/api/admin/tasks/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const data = await res.json();
                      if (data.files) {
                        setReferenceFiles((prev) => [...prev, ...data.files]);
                      }
                    } catch {
                      toast({ title: "Upload failed", variant: "destructive" });
                    } finally {
                      setUploadingFiles(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </div>
            {referenceFiles.length > 0 && (
              <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {referenceFiles.map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "var(--surface)",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                      <Paperclip className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--t3)" }} />
                      <span
                        className="font-outfit"
                        style={{ fontSize: "13px", color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {file.name}
                      </span>
                    </div>
                    <button
                      onClick={() => setReferenceFiles((prev) => prev.filter((_, i) => i !== idx))}
                      style={{ color: "var(--r)", background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end">
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
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Create Task
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
// MANAGE TASKS TAB
// =============================================

function ManageTasksTab({
  tasks,
  workers,
  submissions,
  orders,
  students,
  onRefresh,
}: {
  tasks: Task[];
  workers: Worker[];
  submissions: Submission[];
  orders: Order[];
  students: Student[];
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [upiTxnId, setUpiTxnId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const filtered =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const getWorker = (id?: string) =>
    workers.find((w) => w.id === id) || null;

  const getSubmission = (taskId: string) =>
    submissions.find((s) => s.task_id === taskId) || null;

  const getOrder = (orderId?: string) =>
    orders.find((o) => o.id === orderId) || null;

  const getStudent = (userId?: string) =>
    students.find((s) => s.id === userId) || null;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Order status updated", description: `Status changed to ${newStatus.replace(/_/g, " ")}` });
        onRefresh();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update order status", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReview = async (
    taskId: string,
    action: "approve" | "revision"
  ) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/tasks/${taskId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: reviewNotes || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: action === "approve" ? "Approved" : "Revision requested",
        });
        setReviewNotes("");
        setExpanded(null);
        onRefresh();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Action failed",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async (taskId: string) => {
    if (!upiTxnId.trim()) {
      toast({
        title: "Required",
        description: "Enter UPI transaction ID",
        variant: "destructive",
      });
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/tasks/${taskId}/mark-paid`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upi_transaction_id: upiTxnId.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Marked as paid" });
        setUpiTxnId("");
        setExpanded(null);
        onRefresh();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Action failed",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (!confirm(`Delete task "${taskTitle}"? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/tasks/${taskId}/delete`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Task deleted", description: `"${taskTitle}" has been removed` });
        setExpanded(null);
        onRefresh();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const statusFilters = [
    "all",
    "available",
    "assigned",
    "submitted",
    "under_review",
    "revision_required",
    "approved",
    "payment_processing",
    "paid",
    "cancelled",
  ];

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {statusFilters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="whitespace-nowrap transition-all"
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: filter === f ? 600 : 400,
              background:
                filter === f ? "var(--p-dim)" : "var(--hover-bg-subtle)",
              color: filter === f ? "var(--p)" : "var(--t3)",
              border:
                filter === f
                  ? "1px solid var(--p-border)"
                  : "1px solid var(--b1)",
              textTransform: "capitalize",
            }}
          >
            {f.replace(/_/g, " ")}
            {f !== "all" && (
              <span style={{ marginLeft: "6px", opacity: 0.7 }}>
                {tasks.filter((t) => t.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div
            className="card text-center"
            style={{ padding: "40px", color: "var(--t3)", fontSize: "14px" }}
          >
            No tasks found
          </div>
        )}

        {filtered.map((task) => {
          const isOpen = expanded === task.id;
          const worker = getWorker(task.assigned_worker_id);

          return (
            <div key={task.id} className="card" style={{ padding: "0" }}>
              {/* Task Header Row */}
              <button
                onClick={() => setExpanded(isOpen ? null : task.id)}
                className="w-full flex items-center justify-between text-left transition-all"
                style={{ padding: "16px 20px" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p
                      className="font-outfit font-semibold truncate"
                      style={{ fontSize: "14px", color: "var(--t1)" }}
                    >
                      {task.title}
                    </p>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: `${statusColors[task.status] || "var(--t3)"}15`,
                        color: statusColors[task.status] || "var(--t3)",
                        textTransform: "capitalize",
                        flexShrink: 0,
                      }}
                    >
                      {task.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-3 flex-wrap"
                    style={{ fontSize: "12px", color: "var(--t3)" }}
                  >
                    <span>{task.subject}</span>
                    <span>·</span>
                    <span>
                      {serviceLabels[task.service_type] || task.service_type}
                    </span>
                    <span>·</span>
                    <span>₹{task.worker_pay}</span>
                    <span>·</span>
                    <span>Due: {formatIST(task.real_deadline)}</span>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp
                    className="h-4 w-4 shrink-0 ml-3"
                    style={{ color: "var(--t3)" }}
                  />
                ) : (
                  <ChevronDown
                    className="h-4 w-4 shrink-0 ml-3"
                    style={{ color: "var(--t3)" }}
                  />
                )}
              </button>

              {/* Expanded Details */}
              {isOpen && (
                <div
                  style={{
                    padding: "0 20px 20px",
                    borderTop: "1px solid var(--b1)",
                    paddingTop: "16px",
                  }}
                >
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <InfoItem label="Degree" value={task.degree} />
                    <InfoItem
                      label="Specialization"
                      value={task.specialization}
                    />
                    <InfoItem label="Semester" value={task.semester} />
                    <InfoItem
                      label="Delivery"
                      value={task.delivery_type}
                    />
                    <InfoItem
                      label="Real Deadline"
                      value={formatIST(task.real_deadline)}
                    />
                    <InfoItem
                      label="Revisions"
                      value={`${task.revision_count}/3`}
                    />
                    {task.page_count && (
                      <InfoItem
                        label="Pages"
                        value={task.page_count.toString()}
                      />
                    )}
                    {task.order_id && (
                      <InfoItem label="Order ID" value={task.order_id} />
                    )}
                  </div>

                  {task.description && (
                    <div className="mb-4">
                      <p
                        style={{
                          fontSize: "11px",
                          color: "var(--t3)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: "4px",
                        }}
                      >
                        Description
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "var(--t2)",
                          lineHeight: "1.6",
                        }}
                      >
                        {task.description}
                      </p>
                    </div>
                  )}

                  {task.admin_notes && (
                    <div className="mb-4">
                      <p
                        style={{
                          fontSize: "11px",
                          color: "var(--s)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: "4px",
                        }}
                      >
                        Admin Notes
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "var(--t2)",
                          lineHeight: "1.6",
                        }}
                      >
                        {task.admin_notes}
                      </p>
                    </div>
                  )}

                  {/* Submission / Uploaded File */}
                  {(() => {
                    const sub = getSubmission(task.id);
                    if (!sub) return null;
                    return (
                      <div
                        className="mb-4"
                        style={{
                          padding: "12px 16px",
                          borderRadius: "10px",
                          background: "rgba(129,140,248,0.06)",
                          border: "1px solid rgba(129,140,248,0.2)",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#818cf8",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: "8px",
                          }}
                        >
                          {sub.is_physical_complete
                            ? "Physical Submission"
                            : "Digital Submission"}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {sub.file_name && (
                            <InfoItem
                              label="File"
                              value={sub.file_name}
                            />
                          )}
                          {sub.file_size && (
                            <InfoItem
                              label="Size"
                              value={formatFileSize(sub.file_size)}
                            />
                          )}
                          <InfoItem
                            label="Review Status"
                            value={
                              (sub.review_status || "pending")
                                .replace(/_/g, " ")
                            }
                          />
                          {sub.revision_count !== undefined &&
                            sub.revision_count > 0 && (
                              <InfoItem
                                label="Revisions"
                                value={`${sub.revision_count}/3`}
                              />
                            )}
                          {sub.submitted_at && (
                            <InfoItem
                              label="Submitted At"
                              value={formatIST(sub.submitted_at)}
                            />
                          )}
                          {sub.is_physical_complete &&
                            sub.physical_completed_at && (
                              <InfoItem
                                label="Completed At"
                                value={formatIST(
                                  sub.physical_completed_at
                                )}
                              />
                            )}
                        </div>
                        {sub.reviewer_notes && (
                          <div className="mt-2">
                            <p
                              style={{
                                fontSize: "10px",
                                color: "var(--t3)",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                marginBottom: "2px",
                              }}
                            >
                              Reviewer Notes
                            </p>
                            <p
                              style={{
                                fontSize: "13px",
                                color: "var(--t2)",
                              }}
                            >
                              {sub.reviewer_notes}
                            </p>
                          </div>
                        )}
                        {sub.file_url && (
                          <a
                            href={sub.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost mt-3"
                            style={{
                              padding: "6px 14px",
                              fontSize: "12px",
                              display: "inline-flex",
                              gap: "6px",
                            }}
                          >
                            <ExternalLink
                              style={{
                                width: "12px",
                                height: "12px",
                              }}
                            />
                            View / Download File
                          </a>
                        )}
                      </div>
                    );
                  })()}

                  {/* Assigned Worker — Full Profile */}
                  {task.assigned_worker_id && (
                    <div
                      className="mb-4"
                      style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        background: "var(--hover-bg-subtle)",
                        border: "1px solid var(--b1)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "11px",
                          color: "var(--p)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: "8px",
                          fontWeight: 600,
                        }}
                      >
                        Assigned Worker
                      </p>
                      {worker ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <InfoItem
                            label="Full Name"
                            value={worker.worker_full_name || worker.full_name}
                          />
                          <InfoItem
                            label="Email"
                            value={worker.email}
                          />
                          <InfoItem
                            label="Contact"
                            value={worker.worker_contact || "N/A"}
                          />
                          <InfoItem
                            label="University"
                            value={worker.worker_university || "N/A"}
                          />
                          <InfoItem
                            label="Degree"
                            value={worker.worker_degree || "N/A"}
                          />
                          <InfoItem
                            label="Specialization"
                            value={worker.worker_specialization || "N/A"}
                          />
                          <InfoItem
                            label="Roll No"
                            value={worker.worker_roll_no || "N/A"}
                          />
                          <InfoItem
                            label="Accommodation"
                            value={
                              worker.accommodation_type === "tower"
                                ? `Tower ${worker.tower_no} - Room ${worker.tower_room_no}`
                                : worker.accommodation_type === "block"
                                  ? `Block ${worker.block_no} - Room ${worker.block_room_no}`
                                  : "N/A"
                            }
                          />
                          <InfoItem
                            label="Profile Complete"
                            value={worker.worker_profile_complete ? "Yes" : "No"}
                          />
                          {task.assigned_at && (
                            <InfoItem
                              label="Assigned At"
                              value={formatIST(task.assigned_at)}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <InfoItem
                            label="Worker ID"
                            value={task.assigned_worker_id}
                          />
                          {task.assigned_at && (
                            <InfoItem
                              label="Assigned At"
                              value={formatIST(task.assigned_at)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Student / Customer Details */}
                  {(() => {
                    const order = getOrder(task.order_id);
                    if (!order) {
                      return (
                        <div
                          className="mb-4"
                          style={{
                            padding: "12px 16px",
                            borderRadius: "10px",
                            background: "rgba(34,217,138,0.04)",
                            border: "1px solid rgba(34,217,138,0.2)",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "11px",
                              color: "var(--g)",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              marginBottom: "4px",
                              fontWeight: 600,
                            }}
                          >
                            Customer / Student Details
                          </p>
                          <p style={{ fontSize: "13px", color: "var(--t3)" }}>
                            No linked order — task created manually
                          </p>
                        </div>
                      );
                    }
                    const student = getStudent(order.user_id);
                    return (
                      <div
                        className="mb-4"
                        style={{
                          padding: "12px 16px",
                          borderRadius: "10px",
                          background: "rgba(34,217,138,0.04)",
                          border: "1px solid rgba(34,217,138,0.2)",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "11px",
                            color: "var(--g)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: "8px",
                            fontWeight: 600,
                          }}
                        >
                          Customer / Student Details
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {student && (
                            <>
                              <InfoItem
                                label="Student Name"
                                value={student.full_name}
                              />
                              <InfoItem
                                label="Email"
                                value={student.email}
                              />
                              <InfoItem
                                label="Phone"
                                value={student.phone || "N/A"}
                              />
                              <InfoItem
                                label="College"
                                value={student.college_name}
                              />
                              <InfoItem
                                label="Degree"
                                value={student.degree}
                              />
                              <InfoItem
                                label="Specialization"
                                value={student.specialization || "N/A"}
                              />
                              <InfoItem
                                label="Semester"
                                value={student.semester?.toString() || "N/A"}
                              />
                              <InfoItem
                                label="Roll No"
                                value={student.roll_no || order.roll_no || "N/A"}
                              />
                            </>
                          )}
                          <InfoItem
                            label="Order Total"
                            value={`₹${order.total_price}`}
                          />
                          <div>
                            <p style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                              Order Status
                            </p>
                            <Select value={order.status} onValueChange={(val) => handleOrderStatusUpdate(order.id, val)}>
                              <SelectTrigger style={{ height: "32px", fontSize: "12px", background: "var(--bg)", border: "1px solid var(--b2)" }}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="DELIVERED">Delivered</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <InfoItem
                            label="Client Deadline"
                            value={formatIST(order.deadline)}
                          />
                          {order.front_page_info && (
                            <InfoItem
                              label="Front Page Info"
                              value={order.front_page_info}
                            />
                          )}
                        </div>
                        {order.material_note && (
                          <div className="mt-2">
                            <p
                              style={{
                                fontSize: "10px",
                                color: "var(--t3)",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                marginBottom: "2px",
                              }}
                            >
                              Material Note
                            </p>
                            <p
                              style={{
                                fontSize: "13px",
                                color: "var(--t2)",
                              }}
                            >
                              {order.material_note}
                            </p>
                          </div>
                        )}
                        {order.reference_file_url && (
                          <a
                            href={order.reference_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost mt-3"
                            style={{
                              padding: "6px 14px",
                              fontSize: "12px",
                              display: "inline-flex",
                              gap: "6px",
                            }}
                          >
                            <ExternalLink
                              style={{ width: "12px", height: "12px" }}
                            />
                            View Reference File
                          </a>
                        )}
                      </div>
                    );
                  })()}

                  {/* Actions based on status */}
                  {(task.status === "submitted" ||
                    task.status === "under_review") && (
                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "10px",
                        border: "1px solid var(--b2)",
                        background: "var(--hover-bg-subtle)",
                      }}
                    >
                      <p
                        className="font-outfit font-semibold mb-3"
                        style={{ fontSize: "13px", color: "var(--t1)" }}
                      >
                        Review Submission
                      </p>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Review notes (optional, visible to worker on revision)"
                        rows={2}
                        className="font-outfit mb-3"
                        style={{
                          ...inputStyle,
                          resize: "vertical" as const,
                        }}
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReview(task.id, "approve")}
                          disabled={actionLoading}
                          className="btn btn-green"
                          style={{ padding: "8px 18px", fontSize: "12px" }}
                        >
                          {actionLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview(task.id, "revision")}
                          disabled={actionLoading}
                          className="btn"
                          style={{
                            padding: "8px 18px",
                            fontSize: "12px",
                            background: "var(--r-dim)",
                            color: "var(--r)",
                            border: "1px solid var(--r-border)",
                          }}
                        >
                          {actionLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          Request Revision
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delete button for available tasks */}
                  {task.status === "available" && (
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        disabled={actionLoading}
                        className="btn"
                        style={{
                          padding: "8px 16px",
                          fontSize: "12px",
                          background: "var(--r-dim)",
                          color: "var(--r)",
                          border: "1px solid var(--r-border)",
                        }}
                      >
                        {actionLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Delete Task
                      </button>
                    </div>
                  )}

                  {task.status === "payment_processing" && (
                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "10px",
                        border: "1px solid var(--g-border)",
                        background: "var(--g-dim)",
                      }}
                    >
                      <p
                        className="font-outfit font-semibold mb-3"
                        style={{ fontSize: "13px", color: "var(--t1)" }}
                      >
                        Mark Payment Complete
                      </p>
                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="field-label">
                            UPI TRANSACTION ID *
                          </label>
                          <input
                            value={upiTxnId}
                            onChange={(e) => setUpiTxnId(e.target.value)}
                            placeholder="Enter UPI transaction ID"
                            className="font-outfit"
                            style={inputStyle}
                          />
                        </div>
                        <button
                          onClick={() => handleMarkPaid(task.id)}
                          disabled={actionLoading}
                          className="btn btn-green"
                          style={{ padding: "10px 18px", fontSize: "12px" }}
                        >
                          {actionLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                          Mark Paid
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// =============================================
// WORKERS TAB
// =============================================

function WorkersTab({
  workers,
  onRefresh,
}: {
  workers: Worker[];
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const handleBanToggle = async (
    workerId: string,
    action: "ban" | "unban"
  ) => {
    if (action === "ban" && !banReason.trim()) {
      toast({
        title: "Required",
        description: "Enter a ban reason",
        variant: "destructive",
      });
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/workers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worker_id: workerId,
          action,
          reason: banReason || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: action === "ban" ? "Worker banned" : "Worker unbanned",
        });
        setBanReason("");
        onRefresh();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Action failed",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <div className="space-y-3">
        {workers.length === 0 && (
          <div
            className="card text-center"
            style={{ padding: "40px", color: "var(--t3)", fontSize: "14px" }}
          >
            No workers registered yet
          </div>
        )}

        {workers.map((worker) => {
          const isOpen = expanded === worker.id;
          return (
            <div key={worker.id} className="card" style={{ padding: "0" }}>
              <button
                onClick={() => setExpanded(isOpen ? null : worker.id)}
                className="w-full flex items-center justify-between text-left"
                style={{ padding: "16px 20px" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: worker.worker_banned
                        ? "var(--r-dim)"
                        : "var(--p-dim)",
                      border: `1px solid ${worker.worker_banned ? "var(--r-border)" : "var(--p-border)"}`,
                    }}
                  >
                    <span
                      className="font-semibold"
                      style={{
                        fontSize: "14px",
                        color: worker.worker_banned
                          ? "var(--r)"
                          : "var(--p)",
                      }}
                    >
                      {(
                        worker.worker_full_name ||
                        worker.full_name ||
                        "?"
                      )[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className="font-outfit font-semibold truncate"
                        style={{ fontSize: "14px", color: "var(--t1)" }}
                      >
                        {worker.worker_full_name || worker.full_name}
                      </p>
                      {worker.worker_banned && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "var(--r-dim)",
                            color: "var(--r)",
                          }}
                        >
                          BANNED
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--t3)" }}>
                      {worker.email} ·{" "}
                      {worker.worker_university || "No university"}
                    </p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp
                    className="h-4 w-4 shrink-0"
                    style={{ color: "var(--t3)" }}
                  />
                ) : (
                  <ChevronDown
                    className="h-4 w-4 shrink-0"
                    style={{ color: "var(--t3)" }}
                  />
                )}
              </button>

              {isOpen && (
                <div
                  style={{
                    padding: "0 20px 20px",
                    borderTop: "1px solid var(--b1)",
                    paddingTop: "16px",
                  }}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <InfoItem
                      label="Contact"
                      value={worker.worker_contact || "N/A"}
                    />
                    <InfoItem
                      label="Roll No"
                      value={worker.worker_roll_no || "N/A"}
                    />
                    <InfoItem
                      label="Degree"
                      value={worker.worker_degree || "N/A"}
                    />
                    <InfoItem
                      label="Specialization"
                      value={worker.worker_specialization || "N/A"}
                    />
                    <InfoItem
                      label="Location"
                      value={
                        worker.accommodation_type === "tower"
                          ? `Tower ${worker.tower_no} - Room ${worker.tower_room_no}`
                          : worker.accommodation_type === "block"
                            ? `Block ${worker.block_no} - Room ${worker.block_room_no}`
                            : "N/A"
                      }
                    />
                    <InfoItem
                      label="Profile Complete"
                      value={
                        worker.worker_profile_complete ? "Yes" : "No"
                      }
                    />
                  </div>

                  {worker.upi_qr_url && (
                    <div className="mb-4">
                      <a
                        href={worker.upi_qr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost"
                        style={{
                          padding: "6px 14px",
                          fontSize: "12px",
                          display: "inline-flex",
                        }}
                      >
                        <Eye className="h-3 w-3" />
                        View UPI QR
                      </a>
                    </div>
                  )}

                  {/* Ban / Unban */}
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: `1px solid ${worker.worker_banned ? "var(--g-border)" : "var(--r-border)"}`,
                      background: worker.worker_banned
                        ? "var(--g-dim)"
                        : "var(--r-dim)",
                    }}
                  >
                    {worker.worker_banned ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "var(--t2)",
                              marginBottom: "2px",
                            }}
                          >
                            Ban reason: {worker.worker_ban_reason}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleBanToggle(worker.id, "unban")
                          }
                          disabled={actionLoading}
                          className="btn"
                          style={{
                            padding: "6px 14px",
                            fontSize: "12px",
                            background: "var(--g)",
                            color: "#000",
                          }}
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Unban
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex gap-3 items-end">
                          <div className="flex-1">
                            <label className="field-label">BAN REASON</label>
                            <input
                              value={banReason}
                              onChange={(e) => setBanReason(e.target.value)}
                              placeholder="Reason for banning..."
                              className="font-outfit"
                              style={inputStyle}
                            />
                          </div>
                          <button
                            onClick={() =>
                              handleBanToggle(worker.id, "ban")
                            }
                            disabled={actionLoading}
                            className="btn"
                            style={{
                              padding: "10px 14px",
                              fontSize: "12px",
                              background: "var(--r)",
                              color: "#fff",
                            }}
                          >
                            <Ban className="h-3 w-3" />
                            Ban
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// =============================================
// ORDERS TAB
// =============================================

function OrdersTab({
  orders,
  students,
  onRefresh,
}: {
  orders: Order[];
  students: Student[];
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const orderFilters = [
    { id: "all", label: "All" },
    { id: "PENDING", label: "Pending" },
    { id: "ASSIGNED", label: "Assigned" },
    { id: "IN_PROGRESS", label: "In Progress" },
    { id: "DELIVERED", label: "Delivered" },
    { id: "COMPLETED", label: "Completed" },
  ];

  const filtered = filter === "all"
    ? orders
    : orders.filter((o) => o.status === filter || o.status === filter.toLowerCase());

  const getStudent = (userId: string) =>
    students.find((s) => s.id === userId) || null;

  const getCount = (status: string) =>
    orders.filter((o) => o.status === status || o.status === status.toLowerCase()).length;

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Status updated", description: `Order status → ${newStatus.replace(/_/g, " ")}` });
        onRefresh();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {orderFilters.map((f) => {
          const count = f.id === "all" ? orders.length : getCount(f.id);
          const isActive = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="font-outfit"
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 500,
                background: isActive ? "var(--surface)" : "transparent",
                color: isActive ? "var(--t1)" : "var(--t3)",
                border: isActive ? "1px solid var(--b2)" : "1px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {f.label}{" "}
              <span style={{ opacity: 0.6 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <p style={{ color: "var(--t3)", fontSize: "14px" }}>No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const isExpanded = expanded === order.id;
            const student = getStudent(order.user_id);
            const statusColor = orderStatusColors[order.status] || "var(--t3)";

            return (
              <div
                key={order.id}
                className="card"
                style={{ padding: 0, overflow: "hidden" }}
              >
                {/* Header row */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                  className="w-full text-left"
                  style={{ padding: "16px 20px", cursor: "pointer", background: "none", border: "none" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <h3 className="font-outfit font-semibold truncate" style={{ fontSize: "14px", color: "var(--t1)" }}>
                        {order.title}
                      </h3>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: `${statusColor}15`,
                          color: statusColor,
                          textTransform: "uppercase",
                          flexShrink: 0,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp style={{ width: "16px", height: "16px", color: "var(--t3)", flexShrink: 0 }} />
                    ) : (
                      <ChevronDown style={{ width: "16px", height: "16px", color: "var(--t3)", flexShrink: 0 }} />
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap" style={{ fontSize: "12px", color: "var(--t3)" }}>
                    <span>{order.subject}</span>
                    <span>·</span>
                    <span>{serviceLabels[order.service_type] || order.service_type}</span>
                    <span>·</span>
                    <span style={{ color: "var(--g)" }}>₹{order.total_price}</span>
                    <span>·</span>
                    <span>Due: {formatIST(order.deadline)}</span>
                    {student && (
                      <>
                        <span>·</span>
                        <span>{student.full_name}</span>
                      </>
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--b2)" }}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {/* Student Info */}
                      {student && (
                        <>
                          <InfoItem label="Student Name" value={student.full_name} />
                          <InfoItem label="Email" value={student.email} />
                          <InfoItem label="Phone" value={student.phone || "N/A"} />
                          <InfoItem label="College" value={student.college_name} />
                        </>
                      )}

                      {/* Order Info */}
                      <InfoItem label="Order ID" value={order.id.slice(0, 8)} />
                      <InfoItem label="Service" value={serviceLabels[order.service_type] || order.service_type} />
                      <InfoItem label="Delivery" value={order.delivery_type} />
                      <InfoItem label="Degree" value={order.degree} />
                      <InfoItem label="Semester" value={order.semester?.toString() || "N/A"} />
                      <InfoItem label="Roll No" value={order.roll_no} />
                      <InfoItem label="Deadline" value={formatIST(order.deadline)} />
                      <InfoItem label="Placed" value={formatIST(order.created_at)} />
                    </div>

                    {/* Payment Info */}
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "16px",
                        borderRadius: "10px",
                        border: "1px solid var(--b2)",
                        background: "var(--hover-bg-subtle)",
                      }}
                    >
                      <p className="font-outfit font-semibold mb-3" style={{ fontSize: "13px", color: "var(--t1)" }}>
                        Payment
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <InfoItem label="Total" value={`₹${order.total_price}`} />
                        <InfoItem label="Advance (40%)" value={order.advance_paid ? `₹${order.advance_amount} ✅` : `₹${order.advance_amount} ❌`} />
                        <InfoItem label="Final (60%)" value={order.final_paid ? `₹${order.final_amount} ✅` : `₹${order.final_amount} ⏳`} />
                        <InfoItem label="Advance Status" value={order.advance_paid ? "Paid" : "Unpaid"} />
                      </div>
                    </div>

                    {/* Description */}
                    {order.description && (
                      <div style={{ marginTop: "12px" }}>
                        <p style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                          Description
                        </p>
                        <p style={{ fontSize: "13px", color: "var(--t2)", whiteSpace: "pre-wrap" }}>{order.description}</p>
                      </div>
                    )}

                    {order.front_page_info && (
                      <div style={{ marginTop: "8px" }}>
                        <p style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                          Front Page Info
                        </p>
                        <p style={{ fontSize: "13px", color: "var(--t2)" }}>{order.front_page_info}</p>
                      </div>
                    )}

                    {order.material_note && (
                      <div style={{ marginTop: "8px" }}>
                        <p style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                          Material Note
                        </p>
                        <p style={{ fontSize: "13px", color: "var(--t2)" }}>{order.material_note}</p>
                      </div>
                    )}

                    {order.reference_file_url && (
                      <a
                        href={order.reference_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost mt-3"
                        style={{ padding: "6px 14px", fontSize: "12px", display: "inline-flex", gap: "6px" }}
                      >
                        <ExternalLink style={{ width: "12px", height: "12px" }} />
                        View Reference File
                      </a>
                    )}

                    {/* Status Update */}
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "16px",
                        borderRadius: "10px",
                        border: "1px solid var(--p-border)",
                        background: "var(--p-dim)",
                      }}
                    >
                      <p className="font-outfit font-semibold mb-3" style={{ fontSize: "13px", color: "var(--t1)" }}>
                        Update Order Status
                      </p>
                      <div className="flex gap-3 items-end flex-wrap">
                        <div className="flex-1" style={{ minWidth: "200px" }}>
                          <Select value={order.status} onValueChange={(val) => handleStatusUpdate(order.id, val)}>
                            <SelectTrigger style={{ height: "36px", fontSize: "13px", background: "var(--bg)", border: "1px solid var(--b2)" }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="ASSIGNED">Assigned</SelectItem>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="DELIVERED">Delivered</SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                              <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {actionLoading && <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--p)" }} />}
                      </div>
                      <p style={{ fontSize: "11px", color: "var(--t3)", marginTop: "8px" }}>
                        Set to &quot;Delivered&quot; → user sees &quot;Pay 60%&quot; button. Set to &quot;Completed&quot; after final payment received.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// =============================================
// SHARED COMPONENTS
// =============================================

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          fontSize: "10px",
          color: "var(--t3)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "2px",
        }}
      >
        {label}
      </p>
      <p
        className="font-outfit"
        style={{ fontSize: "13px", color: "var(--t1)" }}
      >
        {value}
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "10px",
  background: "var(--input-bg)",
  border: "1px solid var(--b2)",
  color: "var(--t1)",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.2s",
};
