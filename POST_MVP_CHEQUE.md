# Post-MVP: Cheque / PDC Advanced

This roadmap covers post-MVP enhancements for cheque and post-dated cheque (PDC) management, including printing, banking operations, and advanced tracking features essential for UAE real-estate cash flow operations.

## Existing Fields
The following fields already exist on the `cheques` table and related entities:
- `direction` (received / issued)
- `bank_account_id` (multi-bank routing)
- `custody_holder` (handover tracking)
- `postponed` (date-based postponement)
- `penalty_amount` (penalty tracking)
- `stale_date` (6-month stale cheque)

## Roadmap Items

### Cheque Printing (UAE Bank Format)
- [ ] Cheque printing template with UAE bank-standard MICR/security codes — Priority P1
  - Notes: Support DCC, FAB, ADIB, ENBD cheque layouts; barcode on stub; duplicate carbon tracking

### Bank Deposit Batch / Deposit Slip Generation
- [ ] Select multiple cheques and generate batch deposit slip with totals — Priority P1
  - Notes: Deposit slip PDF (bank-provided template); sequence numbering; deposit reference link back to cheques

### Cheque Collection Receipt (Printable)
- [ ] Generate printable receipt given to tenant when cheque handed over — Priority P2
  - Notes: Receipt template; signature line; copy for tenant and internal record; include payee, amount, date, cheque number

### Partial Clearance Tracking
- [ ] Track remaining balance when cheque is partially cleared — Priority P2
  - Notes: New field `cleared_amount` and `clearance_date` on cheques; support split deposits

### Cheque Penalty / Fine Tracking
- [ ] Dashboard and reports for cheques with penalties; auto-flag bounced cheques — Priority P2
  - Notes: Bounce reason enum; bank notification integration; penalty calculation rules per bank

### Future Bank Balance Projection
- [ ] Cash position forecast from upcoming dated cheques and scheduled deposits — Priority P2
  - Notes: Cash flow widget; confidence levels; assumes no new activity; scenario simulation

### Multi-Bank Routing
- [ ] Route deposits to different bank accounts based on cheque source or owner preference — Priority P1
  - Notes: Field `target_bank_account_id` already exists; enhance UI for batch routing selection

### Owner Payout Cheque Scheduling
- [ ] Schedule cheques to be issued to owners as payment; track as payable cheques — Priority P1
  - Notes: Link to owner_statements; status enum (draft → scheduled → issued → cleared); approval workflow

### Cheque Handover / Custody Full Audit Trail
- [ ] Complete audit log of every custody transfer (staff A → staff B → bank) with timestamps — Priority P1
  - Notes: New table `cheque_custody_log` (cheque_id, from_holder, to_holder, transferred_at, notes); immutable log

### Stale Cheque (6-Month) Automation
- [ ] Auto-flag cheques approaching stale date; workflow to return or reissue — Priority P2
  - Notes: Alert 30 days before stale; bulk reissue option; audit trail of returns

## Schema Additions

```sql
-- cheque_custody_log — immutable audit trail
CREATE TABLE cheque_custody_log (
  id UUID PRIMARY KEY,
  cheque_id UUID NOT NULL REFERENCES cheques(id),
  from_holder_id UUID,
  to_holder_id UUID,
  transferred_at TIMESTAMP NOT NULL,
  transfer_reason VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Extend cheques table with new fields
ALTER TABLE cheques ADD COLUMN IF NOT EXISTS cleared_amount DECIMAL(12, 2);
ALTER TABLE cheques ADD COLUMN IF NOT EXISTS clearance_date DATE;
ALTER TABLE cheques ADD COLUMN IF NOT EXISTS target_bank_account_id UUID REFERENCES bank_accounts(id);
ALTER TABLE cheques ADD COLUMN IF NOT EXISTS bounce_reason VARCHAR(100);
ALTER TABLE cheques ADD COLUMN IF NOT EXISTS payout_status VARCHAR(50) DEFAULT 'draft'; -- for owner payouts
ALTER TABLE cheques ADD COLUMN IF NOT EXISTS approval_by_id UUID REFERENCES staff(id);
ALTER TABLE cheques ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
```
