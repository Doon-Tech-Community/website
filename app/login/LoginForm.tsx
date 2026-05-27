"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { startEmailOtp, verifyEmailOtp } from "@/lib/actions";

export default function LoginForm({
  next,
  initialUserId
}: {
  next: string;
  initialUserId: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">(initialUserId ? "code" : "email");
  const [userId, setUserId] = useState(initialUserId);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function sendCode(formData: FormData) {
    setError(null);
    const result = await startEmailOtp(formData);
    if (!result.ok || !result.userId) {
      setError(result.error || "Failed to send code.");
      return;
    }
    setEmail(String(formData.get("email") ?? ""));
    setUserId(result.userId);
    setStep("code");
  }

  async function verifyCode(formData: FormData) {
    setError(null);
    formData.set("userId", userId);
    formData.set("next", next);
    const result = await verifyEmailOtp(formData);
    if (!result.ok) {
      setError(result.error || "Invalid code.");
      return;
    }
    router.replace(result.redirectTo || next);
    router.refresh();
  }

  if (step === "email") {
    return (
      <form action={(fd) => start(() => sendCode(fd))} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="label">Email</span>
          <input
            type="email"
            name="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="you@example.com"
            className="input"
          />
        </label>
        {error && <p className="chip chip-legendary self-start">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Sending…" : "Send code"}
        </button>
      </form>
    );
  }

  return (
    <form action={(fd) => start(() => verifyCode(fd))} className="flex flex-col gap-3">
      <p className="text-sm text-inkSoft">
        We sent a 6-digit code to <span className="font-semibold">{email || "your email"}</span>.
      </p>
      <label className="flex flex-col gap-1">
        <span className="label">One-time code</span>
        <input
          type="text"
          name="code"
          required
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{4,8}"
          maxLength={8}
          placeholder="123456"
          className="input tracking-[0.4em] text-center"
        />
      </label>
      {error && <p className="chip chip-legendary self-start">{error}</p>}
      <div className="flex gap-2 justify-between">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setStep("email");
            setError(null);
          }}
        >
          Use a different email
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Verifying…" : "Verify"}
        </button>
      </div>
    </form>
  );
}
