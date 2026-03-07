/**
 * @file seed.mjs
 * @description Seed Supabase with realistic multi-community MHC demo data.
 * Usage: node supabase/seed.mjs
 */

import pg from 'pg';

const { Client } = pg;

const connectionString = process.env.SUPABASE_DB_URL
    ?? 'postgresql://postgres:He110XTechLtd.@db.flrjhhfsffjdtkaiplld.supabase.co:5432/postgres';

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

const COMMUNITY_SEEDS = [
    {
        name: 'Sunrise Valley MHC',
        community_code: 'SRV-001',
        address_line1: '4500 Sunrise Valley Rd',
        city: 'Phoenix',
        state: 'AZ',
        postal_code: '85032',
        county: 'Maricopa',
        latitude: 33.6020,
        longitude: -112.0190,
        lot_count: 24,
        community_type: 'All-Age',
        year_established: 1995,
        total_acreage: 18.5,
        amenities: '{Pool,Clubhouse,Laundry,Playground,RV Storage,Dog Park}',
        description: 'A well-maintained all-age community in the heart of Phoenix featuring spacious lots, mature trees, and resort-style amenities.',
        manager_name: 'Sarah Mitchell',
        phone: '(602) 555-0147',
        email: 'office@sunrisevalleymhc.com',
        pet_policy: 'Allowed',
        pet_policy_notes: 'Max 2 pets per lot, weight limit 40 lbs',
        default_lot_rent: 425,
        late_fee_amount: 50,
        late_fee_grace_days: 5,
        nsf_fee_amount: 35,
        street_prefixes: ['Oak', 'Palm', 'Sunset', 'Magnolia'],
    },
    {
        name: 'Magnolia Gardens',
        community_code: 'MAG-001',
        address_line1: '2200 Magnolia Blvd',
        city: 'San Antonio',
        state: 'TX',
        postal_code: '78232',
        county: 'Bexar',
        latitude: 29.5580,
        longitude: -98.5130,
        lot_count: 18,
        community_type: '55+',
        year_established: 2002,
        total_acreage: 12.0,
        amenities: '{Clubhouse,Community Garden,Walking Path,Library,Pickleball Court}',
        description: 'A peaceful 55+ community with landscaped common areas and quiet residential streets.',
        manager_name: 'Robert Chen',
        phone: '(210) 555-0283',
        email: 'info@magnoliagardenstx.com',
        pet_policy: 'Restricted',
        pet_policy_notes: 'Small dogs and cats only, max 1 pet per lot',
        default_lot_rent: 375,
        late_fee_amount: 40,
        late_fee_grace_days: 7,
        nsf_fee_amount: 35,
        street_prefixes: ['Magnolia', 'Garden', 'Willow'],
    },
    {
        name: 'Lakewood Estates',
        community_code: 'LWD-001',
        address_line1: '8900 Lakewood Circle',
        city: 'Orlando',
        state: 'FL',
        postal_code: '32819',
        county: 'Orange',
        latitude: 28.4500,
        longitude: -81.4700,
        lot_count: 36,
        community_type: 'All-Age',
        year_established: 2010,
        total_acreage: 25.0,
        amenities: '{Pool,Clubhouse,Fitness Center,Playground,Basketball Court,Dog Park}',
        description: 'A modern all-age community near Orlando attractions with active amenity programming.',
        manager_name: 'Angela Rivera',
        phone: '(407) 555-0391',
        email: 'office@lakewoodestates.com',
        pet_policy: 'Allowed',
        pet_policy_notes: 'Max 2 pets, up to 40 lbs each',
        default_lot_rent: 450,
        late_fee_amount: 55,
        late_fee_grace_days: 5,
        nsf_fee_amount: 35,
        street_prefixes: ['Lake', 'Shore', 'Harbor', 'Cypress', 'Bay'],
    },
    {
        name: 'Mountain View Ranch',
        community_code: 'MVR-001',
        address_line1: '15600 Mountain View Rd',
        city: 'Denver',
        state: 'CO',
        postal_code: '80228',
        county: 'Jefferson',
        latitude: 39.7000,
        longitude: -105.1200,
        lot_count: 30,
        community_type: 'Family',
        year_established: 2018,
        total_acreage: 22.0,
        amenities: '{Clubhouse,Community Garden,Hiking Trails,Picnic Area,EV Charging}',
        description: 'A family-focused foothills community with mountain views and upgraded infrastructure.',
        manager_name: "Kevin O'Brien",
        phone: '(303) 555-0742',
        email: 'info@mountainviewranch.com',
        pet_policy: 'Allowed',
        pet_policy_notes: 'Max 3 pets, no breed restrictions',
        default_lot_rent: 500,
        late_fee_amount: 60,
        late_fee_grace_days: 5,
        nsf_fee_amount: 35,
        street_prefixes: ['Aspen', 'Pine', 'Ridge', 'Vista'],
    },
];

const FIRST_NAMES = ['John', 'Maria', 'David', 'Linda', 'James', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Elizabeth', 'William', 'Susan', 'Richard', 'Dorothy', 'Thomas', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Margaret', 'Anthony', 'Rosa', 'Victor', 'Emily'];
const LAST_NAMES = ['Smith', 'Garcia', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Martinez', 'Anderson', 'Lopez', 'Wilson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Hernandez', 'Clark', 'Lewis', 'Walker'];
const MANUFACTURERS = ['Clayton Homes', 'Champion', 'Skyline', 'Fleetwood', 'Palm Harbor', 'Cavco', 'Nobility'];
const MODELS = ['Breeze', 'Summit', 'Canyon', 'Harbor', 'Ranchview', 'Mesa', 'Evergreen'];
const VENDORS = ['Mike Thompson', 'Quick Spark Electric', 'ClearFlow Plumbing', 'Green Tree Services', 'Cool Air Services', 'Pest Shield LLC'];

function isoDate(date)
{
    return date.toISOString().slice(0, 10);
}

function addDays(date, days)
{
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
}

function monthStart(date)
{
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function monthEnd(date)
{
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function money(value)
{
    return Number(value.toFixed(2));
}

function pick(list, index)
{
    return list[index % list.length];
}

function lotStatusFor(index, lotCount)
{
    const occupiedCutoff = Math.floor(lotCount * 0.68);
    const vacantCutoff = Math.floor(lotCount * 0.82);
    const setupCutoff = Math.floor(lotCount * 0.90);

    if (index < occupiedCutoff) return 'Occupied';
    if (index < vacantCutoff) return 'Vacant';
    if (index < setupCutoff) return index % 2 === 0 ? 'Under Setup' : 'Renovation';
    return 'Out of Service';
}

function lotTypeFor(index)
{
    if (index % 7 === 0) return 'Premium';
    if (index % 9 === 0) return 'Corner';
    if (index % 11 === 0) return 'End Lot';
    return 'Standard';
}

function utilityTemplate(type)
{
    const map = {
        Water: { unit: 'Gallons', rate: 0.0062, baseFee: 18 },
        Electric: { unit: 'kWh', rate: 0.1325, baseFee: 12 },
        Sewer: { unit: 'Gallons', rate: 0.0048, baseFee: 9 },
        Gas: { unit: 'Therms', rate: 1.08, baseFee: 10 },
    };

    return map[type];
}

async function insertCommunity(seed)
{
    const result = await client.query(
        `INSERT INTO communities (
            name, community_code, address_line1, city, state, postal_code, county,
            latitude, longitude, lot_count, status, community_type, year_established,
            total_acreage, amenities, description, manager_name, phone, email,
            pet_policy, pet_policy_notes, default_lot_rent, late_fee_amount,
            late_fee_grace_days, nsf_fee_amount
        ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Active',$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
        ) RETURNING id`,
        [
            seed.name, seed.community_code, seed.address_line1, seed.city, seed.state, seed.postal_code, seed.county,
            seed.latitude, seed.longitude, seed.lot_count, seed.community_type, seed.year_established, seed.total_acreage,
            seed.amenities, seed.description, seed.manager_name, seed.phone, seed.email, seed.pet_policy,
            seed.pet_policy_notes, seed.default_lot_rent, seed.late_fee_amount, seed.late_fee_grace_days, seed.nsf_fee_amount,
        ],
    );

    return result.rows[0].id;
}

async function seedCommunity(seed, communityId, communityIndex, today, currentMonthStart, currentMonthEnd, previousMonthStart)
{
    const lotRecords = [];
    const occupiedLots = [];
    const residentRecords = [];
    const leaseRecords = [];
    const homeRecords = [];

    for (let i = 0; i < seed.lot_count; i += 1)
    {
        const lotNumber = String(i + 1);
        const status = lotStatusFor(i, seed.lot_count);
        const rent = status === 'Occupied' || status === 'Vacant'
            ? money(seed.default_lot_rent + ((i % 5) * 15) + (communityIndex * 10))
            : null;
        const streetName = `${pick(seed.street_prefixes, i)} ${i % 2 === 0 ? 'Lane' : 'Drive'}`;

        const lotResult = await client.query(
            `INSERT INTO lots (
                community_id, lot_number, street_name, status, lot_type,
                size_sqft, pad_type, max_home_width, max_home_length,
                has_water, has_sewer, has_electric, has_gas, has_cable,
                monthly_rent, notes
            ) VALUES (
                $1,$2,$3,$4,$5,$6,'Concrete',16,80,true,true,true,$7,$8,$9,$10
            ) RETURNING id`,
            [
                communityId,
                lotNumber,
                streetName,
                status,
                lotTypeFor(i),
                3600 + (i * 95),
                i % 3 === 0,
                i % 4 === 0,
                rent,
                status === 'Out of Service' ? 'Offline pending utility rebuild and lot grading.' : null,
            ],
        );

        const lotRecord = {
            id: lotResult.rows[0].id,
            lot_number: lotNumber,
            street_name: streetName,
            status,
            monthly_rent: rent,
            index: i,
        };

        lotRecords.push(lotRecord);

        if (status === 'Occupied')
        {
            occupiedLots.push(lotRecord);
        }
    }

    for (let i = 0; i < occupiedLots.length; i += 1)
    {
        const lot = occupiedLots[i];
        const firstName = pick(FIRST_NAMES, i + (communityIndex * 7));
        const lastName = pick(LAST_NAMES, i + (communityIndex * 5));
        const manufacturer = pick(MANUFACTURERS, i + communityIndex);
        const model = pick(MODELS, i + communityIndex);
        const ownershipType = i % 5 === 0 ? 'COH' : i % 3 === 0 ? 'ROH' : 'TOH';
        const homeType = i % 4 === 0 ? 'Double-Wide' : 'Single-Wide';
        const moveInDate = isoDate(addDays(today, -1 * (260 + (i * 17))));
        const leaseStart = new Date(`${moveInDate}T00:00:00Z`);
        const leaseEnd = isoDate(addDays(leaseStart, i % 4 === 0 ? 395 : 365));
        const isPaid = i % 5 !== 2 && i % 6 !== 0;
        const isOverdue = i % 6 === 0;

        const homeResult = await client.query(
            `INSERT INTO homes (
                community_id, lot_id, serial_number, manufacturer, model_name,
                year_manufactured, width_ft, length_ft, sqft, bedrooms, bathrooms,
                home_type, ownership_type, condition, purchase_date, purchase_price,
                current_value, has_carport, has_deck, has_central_ac
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,true
            ) RETURNING id`,
            [
                communityId,
                lot.id,
                `${seed.community_code}-${String(1000 + i)}`,
                manufacturer,
                model,
                2006 + ((i + communityIndex) % 16),
                homeType === 'Double-Wide' ? 28 : 16,
                homeType === 'Double-Wide' ? 56 : 76,
                homeType === 'Double-Wide' ? 1568 : 1216,
                homeType === 'Double-Wide' ? 3 : 2,
                homeType === 'Double-Wide' ? 2 : 1,
                homeType,
                ownershipType,
                ['Excellent', 'Good', 'Good', 'Fair', 'Needs Rehab'][i % 5],
                moveInDate,
                money((lot.monthly_rent || seed.default_lot_rent) * 65),
                money((lot.monthly_rent || seed.default_lot_rent) * 90),
                i % 3 === 0,
                i % 2 === 0,
            ],
        );

        const residentResult = await client.query(
            `INSERT INTO residents (
                community_id, lot_id, home_id, first_name, last_name, email, phone,
                status, move_in_date, portal_enabled, emergency_contact_name,
                emergency_contact_phone, vehicle1_make, vehicle1_model, vehicle1_year,
                vehicle1_plate, vehicle1_state, notes
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,'Active',$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
            ) RETURNING id`,
            [
                communityId,
                lot.id,
                homeResult.rows[0].id,
                firstName,
                lastName,
                `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
                `(${seed.phone.slice(1, 4)}) 555-${String(1000 + i).slice(-4)}`,
                moveInDate,
                i < 4,
                `${pick(FIRST_NAMES, i + 10)} ${pick(LAST_NAMES, i + 12)}`,
                `(${seed.phone.slice(1, 4)}) 555-${String(1400 + i).slice(-4)}`,
                pick(['Toyota', 'Ford', 'Honda', 'Chevrolet', 'Nissan'], i),
                pick(['Camry', 'F-150', 'Civic', 'Silverado', 'Altima'], i),
                String(2017 + (i % 6)),
                `${seed.state}-${100 + i}X`,
                seed.state,
                i % 7 === 0 ? 'Resident requested online portal autopay enrollment.' : null,
            ],
        );

        const residentId = residentResult.rows[0].id;
        residentRecords.push({ id: residentId, lot, firstName, lastName });
        homeRecords.push({ id: homeResult.rows[0].id, lot });

        const leaseResult = await client.query(
            `INSERT INTO leases (
                community_id, lot_id, resident_id, home_id, lease_number, lease_type, status,
                start_date, end_date, monthly_rent, security_deposit, auto_renew,
                annual_increase_pct, signed_date
            ) VALUES (
                $1,$2,$3,$4,$5,$6,'Active',$7,$8,$9,$10,true,3.00,$11
            ) RETURNING id`,
            [
                communityId,
                lot.id,
                residentId,
                homeResult.rows[0].id,
                `${seed.community_code}-L-${String(100 + i)}`,
                i % 4 === 0 ? 'Month-to-Month' : 'Fixed Term',
                moveInDate,
                leaseEnd,
                lot.monthly_rent || seed.default_lot_rent,
                lot.monthly_rent || seed.default_lot_rent,
                isoDate(addDays(leaseStart, 3)),
            ],
        );

        leaseRecords.push({ id: leaseResult.rows[0].id, lot, residentId });

        const lotRentAmount = lot.monthly_rent || seed.default_lot_rent;
        const lotRentStatus = isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending';

        const rentChargeResult = await client.query(
            `INSERT INTO charges (
                community_id, lot_id, resident_id, lease_id, charge_type, description,
                amount, due_date, status, billing_period_start, billing_period_end
            ) VALUES (
                $1,$2,$3,$4,'Lot Rent',$5,$6,$7,$8,$9,$10
            ) RETURNING id`,
            [
                communityId,
                lot.id,
                residentId,
                leaseResult.rows[0].id,
                `${seed.name} ${currentMonthStart.toLocaleString('en-US', { month: 'long', year: 'numeric' })} lot rent`,
                lotRentAmount,
                isoDate(currentMonthStart),
                lotRentStatus,
                isoDate(currentMonthStart),
                isoDate(currentMonthEnd),
            ],
        );

        if (lotRentStatus === 'Paid')
        {
            const paymentResult = await client.query(
                `INSERT INTO payments (
                    community_id, resident_id, charge_id, amount, payment_date,
                    payment_method, reference_number, status
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,'Completed')
                RETURNING id`,
                [
                    communityId,
                    residentId,
                    rentChargeResult.rows[0].id,
                    lotRentAmount,
                    isoDate(addDays(currentMonthStart, 2 + (i % 4))),
                    pick(['ACH', 'Check', 'Online Portal', 'Auto-Pay'], i),
                    `${seed.community_code}-PAY-${String(2000 + i)}`,
                ],
            );

            await client.query(
                `INSERT INTO payment_allocations (
                    payment_id, charge_id, allocated_amount, allocation_order
                ) VALUES ($1,$2,$3,1)`,
                [
                    paymentResult.rows[0].id,
                    rentChargeResult.rows[0].id,
                    lotRentAmount,
                ],
            );
        }

        if (i % 4 === 0)
        {
            await client.query(
                `INSERT INTO charges (
                    community_id, lot_id, resident_id, lease_id, charge_type, description,
                    amount, due_date, status, billing_period_start, billing_period_end
                ) VALUES (
                    $1,$2,$3,$4,'Late Fee',$5,$6,$7,$8,$9,$10
                )`,
                [
                    communityId,
                    lot.id,
                    residentId,
                    leaseResult.rows[0].id,
                    'Late fee from prior billing cycle',
                    seed.late_fee_amount,
                    isoDate(addDays(previousMonthStart, 20)),
                    i % 8 === 0 ? 'Overdue' : 'Pending',
                    isoDate(previousMonthStart),
                    isoDate(monthEnd(previousMonthStart)),
                ],
            );
        }
    }

    const applicantLot = lotRecords.find((lot) => lot.status === 'Vacant') ?? lotRecords[0];
    const applicantResult = await client.query(
        `INSERT INTO residents (
            community_id, lot_id, first_name, last_name, email, phone, status, notes
        ) VALUES ($1,$2,$3,$4,$5,$6,'Applicant',$7)
        RETURNING id`,
        [
            communityId,
            applicantLot.id,
            pick(FIRST_NAMES, 30 + communityIndex),
            pick(LAST_NAMES, 33 + communityIndex),
            `applicant.${seed.community_code.toLowerCase()}@example.com`,
            `(${seed.phone.slice(1, 4)}) 555-909${communityIndex}`,
            'Awaiting background check and income verification.',
        ],
    );

    await client.query(
        `INSERT INTO resident_applications (
            community_id, resident_id, desired_lot_id, status, application_date,
            monthly_income, household_size, screening_status, screening_notes, notes
        ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
        )`,
        [
            communityId,
            applicantResult.rows[0].id,
            applicantLot.id,
            communityIndex % 2 === 0 ? 'Screening' : 'Submitted',
            isoDate(addDays(today, -3 - communityIndex)),
            4200 + (communityIndex * 350),
            2 + (communityIndex % 3),
            communityIndex % 2 === 0 ? 'Manual Review' : 'Pending',
            communityIndex % 2 === 0 ? 'Income docs received, landlord reference outstanding.' : null,
            'Seeded applicant lifecycle record for PM workflow validation.',
        ],
    );

    for (let i = 0; i < Math.min(homeRecords.length, 4); i += 1)
    {
        const home = homeRecords[i];
        const resident = residentRecords[i];
        await client.query(
            `INSERT INTO inspections (
                community_id, lot_id, home_id, resident_id, inspection_type, status,
                scheduled_date, completed_date, score, inspector_name, summary, findings
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
            )`,
            [
                communityId,
                home.lot.id,
                home.id,
                resident.id,
                i % 2 === 0 ? 'Annual' : 'Move-In',
                'Completed',
                isoDate(addDays(today, -45 + (i * 7))),
                isoDate(addDays(today, -44 + (i * 7))),
                84 + (i * 3),
                seed.manager_name,
                i % 2 === 0 ? 'Annual condition review completed with minor follow-up.' : 'Move-in inspection completed and signed.',
                JSON.stringify([
                    { area: 'Exterior', result: i % 3 === 0 ? 'Needs touch-up paint' : 'Pass' },
                    { area: 'Utilities', result: 'Pass' },
                ]),
            ],
        );
    }

    for (let i = 0; i < Math.min(leaseRecords.length, 3); i += 1)
    {
        const lease = leaseRecords[i];
        await client.query(
            `INSERT INTO resident_notices (
                community_id, resident_id, lease_id, notice_type, status,
                notice_date, effective_date, response_due_date, delivery_method, notes
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
            )`,
            [
                communityId,
                lease.residentId,
                lease.id,
                i === 0 ? 'Renewal Offer' : i === 1 ? 'Intent to Vacate' : 'Lease Violation',
                i === 2 ? 'Acknowledged' : 'Served',
                isoDate(addDays(today, -20 + (i * 5))),
                isoDate(addDays(today, 20 + (i * 10))),
                isoDate(addDays(today, 7 + (i * 4))),
                i === 1 ? 'Portal' : 'Email',
                'Seeded notice workflow record for lifecycle coverage.',
            ],
        );
    }

    const maintenanceTemplates = [
        ['Water heater not producing hot water', 'Plumbing', 'High', 'In Progress'],
        ['Broken porch railing', 'Other', 'Normal', 'New'],
        ['AC unit making loud noise', 'HVAC', 'Normal', 'Assigned'],
        ['Tree limb overhanging roof', 'Landscaping', 'Normal', 'Assigned'],
        ['Streetlight outage near entrance', 'Electrical', 'High', 'New'],
        ['Pothole at curb line', 'Roads/Sidewalks', 'Low', 'Completed'],
    ];

    for (let i = 0; i < maintenanceTemplates.length; i += 1)
    {
        const [title, category, priority, status] = maintenanceTemplates[i];
        const resident = residentRecords[i % residentRecords.length];
        const maintenanceResult = await client.query(
            `INSERT INTO maintenance_requests (
                community_id, lot_id, resident_id, title, description, category,
                priority, status, source, assigned_to, scheduled_date,
                estimated_cost, resident_name, lot_number
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
            ) RETURNING id`,
            [
                communityId,
                i % 5 === 4 ? null : resident.lot.id,
                i % 5 === 4 ? null : resident.id,
                title,
                `${title} reported for ${seed.name}.`,
                category,
                priority,
                status,
                i % 5 === 4 ? 'Staff' : 'Resident',
                status === 'Assigned' || status === 'In Progress' ? pick(VENDORS, i + communityIndex) : null,
                status === 'Assigned' || status === 'In Progress' ? isoDate(addDays(today, i + 1)) : null,
                status === 'Completed' ? 225 : 120 + (i * 45),
                i % 5 === 4 ? null : `${resident.firstName} ${resident.lastName}`,
                i % 5 === 4 ? null : resident.lot.lot_number,
            ],
        );

        await client.query(
            `INSERT INTO maintenance_events (
                maintenance_request_id, event_type, old_status, new_status, actor_name, note
            ) VALUES
                ($1,'Created',NULL,'New',$2,$3),
                ($1,'Status Changed','New',$4,$2,$5)`,
            [
                maintenanceResult.rows[0].id,
                seed.manager_name,
                'Seeded from QA sample data.',
                status,
                status === 'New' ? 'Awaiting dispatch.' : `Request moved into ${status}.`,
            ],
        );
    }

    const violationTemplates = [
        ['Trash/Debris', 'Accumulation of debris and old furniture on the lot.', 'Observed'],
        ['Unauthorized Structure', 'Unapproved shed expansion noted during inspection.', 'Notice Sent'],
        ['Vehicle', 'Vehicle with expired registration parked for more than 14 days.', 'Escalated'],
        ['Exterior Maintenance', 'Detached skirting panel and unpainted fascia board.', 'Cured'],
    ];

    for (let i = 0; i < violationTemplates.length; i += 1)
    {
        const [type, description, status] = violationTemplates[i];
        const resident = residentRecords[(i * 2) % residentRecords.length];
        const observedDate = isoDate(addDays(today, -14 + (i * 2)));
        const noticeDate = status === 'Observed' ? null : isoDate(addDays(today, -10 + (i * 2)));
        const cureByDate = status === 'Observed' ? null : isoDate(addDays(today, 7 + i));

        const violationResult = await client.query(
            `INSERT INTO violations (
                community_id, lot_id, resident_id, violation_type, description,
                observed_date, notice_date, cure_by_date, status, fine_amount,
                resident_name, lot_number
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
            ) RETURNING id`,
            [
                communityId,
                resident.lot.id,
                resident.id,
                type,
                description,
                observedDate,
                noticeDate,
                cureByDate,
                status,
                status === 'Escalated' ? 100 : null,
                `${resident.firstName} ${resident.lastName}`,
                resident.lot.lot_number,
            ],
        );

        await client.query(
            `INSERT INTO violation_events (
                violation_id, event_type, old_status, new_status, actor_name, note
            ) VALUES
                ($1,'Observed',NULL,'Observed',$2,$3),
                ($1,'Status Changed','Observed',$4,$2,$5)`,
            [
                violationResult.rows[0].id,
                seed.manager_name,
                'Violation recorded during seeded compliance walkthrough.',
                status,
                status === 'Observed' ? 'Initial observation only.' : `Violation advanced to ${status}.`,
            ],
        );
    }

    const announcements = [
        ['Pool opening weekend', 'Event', 'Normal'],
        ['Utility maintenance window', 'Maintenance Alert', 'Important'],
        ['Updated resident handbook', 'Policy Update', 'Normal'],
        ['Community BBQ registration', 'Event', 'Normal'],
        ['Storm prep reminder', 'Emergency', 'Urgent'],
    ];

    for (let i = 0; i < announcements.length; i += 1)
    {
        const [title, category, priority] = announcements[i];
        await client.query(
            `INSERT INTO announcements (
                community_id, title, body, category, priority, status,
                publish_date, author_name, is_pinned
            ) VALUES (
                $1,$2,$3,$4,$5,'Published',$6,$7,$8
            )`,
            [
                communityId,
                `${title} at ${seed.name}`,
                `${title} information for ${seed.name}. This seeded announcement keeps the activity feed populated for QA and demos.`,
                category,
                priority,
                isoDate(addDays(today, -1 * (i + 1))),
                seed.manager_name,
                i < 2,
            ],
        );
    }

    const utilityMeters = [];
    const utilityTypesByLot = [
        ['Water', 'Electric'],
        ['Water', 'Electric', 'Sewer'],
        ['Water', 'Electric'],
        ['Water', 'Electric', 'Gas'],
    ];

    for (let i = 0; i < Math.min(occupiedLots.length, 10); i += 1)
    {
        const lot = occupiedLots[i];
        const types = utilityTypesByLot[i % utilityTypesByLot.length];

        for (const type of types)
        {
            const template = utilityTemplate(type);
            const previousValue = 4000 + (communityIndex * 850) + (i * 175) + (type.length * 23);
            const currentValue = previousValue + 180 + ((i % 5) * 55);

            const meterResult = await client.query(
                `INSERT INTO utility_meters (
                    community_id, lot_id, meter_number, utility_type, unit,
                    rate_per_unit, base_fee, status, install_date, last_read_date,
                    last_read_value, lot_number
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
                ) RETURNING id`,
                [
                    communityId,
                    lot.id,
                    `${seed.community_code}-${type.charAt(0)}-${String(lot.lot_number).padStart(3, '0')}`,
                    type,
                    template.unit,
                    template.rate,
                    template.baseFee,
                    i % 8 === 0 && type === 'Electric' ? 'Needs Replacement' : 'Active',
                    isoDate(addDays(today, -620)),
                    isoDate(addDays(currentMonthStart, 4 + (i % 6))),
                    currentValue,
                    lot.lot_number,
                ],
            );

            utilityMeters.push(meterResult.rows[0].id);

            await client.query(
                `INSERT INTO utility_readings (
                    utility_meter_id, lot_id, reading_date, reading_value, previous_value,
                    consumption, calculated_charge, read_by
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8
                )`,
                [
                    meterResult.rows[0].id,
                    lot.id,
                    isoDate(addDays(previousMonthStart, 5 + (i % 6))),
                    previousValue,
                    previousValue - (140 + ((i + 1) * 12)),
                    140 + ((i + 1) * 12),
                    money(template.baseFee + (140 + ((i + 1) * 12)) * template.rate),
                    pick(VENDORS, i),
                ],
            );

            const currentCharge = money(template.baseFee + (currentValue - previousValue) * template.rate);

            await client.query(
                `INSERT INTO utility_readings (
                    utility_meter_id, lot_id, reading_date, reading_value, previous_value,
                    consumption, calculated_charge, read_by
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8
                )`,
                [
                    meterResult.rows[0].id,
                    lot.id,
                    isoDate(addDays(currentMonthStart, 5 + (i % 6))),
                    currentValue,
                    previousValue,
                    currentValue - previousValue,
                    currentCharge,
                    pick(VENDORS, i + 2),
                ],
            );

            const resident = residentRecords[i % residentRecords.length];
            await client.query(
                `INSERT INTO charges (
                    community_id, lot_id, resident_id, charge_type, description,
                    amount, due_date, status, billing_period_start, billing_period_end
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
                )`,
                [
                    communityId,
                    lot.id,
                    resident.id,
                    `Utility - ${type}`,
                    `${type} service for ${currentMonthStart.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
                    currentCharge,
                    isoDate(addDays(currentMonthStart, 10)),
                    i % 3 === 0 ? 'Paid' : 'Pending',
                    isoDate(currentMonthStart),
                    isoDate(currentMonthEnd),
                ],
            );
        }
    }

    if (leaseRecords.length > 0)
    {
        await client.query(
            `INSERT INTO documents (
                community_id, entity_type, entity_id, file_name, file_type,
                file_size, storage_path, description, uploaded_by
            ) VALUES
                ($1,'lease',$2,$3,'application/pdf',245120,$4,$5,$6),
                ($1,'community',$1,$7,'application/pdf',132014,$8,$9,$10)`,
            [
                communityId,
                leaseRecords[0].id,
                `${seed.community_code}-lease-packet.pdf`,
                `${seed.community_code.toLowerCase()}/leases/packet.pdf`,
                'Signed resident lease packet',
                communityId,
                `${seed.community_code}-rules.pdf`,
                `${seed.community_code.toLowerCase()}/community/rules.pdf`,
                'Resident rules and handbook',
                seed.manager_name,
            ],
        );
    }

    await client.query(
        `INSERT INTO audit_log (community_id, user_id, action, entity_type, entity_id, new_values, created_at)
         VALUES
            ($1, NULL, 'seed.community.loaded', 'community', $1, $2, NOW()),
            ($1, NULL, 'seed.utility.ready', 'utility_meter', NULL, $3, NOW())`,
        [
            communityId,
            JSON.stringify({ lots: lotRecords.length, occupiedLots: occupiedLots.length }),
            JSON.stringify({ meters: utilityMeters.length }),
        ],
    );

    return {
        lots: lotRecords.length,
        occupiedLots: occupiedLots.length,
        homes: homeRecords.length,
        residents: residentRecords.length + 1,
        leases: leaseRecords.length,
        meters: utilityMeters.length,
    };
}

async function seed()
{
    await client.connect();
    console.log('Connected to Supabase');

    const today = new Date();
    const currentMonthStart = monthStart(today);
    const currentMonthEnd = monthEnd(today);
    const previousMonthStart = monthStart(addDays(currentMonthStart, -5));

    await client.query('BEGIN');

    const tables = [
        'utility_readings',
        'utility_meters',
        'violation_events',
        'maintenance_events',
        'audit_log',
        'documents',
        'inspections',
        'resident_notices',
        'violations',
        'maintenance_requests',
        'payment_allocations',
        'payments',
        'charges',
        'resident_applications',
        'leases',
        'residents',
        'homes',
        'lots',
        'announcements',
        'communities',
    ];

    for (const table of tables)
    {
        await client.query(`DELETE FROM ${table}`);
    }

    const summaries = [];

    for (let i = 0; i < COMMUNITY_SEEDS.length; i += 1)
    {
        const seedData = COMMUNITY_SEEDS[i];
        const communityId = await insertCommunity(seedData);
        const summary = await seedCommunity(seedData, communityId, i, today, currentMonthStart, currentMonthEnd, previousMonthStart);
        summaries.push({ community: seedData.name, ...summary });
    }

    await client.query('COMMIT');

    console.log('\nSeed completed successfully.\n');
    summaries.forEach((summary) =>
    {
        console.log(`${summary.community}: ${summary.lots} lots, ${summary.occupiedLots} occupied, ${summary.residents} residents, ${summary.leases} leases, ${summary.meters} meters`);
    });

    const verify = await client.query(`
        SELECT
            (SELECT COUNT(*) FROM communities) AS communities,
            (SELECT COUNT(*) FROM lots) AS lots,
            (SELECT COUNT(*) FROM homes) AS homes,
            (SELECT COUNT(*) FROM residents) AS residents,
            (SELECT COUNT(*) FROM leases) AS leases,
            (SELECT COUNT(*) FROM charges) AS charges,
            (SELECT COUNT(*) FROM payments) AS payments,
            (SELECT COUNT(*) FROM maintenance_requests) AS maintenance_requests,
            (SELECT COUNT(*) FROM violations) AS violations,
            (SELECT COUNT(*) FROM announcements) AS announcements,
            (SELECT COUNT(*) FROM utility_meters) AS utility_meters,
            (SELECT COUNT(*) FROM utility_readings) AS utility_readings,
            (SELECT COUNT(*) FROM resident_applications) AS resident_applications,
            (SELECT COUNT(*) FROM resident_notices) AS resident_notices,
            (SELECT COUNT(*) FROM inspections) AS inspections,
            (SELECT COUNT(*) FROM payment_allocations) AS payment_allocations,
            (SELECT COUNT(*) FROM maintenance_events) AS maintenance_events,
            (SELECT COUNT(*) FROM violation_events) AS violation_events,
            (SELECT COUNT(*) FROM documents) AS documents,
            (SELECT COUNT(*) FROM audit_log) AS audit_entries
    `);

    console.log('\nRecord counts:');
    Object.entries(verify.rows[0]).forEach(([key, value]) =>
    {
        console.log(`  ${key}: ${value}`);
    });

    await client.end();
}

seed().catch(async (error) =>
{
    console.error('Seed failed:', error);
    try
    {
        await client.query('ROLLBACK');
        await client.end();
    }
    catch
    {
        // noop
    }
    process.exit(1);
});
