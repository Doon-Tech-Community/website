import { redirect } from "next/navigation";
import MinimalProfileSetupForm from "@/components/MinimalProfileSetupForm";
import { getCurrentUser } from "@/lib/auth";
import { listAttendeesForUser } from "@/lib/queries";

export const metadata = { title: "Get started", robots: { index: false } };
export const dynamic = "force-dynamic";

function fallbackName(email: string): string {
  const localPart = email.split("@")[0] ?? "";
  return localPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function safeNext(next?: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/profile";
  if (next === "/login" || next.startsWith("/login?")) return "/profile";
  if (next === "/profile/setup" || next.startsWith("/profile/setup?")) return "/profile";
  return next;
}

export default async function ProfileSetupPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/profile/setup")}`);

  const sp = await searchParams;
  const linked = await listAttendeesForUser(user.id, 1);
  if (linked.length > 0) redirect(safeNext(sp.next));

  const name = user.name || fallbackName(user.email);
  const next = safeNext(sp.next);

  return (
    <div className="pt-8 flex flex-col gap-6 max-w-md mx-auto">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">What should we call you?</h1>
        <p className="text-sm text-inkSoft">
          We&apos;ll set up your Pokédex card with just your name for now. You can fill in the rest from your profile whenever you&apos;re ready.
        </p>
      </header>

      <section className="card-frame rounded-2xl p-5">
        <MinimalProfileSetupForm initialName={name} next={next} />
      </section>
    </div>
  );
}
