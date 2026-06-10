import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";

interface OwnerStatementData {
  owner: {
    id: string;
    name: string;
  };
  from: Date;
  to: Date;
  totalRent: number;
  totalCommission: number;
  totalMaintenance: number;
  netPayable: number;
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
    marginBottom: 30,
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
    marginTop: 20,
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
  netPayableRow: {
    backgroundColor: "#f0f4f8",
    borderTopWidth: 2,
    borderTopColor: "#1e3a5f",
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a5f",
  },
  netPayableLabel: {
    fontWeight: "bold",
    color: "#1e3a5f",
    fontSize: 13,
  },
  netPayableValue: {
    fontWeight: "bold",
    color: "#1e3a5f",
    fontSize: 13,
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

export const OwnerStatementDocument = ({
  data,
}: {
  data: OwnerStatementData;
}) => {
  const periodStart = format(data.from, "dd MMM yyyy");
  const periodEnd = format(data.to, "dd MMM yyyy");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>DdotsRealty</Text>
          <Text style={styles.headerSubtitle}>Owner Statement</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Owner Name:</Text>
            <Text style={styles.infoValue}>{data.owner.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Statement Period:</Text>
            <Text style={styles.infoValue}>
              {periodStart} to {periodEnd}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statement Summary</Text>
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
                <Text>Rent Collected</Text>
              </View>
              <View style={styles.tableCol2}>
                <Text>+ {formatCurrency(data.totalRent)}</Text>
              </View>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableCol1}>
                <Text>Commission</Text>
              </View>
              <View style={styles.tableCol2}>
                <Text>− {formatCurrency(data.totalCommission)}</Text>
              </View>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableCol1}>
                <Text>Maintenance Costs</Text>
              </View>
              <View style={styles.tableCol2}>
                <Text>− {formatCurrency(data.totalMaintenance)}</Text>
              </View>
            </View>

            <View style={[styles.tableRow, styles.netPayableRow]}>
              <View style={styles.tableCol1}>
                <Text style={styles.netPayableLabel}>Net Payable</Text>
              </View>
              <View style={styles.tableCol2}>
                <Text style={styles.netPayableValue}>
                  {formatCurrency(data.netPayable)}
                </Text>
              </View>
            </View>
          </View>
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
