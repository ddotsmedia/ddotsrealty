import { PageHeader } from "@/components/shared/page-header"
import { ContractForm } from "@/components/forms/contract-form"

export default function NewContractPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Contract"
        description="Create a rental contract and generate the cheque schedule"
      />
      <ContractForm />
    </div>
  )
}
