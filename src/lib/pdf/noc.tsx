import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import { format } from "date-fns"

interface NocDocumentData {
  id: string
  nocType: string
  tenantName: string | null
  description: string | null
  issuedAt: Date
  validUntil: Date | null
  nocDocumentUrl: string | null
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
    width: "40%",
    color: "#555",
  },
  value: {
    width: "60%",
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
  footer: {
    marginTop: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#999",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 12,
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
})

function nocTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    subletting: "Subletting",
    renovation: "Renovation",
    pet: "Pet",
    satellite_dish: "Satellite Dish",
    business_activity: "Business Activity",
    visa_sponsorship: "Visa Sponsorship",
    parking: "Parking",
    move_in: "Move In",
    move_out: "Move Out",
    other: "Other",
  }
  return labels[type] ?? type
}

export const NocDocument = ({ data }: { data: NocDocumentData }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerBrand}>DdotsRealty</Text>
          <Text style={styles.headerSubtitle}>No Objection Certificate</Text>
        </View>

        <Text style={styles.title}>No Objection Certificate</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certificate Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>NOC Type:</Text>
            <Text style={styles.value}>{nocTypeLabel(data.nocType)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tenant Name:</Text>
            <Text style={styles.value}>{data.tenantName ?? "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Issue Date:</Text>
            <Text style={styles.value}>{format(data.issuedAt, "dd MMM yyyy")}</Text>
          </View>
          {data.validUntil && (
            <View style={styles.row}>
              <Text style={styles.label}>Valid Until:</Text>
              <Text style={styles.value}>{format(data.validUntil, "dd MMM yyyy")}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Reference No:</Text>
            <Text style={styles.value}>{data.id.slice(0, 8).toUpperCase()}</Text>
          </View>
        </View>

        {data.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Purpose / Description</Text>
            <Text style={styles.statementText}>{data.description}</Text>
          </View>
        )}

        <View style={styles.statementBox}>
          <Text style={styles.statementText}>
            DdotsRealty Real Estate Management hereby confirms that we have no objection to
            the above-named tenant carrying out the activity described in this certificate,
            subject to compliance with applicable UAE laws, regulations, and the terms of the
            tenancy contract. This NOC is issued in good faith and does not constitute a waiver
            of any contractual rights or obligations.
          </Text>
        </View>

        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Authorized Signatory</Text>
            <Text style={styles.signatureLabel}>DdotsRealty</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Date</Text>
            <Text style={styles.signatureLabel}>{format(data.issuedAt, "dd MMM yyyy")}</Text>
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
