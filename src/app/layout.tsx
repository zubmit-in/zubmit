import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Zubmit | Your Deadline. Our Problem.",
  description:
    "India's #1 academic assignment assistance platform. Get case studies, reports, PPTs, lab manuals & more delivered before your deadline.",
  keywords:
    "assignment help, college assignments, academic writing, PPT, lab manual, case study, India, students",
  openGraph: {
    title: "Zubmit | Your Deadline. Our Problem.",
    description:
      "Struggling with assignments? Zubmit connects you with expert writers who deliver before your deadline.",
    type: "website",
    locale: "en_IN",
    siteName: "Zubmit",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zubmit | Your Deadline. Our Problem.",
    description:
      "India's #1 academic assignment assistance platform for college students.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider signInFallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/onboarding">
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className="font-outfit antialiased">
          {/* Aurora background effects */}
          <div
            className="fixed pointer-events-none z-0"
            style={{
              top: '-300px',
              left: '-200px',
              width: '1100px',
              height: '1100px',
              background: 'radial-gradient(circle, rgba(91,79,255,0.18) 0%, transparent 60%)',
              animation: 'auroraDrift1 22s ease-in-out infinite alternate',
            }}
          />
          <div
            className="fixed pointer-events-none z-0"
            style={{
              bottom: '-400px',
              right: '-300px',
              width: '1000px',
              height: '800px',
              background: 'radial-gradient(circle, rgba(255,184,48,0.11) 0%, transparent 60%)',
              animation: 'auroraDrift2 30s ease-in-out infinite alternate',
            }}
          />
          <div
            className="fixed pointer-events-none z-0"
            style={{
              top: '30%',
              left: '35%',
              width: '600px',
              height: '600px',
              background: 'radial-gradient(circle, rgba(91,79,255,0.07) 0%, transparent 60%)',
              animation: 'auroraDrift1 15s ease-in-out infinite alternate',
            }}
          />
          <div
            className="fixed inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
              backgroundSize: '30px 30px',
              maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 75%)',
            }}
          />
          <div className="relative z-10">
            <Providers>{children}</Providers>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
