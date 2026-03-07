-- ============================================================
-- Rental Smart MHC — Supabase Database Schema
-- Comprehensive schema for US Manufactured Home Communities
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. COMMUNITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    community_code TEXT UNIQUE NOT NULL,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    county TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    lot_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Under Development')),
    community_type TEXT NOT NULL DEFAULT 'All-Age' CHECK (community_type IN ('All-Age', '55+', 'Family')),
    year_established INTEGER,
    total_acreage DECIMAL(10, 2),
    amenities TEXT[] DEFAULT '{}',
    description TEXT,
    manager_name TEXT,
    phone TEXT,
    email TEXT,
    pet_policy TEXT DEFAULT 'Not Allowed',
    pet_policy_notes TEXT,
    -- Billing settings
    default_lot_rent DECIMAL(10, 2),
    late_fee_amount DECIMAL(10, 2) DEFAULT 50.00,
    late_fee_grace_days INTEGER DEFAULT 5,
    nsf_fee_amount DECIMAL(10, 2) DEFAULT 35.00,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. LOTS
-- ============================================================
CREATE TABLE IF NOT EXISTS lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    lot_number TEXT NOT NULL,
    street_name TEXT,
    status TEXT NOT NULL DEFAULT 'Vacant' CHECK (status IN ('Occupied', 'Vacant', 'Under Setup', 'Renovation', 'Out of Service')),
    lot_type TEXT DEFAULT 'Standard' CHECK (lot_type IN ('Standard', 'Premium', 'Corner', 'Waterfront', 'End Lot')),
    size_sqft DECIMAL(10, 2),
    pad_type TEXT DEFAULT 'Concrete' CHECK (pad_type IN ('Concrete', 'Gravel', 'Asphalt')),
    max_home_width INTEGER,
    max_home_length INTEGER,
    has_water BOOLEAN DEFAULT true,
    has_sewer BOOLEAN DEFAULT true,
    has_electric BOOLEAN DEFAULT true,
    has_gas BOOLEAN DEFAULT false,
    has_cable BOOLEAN DEFAULT false,
    monthly_rent DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(community_id, lot_number)
);

-- ============================================================
-- 3. HOMES
-- ============================================================
CREATE TABLE IF NOT EXISTS homes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    lot_id UUID REFERENCES lots(id) ON DELETE SET NULL,
    hud_label TEXT,
    serial_number TEXT,
    manufacturer TEXT,
    model_name TEXT,
    year_manufactured INTEGER,
    width_ft DECIMAL(6, 2),
    length_ft DECIMAL(6, 2),
    sqft DECIMAL(10, 2),
    bedrooms INTEGER DEFAULT 2,
    bathrooms DECIMAL(3, 1) DEFAULT 1.0,
    home_type TEXT DEFAULT 'Single-Wide' CHECK (home_type IN ('Single-Wide', 'Double-Wide', 'Triple-Wide', 'Park Model')),
    ownership_type TEXT DEFAULT 'TOH' CHECK (ownership_type IN ('TOH', 'COH', 'ROH')),
    condition TEXT DEFAULT 'Good' CHECK (condition IN ('Excellent', 'Good', 'Fair', 'Poor', 'Needs Rehab')),
    purchase_date DATE,
    purchase_price DECIMAL(12, 2),
    current_value DECIMAL(12, 2),
    -- Title info
    title_number TEXT,
    title_state TEXT,
    -- Features
    skirting_type TEXT,
    roof_type TEXT,
    has_carport BOOLEAN DEFAULT false,
    has_deck BOOLEAN DEFAULT false,
    has_shed BOOLEAN DEFAULT false,
    has_central_ac BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. RESIDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS residents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    lot_id UUID REFERENCES lots(id) ON DELETE SET NULL,
    home_id UUID REFERENCES homes(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    phone_secondary TEXT,
    date_of_birth DATE,
    ssn_last4 TEXT,
    -- Emergency contact
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    -- Status
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Applicant', 'Past', 'Eviction')),
    move_in_date DATE,
    move_out_date DATE,
    -- Vehicle info
    vehicle1_make TEXT,
    vehicle1_model TEXT,
    vehicle1_year TEXT,
    vehicle1_plate TEXT,
    vehicle1_state TEXT,
    vehicle2_make TEXT,
    vehicle2_model TEXT,
    vehicle2_year TEXT,
    vehicle2_plate TEXT,
    vehicle2_state TEXT,
    -- Pet info
    pet1_type TEXT,
    pet1_breed TEXT,
    pet1_name TEXT,
    pet1_weight DECIMAL(5, 1),
    pet2_type TEXT,
    pet2_breed TEXT,
    pet2_name TEXT,
    pet2_weight DECIMAL(5, 1),
    -- Portal access
    portal_enabled BOOLEAN DEFAULT false,
    auth_user_id UUID,
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. LEASES
-- ============================================================
CREATE TABLE IF NOT EXISTS leases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    home_id UUID REFERENCES homes(id) ON DELETE SET NULL,
    lease_number TEXT UNIQUE,
    lease_type TEXT DEFAULT 'Standard' CHECK (lease_type IN ('Standard', 'Month-to-Month', 'Fixed Term')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Terminated', 'Pending', 'Draft')),
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_rent DECIMAL(10, 2) NOT NULL,
    security_deposit DECIMAL(10, 2) DEFAULT 0,
    pet_deposit DECIMAL(10, 2) DEFAULT 0,
    -- Rent escalation
    annual_increase_pct DECIMAL(5, 2),
    annual_increase_fixed DECIMAL(10, 2),
    -- Terms
    auto_renew BOOLEAN DEFAULT true,
    renewal_notice_days INTEGER DEFAULT 30,
    termination_notice_days INTEGER DEFAULT 60,
    -- Documents
    signed_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. CHARGES
-- ============================================================
CREATE TABLE IF NOT EXISTS charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    lot_id UUID REFERENCES lots(id) ON DELETE SET NULL,
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
    charge_type TEXT NOT NULL CHECK (charge_type IN ('Lot Rent', 'Utility - Water', 'Utility - Electric', 'Utility - Gas', 'Utility - Sewer', 'Late Fee', 'NSF Fee', 'Pet Fee', 'Application Fee', 'Maintenance', 'Other')),
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Partial', 'Overdue', 'Waived', 'Credited')),
    billing_period_start DATE,
    billing_period_end DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    charge_id UUID REFERENCES charges(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'Check' CHECK (payment_method IN ('Check', 'Cash', 'ACH', 'Credit Card', 'Money Order', 'Online Portal', 'Auto-Pay')),
    reference_number TEXT,
    status TEXT NOT NULL DEFAULT 'Completed' CHECK (status IN ('Completed', 'Pending', 'Failed', 'Refunded', 'NSF')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. MAINTENANCE REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    lot_id UUID REFERENCES lots(id) ON DELETE SET NULL,
    resident_id UUID REFERENCES residents(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Other' CHECK (category IN ('Plumbing', 'Electrical', 'HVAC', 'Appliance', 'Landscaping', 'Pest Control', 'Roads/Sidewalks', 'Common Area', 'Other')),
    priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Emergency', 'High', 'Normal', 'Low')),
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Assigned', 'In Progress', 'On Hold', 'Completed', 'Cancelled')),
    source TEXT DEFAULT 'Resident' CHECK (source IN ('Resident', 'Staff', 'Inspection', 'Vendor')),
    assigned_to TEXT,
    scheduled_date DATE,
    completed_date DATE,
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    -- Resident display info
    resident_name TEXT,
    lot_number TEXT,
    -- Media
    photos TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. VIOLATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES residents(id) ON DELETE SET NULL,
    violation_type TEXT NOT NULL CHECK (violation_type IN ('Exterior Maintenance', 'Trash/Debris', 'Unauthorized Structure', 'Vehicle', 'Noise', 'Pet', 'Landscaping', 'Other')),
    description TEXT NOT NULL,
    observed_date DATE NOT NULL,
    notice_date DATE,
    cure_by_date DATE,
    status TEXT NOT NULL DEFAULT 'Observed' CHECK (status IN ('Observed', 'Notice Sent', 'Cure Period', 'Cured', 'Escalated', 'Fined', 'Legal')),
    fine_amount DECIMAL(10, 2),
    resolution_notes TEXT,
    -- Display info
    resident_name TEXT,
    lot_number TEXT,
    -- Media
    photos TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General' CHECK (category IN ('General', 'Event', 'Maintenance Alert', 'Policy Update', 'Emergency', 'Billing')),
    priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Important', 'Urgent')),
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Archived')),
    publish_date DATE,
    expiry_date DATE,
    author_name TEXT,
    is_pinned BOOLEAN DEFAULT false,
    -- Targeting
    target_audience TEXT DEFAULT 'All' CHECK (target_audience IN ('All', 'Residents', 'Staff', 'Specific Lots')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. UTILITY METERS
-- ============================================================
CREATE TABLE IF NOT EXISTS utility_meters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    meter_number TEXT NOT NULL,
    utility_type TEXT NOT NULL CHECK (utility_type IN ('Water', 'Electric', 'Gas', 'Sewer')),
    unit TEXT NOT NULL DEFAULT 'kWh',
    rate_per_unit DECIMAL(10, 4),
    base_fee DECIMAL(10, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Needs Replacement')),
    install_date DATE,
    last_read_date DATE,
    last_read_value DECIMAL(12, 2),
    lot_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. UTILITY READINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS utility_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utility_meter_id UUID NOT NULL REFERENCES utility_meters(id) ON DELETE CASCADE,
    lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    reading_value DECIMAL(12, 2) NOT NULL,
    previous_value DECIMAL(12, 2),
    consumption DECIMAL(12, 2),
    calculated_charge DECIMAL(10, 2),
    read_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS resident_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES residents(id) ON DELETE SET NULL,
    desired_lot_id UUID REFERENCES lots(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Draft', 'Submitted', 'Screening', 'Approved', 'Denied', 'Withdrawn', 'Converted')),
    application_date DATE NOT NULL DEFAULT CURRENT_DATE,
    decision_date DATE,
    monthly_income DECIMAL(12, 2),
    household_size INTEGER,
    screening_status TEXT DEFAULT 'Pending' CHECK (screening_status IN ('Pending', 'Passed', 'Failed', 'Manual Review')),
    screening_notes TEXT,
    denial_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    charge_id UUID NOT NULL REFERENCES charges(id) ON DELETE CASCADE,
    allocated_amount DECIMAL(10, 2) NOT NULL,
    allocation_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resident_notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES residents(id) ON DELETE SET NULL,
    lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
    notice_type TEXT NOT NULL CHECK (notice_type IN ('Renewal Offer', 'Non-Renewal', 'Intent to Vacate', 'Lease Violation', 'Pay or Quit', 'Cure or Quit', 'Termination', 'Eviction')),
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Served', 'Acknowledged', 'Resolved', 'Cancelled')),
    notice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_date DATE,
    response_due_date DATE,
    delivery_method TEXT CHECK (delivery_method IN ('Hand Delivery', 'Mail', 'Email', 'Portal', 'Posting')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    lot_id UUID REFERENCES lots(id) ON DELETE SET NULL,
    home_id UUID REFERENCES homes(id) ON DELETE SET NULL,
    resident_id UUID REFERENCES residents(id) ON DELETE SET NULL,
    inspection_type TEXT NOT NULL CHECK (inspection_type IN ('Move-In', 'Move-Out', 'Annual', 'Safety', 'Turn', 'Pre-Sale', 'Rehab')),
    status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Failed', 'Cancelled')),
    scheduled_date DATE,
    completed_date DATE,
    score DECIMAL(5, 2),
    inspector_name TEXT,
    summary TEXT,
    findings JSONB DEFAULT '[]'::JSONB,
    photos TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('Created', 'Assigned', 'Scheduled', 'Status Changed', 'Note Added', 'Cost Updated', 'Completed', 'Cancelled')),
    old_status TEXT,
    new_status TEXT,
    actor_name TEXT,
    note TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS violation_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    violation_id UUID NOT NULL REFERENCES violations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('Observed', 'Notice Sent', 'Status Changed', 'Fine Applied', 'Resident Response', 'Resolved', 'Escalated', 'Closed')),
    old_status TEXT,
    new_status TEXT,
    actor_name TEXT,
    note TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('community', 'lot', 'home', 'resident', 'lease', 'maintenance', 'violation')),
    entity_id UUID NOT NULL,
    document_category TEXT DEFAULT 'General',
    version_number INTEGER DEFAULT 1,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    storage_path TEXT NOT NULL,
    description TEXT,
    uploaded_by TEXT,
    effective_date DATE,
    expiry_date DATE,
    visibility TEXT DEFAULT 'Staff' CHECK (visibility IN ('Public', 'Residents', 'Staff', 'Managers')),
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. PROFILES (for auth users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'staff', 'maintenance', 'resident', 'viewer')),
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    resident_id UUID REFERENCES residents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
    user_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_lots_community ON lots(community_id);
CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status);
CREATE INDEX IF NOT EXISTS idx_homes_community ON homes(community_id);
CREATE INDEX IF NOT EXISTS idx_homes_lot ON homes(lot_id);
CREATE INDEX IF NOT EXISTS idx_residents_community ON residents(community_id);
CREATE INDEX IF NOT EXISTS idx_residents_lot ON residents(lot_id);
CREATE INDEX IF NOT EXISTS idx_residents_status ON residents(status);
CREATE INDEX IF NOT EXISTS idx_leases_community ON leases(community_id);
CREATE INDEX IF NOT EXISTS idx_leases_resident ON leases(resident_id);
CREATE INDEX IF NOT EXISTS idx_leases_status ON leases(status);
CREATE INDEX IF NOT EXISTS idx_charges_community ON charges(community_id);
CREATE INDEX IF NOT EXISTS idx_charges_resident ON charges(resident_id);
CREATE INDEX IF NOT EXISTS idx_charges_status ON charges(status);
CREATE INDEX IF NOT EXISTS idx_charges_due_date ON charges(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_community ON payments(community_id);
CREATE INDEX IF NOT EXISTS idx_payments_resident ON payments(resident_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_community ON maintenance_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_violations_community ON violations(community_id);
CREATE INDEX IF NOT EXISTS idx_violations_status ON violations(status);
CREATE INDEX IF NOT EXISTS idx_announcements_community ON announcements(community_id);
CREATE INDEX IF NOT EXISTS idx_utility_meters_community ON utility_meters(community_id);
CREATE INDEX IF NOT EXISTS idx_utility_meters_lot ON utility_meters(lot_id);
CREATE INDEX IF NOT EXISTS idx_utility_readings_meter ON utility_readings(utility_meter_id);
CREATE INDEX IF NOT EXISTS idx_resident_applications_community ON resident_applications(community_id);
CREATE INDEX IF NOT EXISTS idx_resident_applications_status ON resident_applications(status);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_charge ON payment_allocations(charge_id);
CREATE INDEX IF NOT EXISTS idx_resident_notices_community ON resident_notices(community_id);
CREATE INDEX IF NOT EXISTS idx_resident_notices_resident ON resident_notices(resident_id);
CREATE INDEX IF NOT EXISTS idx_inspections_community ON inspections(community_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_events_request ON maintenance_events(maintenance_request_id);
CREATE INDEX IF NOT EXISTS idx_violation_events_violation ON violation_events(violation_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_community ON audit_log(community_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_profiles_community ON profiles(community_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'communities', 'lots', 'homes', 'residents', 'leases',
        'charges', 'maintenance_requests', 'violations', 'announcements',
        'utility_meters', 'profiles', 'resident_applications',
        'resident_notices', 'inspections'
    ])
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trigger_updated_at ON %I; CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
            tbl, tbl
        );
    END LOOP;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Enable RLS on all tables
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE violation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ── RLS POLICIES ──
-- For now, allow full access via service_role (BFF server-side),
-- and read-only for residents on their own data.

-- Service role bypass (applied via supabase service_role key from BFF)
-- Supabase automatically grants full access to service_role

-- Anon/public: read-only communities and published announcements
DROP POLICY IF EXISTS "Public can view active communities" ON communities;
CREATE POLICY "Public can view active communities" ON communities
    FOR SELECT USING (status = 'Active');

DROP POLICY IF EXISTS "Public can view published announcements" ON announcements;
CREATE POLICY "Public can view published announcements" ON announcements
    FOR SELECT USING (status = 'Published');

-- Authenticated users: access scoped to their community
DROP POLICY IF EXISTS "Users view own community lots" ON lots;
CREATE POLICY "Users view own community lots" ON lots
    FOR SELECT TO authenticated
    USING (community_id IN (SELECT community_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users view own community homes" ON homes;
CREATE POLICY "Users view own community homes" ON homes
    FOR SELECT TO authenticated
    USING (community_id IN (SELECT community_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users view own profile" ON profiles;
CREATE POLICY "Users view own profile" ON profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid());

-- Residents: view own data
DROP POLICY IF EXISTS "Residents view own record" ON residents;
CREATE POLICY "Residents view own record" ON residents
    FOR SELECT TO authenticated
    USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Residents view own lease" ON leases;
CREATE POLICY "Residents view own lease" ON leases
    FOR SELECT TO authenticated
    USING (resident_id IN (SELECT id FROM residents WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Residents view own charges" ON charges;
CREATE POLICY "Residents view own charges" ON charges
    FOR SELECT TO authenticated
    USING (resident_id IN (SELECT id FROM residents WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Residents view own payments" ON payments;
CREATE POLICY "Residents view own payments" ON payments
    FOR SELECT TO authenticated
    USING (resident_id IN (SELECT id FROM residents WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Residents view own maintenance" ON maintenance_requests;
CREATE POLICY "Residents view own maintenance" ON maintenance_requests
    FOR SELECT TO authenticated
    USING (resident_id IN (SELECT id FROM residents WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Residents can create maintenance" ON maintenance_requests;
CREATE POLICY "Residents can create maintenance" ON maintenance_requests
    FOR INSERT TO authenticated
    WITH CHECK (resident_id IN (SELECT id FROM residents WHERE auth_user_id = auth.uid()));

-- Manager/Admin: full CRUD on their community (enforced via BFF + service_role)
-- The BFF uses service_role key which bypasses RLS

-- ============================================================
-- VIEWS for common queries
-- ============================================================

-- Dashboard KPI view
CREATE OR REPLACE VIEW dashboard_kpi AS
SELECT
    c.id AS community_id,
    c.name AS community_name,
    (SELECT COUNT(*) FROM lots l WHERE l.community_id = c.id) AS total_lots,
    (SELECT COUNT(*) FROM lots l WHERE l.community_id = c.id AND l.status = 'Occupied') AS occupied_lots,
    (SELECT COUNT(*) FROM lots l WHERE l.community_id = c.id AND l.status = 'Vacant') AS vacant_lots,
    ROUND(
        (
            (SELECT COUNT(*) FROM lots l WHERE l.community_id = c.id AND l.status = 'Occupied')::NUMERIC /
            NULLIF((SELECT COUNT(*) FROM lots l WHERE l.community_id = c.id), 0)
        ) * 100, 1
    ) AS occupancy_rate,
    COALESCE((SELECT SUM(le.monthly_rent) FROM leases le WHERE le.community_id = c.id AND le.status = 'Active'), 0) AS monthly_revenue,
    (SELECT COUNT(*) FROM maintenance_requests mr WHERE mr.community_id = c.id AND mr.status NOT IN ('Completed', 'Cancelled')) AS open_maintenance,
    (SELECT COUNT(*) FROM violations v WHERE v.community_id = c.id AND v.status NOT IN ('Cured', 'Legal', 'Closed')) AS open_violations,
    (SELECT COUNT(*) FROM leases le WHERE le.community_id = c.id AND le.status = 'Active' AND le.end_date BETWEEN NOW() AND NOW() + INTERVAL '90 days') AS leases_expiring_soon,
    (SELECT COUNT(*) FROM residents r WHERE r.community_id = c.id AND r.status = 'Active') AS total_residents
FROM communities c;

-- Rent roll view
CREATE OR REPLACE VIEW rent_roll AS
SELECT
    l.lot_number,
    r.first_name || ' ' || r.last_name AS resident_name,
    le.monthly_rent,
    le.start_date AS lease_start,
    le.end_date AS lease_end,
    le.status AS lease_status,
    l.community_id,
    l.id AS lot_id,
    r.id AS resident_id,
    le.id AS lease_id
FROM lots l
LEFT JOIN residents r ON r.lot_id = l.id AND r.status = 'Active'
LEFT JOIN leases le ON le.lot_id = l.id AND le.status = 'Active'
ORDER BY l.lot_number::INTEGER;

RAISE NOTICE 'Schema creation completed successfully!';
