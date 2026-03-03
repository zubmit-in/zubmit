# Zubmit

**Your Deadline. Our Problem.**

India's #1 Assignment Platform — Assignments, PPTs, lab manuals, case studies done right, delivered before your deadline.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| Payments | Razorpay |
| Email | Resend |
| Styling | Tailwind CSS, Framer Motion |
| UI | Radix UI, Lucide Icons |
| State | Zustand |

## Features

- **Student Dashboard** — Place orders, track progress, manage payments
- **Worker System** — Accept tasks, submit work, track earnings
- **Admin Panel** — Manage tasks, review submissions, handle payments, monitor workers
- **Dynamic Pricing** — Urgency-based multipliers (0.85x–2.5x)
- **Split Payments** — 40% advance, 60% on delivery via Razorpay
- **Dark/Light Mode** — Theme-aware UI with custom logos
- **Multi-stage Reviews** — Quality control with revision tracking

## Services

| Service | Starting Price |
|---------|---------------|
| Case Study | ₹170 |
| Report | ₹195 |
| PPT | ₹212 |
| Lab Manual | ₹255 |
| Handwritten Assignment | ₹255 |
| Notes | ₹255 |
| Full Stack Website | ₹1,275 |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase project
- Clerk application
- Razorpay account
- Resend account

### Setup

1. Clone the repo:
```bash
git clone https://github.com/zubmit-in/zubmit.git
cd zubmit
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Fill in your `.env` with keys from Clerk, Supabase, Razorpay, and Resend.

5. Run the Supabase migrations:
   - Open Supabase SQL Editor
   - Run `supabase/migration.sql` first
   - Then run `supabase/worker-system-migration.sql`

6. Start the dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# Resend
RESEND_API_KEY=

# App
ADMIN_EMAIL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── (landing)/       # Landing page
│   ├── (auth)/          # Login & signup (Clerk)
│   ├── (dashboard)/     # Dashboard, orders, earnings, admin
│   ├── onboarding/      # Worker onboarding
│   ├── api/             # API routes
│   └── not-found.tsx    # 404 page
├── components/          # Reusable UI components
├── hooks/               # Custom React hooks
└── lib/                 # Utilities, pricing, DB types, email templates
```

## Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm start         # Production server
npm run lint      # Lint check
```

## License

Private — All rights reserved.
