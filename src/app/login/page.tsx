import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-all duration-500">
      <div className="w-full">
        <LoginForm />
      </div>
    </div>
  )
}

