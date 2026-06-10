import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Activity, Banknote, Target, TrendingUp } from "lucide-react";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your portfolio"
      />

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Properties */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Properties</p>
              <p className="text-3xl font-display font-semibold mt-2 text-foreground">
                —
              </p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            All properties
          </p>
        </Card>

        {/* Cheques Due This Month */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Cheques Due (This Month)
              </p>
              <p className="text-3xl font-display font-semibold mt-2 text-foreground">
                —
              </p>
            </div>
            <div className="p-2 bg-warning/10 rounded-lg">
              <Banknote className="h-5 w-5 text-warning" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Pending payments
          </p>
        </Card>

        {/* New Leads */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">New Leads</p>
              <p className="text-3xl font-display font-semibold mt-2 text-foreground">
                —
              </p>
            </div>
            <div className="p-2 bg-success/10 rounded-lg">
              <Target className="h-5 w-5 text-success" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            This month
          </p>
        </Card>

        {/* Revenue MTD */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Revenue MTD</p>
              <p className="text-3xl font-display font-semibold mt-2 text-foreground">
                —
              </p>
            </div>
            <div className="p-2 bg-gold/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-gold" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Monthly total
          </p>
        </Card>
      </div>

      {/* Activity & Cheques Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">
            Recent Activity
          </h3>
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Your recent activities will appear here"
          />
        </Card>

        {/* Upcoming Cheques */}
        <Card className="p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">
            Upcoming Cheques
          </h3>
          <EmptyState
            icon={Banknote}
            title="No upcoming cheques"
            description="Your upcoming payments will appear here"
          />
        </Card>
      </div>
    </div>
  );
}
