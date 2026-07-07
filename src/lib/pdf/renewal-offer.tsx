import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";

interface RenewalOfferData {
  contract: {
    id: string;
    ejariNumber: string | null;
  };
  propertyTitle: string;
  tenantName: string;
  currentRent: number;
  newRent: number;
  startDate: Date;
  endDate: Date;
  increasePct: number;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#333",
  },
  header: {
    backgroundColor: "#1e3a5f",
    color: "white",
    padding: 20,
    marginBottom: 30,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#d0d0d0",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1e3a5f",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
    justifyContent: "space-between",
  },
  infoLabel: {
    fontWeight: "bold",
    width: "50%",
  },
  infoValue: {
    width: "50%",
    textAlign: "right",
  },
  table: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
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
  },
  highlightRow: {
    backgroundColor: "#f0f4f8",
    borderTopWidth: 2,
    borderTopColor: "#1e3a5f",
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a5f",
  },
  highlightLabel: {
    fontWeight: "bold",
    color: "#1e3a5f",
    fontSize: 13,
  },
  highlightValue: {
    fontWeight: "bold",
    color: "#1e3a5f",
    fontSize: 13,
  },
  note: {
    marginTop: 24,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
    fontSize: 10,
    color: "#555",
    lineHeight: 1.5,
  },
  footer: {
    marginTop: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#999",
  },
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const RenewalOfferDocument = ({ data }: { data: RenewalOfferData }) => {
  const start = format(data.startDate, "dd MMM yyyy");
  const end = format(data.endDate, "dd MMM yyyy");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>DdotsRealty</Text>
          <Text style={styles.headerSubtitle}>Tenancy Renewal Offer</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Property:</Text>
            <Text style={styles.infoValue}>{data.propertyTitle}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tenant:</Text>
            <Text style={styles.infoValue}>{data.tenantName}</Text>
          </View>
          {data.contract.ejariNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ejari No.:</Text>
              <Text style={styles.infoValue}>{data.contract.ejariNumber}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Proposed Term:</Text>
            <Text style={styles.infoValue}>{start} – {end}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Renewal Terms</Text>
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
              <View style={styles.tableCol1}>
                <Text>Current Annual Rent</Text>
              </View>
              <View style={styles.tableCol2}>
                <Text>{formatCurrency(data.currentRent)}</Text>
              </View>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableCol1}>
                <Text>Rent Increase</Text>
              </View>
              <View style={styles.tableCol2}>
                <Text>{data.increasePct.toFixed(2)}%</Text>
              </View>
            </View>

            <View style={[styles.tableRow, styles.highlightRow]}>
              <View style={styles.tableCol1}>
                <Text style={styles.highlightLabel}>Proposed New Annual Rent</Text>
              </View>
              <View style={styles.tableCol2}>
                <Text style={styles.highlightValue}>{formatCurrency(data.newRent)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.note}>
          <Text>
            This offer is valid for 14 days from the date of issue. Please confirm your
            acceptance in writing (or via signed Ejari renewal) so that the new tenancy
            contract can be finalized before the proposed start date of {start}. Terms are
            subject to RERA rental index guidelines applicable at the time of renewal.
            Should you have any questions regarding this offer, please contact your
            property manager.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>
            Generated on {format(new Date(), "dd MMM yyyy")} - Confidential
          </Text>
        </View>
      </Page>
    </Document>
  );
};
