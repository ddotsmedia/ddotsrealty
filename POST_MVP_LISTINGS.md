# Post-MVP: Listings & Portals

This roadmap covers property listing distribution, analytics, and multi-channel visibility features to maximize rental unit exposure and lead generation in UAE real-estate portals.

## Roadmap Items

### XML Feed to Bayut / Dubizzle
- [ ] Generate and push XML feed to Bayut and Dubizzle with auto-sync on updates — Priority P2
  - Notes: XML schema per portal; property activation/deactivation sync; feed validation and error logging; support bulk and incremental feeds

### QR Code Per Listing
- [ ] Auto-generate and display QR code on listing; link to property detail page — Priority P2
  - Notes: QR code image in listing; clickable on printed materials; track QR scans for analytics; store qr_code_url on listings table

### Virtual Tour Link (Matterport / YouTube 360)
- [ ] Store and display virtual tour embed from Matterport or YouTube 360 video — Priority P2
  - Notes: Embed iframe or iFrame URL; fallback to photo gallery if no tour; virtual_tour_url field on listings; compliance with UAE privacy regulations

### Listing Performance Analytics
- [ ] Track views, clicks, enquiries, and lead source attribution per listing — Priority P2
  - Notes: Dashboard widget per property; time-series graph (views/day, enquiries/week); source breakdown (Bayut, Dubizzle, direct, portal); export to CSV

### Agent Watermark on Photos
- [ ] Auto-add agent name / company logo watermark to listing photos — Priority P3
  - Notes: Watermark position and transparency customizable; bulk apply to existing photos; preserve original; watermark_enabled toggle per listing

### Listing / Permit Expiry Auto-Pause
- [ ] Auto-pause listing when contract end date or permit expiry approaches — Priority P1
  - Notes: Alert 30 days before expiry; auto-pause on expiry date; manual override; pause notification to agent

### Multi-Language (EN + AR) Descriptions
- [ ] Support Arabic and English property descriptions; sync to Bayut/Dubizzle feeds — Priority P3
  - Notes: description_ar field on listings; auto-translate (Google Translate) or manual entry; separate slug per language; RTL layout on tenant portal

### Neighborhood Info Auto-Attach
- [ ] Auto-populate neighborhood amenities, schools, transit, walkability score — Priority P3
  - Notes: Geo-lookup (Google Places API); cache results; manual override; attach to listing export; value-add for tenant discovery

## Schema Sketches

### Listings Table Extensions
```sql
-- Add new columns to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS qr_code_url TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS watermark_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS xml_feed_pushed BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS xml_feed_id VARCHAR(100);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS permit_expiry_date DATE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS pause_reason VARCHAR(255);

-- Portal URLs (Bayut, Dubizzle, etc.) stored as JSON
ALTER TABLE listings ADD COLUMN IF NOT EXISTS portal_urls JSONB DEFAULT '{}';
-- Example: {"bayut": "https://bayut.ae/...", "dubizzle": "https://dubizzle.ae/..."}
```

### Listing Analytics
```sql
CREATE TABLE listing_analytics (
  id UUID PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id),
  analytics_date DATE NOT NULL,
  views INT DEFAULT 0,
  clicks INT DEFAULT 0,
  enquiries INT DEFAULT 0,
  source VARCHAR(100), -- bayut | dubizzle | direct | portal | qr_scan
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (listing_id, analytics_date, source)
);

-- Detailed enquiry tracking
CREATE TABLE listing_enquiries (
  id UUID PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id),
  enquirer_name VARCHAR(255),
  enquirer_email VARCHAR(255),
  enquirer_phone VARCHAR(20),
  enquirer_nationality VARCHAR(100),
  enquiry_type VARCHAR(50), -- rental | sale | info
  source VARCHAR(100), -- bayut | dubizzle | direct | qr | referral
  message TEXT,
  enquired_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  responded_by_id UUID REFERENCES staff(id),
  status VARCHAR(50) DEFAULT 'new', -- new | responded | viewing_scheduled | no_interest | lost
  notes TEXT
);

-- QR Code scan tracking
CREATE TABLE qr_code_scans (
  id UUID PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id),
  scanned_at TIMESTAMP DEFAULT NOW(),
  scanner_ip_address VARCHAR(45),
  scanner_device_type VARCHAR(50), -- mobile | desktop | tablet
  scanner_location_lat DECIMAL(10, 8),
  scanner_location_lng DECIMAL(11, 8)
);
```

### Neighborhood Data
```sql
CREATE TABLE listing_neighborhood_data (
  id UUID PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id),
  amenity_type VARCHAR(100), -- schools | healthcare | transit | shopping | parks | etc.
  amenity_name VARCHAR(255),
  amenity_distance_km DECIMAL(5, 2),
  amenity_rating DECIMAL(3, 2),
  amenity_google_place_id VARCHAR(255),
  data_source VARCHAR(50), -- google_places | manual | other
  fetched_at TIMESTAMP DEFAULT NOW(),
  walkability_score INT, -- 0-100
  transit_score INT, -- 0-100
  notes TEXT
);

-- Bulk neighborhood lookup cache
CREATE TABLE neighborhood_cache (
  id UUID PRIMARY KEY,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_hash VARCHAR(100) UNIQUE,
  data JSONB, -- cached Google Places results
  fetched_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

### Portal Integration
```sql
CREATE TABLE portal_sync_logs (
  id UUID PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id),
  portal_name VARCHAR(100), -- bayut | dubizzle
  sync_type VARCHAR(50), -- push | update | pause | delete
  request_body TEXT,
  response_body TEXT,
  status_code INT,
  error_message TEXT,
  synced_at TIMESTAMP DEFAULT NOW(),
  next_retry TIMESTAMP
);
```
