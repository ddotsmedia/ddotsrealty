"use client";

import { trpc } from "@/lib/trpc";

export default function PlatformPage() {
  const statsQuery = trpc.superadmin.tenantStats.useQuery();
  const tenantsQuery = trpc.superadmin.allTenants.useQuery();

  if (statsQuery.isLoading || tenantsQuery.isLoading) {
    return <div className="text-slate-600">Loading...</div>;
  }

  if (statsQuery.error || tenantsQuery.error) {
    return (
      <div className="text-red-600">
        Error: {statsQuery.error?.message || tenantsQuery.error?.message}
      </div>
    );
  }

  const stats = statsQuery.data ?? {
    tenantCount: 0,
    userCount: 0,
    propertyCount: 0,
    activeContracts: 0,
    totalChequeValue: 0,
  };
  const tenants = tenantsQuery.data ?? [];

  return (
    <div>
      <h1 className="text-4xl font-bold text-slate-900 mb-8">
        Platform Overview
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-sm font-medium text-slate-600 mb-2">
            Total Tenants
          </h3>
          <p className="text-3xl font-bold text-slate-900">
            {stats.tenantCount}
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-sm font-medium text-slate-600 mb-2">
            Total Users
          </h3>
          <p className="text-3xl font-bold text-slate-900">
            {stats.userCount}
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-sm font-medium text-slate-600 mb-2">
            Total Properties
          </h3>
          <p className="text-3xl font-bold text-slate-900">
            {stats.propertyCount}
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-sm font-medium text-slate-600 mb-2">
            Active Contracts
          </h3>
          <p className="text-3xl font-bold text-slate-900">
            {stats.activeContracts}
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-sm font-medium text-slate-600 mb-2">
            Total Cheques
          </h3>
          <p className="text-3xl font-bold text-slate-900">
            AED {stats.totalChequeValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-slate-900">All Tenants</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Subscription
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                  Users
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                  Properties
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                    {tenant.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {tenant.type}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                      {tenant.subscription}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 text-right">
                    {tenant.userCount}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 text-right">
                    {tenant.propertyCount}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        tenant.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {tenant.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
