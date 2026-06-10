import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-slate-900">
              Platform Admin
            </div>
          </div>
          <nav className="flex gap-6">
            <Link
              href="/platform"
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              Overview
            </Link>
            <Link
              href="/platform/subscriptions"
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              Subscriptions
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
