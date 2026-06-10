"use client";

import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

export default function SubscriptionsPage() {
  const subscriptionsQuery = trpc.superadmin.subscriptions.useQuery();

  if (subscriptionsQuery.isLoading) {
    return <div className="text-slate-600">Loading...</div>;
  }

  if (subscriptionsQuery.error) {
    return (
      <div className="text-red-600">
        Error: {subscriptionsQuery.error?.message}
      </div>
    );
  }

  const subscriptions = subscriptionsQuery.data ?? [];

  return (
    <div>
      <h1 className="text-4xl font-bold text-slate-900 mb-8">
        Subscriptions
      </h1>

      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Tenant Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Expires At
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subscriptions.map((sub) => {
                const isExpired =
                  sub.subscriptionExpiresAt &&
                  new Date() > new Date(sub.subscriptionExpiresAt);

                return (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {sub.name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                        {sub.subscription}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {sub.subscriptionExpiresAt
                        ? format(
                            new Date(sub.subscriptionExpiresAt),
                            "MMM dd, yyyy",
                          )
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {isExpired ? (
                        <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                          Expired
                        </span>
                      ) : sub.isActive ? (
                        <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
