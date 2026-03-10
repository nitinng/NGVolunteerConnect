# NavGurukul Volunteer Connect

An advanced, comprehensive Volunteer Management System and Skills Content Management System (CMS) tailored specifically for **NavGurukul**. The application streamlines the onboarding, tracking, routing, and management of volunteers, internal operations staff, and program directors. Built with modern web technologies, it features an elegant, responsive UI with deep dark mode integration, an intuitive dashboard, and robust role-based access control (RBAC).

---

## 🚀 Key Objectives

1. **Centralized User Management**: A single source of truth for all users joining the NavGurukul ecosystem, tracking engagement and drop-off rates visually.
2. **Unified Skills CMS**: Architecting the learning and onboarding journey for the student and volunteer community via modular "Mission Tasks".
3. **Role-based Workflows**: Curated experiences and permissions based on four explicit tiers: `Admin`, `Program`, `Operations`, and `Volunteer`.
4. **Seamless Authentication**: Utilizing Supabase for secure, password-less and social authentication, eliminating authorization bottlenecks.

---

## ✨ Core Features & Functionality

### 1. Robust Role-Based Access Control (RBAC)
- **Four Core Roles**: `Admin`, `Program`, `Operations`, and `Volunteer`.
- **Master Admin Override**: Built-in omnipresence override for top-level administrators to bypass standard constraints via `MASTER_USER_ID`.
- **Automated Defaulting**: New signups are automatically provisioned with the `Volunteer` role in Supabase profiles, securing default routes from unauthorized access.
- **Restricted Dashboards**: Dashboards dynamically adapt. Volunteers see their onboarding journey, while Admins/Operations staff see system-wide analytics and CMS settings.

### 2. Analytics & User Management Dashboard
A highly detailed command center designed for `Admin` and `Operations` roles:
- **Metric Cards with Trend Indicators**: Tracks total volunteers, active users, dropping-off users (30-90 days), and inactive users over 90 days. Displays percentage growth/decline.
- **Dynamic Time Range Filtering**: Toggle analytics between the *Last 7 days*, *Last 30 days*, and *Last 90 days*.
- **Interactive Signups Area Chart**: Visualizes user acquisition via a sleek, responsive area chart using Recharts.
- **Comprehensive User Table**: View avatars, emails, roles, and join dates. Fully paginated UI for scalability.
- **Inline Role Management**: Demote, promote, or delete completely from the ecosystem with single clicks.

### 3. Skills CMS & Master Task Controller
A dedicated module engineered for program architects to build learning and onboarding pathways:
- **Skill Categories**: Define high-level expertise areas using unique identifiers and categorization.
- **Sub-Categories (Sub-Roles)**: Nest specific operational roles or niche technical stacks beneath main categories.
- **Mission Tasks**: 
  - **Types Supported**: Reading, Video, MCQ, Essay, Report, and Upload.
  - **Status Management**: Draft, Published, On Hold.
  - **Multi-Assignment**: Create a task once and assign it to multiple sub-categories across entirely different functional categories simultaneously.
  - **Global Task Deletion**: Removing a task globally removes it accurately from every assigned pathway.

### 4. Personalized Volunteer Experience
- **Greeting & Progress**: Dynamic greetings with guided prompts urging volunteers to complete their individualized onboarding profiles.
- **Dark-Mode Compliant Portal**: A distraction-free environment allowing the volunteer to interact with their required mission tasks without system noise.

---

## 🛠 Tech Stack

### Core Frameworks & Languages
- **Framework**: [Next.js 16/19 (App Router)](https://nextjs.org/) for server-side rendering, seamless client-side routing, API routes, and optimal web performance.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for end-to-end type safety, improving developer experience and code reliability.

### UI & Styling
- **CSS Framework**: [Tailwind CSS v4](https://tailwindcss.com/) for utility-first styling, enabling rapid UI development.
- **Component Library**: [Shadcn UI](https://ui.shadcn.com/) providing beautifully crafted, accessible, and customizable interface components (e.g., Dialogs, Selects, Dropdowns, Cards, Tables).
- **Icons**: [Lucide React](https://lucide.dev/) for clean, consistent, and customizable vector iconography.
- **Data Visualization**: [Recharts](https://recharts.org/) for rendering reactive and interactive data charts (like the Signups Area Chart).
- **Theming**: `next-themes` ensuring seamless Light/Dark mode parity across the application.

### Authentication & User Management
- **Database & Identity Provider**: [Supabase](https://supabase.com/) handling Identity, Authentication, secure sessions, and custom Profiles table to store RBAC roles and app metadata.

---

## 🎨 Design Language & Philosophy

The application strictly adheres to a premium, modern design language:

1. **Light & Dark Mode Parity**: A deep, native dark mode integration. Backgrounds shift to deep zincs/blacks (`zinc-950`), while borders and accents adapt gracefully to maintain high contrast and readability.
2. **Color Palette Standardization**: 
   - **Primary Accents**: Rich Indigos and Emeralds replace generic blues/greens for a more sophisticated feel.
   - **Status Indicators**: Uses specific curated shades—Emerald (Success/Published), Amber (Warning/On-Hold), Rose (Destructive/Delete), and Indigo (Information).
3. **Card-Based UI**: Complex information (like the Users table and Dashboard metrics) is compartmentalized into neat, bordered cards with subtle shadows (`shadow-sm`) to create depth.
4. **Interactive Density**: Using hover states, transparent button backgrounds (ghost variants), and concise badging to ensure the UI feels alive but not cluttered.
5. **Modern Typography**: Relies on clean Sans-Serif fonts (like Geist via Next.js) with tight tracking (`tracking-tight`) for headers, ensuring a snappy, readable interface.

---

## 💻 Running the App Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment variables**: 
   Ensure you have configured your local `.env.local` to securely hold your Supabase API keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) and your Master User ID (`MASTER_USER_ID`).
   
   *Example `.env.local`:*
   ```env
   MASTER_USER_ID=your_master_user_uuid
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Start the up local server**:
   ```bash
   npm run dev
   ```
4. **View**: Launch `http://localhost:3000` via your web browser to enter the Volunteer Connect onboarding & portal.
