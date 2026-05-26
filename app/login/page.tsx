import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams
}: {
  searchParams: { next?: string; uid?: string };
}) {
  const user = await getCurrentUser();
  if (user) redirect(searchParams.next || "/");
  const next = searchParams.next || "/";
  return (
    <div className="pt-12 max-w-md mx-auto card-frame rounded-2xl p-6">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Sign in</h1>
      <p className="text-sm text-inkSoft mb-4">
        Enter your email and we&apos;ll send you a one-time code.
      </p>
      <LoginForm next={next} initialUserId={searchParams.uid ?? ""} />
    </div>
  );
}
