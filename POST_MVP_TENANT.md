# Post-MVP: Tenant Self-Service Portal

This roadmap covers tenant-facing self-service features that increase engagement and reduce operational overhead for property management staff. Key value driver at the AED 299/month tier.

## Roadmap Items

### Tenant Portal Login
- [ ] Separate tenant authentication (OAuth/email+password) with secure role separation — Priority P3
  - Notes: Access controls per tenant; multi-unit support if co-tenants; language toggle (EN/AR); mobile-responsive design

### View Contract Details & Rent Schedule
- [ ] Display active contract terms, rent amount, due dates, and escalation schedule — Priority P3
  - Notes: Read-only view; highlight payment schedule for next 12 months; show escalation percentage if applicable

### View Documents
- [ ] Access uploaded contract, tenancy agreement, and other related documents — Priority P3
  - Notes: PDF viewer; date filtering; download capability; document version history

### Payment History
- [ ] View all rent payments, cheques, and receipts with dates and amounts — Priority P3
  - Notes: Searchable table; export to PDF; linked receipts; bounced cheque notifications

### Submit Maintenance Request
- [ ] Form to submit maintenance request with photo, description, and category — Priority P2
  - Notes: Request categories (plumbing, electrical, appliances, structural, cleaning); photo upload; status tracking

### Track Maintenance Status Timeline
- [ ] View maintenance request status with updates and technician notes — Priority P2
  - Notes: Status enum (submitted → acknowledged → in-progress → completed); expected completion date; cost if tenant liable

### Download Rent Receipt PDF
- [ ] Auto-generate and download printable rent receipt for each payment — Priority P3
  - Notes: Receipt template with company logo; QR code for verification; email delivery option

### View Outstanding Balance
- [ ] Display current outstanding balance and next due date — Priority P3
  - Notes: Highlight overdue amounts; payment plan status if in arrears; linked to payment gateway

### Update Contact Information
- [ ] Tenant can update phone, email, emergency contact — Priority P3
  - Notes: Confirmation email on change; staff audit trail; prevent self-modification of legal name/ID

## Value Proposition at AED 299/Month Tier

The tenant portal significantly increases retention and reduces support costs:
- **Self-serve document access** reduces staff inquiries by ~30%
- **Maintenance request submission** streamlines ticketing and reduces phone calls
- **Payment transparency** builds trust and improves on-time rent collection
- **Automated receipt generation** eliminates manual receipt requests
- **Rent schedule visibility** provides tenants confidence in lease terms

Estimated lift: 25–35% reduction in tenant-facing staff hours per property.

## Related Notes

- Maintenance request tracking ties into work order system (not yet built)
- Payment history depends on robust transaction logging (shipped in MVP for cheques; extend to bank transfers)
- Receipt PDF generation uses existing contract templates; extend to rental receipt template
- Consider SMS/WhatsApp notification channel for payment reminders and maintenance status updates
