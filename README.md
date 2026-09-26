# Kohi Sekai - Idol Merchandise & Cheki Ecommerce Platform

Kohi Sekai is a fullstack web platform engineered for idol fan communities, featuring a high-conversion Cheki and merchandise shop, digital collectible receipts, and a comprehensive Admin Command Center. Built with a signature **Kawaii Metal** design aesthetic (glassmorphism, vibrant accents, and clean contrast).

---

## Architecture & Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Progressive Web App (PWA)**: `vite-plugin-pwa` with service worker caching for offline readiness and native mobile installability
- **Styling**: Vanilla CSS design tokens with Glassmorphism, Tailwind CSS utility classes, and Dual-Theme support (Clean Light Mode & Metal Dark Mode)
- **Icons**: `react-icons` and `lucide-react` (No-Emojis Policy across all action UI elements)
- **Data Visualization**: `chart.js` & `react-chartjs-2` for order and member sales analytics
- **Animations & Interactivity**: `framer-motion`, `react-parallax-tilt`, and `aos`
- **Notifications**: Custom toast notification system (`src/lib/toast.jsx`) and SweetAlert2 for confirmations

### Backend, Database & Serverless
- **Runtime**: Node.js with Express.js (Local & Production Server)
- **Serverless API**: Vercel Serverless Functions (`/api`) for cloud-native deployment
- **Database**: PostgreSQL hosted on Supabase with Row Level Security (RLS)
- **Authentication**: Supabase Auth and secure JWT middleware
- **Storage & Compression**: Supabase Storage with automated server-side WebP compression via Sharp (`sharp`)
- **Realtime**: Supabase Realtime WebSocket subscriptions for instant order and inventory alerts
- **Security & Rate Limiting**: `helmet`, `express-rate-limit`, `express-slow-down`, and CORS protection

---

## Core Features

### 1. Public Portal & Shopping Experience
- **Dynamic Member Showcase**: Idol profiles, stage names, catchphrases, birthdates, social media links, custom neon brand colors, and multi-slot photo galleries dynamically driven from Supabase.
- **Smart Cheki & Merchandise Store**: Event-based ordering, dynamic quantity calculators, bundle discounts, merchandise size variants, and real-time cart persistence.
- **Optimized Checkout Flow**: Streamlined two-field checkout (Customer Name and Contact info/WhatsApp), instant price calculation (PO vs OTS), and proof-of-payment upload with automated WebP conversion.
- **Digital Collectibles & Receipts**: Client-side canvas receipt generator formatted for high-res downloading and direct Instagram Story sharing.
- **Maintenance Barrier**: Centralized maintenance mode screen with customized announcement messages and estimated completion timers.
- **Static Member Landing Pages**: Built-in support for dedicated member subpaths (`/aca`, `/cally`, `/channie`, etc.).

### 2. Admin Command Center
- **Live Order Management**: Realtime order feed, multi-criteria filtering (status, event, OTS, PO, merch), search, and bulk order actions.
- **Interactive Sales Recap & Analytics (`RecapTab`)**: Visual bar charts (`chart.js`) breaking down sales by member, total gross revenue, OTS vs PO ratio, and completed Polaroid counts.
- **Full CMS Member Management (`MembersTab`)**: Full-page editor (no modal popups) for creating and updating idol profiles, group banners, custom HEX color branding, and sort ordering.
- **Dual-Photo System**: Independent image upload pipelines for Member Profile portraits (`image_url`) and vertical 2-Shot Cheki store displays (`shop_image_url`).
- **Interactive Hero Section Customizer (`HeroTab`)**: Real-time visual drag/scale/position editor for hero idol cutouts on desktop (1440x800) and mobile (390x600) viewports with instant live preview and preset color backdrops.
- **Merchandise Inventory Management (`MerchTab`)**: Variant controls (sizes S/M/L/XL/XXL), pricing, stock tracking, and dimension chart management.
- **Event Scheduling (`EventsTab`)**: Full scheduling and status toggles for upcoming live events and preorder deadlines.
- **System Settings & Storage Purge (`SettingsTab`)**:
  - Pre-Order (PO) and On-The-Spot (OTS) global price configurations with live comparison calculators.
  - Payment credentials (Bank, e-wallet, account number, account holder name).
  - Instant toggle for site-wide Maintenance Mode with custom banner messaging.
  - Automated purge tool for old payment proofs (>1 month) to save Supabase Storage quota.
  - Bulk order reset / event-based transactional purge.
- **Export Capabilities**: One-click Excel (`exceljs`) and PDF (`jspdf`, `jspdf-autotable`) report generation per event.

---

## Getting Started

### Prerequisites
- Node.js version 18 or later
- npm or yarn
- Supabase project with PostgreSQL database and Storage buckets initialized

### Installation

1. Clone the repository:
```bash
git clone https://github.com/NobodySandJ/KohiSekaiCMS.git
cd KohiSekaiCMS
```

2. Install all dependencies across all workspaces (`root`, `frontend`, `backend`, `api`):
```bash
ppnpm install:all
```

3. Configure environment variables:
Create `.env` files in `backend/` and `frontend/` using `.env.example` as a template:
```env
# Frontend (.env)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000/api

# Backend (.env)
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
```

4. Apply database migrations:
```bash
npx supabase migration up
# or execute database/production-full-schema.sql directly in the Supabase SQL editor
```

5. Run development servers:
```bash
pnpm dev
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`

> **Alternative Windows Launchers**: You can also use `Start Local Projek.bat` to launch both servers with health monitoring or `Start Vercel Local.bat` for local Vercel CLI testing.

---

## Project Structure

```
KohiSekaiCMS/
â”œâ”€â”€ .agents/                 # AI vibe coding guidelines and specialized skills
â”œâ”€â”€ api/                     # Vercel Serverless API endpoints
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ config/              # Supabase admin and storage service clients
â”‚   â”œâ”€â”€ middleware/          # JWT auth, rate limiting, and Sharp upload filters
â”‚   â”œâ”€â”€ routes/              # RESTful API endpoints (orders, merch, members, config)
â”‚   â””â”€â”€ server.js            # Express server entrypoint
â”œâ”€â”€ database/                # Full production SQL schemas and patches
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ public/              # Static assets, PWA icons, member landing pages
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ components/      # Glassmorphism UI components (Hero, Shop, Receipts, Modals)
â”‚   â”‚   â”œâ”€â”€ context/         # React Contexts (MaintenanceContext, CartContext)
â”‚   â”‚   â”œâ”€â”€ hooks/           # Business logic and query hooks
â”‚   â”‚   â”œâ”€â”€ lib/             # API client, toast notifications, export utilities
â”‚   â”‚   â”œâ”€â”€ pages/           # Customer pages (Home, Shop, MemberDetail) and Admin CMS
â”‚   â”‚   â”‚   â””â”€â”€ admin/       # Modular Admin Dashboard (tabs, modals, components)
â”‚   â”‚   â””â”€â”€ styles/          # Global tokens and CSS
â”‚   â””â”€â”€ vite.config.js       # Vite build setup with PWA plugin & static route plugins
â”œâ”€â”€ supabase/
â”‚   â””â”€â”€ migrations/          # Versioned SQL migrations
â”œâ”€â”€ ARCHITECTURE.md          # Detailed system architecture
â”œâ”€â”€ CHANGELOG.md             # Version history and release notes
â”œâ”€â”€ CONTRIBUTING.md          # Contribution and code quality guide
â”œâ”€â”€ TODO.md                  # Development roadmap and backlog
â””â”€â”€ README.md                # Project documentation
```

---

## License & Intellectual Property

This repository is maintained for transparent deployment and review. Source code, design assets, and brand trademarks are reserved exclusively for the official Kohi Sekai production operations.
