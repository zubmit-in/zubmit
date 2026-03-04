"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  Presentation,
  PenTool,
  BookMarked,
  StickyNote,
  Globe,
  ArrowRight,
  ArrowLeft,
  Loader2,
  MessageCircle,
  Clock,
  CheckCircle2,
  FileEdit,
  AlertCircle,
  Upload,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  degreeList,
  getSpecializations,
  getMaxSemester,
  getSubjects,
} from "@/lib/curriculum";
import {
  serviceLabels,
  serviceDescriptions,
  calculatePrice,
  getAdvanceAmount,
  getFinalAmount,
  getUrgencyLabel,
  ServiceType,
} from "@/lib/pricing";
import { formatPrice, getHoursUntilDeadline, getWhatsAppLink } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { pageEnter } from "@/lib/motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  degree: string;
  specialization: string;
  semester: string;
  subject: string;
  customSubject: string;
  cantFindSubject: boolean;
  serviceType: ServiceType | "";
  title: string;
  rollNo: string;
  description: string;
  frontPageInfo: string;
  deadline: string;
  pages: string;
  slides: string;
}

interface ProfileData {
  degree: string | null;
  specialization: string | null;
  semester: number | null;
  roll_no: string | null;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: () => void) => void;
    };
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PHYSICAL_SERVICES: ServiceType[] = ["LAB_MANUAL", "HANDWRITTEN_ASSIGNMENT"];
const WHATSAPP_NUMBER = "919999999999";

const SERVICE_ICONS: Record<string, React.ElementType> = {
  CASE_STUDY: FileText,
  REPORT: FileEdit,
  PPT: Presentation,
  NOTES: StickyNote,
  LAB_MANUAL: BookMarked,
  HANDWRITTEN_ASSIGNMENT: PenTool,
  PROTOTYPE_FULL_STACK_WEBSITE: Globe,
};

const DISPLAY_SERVICES: ServiceType[] = [
  "CASE_STUDY", "REPORT", "PPT", "NOTES",
  "LAB_MANUAL", "HANDWRITTEN_ASSIGNMENT", "PROTOTYPE_FULL_STACK_WEBSITE",
];

const STEP_LABELS = ["Select Subject", "Select Service", "Order Details", "Review & Pay"];

const stepVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -80 : 80, opacity: 0 }),
};

function getMinDatetime(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function NewOrderPage() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    degree: "", specialization: "", semester: "", subject: "",
    customSubject: "", cantFindSubject: false, serviceType: "",
    title: "", rollNo: "", description: "", frontPageInfo: "",
    deadline: "", pages: "", slides: "",
  });
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [uploadingRef, setUploadingRef] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (data.profile) setProfile(data.profile);
      } catch { /* */ }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        degree: profile.degree ?? prev.degree,
        specialization: profile.specialization ?? prev.specialization,
        semester: profile.semester ? String(profile.semester) : prev.semester,
        rollNo: profile.roll_no ?? prev.rollNo,
      }));
    }
  }, [profile]);

  const specializations = useMemo(() => (formData.degree ? getSpecializations(formData.degree) : []), [formData.degree]);
  const maxSemester = useMemo(() => (formData.degree ? getMaxSemester(formData.degree) : 0), [formData.degree]);
  const subjects = useMemo(
    () => formData.degree && formData.specialization && formData.semester
      ? getSubjects(formData.degree, formData.specialization, Number(formData.semester))
      : [],
    [formData.degree, formData.specialization, formData.semester]
  );

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      specialization: specializations.length === 1 ? specializations[0] : "",
      semester: "", subject: "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.degree]);

  useEffect(() => {
    if (specializations.length === 1 && formData.specialization !== specializations[0]) {
      setFormData((prev) => ({ ...prev, specialization: specializations[0] }));
    }
  }, [specializations, formData.specialization]);

  const isPhysical = PHYSICAL_SERVICES.includes(formData.serviceType as ServiceType);
  const hoursUntilDeadline = useMemo(() => (formData.deadline ? getHoursUntilDeadline(formData.deadline) : 0), [formData.deadline]);

  const totalPrice = useMemo(() => {
    if (!formData.serviceType || !formData.deadline) return 0;
    return calculatePrice(
      formData.serviceType as ServiceType, hoursUntilDeadline,
      formData.pages ? Number(formData.pages) : undefined,
      formData.slides ? Number(formData.slides) : undefined
    );
  }, [formData.serviceType, formData.deadline, formData.pages, formData.slides, hoursUntilDeadline]);

  const advance = useMemo(() => getAdvanceAmount(totalPrice), [totalPrice]);
  const remaining = useMemo(() => getFinalAmount(totalPrice), [totalPrice]);
  const finalSubject = formData.cantFindSubject ? formData.customSubject : formData.subject;

  const canProceedStep1 = useMemo(() => {
    if (formData.cantFindSubject) return formData.customSubject.trim().length > 0;
    return formData.degree !== "" && formData.specialization !== "" && formData.semester !== "" && formData.subject !== "";
  }, [formData]);

  const canProceedStep2 = formData.serviceType !== "";

  const canProceedStep3 = useMemo(() => {
    return formData.title.trim().length > 0 && formData.rollNo.trim().length > 0 && formData.deadline !== "" && hoursUntilDeadline > 0;
  }, [formData.title, formData.rollNo, formData.deadline, hoursUntilDeadline]);

  const goNext = useCallback(() => { setDirection(1); setCurrentStep((s) => Math.min(s + 1, 4)); }, []);
  const goBack = useCallback(() => { setDirection(-1); setCurrentStep((s) => Math.max(s - 1, 1)); }, []);
  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const loadRazorpay = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window.Razorpay !== "undefined") { resolve(true); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const handlePayment = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Upload reference file if selected
      let referenceFileUrl: string | null = null;
      if (referenceFile) {
        setUploadingRef(true);
        const fileForm = new FormData();
        fileForm.append("file", referenceFile);
        const uploadRes = await fetch("/api/orders/upload-reference", {
          method: "POST",
          body: fileForm,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          referenceFileUrl = uploadData.url;
        }
        setUploadingRef(false);
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: finalSubject, serviceType: formData.serviceType,
          title: formData.title, description: formData.description,
          rollNo: formData.rollNo, degree: formData.degree,
          specialization: formData.specialization,
          semester: Number(formData.semester),
          frontPageInfo: formData.frontPageInfo || null,
          referenceFileUrl,
          deadline: new Date(formData.deadline).toISOString(),
          pages: formData.pages ? Number(formData.pages) : null,
          slides: formData.slides ? Number(formData.slides) : null,
          totalPrice, advanceAmount: advance,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to create order"); }
      const orderData = await res.json();
      setCreatedOrderId(orderData.id);
      const loaded = await loadRazorpay();
      if (!loaded) { toast({ title: "Payment Error", description: "Could not load payment gateway.", variant: "destructive" }); setLoading(false); return; }
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: advance * 100, currency: "INR", name: "Zubmit",
        description: `Advance for ${serviceLabels[formData.serviceType as ServiceType]} - ${finalSubject}`,
        order_id: orderData.razorpayOrderId,
        prefill: { name: user.fullName || user.firstName || "", email: user.emailAddresses[0]?.emailAddress || "" },
        theme: { color: "#e8722a" },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch("/api/payment/webhook", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature }),
            });
            if (verifyRes.ok) {
              setPaymentSuccess(true);
              toast({ title: "Payment Successful!", description: "Your order has been placed." });
              setTimeout(() => { router.push(`/order/${orderData.id}`); }, 2000);
            } else {
              toast({ title: "Verification Failed", description: "Payment received but verification failed.", variant: "destructive" });
            }
          } catch { toast({ title: "Error", description: "Something went wrong verifying your payment.", variant: "destructive" }); }
        },
        modal: { ondismiss: () => { toast({ title: "Payment Cancelled", description: "You can complete the payment later." }); setLoading(false); } },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
      setLoading(false);
    }
  }, [user, formData, finalSubject, totalPrice, advance, loadRazorpay, toast, router, referenceFile]);

  const whatsappMessage = useMemo(() => {
    return `Hi! I'd like to place a *${formData.serviceType ? serviceLabels[formData.serviceType as ServiceType] : ""}* order.\n\n*Details:*\n- Subject: ${finalSubject}\n- Degree: ${formData.degree}\n- Semester: ${formData.semester}\n- Roll No: ${formData.rollNo || profile?.roll_no || "N/A"}\n- Name: ${user?.fullName || "N/A"}\n- Email: ${user?.emailAddresses[0]?.emailAddress || "N/A"}\n\nPlease guide me on the next steps.`;
  }, [formData, finalSubject, user, profile]);

  // Payment success screen
  if (paymentSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", duration: 0.6 }}>
          <div className="card card-glow max-w-md w-full text-center" style={{ padding: '48px 40px' }}>
            <div className="flex items-center justify-center mx-auto" style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--g-dim)', border: '1px solid var(--g-border)', boxShadow: '0 0 40px rgba(34,217,138,0.3)' }}>
              <CheckCircle2 className="h-10 w-10" style={{ color: 'var(--g)' }} />
            </div>
            <h2 className="display mt-6" style={{ fontSize: '36px', color: 'var(--t1)' }}>ORDER PLACED!</h2>
            <p className="font-outfit text-sm mt-3" style={{ color: 'var(--t2)' }}>
              Your advance payment of {formatPrice(advance)} has been received. We&apos;ll start working on your {serviceLabels[formData.serviceType as ServiceType]} right away.
            </p>
            <div className="flex flex-col gap-3 mt-6">
              <button className="btn btn-p w-full justify-center" onClick={() => router.push(`/order/${createdOrderId}`)}>
                View Order Details <ArrowRight className="h-4 w-4" />
              </button>
              <button className="btn btn-ghost w-full justify-center" onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div {...pageEnter} className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <span className="eyebrow">ORDER PLACEMENT</span>
        <h1 className="display mt-2" style={{ fontSize: '52px', color: 'var(--t1)' }}>Place New Order</h1>
        <p className="font-outfit mt-1" style={{ fontSize: '15px', fontWeight: 300, color: 'var(--t2)' }}>
          Fill in the details and get your work delivered
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0" style={{ margin: '36px 0' }}>
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isDone = currentStep > stepNum;
          const isActive = currentStep === stepNum;
          return (
            <div key={label} className="flex items-center">
              <div
                className="flex items-center gap-2 transition-all duration-300"
                style={{
                  padding: '9px 18px', borderRadius: '10px', whiteSpace: 'nowrap',
                  background: isActive ? 'var(--p-dim)' : isDone ? 'var(--g-dim)' : 'transparent',
                  border: isActive ? '1px solid var(--p-border)' : isDone ? '1px solid var(--g-border)' : '1px solid transparent',
                  boxShadow: isActive ? '0 0 24px var(--p-glow)' : 'none',
                }}
              >
                <div
                  className="flex items-center justify-center font-outfit font-bold transition-all duration-300"
                  style={{
                    width: '22px', height: '22px', borderRadius: '50%', fontSize: '11px',
                    background: isActive ? 'var(--p)' : isDone ? 'var(--g)' : 'var(--b2)',
                    color: isActive || isDone ? 'white' : 'var(--t3)',
                    boxShadow: isActive ? '0 0 10px var(--p)' : 'none',
                  }}
                >
                  {isDone ? '✓' : stepNum}
                </div>
                <span
                  className="hidden sm:inline font-outfit font-semibold transition-colors duration-300"
                  style={{
                    fontSize: '12px', letterSpacing: '0.05em',
                    color: isActive ? 'var(--p-bright)' : isDone ? 'var(--g)' : 'var(--t3)',
                    fontWeight: isActive ? 700 : 600,
                  }}
                >
                  {label}
                </span>
              </div>
              {i < 3 && (
                <div
                  className="hidden sm:block"
                  style={{
                    flex: 1, height: '1px', minWidth: '24px', margin: '0 4px',
                    background: isDone ? 'rgba(34,217,138,0.3)' : 'var(--b2)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="card" style={{ padding: '40px' }}>
              <div className="flex items-center gap-3.5 mb-4">
                <div className="flex items-center justify-center" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--p-dim)', border: '1px solid var(--p-border)' }}>
                  <BookMarked className="h-[22px] w-[22px]" style={{ color: 'var(--p-bright)' }} />
                </div>
                <div>
                  <h3 className="font-outfit font-bold text-xl" style={{ color: 'var(--t1)' }}>Select Your Subject</h3>
                  <p className="font-outfit text-sm" style={{ color: 'var(--t2)' }}>Choose your degree, semester, and subject</p>
                </div>
              </div>
              <div className="gradient-sep my-6" />
              <div className="space-y-5">
                <div><Label className="field-label">Degree Program</Label><Select value={formData.degree} onValueChange={(val) => updateField("degree", val)}><SelectTrigger><SelectValue placeholder="Select your degree" /></SelectTrigger><SelectContent>{degreeList.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}</SelectContent></Select></div>
                {maxSemester > 0 && (<div><Label className="field-label">Semester</Label><Select value={formData.semester} onValueChange={(val) => updateField("semester", val)}><SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger><SelectContent>{Array.from({ length: maxSemester }, (_, i) => (<SelectItem key={i + 1} value={String(i + 1)}>Semester {i + 1}</SelectItem>))}</SelectContent></Select></div>)}
                {subjects.length > 0 && !formData.cantFindSubject && (<div><Label className="field-label">Subject</Label><Select value={formData.subject} onValueChange={(val) => updateField("subject", val)}><SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger><SelectContent>{subjects.map((sub) => (<SelectItem key={sub} value={sub}>{sub}</SelectItem>))}</SelectContent></Select></div>)}
                <div className="flex items-center gap-3 pt-1"><Checkbox id="cantFind" checked={formData.cantFindSubject} onCheckedChange={(checked) => { updateField("cantFindSubject", checked === true); if (checked) updateField("subject", ""); else updateField("customSubject", ""); }} /><Label htmlFor="cantFind" className="text-sm cursor-pointer" style={{ color: 'var(--t3)' }}>Can&apos;t find your subject? Enter it manually</Label></div>
                {formData.cantFindSubject && (<div><Label className="field-label">Subject Name</Label><Input placeholder="e.g. Advanced Thermodynamics" value={formData.customSubject} onChange={(e) => updateField("customSubject", e.target.value)} /></div>)}
              </div>
              <div className="gradient-sep my-8" />
              <div className="flex justify-end"><button className="btn btn-p" onClick={goNext} disabled={!canProceedStep1}>Continue <ArrowRight className="h-4 w-4" /></button></div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="card" style={{ padding: '40px' }}>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="flex items-center justify-center" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--p-dim)', border: '1px solid var(--p-border)' }}>
                    <FileText className="h-[22px] w-[22px]" style={{ color: 'var(--p-bright)' }} />
                  </div>
                  <div>
                    <h3 className="font-outfit font-bold text-xl" style={{ color: 'var(--t1)' }}>Select Service Type</h3>
                    <p className="font-outfit text-sm" style={{ color: 'var(--t2)' }}>What type of work do you need for &ldquo;{finalSubject}&rdquo;?</p>
                  </div>
                </div>
                <div className="gradient-sep my-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {DISPLAY_SERVICES.map((svc) => {
                    const Icon = SERVICE_ICONS[svc] || FileText;
                    const isSelected = formData.serviceType === svc;
                    const isPhysicalSvc = PHYSICAL_SERVICES.includes(svc);
                    const startPrice = formatPrice(calculatePrice(svc, 100));
                    return (
                      <button
                        key={svc} type="button"
                        onClick={() => updateField("serviceType", svc)}
                        className="relative text-left transition-all duration-200 group"
                        style={{
                          padding: '20px', borderRadius: '16px',
                          background: isSelected ? 'var(--p-dim)' : 'var(--hover-bg)',
                          border: isSelected ? '2px solid var(--p-border)' : '2px solid var(--b1)',
                          boxShadow: isSelected ? '0 0 20px var(--p-glow), inset 0 1px 0 rgba(255,255,255,0.05)' : 'none',
                        }}
                      >
                        {isPhysicalSvc && (<span className="absolute top-3 right-3 mono" style={{ fontSize: '9px', background: 'var(--s-dim)', border: '1px solid var(--s-border)', color: 'var(--s)', padding: '2px 8px', borderRadius: '6px' }}>PHYSICAL</span>)}
                        <div className="flex items-center justify-center mb-3" style={{ width: '40px', height: '40px', borderRadius: '11px', background: isSelected ? 'var(--p)' : 'var(--p-dim)', border: isSelected ? 'none' : '1px solid var(--p-border)' }}>
                          <Icon className="h-5 w-5" style={{ color: isSelected ? 'white' : 'var(--p-bright)' }} />
                        </div>
                        <h3 className="font-outfit font-bold text-sm mb-1" style={{ color: 'var(--t1)' }}>{serviceLabels[svc]}</h3>
                        <p className="font-outfit text-xs mb-3 line-clamp-2" style={{ color: 'var(--t3)' }}>{serviceDescriptions[svc]}</p>
                        <p className="mono text-xs" style={{ color: 'var(--p-bright)' }}>From {startPrice}</p>
                        {isSelected && (<div className="absolute -top-2 -right-2 flex items-center justify-center" style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--p)', boxShadow: '0 2px 8px var(--p-glow)' }}><CheckCircle2 className="h-4 w-4" style={{ color: 'white' }} /></div>)}
                      </button>
                    );
                  })}
                </div>
              </div>
              {isPhysical && formData.serviceType && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="card" style={{ padding: '32px', borderColor: 'var(--g-border)', borderLeft: '3px solid var(--g)' }}>
                    <div className="text-center">
                      <div className="flex items-center justify-center mx-auto mb-3" style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'var(--g-dim)', border: '1px solid var(--g-border)' }}>
                        <MessageCircle className="h-8 w-8" style={{ color: 'var(--g)' }} />
                      </div>
                      <h3 className="font-outfit font-bold text-lg" style={{ color: 'var(--t1)' }}>Order via WhatsApp</h3>
                      <p className="font-outfit text-sm mt-1 max-w-sm mx-auto" style={{ color: 'var(--t2)' }}>
                        Physical orders like <strong>{serviceLabels[formData.serviceType as ServiceType]}</strong> require coordination through WhatsApp.
                      </p>
                      <div className="card mt-4 text-left text-sm space-y-1 max-w-md mx-auto" style={{ padding: '16px' }}>
                        <p><span style={{ color: 'var(--t3)' }}>Subject:</span> {finalSubject}</p>
                        <p><span style={{ color: 'var(--t3)' }}>Service:</span> {serviceLabels[formData.serviceType as ServiceType]}</p>
                        <p><span style={{ color: 'var(--t3)' }}>Degree:</span> {formData.degree}</p>
                        <p><span style={{ color: 'var(--t3)' }}>Semester:</span> {formData.semester}</p>
                      </div>
                      <a href={getWhatsAppLink(WHATSAPP_NUMBER, whatsappMessage)} target="_blank" rel="noopener noreferrer" className="block mt-4">
                        <button className="btn btn-green w-full max-w-md mx-auto justify-center">
                          <MessageCircle className="h-5 w-5" />Chat on WhatsApp
                        </button>
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}
              <div className="flex items-center justify-between">
                <button className="btn btn-ghost" onClick={goBack}><ArrowLeft className="h-4 w-4" />Back</button>
                {!isPhysical && (<button className="btn btn-p" onClick={goNext} disabled={!canProceedStep2}>Continue <ArrowRight className="h-4 w-4" /></button>)}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="card" style={{ padding: '40px' }}>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="flex items-center justify-center" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--p-dim)', border: '1px solid var(--p-border)' }}>
                    <FileEdit className="h-[22px] w-[22px]" style={{ color: 'var(--p-bright)' }} />
                  </div>
                  <div>
                    <h3 className="font-outfit font-bold text-xl" style={{ color: 'var(--t1)' }}>Order Details</h3>
                    <p className="font-outfit text-sm" style={{ color: 'var(--t2)' }}>Provide the specifics for your {formData.serviceType ? serviceLabels[formData.serviceType as ServiceType] : "order"}</p>
                  </div>
                </div>
                <div className="gradient-sep my-6" />
                <div className="space-y-5">
                  <div><Label className="field-label">Assignment Title *</Label><Input placeholder="e.g. Marketing Strategy Case Study for Tesla" value={formData.title} onChange={(e) => updateField("title", e.target.value)} /></div>
                  <div><Label className="field-label">Roll Number *</Label><Input placeholder="e.g. 22BCS10045" value={formData.rollNo} onChange={(e) => updateField("rollNo", e.target.value)} /></div>
                  <div><Label className="field-label">Professor Instructions / Description</Label><Textarea placeholder="Any specific instructions, topics to cover, formatting requirements..." value={formData.description} onChange={(e) => updateField("description", e.target.value)} className="min-h-[120px]" /></div>
                  <div><Label className="field-label">Front Page Information</Label><Input placeholder="Professor name, subject code, academic year, etc." value={formData.frontPageInfo} onChange={(e) => updateField("frontPageInfo", e.target.value)} /><p className="font-outfit text-xs mt-1" style={{ color: 'var(--t3)' }}>This will appear on the cover page</p></div>
                  <div style={{ background: 'var(--p-dim)', border: '1px solid var(--p-border)', borderRadius: '12px', padding: '16px' }}>
                    <div className="flex items-start gap-3 mb-3">
                      <Upload className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--p-bright)' }} />
                      <div>
                        <p className="font-outfit font-semibold text-sm" style={{ color: 'var(--t1)' }}>Reference Files</p>
                        <p className="font-outfit text-xs mt-1" style={{ color: 'var(--t2)' }}>Upload any reference material, notes, or guidelines (optional)</p>
                      </div>
                    </div>
                    <label
                      className="flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                      style={{
                        padding: '12px 16px', borderRadius: '10px',
                        border: referenceFile ? '1px solid var(--g-border)' : '1px dashed var(--b2)',
                        background: referenceFile ? 'var(--g-dim)' : 'var(--hover-bg)',
                      }}
                    >
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.zip,.rar"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setReferenceFile(file);
                        }}
                      />
                      {referenceFile ? (
                        <span className="font-outfit text-sm font-medium" style={{ color: 'var(--g)' }}>
                          {referenceFile.name} ({(referenceFile.size / 1024).toFixed(1)} KB)
                        </span>
                      ) : (
                        <span className="font-outfit text-sm" style={{ color: 'var(--t3)' }}>
                          Click to choose a file
                        </span>
                      )}
                    </label>
                    {referenceFile && (
                      <button
                        type="button"
                        className="font-outfit text-xs mt-2"
                        style={{ color: 'var(--r)' }}
                        onClick={() => setReferenceFile(null)}
                      >
                        Remove file
                      </button>
                    )}
                  </div>
                  {formData.serviceType === "PPT" && (<div><Label className="field-label">Number of Slides</Label><Input type="number" min={1} placeholder="e.g. 15" value={formData.slides} onChange={(e) => updateField("slides", e.target.value)} /><p className="font-outfit text-xs mt-1" style={{ color: 'var(--t3)' }}>Base price covers up to 10 slides</p></div>)}
                  {formData.serviceType !== "PPT" && formData.serviceType !== "PROTOTYPE_FULL_STACK_WEBSITE" && (<div><Label className="field-label">Number of Pages (optional)</Label><Input type="number" min={1} placeholder="e.g. 10" value={formData.pages} onChange={(e) => updateField("pages", e.target.value)} /><p className="font-outfit text-xs mt-1" style={{ color: 'var(--t3)' }}>Base price covers up to 5 pages</p></div>)}
                  <div><Label className="field-label">Deadline *</Label><Input type="datetime-local" min={getMinDatetime()} value={formData.deadline} onChange={(e) => updateField("deadline", e.target.value)} />{formData.deadline && hoursUntilDeadline <= 0 && (<p className="font-outfit text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--r)' }}><AlertCircle className="h-3 w-3" />Deadline must be in the future</p>)}</div>
                </div>
              </div>

              {/* Live Price Preview */}
              {formData.serviceType && formData.deadline && hoursUntilDeadline > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="card card-glow relative overflow-hidden" style={{ padding: '32px' }}>
                    <div className="absolute top-0 left-0 right-0" style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, var(--p) 30%, var(--s) 70%, transparent 100%)', animation: 'borderSweep 4s linear infinite' }} />
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--g)', animation: 'dotPulse 1.5s ease-in-out infinite' }} />
                        <span className="mono text-[10px] uppercase" style={{ color: 'var(--g)', letterSpacing: '0.15em' }}>LIVE QUOTE</span>
                      </div>
                      <span className="mono text-[11px] uppercase font-semibold" style={{
                        padding: '4px 10px', borderRadius: '8px',
                        color: hoursUntilDeadline <= 24 ? 'var(--r)' : hoursUntilDeadline <= 48 ? 'var(--s)' : 'var(--g)',
                        background: hoursUntilDeadline <= 24 ? 'var(--r-dim)' : hoursUntilDeadline <= 48 ? 'var(--s-dim)' : 'var(--g-dim)',
                        border: `1px solid ${hoursUntilDeadline <= 24 ? 'var(--r-border)' : hoursUntilDeadline <= 48 ? 'var(--s-border)' : 'var(--g-border)'}`,
                      }}>
                        {getUrgencyLabel(hoursUntilDeadline)}
                      </span>
                    </div>
                    <div className="flex items-end justify-center gap-1" style={{ padding: '24px 0' }}>
                      <span className="font-outfit" style={{ fontSize: '30px', fontWeight: 300, color: 'var(--t2)', paddingBottom: '12px' }}>&#8377;</span>
                      <span className="display" style={{
                        fontSize: '88px',
                        color: hoursUntilDeadline <= 24 ? 'var(--r)' : hoursUntilDeadline <= 48 ? 'var(--s)' : 'var(--t1)',
                      }}>
                        {totalPrice}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 mt-6" style={{ borderTop: '1px solid var(--b1)', paddingTop: '24px' }}>
                      <div className="text-center" style={{ borderRight: '1px solid var(--b1)' }}>
                        <p className="field-label">ADVANCE (40%)</p>
                        <p className="display" style={{ fontSize: '36px', color: 'var(--p-bright)' }}>{advance}</p>
                        <p className="font-outfit text-[11px]" style={{ color: 'var(--t3)' }}>Pay now</p>
                      </div>
                      <div className="text-center">
                        <p className="field-label">REMAINING (60%)</p>
                        <p className="display" style={{ fontSize: '36px', color: 'var(--t2)' }}>{remaining}</p>
                        <p className="font-outfit text-[11px]" style={{ color: 'var(--t3)' }}>After delivery</p>
                      </div>
                    </div>
                    {hoursUntilDeadline < 48 && (
                      <div className="flex items-center gap-2 mt-5 animate-urgent-pulse" style={{ background: 'var(--r-dim)', border: '1px solid var(--r-border)', borderRadius: '10px', padding: '12px 16px' }}>
                        <Clock className="h-4 w-4" style={{ color: 'var(--r)' }} />
                        <span className="font-outfit font-medium text-[13px]" style={{ color: 'var(--r)' }}>{Math.floor(hoursUntilDeadline)} hours until deadline</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              <div className="flex items-center justify-between">
                <button className="btn btn-ghost" onClick={goBack}><ArrowLeft className="h-4 w-4" />Back</button>
                <button className="btn btn-p" onClick={goNext} disabled={!canProceedStep3}>Review Order <ArrowRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="card" style={{ padding: '40px' }}>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="flex items-center justify-center" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--p-dim)', border: '1px solid var(--p-border)' }}>
                    <CheckCircle2 className="h-[22px] w-[22px]" style={{ color: 'var(--p-bright)' }} />
                  </div>
                  <div>
                    <h3 className="font-outfit font-bold text-xl" style={{ color: 'var(--t1)' }}>Order Summary</h3>
                    <p className="font-outfit text-sm" style={{ color: 'var(--t2)' }}>Review your order details before payment</p>
                  </div>
                </div>
                <div className="gradient-sep my-6" />
                <div style={{ borderRadius: '12px', border: '1px solid var(--b1)', overflow: 'hidden' }}>
                  {[
                    { label: "Subject", value: finalSubject },
                    { label: "Service", value: formData.serviceType ? serviceLabels[formData.serviceType as ServiceType] : "" },
                    { label: "Degree", value: formData.degree },
                    { label: "Semester", value: `Semester ${formData.semester}` },
                    { label: "Title", value: formData.title },
                    { label: "Roll No", value: formData.rollNo },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center px-4 py-3" style={{ borderBottom: '1px solid var(--b1)' }}>
                      <span className="font-outfit text-sm" style={{ color: 'var(--t3)' }}>{row.label}</span>
                      <span className="font-outfit text-sm font-medium text-right max-w-[60%] truncate" style={{ color: 'var(--t1)' }}>{row.value}</span>
                    </div>
                  ))}
                  {formData.description && (<div className="px-4 py-3" style={{ borderBottom: '1px solid var(--b1)' }}><span className="font-outfit text-sm block mb-1" style={{ color: 'var(--t3)' }}>Instructions</span><p className="font-outfit text-sm whitespace-pre-wrap" style={{ color: 'var(--t1)' }}>{formData.description}</p></div>)}
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="font-outfit text-sm" style={{ color: 'var(--t3)' }}>Deadline</span>
                    <span className="font-outfit text-sm font-medium flex items-center gap-2" style={{ color: 'var(--t1)' }}>
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(formData.deadline).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price card */}
              <div className="card card-glow relative overflow-hidden" style={{ padding: '32px' }}>
                <div className="absolute top-0 left-0 right-0" style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, var(--p) 30%, var(--s) 70%, transparent 100%)', animation: 'borderSweep 4s linear infinite' }} />
                <h3 className="font-outfit font-bold text-lg" style={{ color: 'var(--t1)' }}>Price Breakdown</h3>
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between text-sm font-outfit"><span style={{ color: 'var(--t3)' }}>{formData.serviceType ? serviceLabels[formData.serviceType as ServiceType] : "Service"}</span><span style={{ color: 'var(--t1)' }}>{formatPrice(totalPrice)}</span></div>
                  <div className="flex justify-between text-sm font-outfit"><span style={{ color: 'var(--t3)' }}>Urgency ({getUrgencyLabel(hoursUntilDeadline)})</span><span style={{ color: hoursUntilDeadline <= 24 ? 'var(--r)' : hoursUntilDeadline <= 48 ? 'var(--s)' : 'var(--g)' }}>Included</span></div>
                  <div className="gradient-sep" />
                  <div className="flex justify-between font-outfit font-bold text-lg"><span style={{ color: 'var(--t1)' }}>Total</span><span className="display" style={{ fontSize: '28px', color: 'var(--t1)' }}>{formatPrice(totalPrice)}</span></div>
                  <div className="gradient-sep" />
                  <div className="flex justify-between text-sm font-outfit"><span className="font-semibold" style={{ color: 'var(--p-bright)' }}>Pay Now (40% Advance)</span><span className="font-bold text-base" style={{ color: 'var(--p-bright)' }}>{formatPrice(advance)}</span></div>
                  <div className="flex justify-between text-sm font-outfit"><span style={{ color: 'var(--t3)' }}>Pay After Delivery (60%)</span><span style={{ color: 'var(--t2)' }}>{formatPrice(remaining)}</span></div>
                </div>
              </div>

              <div className="space-y-3">
                <button className="btn btn-p w-full justify-center" style={{ padding: '16px' }} onClick={handlePayment} disabled={loading}>
                  {loading ? (<><Loader2 className="h-5 w-5 animate-spin" />{uploadingRef ? "Uploading files..." : "Processing..."}</>) : (<>Pay {formatPrice(advance)} Advance Now <ArrowRight className="h-5 w-5" /></>)}
                </button>
                <a href={getWhatsAppLink(WHATSAPP_NUMBER, `Hi, I need help with my order for "${finalSubject}".`)} target="_blank" rel="noopener noreferrer" className="block">
                  <button className="btn btn-ghost w-full justify-center" style={{ fontSize: '13px' }}><MessageCircle className="h-4 w-4" />Need help? Chat with us on WhatsApp</button>
                </a>
              </div>
              <div><button className="btn btn-ghost" onClick={goBack}><ArrowLeft className="h-4 w-4" />Back</button></div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
