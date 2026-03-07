/**
 * @file seed.mjs
 * @description Seed the Supabase database with realistic MHC demo data.
 * Usage: node supabase/seed.mjs
 */

import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:He110XTechLtd.@db.flrjhhfsffjdtkaiplld.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false },
});

async function seed() {
    await client.connect();
    console.log('✅ Connected to Supabase');

    // Clear existing data
    await client.query('BEGIN');
    const tables = [
        'utility_readings', 'utility_meters', 'audit_log', 'documents',
        'violations', 'maintenance_requests', 'payments', 'charges',
        'leases', 'residents', 'homes', 'lots', 'announcements', 'communities'
    ];
    for (const t of tables) {
        await client.query(`DELETE FROM ${t}`);
    }
    console.log('🧹 Cleared existing data');

    // ── Communities ──
    const communities = [
        {
            name: 'Sunrise Valley MHC', community_code: 'SRV-001',
            address_line1: '4500 Sunrise Valley Rd', city: 'Phoenix', state: 'AZ', postal_code: '85032', county: 'Maricopa',
            latitude: 33.6020, longitude: -112.0190, lot_count: 24,
            status: 'Active', community_type: 'All-Age', year_established: 1995, total_acreage: 18.5,
            amenities: '{Pool,Clubhouse,Laundry,Playground,RV Storage,Dog Park}',
            description: 'A well-maintained all-age community in the heart of Phoenix featuring spacious lots, mature trees, and resort-style amenities.',
            manager_name: 'Sarah Mitchell', phone: '(602) 555-0147', email: 'office@sunrisevalleymhc.com',
            pet_policy: 'Allowed', pet_policy_notes: 'Max 2 pets per lot, weight limit 40 lbs',
            default_lot_rent: 425.00, late_fee_amount: 50.00, late_fee_grace_days: 5, nsf_fee_amount: 35.00,
        },
        {
            name: 'Magnolia Gardens', community_code: 'MAG-001',
            address_line1: '2200 Magnolia Blvd', city: 'San Antonio', state: 'TX', postal_code: '78232', county: 'Bexar',
            latitude: 29.5580, longitude: -98.5130, lot_count: 18,
            status: 'Active', community_type: '55+', year_established: 2002, total_acreage: 12.0,
            amenities: '{Clubhouse,Community Garden,Walking Path,Library,Pickleball Court}',
            description: 'A peaceful 55+ community offering quiet, well-maintained lots with beautiful magnolia trees and a close-knit neighborly atmosphere.',
            manager_name: 'Robert Chen', phone: '(210) 555-0283', email: 'info@magnoliagardenstx.com',
            pet_policy: 'Restricted', pet_policy_notes: 'Small dogs and cats only, max 1 pet per lot',
            default_lot_rent: 375.00,
        },
        {
            name: 'Lakewood Estates', community_code: 'LWD-001',
            address_line1: '8900 Lakewood Circle', city: 'Orlando', state: 'FL', postal_code: '32819', county: 'Orange',
            latitude: 28.4500, longitude: -81.4700, lot_count: 36,
            status: 'Active', community_type: 'All-Age', year_established: 2010, total_acreage: 25.0,
            amenities: '{Pool,Clubhouse,Fitness Center,Playground,Basketball Court,Dog Park}',
            description: 'A modern all-age community near Orlando attractions.',
            manager_name: 'Angela Rivera', phone: '(407) 555-0391', email: 'office@lakewoodestates.com',
            pet_policy: 'Allowed', pet_policy_notes: 'Max 2 pets, up to 40 lbs each',
            default_lot_rent: 450.00,
        },
        {
            name: 'Mountain View Ranch', community_code: 'MVR-001',
            address_line1: '15600 Mountain View Rd', city: 'Denver', state: 'CO', postal_code: '80228', county: 'Jefferson',
            latitude: 39.7000, longitude: -105.1200, lot_count: 30,
            status: 'Active', community_type: 'Family', year_established: 2018, total_acreage: 22.0,
            amenities: '{Clubhouse,Community Garden,Hiking Trails,Picnic Area,EV Charging}',
            description: 'A family-friendly community nestled in the Colorado foothills.',
            manager_name: "Kevin O'Brien", phone: '(303) 555-0742', email: 'info@mountainviewranch.com',
            pet_policy: 'Allowed', pet_policy_notes: 'Max 3 pets, no breed restrictions',
            default_lot_rent: 500.00,
        },
    ];

    const communityIds = [];
    for (const c of communities) {
        const res = await client.query(
            `INSERT INTO communities (name, community_code, address_line1, city, state, postal_code, county,
             latitude, longitude, lot_count, status, community_type, year_established, total_acreage,
             amenities, description, manager_name, phone, email, pet_policy, pet_policy_notes,
             default_lot_rent, late_fee_amount, late_fee_grace_days, nsf_fee_amount)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
             RETURNING id`,
            [c.name, c.community_code, c.address_line1, c.city, c.state, c.postal_code, c.county,
             c.latitude, c.longitude, c.lot_count, c.status, c.community_type, c.year_established, c.total_acreage,
             c.amenities, c.description, c.manager_name, c.phone, c.email, c.pet_policy, c.pet_policy_notes,
             c.default_lot_rent, c.late_fee_amount || 50, c.late_fee_grace_days || 5, c.nsf_fee_amount || 35]
        );
        communityIds.push(res.rows[0].id);
    }
    console.log(`🏘️  Seeded ${communities.length} communities`);
    const cid = communityIds[0]; // Primary community ID (Sunrise Valley)

    // ── Lots (24 for Sunrise Valley) ──
    const streetNames = ['Oak Lane', 'Oak Lane', 'Oak Lane', 'Oak Lane', 'Oak Lane', 'Oak Lane',
                         'Palm Drive', 'Palm Drive', 'Palm Drive', 'Palm Drive', 'Palm Drive', 'Palm Drive',
                         'Sunset Lane', 'Sunset Lane', 'Sunset Lane', 'Sunset Lane', 'Sunset Lane', 'Sunset Lane',
                         'Magnolia Way', 'Magnolia Way', 'Magnolia Way', 'Magnolia Way', 'Magnolia Way', 'Magnolia Way'];
    const lotStatuses = [
        'Occupied','Occupied','Occupied','Occupied','Occupied','Occupied',
        'Occupied','Vacant','Occupied','Occupied','Out of Service','Occupied',
        'Occupied','Occupied','Under Setup','Occupied','Occupied','Renovation',
        'Occupied','Occupied','Occupied','Vacant','Occupied','Vacant',
    ];
    const rents = [
        425,425,450,425,475,425,
        450,0,425,425,0,425,
        450,425,0,475,425,0,
        425,425,450,0,425,0,
    ];
    const lotTypes = [
        'Standard','Standard','Premium','Standard','Corner','Standard',
        'Standard','Standard','Premium','Standard','Standard','End Lot',
        'Standard','Standard','Standard','Premium','Standard','Corner',
        'Standard','Standard','Premium','Standard','End Lot','Standard',
    ];

    const lotIds = [];
    for (let i = 0; i < 24; i++) {
        const num = String(i + 1);
        const res = await client.query(
            `INSERT INTO lots (community_id, lot_number, street_name, status, lot_type,
             size_sqft, has_water, has_sewer, has_electric, has_gas, monthly_rent)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
            [cid, num, streetNames[i], lotStatuses[i], lotTypes[i],
             3500 + Math.floor(Math.random() * 2000), true, true, true, i % 3 === 0,
             rents[i] > 0 ? rents[i] : null]
        );
        lotIds.push(res.rows[0].id);
    }
    console.log(`📍 Seeded 24 lots`);

    // ── Homes ──
    const manufacturers = ['Clayton Homes', 'Champion', 'Skyline', 'Fleetwood', 'Palm Harbor', 'Cavco', 'Nobility'];
    const homeIds = [];
    const occupiedLotIndices = lotStatuses.map((s, i) => s === 'Occupied' ? i : -1).filter(i => i >= 0);

    for (const idx of occupiedLotIndices) {
        const mfr = manufacturers[idx % manufacturers.length];
        const yr = 2005 + Math.floor(Math.random() * 18);
        const isDouble = idx % 4 === 0;
        const res = await client.query(
            `INSERT INTO homes (community_id, lot_id, manufacturer, year_manufactured,
             width_ft, length_ft, sqft, bedrooms, bathrooms,
             home_type, ownership_type, condition, has_central_ac, has_carport, has_deck)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
            [cid, lotIds[idx], mfr, yr,
             isDouble ? 28 : 16, isDouble ? 56 : 76,
             isDouble ? 1568 : 1216,
             isDouble ? 3 : 2, isDouble ? 2 : 1,
             isDouble ? 'Double-Wide' : 'Single-Wide',
             idx % 5 === 0 ? 'COH' : 'TOH',
             ['Excellent', 'Good', 'Good', 'Fair', 'Good'][idx % 5],
             true, idx % 3 === 0, idx % 4 !== 0]
        );
        homeIds.push({ id: res.rows[0].id, lotIdx: idx });
    }
    console.log(`🏠 Seeded ${homeIds.length} homes`);

    // ── Residents ──
    const names = [
        ['John', 'Smith'], ['Maria', 'Garcia'], ['David', 'Williams'], ['Linda', 'Brown'],
        ['James', 'Jones'], ['Patricia', 'Miller'], ['Robert', 'Davis'], ['Jennifer', 'Wilson'],
        ['Michael', 'Taylor'], ['Elizabeth', 'Martinez'], ['William', 'Anderson'], ['Dorothy', 'Lopez'],
        ['Richard', 'Gonzalez'], ['Susan', 'Harris'], ['Daniel', 'Clark'], ['Nancy', 'Thomas'],
        ['Charles', 'Moore'], ['Karen', 'Jackson'],
    ];

    const residentIds = [];
    for (let i = 0; i < homeIds.length && i < names.length; i++) {
        const [fn, ln] = names[i];
        const homeEntry = homeIds[i];
        const moveIn = `${2020 + Math.floor(Math.random() * 5)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-01`;
        const res = await client.query(
            `INSERT INTO residents (community_id, lot_id, home_id, first_name, last_name,
             email, phone, status, move_in_date, portal_enabled,
             vehicle1_make, vehicle1_model, vehicle1_year, vehicle1_plate, vehicle1_state)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
            [cid, lotIds[homeEntry.lotIdx], homeEntry.id, fn, ln,
             `${fn.toLowerCase()}.${ln.toLowerCase()}@email.com`,
             `(602) 555-${String(1000 + i).slice(1)}`,
             'Active', moveIn, i < 5,
             ['Toyota', 'Ford', 'Honda', 'Chevrolet', 'Nissan'][i % 5],
             ['Camry', 'F-150', 'Civic', 'Silverado', 'Altima'][i % 5],
             String(2018 + (i % 6)),
             `AZ-${String(100 + i)}X`,
             'AZ']
        );
        residentIds.push(res.rows[0].id);
    }
    console.log(`👥 Seeded ${residentIds.length} residents`);

    // ── Leases ──
    for (let i = 0; i < residentIds.length; i++) {
        const homeEntry = homeIds[i];
        const startYr = 2023 + (i % 3);
        const endYr = startYr + 1;
        const rent = rents[homeEntry.lotIdx] || 425;
        await client.query(
            `INSERT INTO leases (community_id, lot_id, resident_id, home_id, lease_number,
             lease_type, status, start_date, end_date, monthly_rent,
             security_deposit, auto_renew, annual_increase_pct)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
            [cid, lotIds[homeEntry.lotIdx], residentIds[i], homeEntry.id,
             `SRV-L-${String(100 + i)}`,
             i % 4 === 0 ? 'Month-to-Month' : 'Fixed Term',
             i < 15 ? 'Active' : 'Expired',
             `${startYr}-01-01`, `${endYr}-12-31`,
             rent, rent, true, 3.0]
        );
    }
    console.log(`📋 Seeded ${residentIds.length} leases`);

    // ── Charges (current month lot rent for each active resident) ──
    let chargeCount = 0;
    for (let i = 0; i < residentIds.length; i++) {
        const homeEntry = homeIds[i];
        const rent = rents[homeEntry.lotIdx] || 425;
        const paid = i < 14; // Most have paid
        await client.query(
            `INSERT INTO charges (community_id, lot_id, resident_id, charge_type, description,
             amount, due_date, status, billing_period_start, billing_period_end)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [cid, lotIds[homeEntry.lotIdx], residentIds[i],
             'Lot Rent', 'March 2026 Lot Rent',
             rent, '2026-03-01',
             paid ? 'Paid' : (i === 14 ? 'Overdue' : 'Pending'),
             '2026-03-01', '2026-03-31']
        );
        chargeCount++;

        // Add payment for paid charges
        if (paid) {
            await client.query(
                `INSERT INTO payments (community_id, resident_id, amount, payment_date,
                 payment_method, status, reference_number)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                [cid, residentIds[i], rent,
                 `2026-03-0${Math.min(i + 1, 5)}`,
                 ['ACH', 'Check', 'Online Portal', 'Auto-Pay', 'Money Order'][i % 5],
                 'Completed',
                 `PAY-${String(2000 + i)}`]
            );
        }
    }
    console.log(`💰 Seeded ${chargeCount} charges + payments`);

    // ── Maintenance Requests ──
    const maintRequests = [
        { title: 'Water heater not producing hot water', desc: 'The water heater stopped working yesterday. No hot water at all.', cat: 'Plumbing', priority: 'High', status: 'In Progress', lotIdx: 2, resIdx: 2, assigned: 'Mike Thompson', cost: 350 },
        { title: 'Broken porch railing', desc: 'One of the porch railing posts has come loose and is a safety hazard.', cat: 'Other', priority: 'Normal', status: 'New', lotIdx: 6, resIdx: 5 },
        { title: 'AC unit making loud noise', desc: 'The air conditioning unit is making a grinding noise when it starts up.', cat: 'HVAC', priority: 'Normal', status: 'Assigned', lotIdx: 11, resIdx: 9, assigned: 'Cool Air Services', cost: 200 },
        { title: 'Sewer line backup', desc: 'Kitchen and bathroom sinks draining very slowly.', cat: 'Plumbing', priority: 'Emergency', status: 'In Progress', lotIdx: 0, resIdx: 0, assigned: 'Mike Thompson', cost: 800 },
        { title: 'Streetlight out on Palm Drive', desc: 'Streetlight near lot 8 is not working.', cat: 'Electrical', priority: 'High', status: 'New', lotIdx: null, resIdx: null },
        { title: 'Tree limb overhanging roof', desc: 'Large oak tree limb resting on home roof.', cat: 'Landscaping', priority: 'Normal', status: 'Assigned', lotIdx: 15, resIdx: 12, assigned: 'Green Tree Services', cost: 450 },
        { title: 'Pothole on Magnolia Way', desc: 'Large pothole at intersection of Magnolia Way and Sunset Lane.', cat: 'Roads/Sidewalks', priority: 'Normal', status: 'Completed', lotIdx: null, resIdx: null, assigned: 'ABC Paving' },
        { title: 'Ant infestation near skirting', desc: 'Fire ants building mounds near home skirting.', cat: 'Pest Control', priority: 'High', status: 'Assigned', lotIdx: 19, resIdx: 15, assigned: 'Pest Shield LLC', cost: 150 },
        { title: 'Clubhouse HVAC maintenance', desc: 'Seasonal AC tune-up before summer.', cat: 'Common Area', priority: 'Low', status: 'New', lotIdx: null, resIdx: null },
        { title: 'Electrical outlet sparking', desc: 'Kitchen outlet sparking when appliances plugged in.', cat: 'Electrical', priority: 'Emergency', status: 'In Progress', lotIdx: 4, resIdx: 4, assigned: 'Quick Spark Electric', cost: 300 },
    ];

    for (const mr of maintRequests) {
        await client.query(
            `INSERT INTO maintenance_requests (community_id, lot_id, resident_id, title, description,
             category, priority, status, assigned_to, estimated_cost, resident_name, lot_number, source)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
            [cid,
             mr.lotIdx !== null ? lotIds[mr.lotIdx] : null,
             mr.resIdx !== null ? residentIds[mr.resIdx] : null,
             mr.title, mr.desc, mr.cat, mr.priority, mr.status,
             mr.assigned || null, mr.cost || null,
             mr.resIdx !== null ? `${names[mr.resIdx][0]} ${names[mr.resIdx][1]}` : null,
             mr.lotIdx !== null ? String(mr.lotIdx + 1) : null,
             mr.resIdx !== null ? 'Resident' : 'Staff']
        );
    }
    console.log(`🔧 Seeded ${maintRequests.length} maintenance requests`);

    // ── Violations ──
    const violationData = [
        { type: 'Trash/Debris', desc: 'Accumulation of debris and old furniture on lot.', lotIdx: 8, resIdx: 7, status: 'Cure Period', observed: '2026-02-28', notice: '2026-03-01', cure: '2026-03-15' },
        { type: 'Unauthorized Structure', desc: 'Unauthorized storage shed placed without approval.', lotIdx: 13, resIdx: 11, status: 'Observed', observed: '2026-03-02' },
        { type: 'Vehicle', desc: 'Unregistered vehicle with expired plates parked 30+ days.', lotIdx: 3, resIdx: 3, status: 'Escalated', observed: '2026-02-15', notice: '2026-02-20', cure: '2026-03-06', fine: 100 },
        { type: 'Noise', desc: 'Repeated complaints about loud music after 10 PM quiet hours.', lotIdx: 18, resIdx: 14, status: 'Notice Sent', observed: '2026-03-04', notice: '2026-03-05' },
        { type: 'Exterior Maintenance', desc: 'Home skirting damaged and detached on east side.', lotIdx: 20, resIdx: 16, status: 'Cured', observed: '2026-02-20', notice: '2026-02-25', cure: '2026-03-11' },
    ];

    for (const v of violationData) {
        await client.query(
            `INSERT INTO violations (community_id, lot_id, resident_id, violation_type, description,
             observed_date, notice_date, cure_by_date, status, fine_amount, resident_name, lot_number)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [cid, lotIds[v.lotIdx], residentIds[v.resIdx], v.type, v.desc,
             v.observed, v.notice || null, v.cure || null, v.status,
             v.fine || null,
             `${names[v.resIdx][0]} ${names[v.resIdx][1]}`,
             String(v.lotIdx + 1)]
        );
    }
    console.log(`⚠️  Seeded ${violationData.length} violations`);

    // ── Announcements ──
    const announcements = [
        { title: 'Community Pool Opens May 15!', body: 'Pool opens May 15th, hours 8am-9pm daily. New pool furniture ordered.', cat: 'Event', priority: 'Normal', date: '2026-03-01', pinned: true },
        { title: 'Water Line Maintenance — March 10', body: 'City performing water line maintenance March 10th, 9am-2pm.', cat: 'Maintenance Alert', priority: 'Important', date: '2026-02-28', pinned: false },
        { title: 'Updated Pet Policy Effective April 1', body: 'Review the updated pet policy. Key changes include required pet registration.', cat: 'Policy Update', priority: 'Normal', date: '2026-03-05', pinned: false },
        { title: 'Spring Community BBQ — April 12', body: 'Annual Spring BBQ at the clubhouse! Free food, games, live music 11am-4pm.', cat: 'Event', priority: 'Normal', date: '2026-03-05', pinned: true },
        { title: 'Severe Storm Warning — Secure Your Homes', body: 'Severe thunderstorm warning tonight. Secure outdoor furniture and check tiedowns.', cat: 'Emergency', priority: 'Urgent', date: '2026-03-06', pinned: true },
        { title: 'New Online Payment Portal Available', body: 'Pay lot rent, utility charges, and fees securely from any device.', cat: 'General', priority: 'Important', date: '2026-03-03', pinned: false },
    ];

    for (const a of announcements) {
        await client.query(
            `INSERT INTO announcements (community_id, title, body, category, priority,
             status, publish_date, author_name, is_pinned)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [cid, a.title, a.body, a.cat, a.priority,
             'Published', a.date, 'Sarah Mitchell', a.pinned]
        );
    }
    console.log(`📢 Seeded ${announcements.length} announcements`);

    // ── Utility Meters ──
    const utilTypes = ['Water', 'Electric', 'Sewer', 'Gas'];
    const units = ['Gallons', 'kWh', 'Gallons', 'Therms'];
    const rates = [0.006, 0.12, 0.005, 1.05];
    const baseFees = [15, 12, 8, 10];
    let meterCount = 0;

    for (let i = 0; i < 10; i++) {
        const lotIdx = occupiedLotIndices[i % occupiedLotIndices.length];
        const utilIdx = i % 4;
        await client.query(
            `INSERT INTO utility_meters (community_id, lot_id, meter_number, utility_type, unit,
             rate_per_unit, base_fee, status, last_read_date, last_read_value, lot_number)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [cid, lotIds[lotIdx],
             `M${utilTypes[utilIdx].charAt(0)}${String(lotIdx + 1).padStart(3, '0')}`,
             utilTypes[utilIdx], units[utilIdx],
             rates[utilIdx], baseFees[utilIdx],
             'Active', '2026-02-28',
             5000 + Math.floor(Math.random() * 10000),
             String(lotIdx + 1)]
        );
        meterCount++;
    }
    console.log(`⚡ Seeded ${meterCount} utility meters`);

    await client.query('COMMIT');
    console.log('\n🎉 Database seeded successfully!');

    // Verify counts
    const verify = await client.query(`
        SELECT
            (SELECT COUNT(*) FROM communities) AS communities,
            (SELECT COUNT(*) FROM lots) AS lots,
            (SELECT COUNT(*) FROM homes) AS homes,
            (SELECT COUNT(*) FROM residents) AS residents,
            (SELECT COUNT(*) FROM leases) AS leases,
            (SELECT COUNT(*) FROM charges) AS charges,
            (SELECT COUNT(*) FROM payments) AS payments,
            (SELECT COUNT(*) FROM maintenance_requests) AS maintenance,
            (SELECT COUNT(*) FROM violations) AS violations,
            (SELECT COUNT(*) FROM announcements) AS announcements,
            (SELECT COUNT(*) FROM utility_meters) AS meters
    `);
    console.log('\n📊 Record counts:');
    const counts = verify.rows[0];
    Object.entries(counts).forEach(([k, v]) => console.log(`   ${k}: ${v}`));

    await client.end();
}

seed().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
