import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import { format } from "date-fns"

interface ClearanceCertificateData {
  id: string
  tenantName: string | null
  propertyTitle: string | null
  actualMoveOut: Date | null
  plannedMoveOut: Date | null
  clearedAt: Date | null
  outstandingRent: string | number
  outstandingUtility: string | number
  outstandingMaintenance: string | number
  penaltyAmount: string | number
  totalOutstanding: string | number
  depositAmount: string | number | null
  depositDeductions: string | number
  depositRefundAmount: string | number
  settlementStatus: string
}

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#333",
  },
  header: {
    backgroundColor: "#1e3a5f",
    color: "white",
    padding: 24,
    marginBottom: 32,
    borderRadius: 4,
  },
  headerBrand: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#c8d8ec",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e3a5f",
    textAlign: "center",
    marginBottom: 24,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#d0dce8",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    fontWeight: "bold",
    width: "50%",
    color: "#555",
  },
  value: {
    width: "50%",
    textAlign: "right",
  },
  table: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a5f",
  },
  tableCol1: {
    width: "60%",
  },
  tableCol2: {
    width: "40%",
    textAlign: "right",
  },
  tableHeaderText: {
    fontWeight: "bold",
    color: "#1e3a5f",
    fontSize: 10,
  },
  totalRow: {
    backgroundColor: "#f0f4f8",
    borderTopWidth: 2,
    borderTopColor: "#1e3a5f",
  },
  totalLabel: {
    fontWeight: "bold",
    color: "#1e3a5f",
  },
  totalValue: {
    fontWeight: "bold",
    color: "#1e3a5f",
  },
  statementBox: {
    backgroundColor: "#f0f4f8",
    borderLeftWidth: 4,
    borderLeftColor: "#1e3a5f",
    padding: 16,
    marginBottom: 24,
  },
  statementText: {
    fontSize: 11,
    lineHeight: 1.6,
    color: "#333",
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
  },
  signatureBox: {
    width: "45%",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 8,
  },
  signatureLabel: {
    fontSize: 10,
    color: "#666",
  },
  footer: {
    marginTop: 32,
    textAlign: "center",
    fontSize: 9,
    color: "#999",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 12,
  },
})

function fmtAED(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "AED 0"
  const n = typeof amount === "string" ? Number(amount) : amount
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function settlementLabel(s: string): string {
  const map: Record<string, string> = {
    pending: "Pending",
    partial: "Partial",
    settled: "Settled",
  }
  return map[s] ?? s
}

export const ClearanceCertificateDocument = ({
  data,
}: {
  data: ClearanceCertificateData
}) => {
  const moveOutDate = data.actualMoveOut ?? data.plannedMoveOut
  const clearedDate = data.clearedAt ?? new Date()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerBrand}>DdotsRealty</Text>
          <Text style={styles.headerSubtitle}>Tenant Clearance Certificate</Text>
        </View>

        <Text style={styles.title}>Tenant Clearance Certificate</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tenant & Property Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Tenant Name:</Text>
            <Text style={styles.value}>{data.tenantName ?? "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Property:</Text>
            <Text style={styles.value}>{data.propertyTitle ?? "—"}</Text>
          </View>
          {moveOutDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Move-Out Date:</Text>
              <Text style={styles.value}>{format(moveOutDate, "dd MMM yyyy")}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Clearance Date:</Text>
            <Text style={styles.value}>{format(clearedDate, "dd MMM yyyy")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reference No:</Text>
            <Text style={styles.value}>{data.id.slice(0, 8).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settlement Summary</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableCol1}>
                <Text style={styles.tableHeaderText}>Description</Text>
              </View>
              <View style={styles.tableCol2}>
                <Text style={styles.tableHeaderText}>Amount (AED)</Text>
              </View>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableCol1}><Text>Outstanding Rent</Text></View>
              <View style={styles.tableCol2}><Text>{fmtAED(data.outstandingRent)}</Text></View>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableCol1}><Text>Outstanding Utility</Text></View>
              <View style={styles.tableCol2}><Text>{fmtAED(data.outstandingUtility)}</Text></View>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableCol1}><Text>Outstanding Maintenance</Text></View>
              <View style={styles.tableCol2}><Text>{fmtAED(data.outstandingMaintenance)}</Text></View>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableCol1}><Text>Penalty</Text></View>
              <View style={styles.tableCol2}><Text>{fmtAED(data.penaltyAmount)}</Text></View>
            </View>

            <View style={[styles.tableRow, styles.totalRow]}>
              <View style={styles.tableCol1}><Text style={styles.totalLabel}>Total Outstanding</Text></View>
              <View style={styles.tableCol2}><Text style={styles.totalValue}>{fmtAED(data.totalOutstanding)}</Text></View>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableCol1}><Text>Security Deposit Held</Text></View>
              <View style={styles.tableCol2}><Text>{fmtAED(data.depositAmount)}</Text></View>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableCol1}><Text>Deposit Deductions</Text></View>
              <View style={styles.tableCol2}><Text>{fmtAED(data.depositDeductions)}</Text></View>
            </View>

            <View style={[styles.tableRow, styles.totalRow]}>
              <View style={styles.tableCol1}><Text style={styles.totalLabel}>Deposit Refund Amount</Text></View>
              <View style={styles.tableCol2}><Text style={styles.totalValue}>{fmtAED(data.depositRefundAmount)}</Text></View>
            </View>
          </View>

          <View style={[styles.row, { marginTop: 8 }]}>
            <Text style={styles.label}>Settlement Status:</Text>
            <Text style={styles.value}>{settlementLabel(data.settlementStatus)}</Text>
          </View>
        </View>

        <View style={styles.statementBox}>
          <Text style={styles.statementText}>
            This is to certify that the above-named tenant has vacated the premises and has no
            outstanding dues or obligations to DdotsRealty Real Estate Management as at the date of
            clearance stated herein. The security deposit has been handled in accordance with
            applicable UAE tenancy regulations and the terms of the tenancy contract.
          </Text>
        </View>

        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Authorized Signatory</Text>
            <Text style={styles.signatureLabel}>DdotsRealty</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Date</Text>
            <Text style={styles.signatureLabel}>{format(clearedDate, "dd MMM yyyy")}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>
            Generated on {format(new Date(), "dd MMM yyyy")} — DdotsRealty Real Estate Management
          </Text>
        </View>
      </Page>
    </Document>
  )
}
