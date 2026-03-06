import { SignUp } from "@clerk/nextjs";

// NOTE: To require email OTP verification before signup completes,
// configure in Clerk Dashboard → Configure → Email, Phone, Username:
// 1. Enable "Email address" as required
// 2. Set verification method to "Email verification code"

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center">
      <SignUp
        fallbackRedirectUrl="/onboarding"
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "glass-card shadow-none !bg-[var(--card)] !border-[var(--card-border)]",
            headerTitle: "font-clash font-bold !text-[var(--foreground)]",
            headerSubtitle: "!text-[var(--muted)]",
            formFieldLabel: "!text-[var(--foreground)]",
            formFieldInput:
              "!bg-[var(--surface)] !border-[var(--card-border)] !text-[var(--foreground)] placeholder:!text-[var(--muted)] focus:!border-brand-blue focus:!ring-brand-blue",
            formButtonPrimary:
              "!bg-gradient-to-r !from-brand-blue !to-blue-600 hover:!shadow-[0_0_25px_rgba(37,99,235,0.4)] !transition-all !font-semibold",
            footerAction: "!bg-transparent",
            footerActionText: "!text-[var(--muted)]",
            footerActionLink: "!text-brand-blue hover:!text-blue-400",
            footer: "!bg-transparent",
            footerPages: "!bg-transparent",
            footerPagesLink: "!text-brand-blue hover:!text-blue-400",
            socialButtonsBlockButton:
              "!bg-[var(--surface)] !border-[var(--card-border)] !text-[var(--foreground)] hover:!bg-[var(--card-hover)]",
            socialButtonsBlockButtonText: "!text-[var(--foreground)]",
            dividerLine: "!bg-[var(--card-border)]",
            dividerText: "!text-[var(--muted)]",
            identityPreview:
              "!bg-[var(--surface)] !border-[var(--card-border)]",
            identityPreviewText: "!text-[var(--foreground)]",
            identityPreviewEditButton: "!text-brand-blue",
            formFieldInfoText: "!text-[var(--muted)]",
            otpCodeFieldInput:
              "!bg-[var(--surface)] !border-[var(--card-border)] !text-[var(--foreground)]",
            alternativeMethodsBlockButton:
              "!bg-[var(--surface)] !border-[var(--card-border)] !text-[var(--foreground)]",
            formResendCodeLink: "!text-brand-blue",
          },
        }}
      />
    </div>
  );
}
