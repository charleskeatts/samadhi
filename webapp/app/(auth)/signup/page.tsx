import { Zap } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Sign Up — Clairio CRM" };

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-white">Create your account</h1>
        <p className="mt-1 text-sm text-slate-400">14-day free trial, no credit card required</p>
      </div>

      {/* Form will be wired in Step 3 */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <p className="text-center text-sm text-slate-400">
          Signup form — coming in Step 3 (Auth implementation)
        </p>
      </div>

      <p className="text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
