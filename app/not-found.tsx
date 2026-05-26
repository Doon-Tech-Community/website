import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pt-24 text-center flex flex-col gap-3 items-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-slate-300">This developer card doesn't exist.</p>
      <Link href="/" className="btn btn-primary mt-2">Back to Pokedex</Link>
    </div>
  );
}
