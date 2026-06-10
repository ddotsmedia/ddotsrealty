# Post-MVP: UAE Compliance & Regulatory

This roadmap covers UAE-specific regulatory and compliance features essential for legal rent management, RERA compliance, and government authority coordination.

## Related MVP Shipping

The following compliance features already shipped in MVP:
- `escalation_pct` field on contracts (multi-year rent escalation support)
- `auto_renew` and `termination_notice_days` fields on contracts (90-day notice + auto-renewal detection)
- `dewa_premise_no` field on properties (DEWA tracking)
- Contract PDF generation from template

Post-MVP items extend these to advanced calculations, multi-year tracking, and regulatory filings.

## Roadmap Items

### RERA Rent Index Lookup & Rent-Increase Calculator
- [ ] Fetch current RERA rent index for property type/size/location; calculate allowable increase bands — Priority P1
  - Notes: Integration with RERA public API; rental increase bands (≤10% below market→0%, 11-20%→5%, 21-30%→10%, 31-40%→15%, >40%→20%); cached annually; Dubai-specific logic; manual override for special cases

### Rental Escalation Schedule (Multi-Year)
- [ ] Generate and display multi-year escalation schedule per contract — Priority P1
  - Notes: Extend escalation_pct (shipped in MVP); show projected rent per year; flag escalations exceeding RERA limits; print schedule on contract and statement

### AI Rent Recommendation
- [ ] AI model to recommend market-competitive rent based on property attributes and location — Priority P2
  - Notes: Train on RERA data + Bayut/Dubizzle comps; input: property type, size, location, amenities; output: recommended rent + confidence band; update quarterly

### Mollak Service-Charge Integration
- [ ] Integrate with Mollak to fetch and auto-fill service charges per property — Priority P2
  - Notes: API call to Mollak; store mollak_ref; auto-update charges annually; match to property premise number

### Service Charges Table
- [ ] Track service charges (rate per sqft, Mollak reference, status) per property — Priority P2
  - Notes: New `service_charges` table; store rate, mollak_ref, effective_date, expiry_date, status (active | pending | expired)

### Move-In / Move-Out Inspection with Photos & Deductions
- [ ] Capture move-in/move-out photos and damage assessment; calculate deposit deductions — Priority P2
  - Notes: New `move_inspections` table; attach photo library; damage categories; deduction line items per category; generate inspection report PDF

### Contract Termination Workflow & Tenant Clearance Certificate
- [ ] Formal termination workflow with signature; auto-generate tenant clearance (NOC-equivalent) — Priority P1
  - Notes: Termination status enum (notice_issued → acknowledged → completed); generate clearance certificate; audit trail; prevent re-occupancy without clearance

### DEWA Transfer Tracking
- [ ] Track DEWA account transfers between tenants and utilities handover completion — Priority P2
  - Notes: Extend dewa_premise_no (shipped); new fields: dewa_transfer_initiated_date, dewa_transfer_completed_date, dewa_final_reading, dewa_transferee_id; link to move-in/move-out inspection

### Auto-Renewal Detection (90-Day Notice, UAE Law)
- [ ] Detect contracts approaching auto-renewal; alert tenant and owner 90 days before expiry — Priority P1
  - Notes: Extend auto_renew + termination_notice_days fields (shipped); automation: check nightly; send alert email/SMS at 90-day mark; flag in dashboard; generate renewal offer template

### Contract PDF Generation from Template
- [ ] Generate contract PDF from data with signature blocks and approval flow — Priority P1
  - Notes: Template system (merge fields); support multiple contract types (unfurnished, furnished, short-term); digital signature capture; audit trail of document creation and signing

### Contract Occupants Table (Ejari Occupant List)
- [ ] Track occupants per contract (names, IDs, nationalities) for Ejari registration — Priority P2
  - Notes: New `contract_occupants` table; links to Ejari registry; validate ID numbers; track Ejari reference; audit changes

## Schema Sketches

### Service Charges
```sql
CREATE TABLE service_charges (
  id UUID PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id),
  rate_per_sqft DECIMAL(8, 2) NOT NULL,
  mollak_ref VARCHAR(100),
  effective_date DATE NOT NULL,
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- active | pending | expired
  created_at TIMESTAMP DEFAULT NOW(),
  created_by_id UUID NOT NULL REFERENCES staff(id),
  notes TEXT,
  UNIQUE (property_id, effective_date)
);
```

### Move-In / Move-Out Inspections
```sql
CREATE TABLE move_inspections (
  id UUID PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id),
  inspection_type VARCHAR(50) NOT NULL, -- move_in | move_out
  inspection_date DATE NOT NULL,
  inspector_id UUID NOT NULL REFERENCES staff(id),
  inspectee_name VARCHAR(255),
  inspectee_signature_url TEXT,
  summary_notes TEXT,
  overall_condition VARCHAR(50), -- excellent | good | fair | poor
  total_deductions DECIMAL(12, 2) DEFAULT 0,
  deposit_amount DECIMAL(12, 2),
  refund_amount DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'completed' -- draft | completed | disputed
);

-- Damage & deduction line items
CREATE TABLE move_inspection_deductions (
  id UUID PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES move_inspections(id),
  damage_category VARCHAR(100), -- appliance | wall | flooring | furniture | cleaning | etc.
  description TEXT NOT NULL,
  photo_url TEXT,
  estimated_repair_cost DECIMAL(12, 2),
  deduction_amount DECIMAL(12, 2),
  notes TEXT
);

-- Photo library for inspections
CREATE TABLE move_inspection_photos (
  id UUID PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES move_inspections(id),
  room_name VARCHAR(100),
  photo_url TEXT,
  uploaded_by_id UUID NOT NULL REFERENCES staff(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  description TEXT
);
```

### Contract Occupants (Ejari)
```sql
CREATE TABLE contract_occupants (
  id UUID PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id),
  occupant_name VARCHAR(255) NOT NULL,
  occupant_id_number VARCHAR(50) NOT NULL,
  occupant_nationality VARCHAR(100),
  occupant_email VARCHAR(255),
  occupant_phone VARCHAR(20),
  occupant_dob DATE,
  relationship_to_tenant VARCHAR(100), -- primary | spouse | child | dependent | etc.
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (contract_id, occupant_id_number)
);

-- Ejari registration tracking
CREATE TABLE ejari_registrations (
  id UUID PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id),
  ejari_ref_number VARCHAR(100) UNIQUE,
  registration_date DATE,
  registered_by_id UUID NOT NULL REFERENCES staff(id),
  rera_contract_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending', -- pending | registered | dispute | expired
  dispute_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Termination & Clearance
```sql
CREATE TABLE contract_terminations (
  id UUID PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id),
  termination_notice_date DATE NOT NULL,
  termination_effective_date DATE NOT NULL,
  termination_reason VARCHAR(255),
  initiated_by_role VARCHAR(50), -- owner | tenant | staff
  initiated_by_id UUID NOT NULL REFERENCES staff(id),
  tenant_acknowledgement_date DATE,
  tenant_acknowledgement_signature_url TEXT,
  status VARCHAR(50) DEFAULT 'notice_issued', -- notice_issued | acknowledged | completed | cancelled
  clearance_certificate_url TEXT,
  issued_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- Tenant clearance checklist
CREATE TABLE tenant_clearance_checklist (
  id UUID PRIMARY KEY,
  termination_id UUID NOT NULL REFERENCES contract_terminations(id),
  checklist_item VARCHAR(255), -- returned keys | utility handover | deposit returned | etc.
  completed BOOLEAN DEFAULT FALSE,
  completed_date DATE,
  completed_by_id UUID REFERENCES staff(id),
  notes TEXT
);
```

### RERA & Rent Compliance
```sql
CREATE TABLE rera_rent_index (
  id UUID PRIMARY KEY,
  property_type VARCHAR(100), -- studio | 1br | 2br | etc.
  location VARCHAR(255),
  size_sqft_min INT,
  size_sqft_max INT,
  market_rent_aed DECIMAL(12, 2),
  index_year INT NOT NULL,
  fetched_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (property_type, location, size_sqft_min, size_sqft_max, index_year)
);

-- Rent escalation schedule per contract
CREATE TABLE contract_escalation_schedule (
  id UUID PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id),
  year_number INT NOT NULL,
  scheduled_rent_aed DECIMAL(12, 2),
  escalation_pct DECIMAL(5, 2),
  rera_market_rent_aed DECIMAL(12, 2),
  rera_max_increase_pct DECIMAL(5, 2),
  exceeds_rera_limit BOOLEAN DEFAULT FALSE,
  scheduled_effective_date DATE,
  notes TEXT,
  UNIQUE (contract_id, year_number)
);

-- Auto-renewal alerts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS auto_renewal_alert_sent_at TIMESTAMP;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS renewal_offer_generated_at TIMESTAMP;

-- DEWA tracking extensions
ALTER TABLE properties ADD COLUMN IF NOT EXISTS dewa_transfer_initiated_date DATE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS dewa_transfer_completed_date DATE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS dewa_final_reading INT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS dewa_transferee_id VARCHAR(50);
```
