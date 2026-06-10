# Post-MVP Tasks for DdotsRealty

## Communication & Notifications

- [ ] WhatsApp delivery receipts wiring
  - [ ] Implement webhook handler for Whapi delivery status
  - [ ] Track message delivery/read status in database
  - [ ] Update UI with delivery indicators
  
- [ ] WhatsApp message template library
  - [ ] Build reusable message templates
  - [ ] Add template parameter substitution system
  - [ ] Admin interface for template management

- [ ] SMS integration (optional)
  - [ ] Add SMS provider integration (e.g., Twilio)
  - [ ] Create SMS notification service
  - [ ] Setup SMS templates

- [ ] Email template refinements
  - [ ] Build rich HTML email templates
  - [ ] Add email preview functionality
  - [ ] Template testing framework

## AI & Automation

- [ ] AI property description generation UI
  - [ ] Add "Generate with AI" button to property form
  - [ ] Real-time preview of generated descriptions
  - [ ] User feedback loop for quality improvement

- [ ] AI lead reply suggestions
  - [ ] Show AI-generated response suggestions in lead replies
  - [ ] One-click send or edit before sending
  - [ ] Track response effectiveness

- [ ] Market price estimation
  - [ ] Implement AI-based property valuation
  - [ ] Compare against market data
  - [ ] Historical trend analysis

- [ ] Lead matching algorithm
  - [ ] Auto-match leads to relevant properties
  - [ ] Ranking & scoring system
  - [ ] Admin dashboard for match quality

## Job Queue & Scheduling

- [ ] BullMQ scheduled jobs (cron)
  - [ ] Wire cheque reminder cron (e.g., 9am daily)
  - [ ] Contract renewal check (weekly)
  - [ ] Document expiry check (daily)
  - [ ] Subscription expiry check (daily)
  - [ ] Daily summary generation (6pm daily)

- [ ] Job monitoring dashboard
  - [ ] View job history & status
  - [ ] Retry failed jobs manually
  - [ ] Job performance metrics

- [ ] Lead follow-up automation
  - [ ] Auto-generate follow-up tasks based on lead age
  - [ ] Send escalation reminders to brokers
  - [ ] Track follow-up effectiveness

## Public Portal

- [ ] Advanced search filters
  - [ ] Property type, bedrooms, price range filters
  - [ ] Location/community search
  - [ ] Amenities & features filters
  - [ ] Availability date filters

- [ ] Interactive map integration
  - [ ] Google Maps property pin placement
  - [ ] Community boundary visualization
  - [ ] Nearby amenities (schools, malls, metro)
  - [ ] Commute time calculator

- [ ] Listing detail page enhancements
  - [ ] Photo gallery with lightbox
  - [ ] Virtual tour/360 view support
  - [ ] Property timeline (history, price changes)
  - [ ] Similar properties recommendations

- [ ] Public enquiry form
  - [ ] Capture lead information
  - [ ] Property interest selection
  - [ ] Preferred contact method
  - [ ] Auto-assign to broker workflow

- [ ] Public lead management
  - [ ] Track lead source attribution
  - [ ] Lead scoring & prioritization
  - [ ] Auto-responder integration
  - [ ] CRM sync for broker follow-up

## Billing & Subscriptions

- [ ] Stripe integration
  - [ ] Payment processing
  - [ ] Subscription management
  - [ ] Invoice generation & delivery

- [ ] Subscription enforcement
  - [ ] Feature gating based on plan limits
  - [ ] Usage tracking (properties, users)
  - [ ] Hard limits when exceeded
  - [ ] Graceful degradation messaging

- [ ] Billing portal
  - [ ] Invoice history & download
  - [ ] Payment method management
  - [ ] Billing address updates
  - [ ] Tax/VAT handling

- [ ] Trial management
  - [ ] Free trial period setup
  - [ ] Auto-upgrade reminders
  - [ ] Trial extension for special cases

## Search & Indexing

- [ ] Meilisearch integration
  - [ ] Index all properties & listings
  - [ ] Faceted search implementation
  - [ ] Typo tolerance & fuzzy matching
  - [ ] Real-time indexing for new properties

- [ ] Search analytics
  - [ ] Track popular searches
  - [ ] Search quality metrics
  - [ ] Search ranking optimization

- [ ] Full-text search enhancements
  - [ ] Lead database search
  - [ ] Document search
  - [ ] Contact search

## Location & Maps

- [ ] Google Maps API integration
  - [ ] Interactive property picker for listing creation
  - [ ] Address autocomplete
  - [ ] Geocoding for properties

- [ ] Location-based features
  - [ ] Properties near me (with permission)
  - [ ] Commute time estimates
  - [ ] Community insights & statistics

## Document & Reporting

- [ ] PDF generation
  - [ ] Invoice PDFs via @react-pdf/renderer
  - [ ] Rent statements
  - [ ] Contract summaries
  - [ ] Property reports

- [ ] Report export
  - [ ] PDF reports (property, financial, lead)
  - [ ] Excel/CSV exports
  - [ ] Scheduled report generation & email

- [ ] Audit log viewer
  - [ ] User action tracking
  - [ ] Data change history
  - [ ] Export audit trails
  - [ ] Compliance reporting

## Regulatory & Compliance

- [ ] RERA/Trakheesi validation
  - [ ] Validate Ejari contracts
  - [ ] Check RERA registration status
  - [ ] Property title deed verification

- [ ] Document compliance checks
  - [ ] Emirates ID validity
  - [ ] Trade license verification
  - [ ] Passport expiry alerts

- [ ] Legal template library
  - [ ] Standard contract templates
  - [ ] Terms & conditions
  - [ ] Privacy policy management

## Dashboard & Analytics

- [ ] Enhanced dashboard KPIs
  - [ ] Revenue trending
  - [ ] Lead conversion funnel
  - [ ] Property occupancy rates
  - [ ] Broker performance metrics

- [ ] Interactive dashboards
  - [ ] Drag-and-drop widget customization
  - [ ] Custom date ranges
  - [ ] Drill-down capabilities

- [ ] Performance reports
  - [ ] Top-performing brokers
  - [ ] High-demand properties
  - [ ] Market trends & insights

## Mobile & PWA

- [ ] Mobile app optimization
  - [ ] Responsive design refinement
  - [ ] Touch gesture support
  - [ ] Mobile-specific features

- [ ] Progressive Web App
  - [ ] Offline capability
  - [ ] Push notifications
  - [ ] Home screen installation

## Admin & Settings

- [ ] Tenant management UI
  - [ ] Create/edit/delete tenants
  - [ ] License & compliance tracking
  - [ ] Tenant user management

- [ ] Email & notification settings
  - [ ] Notification preference center
  - [ ] Email template customization
  - [ ] Notification frequency limits

- [ ] Role & permission management
  - [ ] Custom role creation
  - [ ] Permission matrix UI
  - [ ] Audit of permission changes

- [ ] Integration settings
  - [ ] Whapi configuration & testing
  - [ ] Anthropic API key management
  - [ ] Resend API testing
  - [ ] Redis connection status

## Data & Quality

- [ ] Data import/export
  - [ ] CSV import for properties, leads, contacts
  - [ ] Data validation & error reporting
  - [ ] Batch import scheduling

- [ ] Data cleanup
  - [ ] Duplicate detection & merging
  - [ ] Orphaned record identification
  - [ ] Data archival for old records

- [ ] Data backup & recovery
  - [ ] Automated backup scheduling
  - [ ] Point-in-time recovery
  - [ ] Backup encryption

## Performance & Optimization

- [ ] Query optimization
  - [ ] Database index analysis
  - [ ] N+1 query detection
  - [ ] Cache strategy refinement

- [ ] Image optimization
  - [ ] WebP conversion
  - [ ] Responsive image serving
  - [ ] Lazy loading for galleries

- [ ] Frontend performance
  - [ ] Code splitting optimization
  - [ ] Bundle size monitoring
  - [ ] Lighthouse improvements

## Testing & QA

- [ ] End-to-end test suite
  - [ ] Critical user journeys
  - [ ] Lead creation to assignment
  - [ ] Property listing workflow

- [ ] Performance testing
  - [ ] Load testing with k6 or similar
  - [ ] Concurrent user simulation
  - [ ] Database stress testing

- [ ] Accessibility audit
  - [ ] WCAG compliance review
  - [ ] Screen reader testing
  - [ ] Keyboard navigation

## Security

- [ ] Two-factor authentication
  - [ ] TOTP setup
  - [ ] Backup codes
  - [ ] Recovery options

- [ ] IP whitelisting (for enterprise)
  - [ ] Admin IP restrictions
  - [ ] VPN integration support

- [ ] API rate limiting
  - [ ] Endpoint-specific limits
  - [ ] Tenant isolation
  - [ ] DDoS protection

- [ ] Data encryption
  - [ ] At-rest encryption for sensitive fields
  - [ ] TLS everywhere
  - [ ] Key rotation strategy
