# Post-MVP: Owner Management

This roadmap covers owner relationship management, including owner portal access, statement generation, payout tracking, and compliance features required for UAE property management.

## Roadmap Items

### Owner Portal Login
- [ ] Separate owner login (OAuth/email+password) with dashboard — Priority P3
  - Notes: View owned properties, income statements, payout history; role-based access; language preference (EN/AR)

### Owner Statements Table & Persistence
- [ ] Persist generated owner statements with PDF URL and approval status — Priority P1
  - Notes: New `owner_statements` table; support draft → approved → paid workflow; regeneration on contract/payment changes

### Owner Payout Tracking
- [ ] Track paid vs due payout amounts per statement period — Priority P1
  - Notes: Link payout to statement; track cheque issued date vs cleared date; tie to bank reconciliation

### Multiple Owners Per Property
- [ ] Support multiple owners with ownership percentage on shared property — Priority P2
  - Notes: New `property_owners` join table; ownership_pct field; ensure statement generation distributes by percentage

### Owner NOC (No Objection Certificate) Tracking
- [ ] Track NOC issuance date, expiry, recipient, and digital certificate link — Priority P2
  - Notes: NOC document library; auto-expire 12 months; audit log of issuance

### Power of Attorney (PoA) Tracking
- [ ] Upload and track PoA document with expiry; link to authorized agent — Priority P2
  - Notes: Document versioning; expiry alerts; agent access control; audit trail of PoA changes

## Schema Sketches

### owner_statements Table
```sql
CREATE TABLE owner_statements (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES owners(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  statement_period_start DATE NOT NULL,
  statement_period_end DATE NOT NULL,
  total_rent_collected DECIMAL(12, 2),
  total_expenses DECIMAL(12, 2),
  net_payout DECIMAL(12, 2),
  pdf_url TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft | approved | paid | cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  approved_by_id UUID REFERENCES staff(id),
  approved_at TIMESTAMP,
  paid_via_cheque_id UUID REFERENCES cheques(id),
  paid_at TIMESTAMP,
  notes TEXT,
  UNIQUE (owner_id, property_id, statement_period_start, statement_period_end)
);
```

### property_owners Join Table
```sql
CREATE TABLE property_owners (
  id UUID PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id),
  owner_id UUID NOT NULL REFERENCES owners(id),
  ownership_pct DECIMAL(5, 2) NOT NULL DEFAULT 100.0, -- percentage (0-100)
  co_owner_name VARCHAR(255),
  co_owner_id_number VARCHAR(50),
  ownership_start_date DATE,
  ownership_end_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (property_id, owner_id),
  CONSTRAINT ownership_pct_valid CHECK (ownership_pct > 0 AND ownership_pct <= 100)
);

-- Audit trail for property ownership changes
CREATE TABLE property_owners_audit (
  id UUID PRIMARY KEY,
  property_owners_id UUID NOT NULL REFERENCES property_owners(id),
  changed_by_id UUID NOT NULL REFERENCES staff(id),
  change_type VARCHAR(50), -- created | updated | deleted
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMP DEFAULT NOW()
);
```

### Owner Extensions (NOC & PoA)
```sql
-- NOC tracking
ALTER TABLE owners ADD COLUMN IF NOT EXISTS noc_issued_at TIMESTAMP;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS noc_expiry_date DATE;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS noc_document_url TEXT;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS noc_issued_to VARCHAR(255);

-- PoA tracking
CREATE TABLE owner_power_of_attorney (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES owners(id),
  attorney_name VARCHAR(255) NOT NULL,
  attorney_id_number VARCHAR(50),
  attorney_email VARCHAR(255),
  document_url TEXT,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  scope VARCHAR(255), -- property management, rent collection, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  created_by_id UUID NOT NULL REFERENCES staff(id),
  revoked_at TIMESTAMP,
  revoked_by_id UUID REFERENCES staff(id),
  revoke_reason TEXT
);

-- PoA audit log
CREATE TABLE owner_power_of_attorney_audit (
  id UUID PRIMARY KEY,
  poa_id UUID NOT NULL REFERENCES owner_power_of_attorney(id),
  action VARCHAR(50), -- created | updated | revoked
  action_by_id UUID NOT NULL REFERENCES staff(id),
  action_at TIMESTAMP DEFAULT NOW(),
  details JSONB
);
```
