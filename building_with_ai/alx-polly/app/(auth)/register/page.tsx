import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your account.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <main className="container mx-auto p-6" aria-labelledby="page-title">
      <h1 id="page-title" className="text-xl font-medium">Create account</h1>
    </main>
  );
}
