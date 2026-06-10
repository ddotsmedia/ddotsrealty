import { Suspense } from "react";
import { DashboardContent } from "@/components/data/dashboard-content";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
