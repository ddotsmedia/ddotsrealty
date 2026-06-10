# Post-MVP: Accounting

This roadmap covers accounting and financial reporting features required for UAE real-estate compliance, audit readiness, and integration with standard accounting packages.

## Related MVP Shipping

The following accounting features already shipped in MVP:
- Cheque clear → transaction auto-link (cash receipt journal entry auto-created)
- Dashboard widgets for rent receivable aging (basic view)

Post-MVP items extend these to full reporting, GL management, and compliance.

## Roadmap Items

### Chart of Accounts (Real-Estate GL)
- [ ] Pre-built chart of accounts for UAE real-estate operations — Priority P2
  - Notes: Account structure (1000–1999 Assets, 2000–2999 Liabilities, 3000–3999 Equity, 4000–4999 Revenue, 5000–5999 Expenses); mapping to IFRS categories; customizable account names

### Automated Journal Entries
- [ ] Auto-generate journal entries when cheques clear, payments received, expenses posted — Priority P2
  - Notes: Rules engine (cheque clear → debit bank / credit rent receivable); reversals on bounce; audit trail per entry

### Rent Receivable Aging Report (Extended)
- [ ] Full aging report with drill-down to tenant/property and payment plan view — Priority P1
  - Notes: Extend MVP widget to full A/R aging; columns: current, 30–60, 60–90, 90–120, 120+; export to Excel

### Owner Payable Aging Report
- [ ] Aging of owner payouts due vs paid — Priority P1
  - Notes: Link to owner_statements; highlight overdue payouts; payment plan option for deferred payouts

### Bank Reconciliation
- [ ] Import bank statements and match to cheques/transactions; flag unmatched items — Priority P3
  - Notes: CSV/OFX import; automated matching; manual override; monthly statement sign-off

### Petty Cash Management
- [ ] Track petty cash float, reimbursements, and reconciliation — Priority P3
  - Notes: Receipt upload; category coding; reconciliation checklist; expense approval workflow

### UAE Corporate Tax 9% Reporting
- [ ] Calculate and report taxable income per UAE CT regulations — Priority P3
  - Notes: Tax calculation rules (rental income subject to 9% on amounts > AED 375k); deductible expenses per FTA; export to FTA format

### FTA E-Invoicing Readiness
- [ ] Prepare invoices in FTA-compliant format (XML); track compliance — Priority P2
  - Notes: Invoice numbering rules; mandatory fields (invoice ID, QR code, digital signature); upload to FTA portal

### Multi-Currency Support
- [ ] Handle properties with rents in AED, USD, GBP, EUR; auto-conversion at transaction rates — Priority P3
  - Notes: Exchange rate table; realized/unrealized gains; revaluation on year-end; GL multi-currency view

### QuickBooks / Tally Export
- [ ] Export journal entries, ledgers, and reports to QB Online / Tally format — Priority P3
  - Notes: CSV mapping per package; support accrual and cash basis; test with sample QB/Tally accounts

## Schema Sketches

### Chart of Accounts
```sql
CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY,
  account_number VARCHAR(10) NOT NULL UNIQUE, -- e.g., '4100'
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- asset | liability | equity | revenue | expense
  category VARCHAR(100), -- rental_income, maintenance_expense, etc.
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by_id UUID NOT NULL REFERENCES staff(id)
);

-- GL Transaction Journal
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY,
  reference_id UUID, -- cheque_id | owner_statement_id | expense_claim_id, etc.
  reference_type VARCHAR(50), -- cheque | owner_payment | expense | manual
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  posted_by_id UUID NOT NULL REFERENCES staff(id),
  posted_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'draft', -- draft | posted | reversed
  reversed_by_id UUID REFERENCES staff(id),
  reversed_at TIMESTAMP,
  reversal_reason TEXT
);

-- GL Line Items
CREATE TABLE journal_entry_lines (
  id UUID PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id),
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  debit_amount DECIMAL(12, 2),
  credit_amount DECIMAL(12, 2),
  currency VARCHAR(3) DEFAULT 'AED',
  exchange_rate DECIMAL(12, 6) DEFAULT 1.0,
  property_id UUID REFERENCES properties(id), -- for property-specific reporting
  notes TEXT
);
```

### Bank Reconciliation
```sql
CREATE TABLE bank_reconciliation (
  id UUID PRIMARY KEY,
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
  reconciliation_date DATE NOT NULL,
  bank_statement_opening_balance DECIMAL(12, 2),
  bank_statement_closing_balance DECIMAL(12, 2),
  system_balance DECIMAL(12, 2),
  difference DECIMAL(12, 2),
  status VARCHAR(50) DEFAULT 'in_progress', -- in_progress | reconciled | discrepancy
  reconciled_by_id UUID REFERENCES staff(id),
  reconciled_at TIMESTAMP,
  notes TEXT,
  UNIQUE (bank_account_id, reconciliation_date)
);

-- Reconciliation matches
CREATE TABLE bank_reconciliation_matches (
  id UUID PRIMARY KEY,
  reconciliation_id UUID NOT NULL REFERENCES bank_reconciliation(id),
  transaction_id UUID, -- cheque_id or other transaction
  transaction_type VARCHAR(50), -- cheque | transfer | deposit
  matched_amount DECIMAL(12, 2),
  matched_at TIMESTAMP DEFAULT NOW(),
  matched_by_id UUID REFERENCES staff(id)
);

-- Unmatched items
CREATE TABLE bank_reconciliation_unmatched (
  id UUID PRIMARY KEY,
  reconciliation_id UUID NOT NULL REFERENCES bank_reconciliation(id),
  bank_reference VARCHAR(100),
  amount DECIMAL(12, 2),
  transaction_date DATE,
  description TEXT,
  resolution VARCHAR(255), -- pending | explained | needs_investigation
  notes TEXT
);
```

### Petty Cash
```sql
CREATE TABLE petty_cash_floats (
  id UUID PRIMARY KEY,
  location VARCHAR(255),
  custodian_id UUID NOT NULL REFERENCES staff(id),
  float_amount DECIMAL(12, 2),
  recon_date DATE,
  recon_balance DECIMAL(12, 2),
  variance DECIMAL(12, 2),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE petty_cash_transactions (
  id UUID PRIMARY KEY,
  float_id UUID NOT NULL REFERENCES petty_cash_floats(id),
  transaction_type VARCHAR(50), -- expense | reimbursement | top_up
  category VARCHAR(100),
  amount DECIMAL(12, 2),
  receipt_url TEXT,
  description TEXT,
  submitted_by_id UUID NOT NULL REFERENCES staff(id),
  submitted_at TIMESTAMP DEFAULT NOW(),
  approved_by_id UUID REFERENCES staff(id),
  approved_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending' -- pending | approved | rejected
);
```

### UAE Tax & FTA
```sql
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS fta_invoice_id VARCHAR(100);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS fta_qr_code TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS fta_submitted_at TIMESTAMP;

CREATE TABLE uae_tax_calculation (
  id UUID PRIMARY KEY,
  tax_year INT NOT NULL,
  gross_rental_income DECIMAL(12, 2),
  total_deductible_expenses DECIMAL(12, 2),
  taxable_income DECIMAL(12, 2),
  tax_rate DECIMAL(5, 2) DEFAULT 9.0,
  tax_payable DECIMAL(12, 2),
  fta_reference VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft',
  finalized_at TIMESTAMP,
  UNIQUE (tax_year)
);
```
