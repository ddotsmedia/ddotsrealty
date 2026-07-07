"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/data/kpi-card";
import { ActivityFeed } from "@/components/data/activity-feed";
import { ChequeLookahead } from "@/components/data/cheque-lookahead";
import { AgingWidget } from "@/components/data/aging-widget";
import {
  RevenueBarChart,
  OccupancyDonut,
  LeadPipelineBar,
} from "@/components/data/stat-chart";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Home,
  Banknote,
  Target,
  TrendingUp,
  Plus,
  Clock,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

export function DashboardContent() {
  const { data: kpis, isLoading: kpisLoading } = trpc.dashboard.kpis.useQuery();
  const { data: charts, isLoading: chartsLoading } =
    trpc.dashboard.charts.useQuery();
  const { data: activities, isLoading: activitiesLoading } =
    trpc.dashboard.recentActivity.useQuery();
  const { data: expiringContracts, isLoading: contractsLoading } =
    trpc.dashboard.contractExpiry.useQuery();

  const now = new Date();
  const { data: upcomingCheques, isLoading: chequesLoading } =
    trpc.dashboard.chequeCalendar.useQuery({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });
  const { data: chequesNext7Days, isLoading: chequesNext7DaysLoading } =
    trpc.dashboard.chequesNext7Days.useQuery();
  const { data: rentReceivableAging, isLoading: rentReceivableAgingLoading } =
    trpc.dashboard.rentReceivableAging.useQuery();
  const { data: remindersSentToday, isLoading: remindersSentTodayLoading } =
    trpc.dashboard.remindersSentToday.useQuery();

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your portfolio">
        <div className="flex gap-2 flex-wrap">
          <Button render={<Link href="/properties/new" />} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
          <Button render={<Link href="/contracts/new" />} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Contract
          </Button>
          <Button render={<Link href="/leads/new" />} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
          <Button render={<Link href="/cheques" />} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Log Cheque
          </Button>
        </div>
      </PageHeader>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Active Properties"
          value={String(kpis?.activeProperties ?? 0)}
          sublabel="All properties"
          icon={Building2}
          accent="navy"
          loading={kpisLoading}
        />
        <KpiCard
          label="Vacant Units"
          value={String(kpis?.vacantUnits ?? 0)}
          sublabel="Available"
          icon={Home}
          accent="success"
          loading={kpisLoading}
        />
        <KpiCard
          label="Cheques Due"
          value={formatCurrency(kpis?.chequesDueThisMonthAmount ?? 0)}
          sublabel={`${kpis?.chequesDueThisMonthCount ?? 0} pending this month`}
          icon={Banknote}
          accent="warning"
          loading={kpisLoading}
        />
        <KpiCard
          label="New Leads"
          value={String(kpis?.newLeadsThisWeek ?? 0)}
          sublabel="This week"
          icon={Target}
          accent="gold"
          loading={kpisLoading}
        />
        <KpiCard
          label="Revenue MTD"
          value={formatCurrency(kpis?.revenueMtd ?? 0)}
          sublabel="Monthly total"
          icon={TrendingUp}
          accent="success"
          loading={kpisLoading}
        />
        <KpiCard
          label="Reminders Sent Today"
          value={String(remindersSentToday?.total ?? 0)}
          sublabel="Automated messages"
          icon={Bell}
          accent="gold"
          loading={remindersSentTodayLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">
            Revenue Trend
          </h3>
          {chartsLoading ? (
            <div className="h-60 bg-muted animate-pulse rounded" />
          ) : (
            <RevenueBarChart data={charts?.revenueTrend ?? []} />
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">
            Occupancy
          </h3>
          {chartsLoading ? (
            <div className="h-60 bg-muted animate-pulse rounded" />
          ) : (
            <OccupancyDonut data={charts?.occupancy ?? { available: 0, rented: 0, other: 0 }} />
          )}
        </Card>
      </div>

      {/* Lead Pipeline */}
      <Card className="p-6">
        <h3 className="font-display font-semibold text-foreground mb-4">
          Lead Pipeline
        </h3>
        {chartsLoading ? (
          <div className="h-60 bg-muted animate-pulse rounded" />
        ) : (
          <LeadPipelineBar data={charts?.leadPipeline ?? []} />
        )}
      </Card>

      {/* Cheques & Aging Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChequeLookahead
          items={chequesNext7Days ?? []}
          loading={chequesNext7DaysLoading}
        />
        <AgingWidget
          buckets={rentReceivableAging ?? []}
          loading={rentReceivableAgingLoading}
        />
      </div>

      {/* Bottom Row: Activity & Contracts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityFeed
          items={
            activities?.map((a) => ({
              type: a.type,
              title: a.title,
              subtitle: a.subtitle,
              date: a.date,
            })) ?? []
          }
          loading={activitiesLoading}
        />

        <Card className="p-6">
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Contract Renewals (90 days)
          </h3>
          {contractsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : expiringContracts && expiringContracts.length > 0 ? (
            <div className="space-y-3">
              {expiringContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {contract.propertyTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ends {formatDate(contract.endDate)}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${
                      contract.daysLeft <= 7
                        ? "bg-red-100 text-red-700"
                        : contract.daysLeft <= 30
                          ? "bg-orange-100 text-orange-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {contract.daysLeft}d
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No contract renewals in the next 90 days
            </p>
          )}
        </Card>
      </div>

      {/* Upcoming Cheques */}
      <Card className="p-6">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Upcoming Cheques (This Month)
        </h3>
        {chequesLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : upcomingCheques && upcomingCheques.length > 0 ? (
          <div className="space-y-2">
            {upcomingCheques
              .sort(
                (a, b) =>
                  new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
              )
              .map((cheque) => (
                <div
                  key={cheque.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      Due {formatDate(cheque.dueDate)}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(Number(cheque.amount))}
                  </p>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No pending cheques this month
          </p>
        )}
      </Card>
    </div>
  );
}
