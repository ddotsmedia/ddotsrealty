"use client";

import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { ComplianceWidget } from "@/components/data/compliance-widget";

export default function CompliancePage() {
  const complianceFields = [
    {
      code: "RERA ORN",
      label: "Real Estate Regulatory Authority Office Registration Number",
      description: "Abu Dhabi property registration number",
    },
    {
      code: "BRN",
      label: "Business Registration Number",
      description: "UAE business registration number",
    },
    {
      code: "Trade License",
      label: "Trade License",
      description: "UAE trade license for business operations",
    },
    {
      code: "Ejari",
      label: "Ejari (Dubai Tenancy Contract)",
      description: "Dubai rental contract registration",
    },
    {
      code: "Tawtheeq",
      label: "Tawtheeq (Abu Dhabi Tenancy Contract)",
      description: "Abu Dhabi rental contract registration",
    },
    {
      code: "Trakheesi Permit",
      label: "Trakheesi Permit",
      description: "Dubai property management permit for rentals",
    },
    {
      code: "Title Deed",
      label: "Title Deed",
      description: "Property ownership document",
    },
    {
      code: "Oqood",
      label: "Oqood (NOC - No Objection Certificate)",
      description: "Landlord approval document for tenant transfers",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Compliance" />

      {/* Compliance Alerts Widget */}
      <ComplianceWidget />

      {/* UAE Compliance Reference */}
      <Card>
        <CardHeader>
          <CardTitle>UAE Compliance Fields Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            The following documents and registrations are tracked in the system to ensure compliance with UAE real estate regulations:
          </p>

          <div className="grid gap-4">
            {complianceFields.map((field, idx) => (
              <div
                key={idx}
                className="flex gap-3 p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex-shrink-0 mt-1">
                  <Check className="h-4 w-4 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">
                    {field.code}: {field.label}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {field.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-info/10 border border-info/30 rounded-lg">
            <p className="text-sm text-foreground">
              <strong>Tip:</strong> Upload and track these documents in the Documents section to maintain compliance and ensure timely renewals.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
