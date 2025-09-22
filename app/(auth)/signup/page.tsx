import { LoginForm } from "@/components/login-form"

export default function SignupPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold">Create an account</h1>
          <p className="text-muted-foreground">Sign up to get started with Twizz Cutter</p>
        </div>
        <LoginForm />
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <a href="/login" className="underline underline-offset-4 hover:text-primary">
            Sign in
          </a>
        </div>
      </div>
    </div>
  )
}