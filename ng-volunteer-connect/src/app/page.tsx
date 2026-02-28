import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <main className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border dark:bg-zinc-950 dark:border-zinc-800 text-center">
        <h1 className="text-2xl font-bold mb-2">NG-Volunteer-Connect</h1>
        <p className="text-muted-foreground mb-8">
          The project has been successfully initialized with Next.js, Tailwind CSS, and Shadcn UI components.
        </p>

        <div className="flex flex-col gap-4">
          <Link href="/login" className="w-full">
            <Button className="w-full" size="lg">Go to Login Page (login-04)</Button>
          </Link>
          <Link href="/regester" className="w-full">
            <Button className="w-full" variant="secondary" size="lg">Go to Register Form</Button>
          </Link>
          <Link href="/dashboard" className="w-full">
            <Button className="w-full" variant="outline" size="lg">Go to Dashboard (sidebar-16)</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
