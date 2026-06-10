"use client";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PLAN_LIMITS } from "@/server/services/subscription.service";

export default function SubscriptionPage() {
  const companyQuery = trpc.settings.getCompany.useQuery();

  if (companyQuery.isLoading) {
    return <div className="text-slate-600">Loading...</div>;
  }

  if (companyQuery.error) {
    return (
      <div className="text-red-600">
        Error: {companyQuery.error?.message}
      </div>
    );
  }

  const company = companyQuery.data;
  const currentPlan = (company?.subscription ?? "free") as
    | "free"
    | "basic"
    | "pro"
    | "enterprise";

  const plans: Array<"free" | "basic" | "pro" | "enterprise"> = [
    "free",
    "basic",
    "pro",
    "enterprise",
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Billing</h1>
        <p className="text-slate-600">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600 mb-1">Current Subscription</p>
            <p className="text-3xl font-bold text-slate-900 capitalize">
              {currentPlan}
            </p>
            <p className="text-sm text-slate-600 mt-2">
              {company?.subscriptionExpiresAt
                ? `Expires on ${new Date(company.subscriptionExpiresAt).toLocaleDateString()}`
                : "No expiration date"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600 mb-1">Monthly Price</p>
            <p className="text-2xl font-bold text-slate-900">
              AED {PLAN_LIMITS[currentPlan].price}
            </p>
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          Plan Comparison
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const limits = PLAN_LIMITS[plan];
            const isCurrent = plan === currentPlan;

            return (
              <div
                key={plan}
                className={`border rounded-lg p-4 ${
                  isCurrent
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <h3 className="font-bold text-slate-900 capitalize mb-3">
                  {plan}
                </h3>
                <div className="space-y-2 mb-4">
                  <div className="text-sm text-slate-600">
                    <span className="font-semibold">AED {limits.price}</span>
                    /month
                  </div>
                  <div className="text-sm text-slate-600">
                    {limits.properties} properties
                  </div>
                  <div className="text-sm text-slate-600">
                    {limits.users} users
                  </div>
                </div>
                {isCurrent && (
                  <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                    Current
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Ready to Upgrade?
        </h2>
        <p className="text-slate-600 mb-6">
          Billing integration (Stripe) is coming soon. Contact our sales team
          for custom enterprise plans.
        </p>
        <div className="flex gap-3">
          <Button disabled>Upgrade Plan</Button>
          <Button
            variant="secondary"
            render={<a href="mailto:sales@ddotsrealty.com" />}
          >
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}
