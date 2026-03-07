/**
 * @file worker.ts
 * @description Rental Smart MHC BFF — Cloudflare Worker entrypoint.
 * Routes all API requests and handles CORS, auth, and Supabase integration.
 */

import { AutoRouter, cors, error, json } from 'itty-router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ── Types ──
export interface Env {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    SUPABASE_ANON_KEY: string;
    CORS_ORIGIN: string;
}

// ── Supabase client factory ──
function getSupabase(env: Env): SupabaseClient {
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

// ── CORS setup ──
const { preflight, corsify } = cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Community-ID'],
});

// ── Router ──
const router = AutoRouter({
    before: [preflight],
    finally: [corsify],
});

// ─── Health Check ───
router.get('/api/health', () => {
    return {
        status: 'ok',
        service: 'Rental Smart MHC BFF',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    };
});

// ============================================================
// COMMUNITIES
// ============================================================
router.get('/api/communities', async (req, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('communities')
        .select('*')
        .eq('status', 'Active')
        .order('name');

    if (err) return error(500, err.message);
    return data;
});

router.get('/api/communities/:id', async (req, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('communities')
        .select('*')
        .eq('id', req.params.id)
        .single();

    if (err) return error(404, err.message);
    return data;
});

router.put('/api/communities/:id', async (req, env: Env) => {
    const body = await req.json();
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('communities')
        .update(body as Record<string, unknown>)
        .eq('id', req.params.id)
        .select()
        .single();

    if (err) return error(500, err.message);
    return data;
});

// ============================================================
// DASHBOARD
// ============================================================
router.get('/api/communities/:id/dashboard', async (req, env: Env) => {
    const communityId = req.params.id;
    const supabase = getSupabase(env);

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const ninetyDaysOut = new Date();
    ninetyDaysOut.setDate(ninetyDaysOut.getDate() + 90);

    const [
        totalLotsResult,
        occupiedLotsResult,
        vacantLotsResult,
        activeResidentsResult,
        activeLeasesResult,
        expiringLeasesResult,
        openMaintenanceResult,
        openViolationsResult,
        maintenanceResult,
        announcementsResult,
        chargeDataResult,
    ] = await Promise.all([
        supabase.from('lots').select('id', { count: 'exact', head: true }).eq('community_id', communityId),
        supabase.from('lots').select('id', { count: 'exact', head: true }).eq('community_id', communityId).eq('status', 'Occupied'),
        supabase.from('lots').select('id', { count: 'exact', head: true }).eq('community_id', communityId).eq('status', 'Vacant'),
        supabase.from('residents').select('id', { count: 'exact', head: true }).eq('community_id', communityId).eq('status', 'Active'),
        supabase.from('leases').select('monthly_rent, end_date').eq('community_id', communityId).eq('status', 'Active'),
        supabase.from('leases').select('id', { count: 'exact', head: true }).eq('community_id', communityId).eq('status', 'Active').gte('end_date', new Date().toISOString().slice(0, 10)).lte('end_date', ninetyDaysOut.toISOString().slice(0, 10)),
        supabase.from('maintenance_requests').select('id', { count: 'exact', head: true }).eq('community_id', communityId).not('status', 'in', '("Completed","Cancelled")'),
        supabase.from('violations').select('id', { count: 'exact', head: true }).eq('community_id', communityId).not('status', 'in', '("Cured","Closed","Legal")'),
        supabase.from('maintenance_requests').select('*').eq('community_id', communityId).neq('status', 'Completed').order('created_at', { ascending: false }).limit(5),
        supabase.from('announcements').select('*').eq('community_id', communityId).eq('status', 'Published').order('publish_date', { ascending: false }).limit(5),
        supabase.from('charges').select('status, amount').eq('community_id', communityId).gte('due_date', startOfMonth),
    ]);

    const activeLeases = activeLeasesResult.data || [];
    const monthlyRevenue = activeLeases.reduce((sum: number, lease: Record<string, unknown>) => sum + Number(lease.monthly_rent || 0), 0);

    const chargeData = chargeDataResult.data || [];
    let totalCharged = 0;
    let totalCollected = 0;
    chargeData.forEach((charge: Record<string, unknown>) => {
        totalCharged += Number(charge.amount || 0);
        if (charge.status === 'Paid') totalCollected += Number(charge.amount || 0);
    });

    const totalLots = totalLotsResult.count || 0;
    const occupiedLots = occupiedLotsResult.count || 0;
    const vacantLots = vacantLotsResult.count || 0;
    const collectionRate = totalCharged > 0 ? Math.round((totalCollected / totalCharged) * 100) : 0;
    const occupancyRate = totalLots > 0 ? Number(((occupiedLots / totalLots) * 100).toFixed(1)) : 0;

    return {
        kpi: {
            community_id: communityId,
            total_lots: totalLots,
            occupied_lots: occupiedLots,
            vacant_lots: vacantLots,
            occupancy_rate: occupancyRate,
            monthly_revenue: monthlyRevenue,
            open_maintenance: openMaintenanceResult.count || 0,
            open_violations: openViolationsResult.count || 0,
            leases_expiring_soon: expiringLeasesResult.count || 0,
            total_residents: activeResidentsResult.count || 0,
            collection_rate: collectionRate,
        },
        recentMaintenance: maintenanceResult.data || [],
        recentAnnouncements: announcementsResult.data || [],
    };
});

// ============================================================
// LOTS
// ============================================================
router.get('/api/communities/:id/lots', async (req, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('lots')
        .select('*, homes(id, manufacturer, model_name, year_manufactured, home_type, bedrooms, bathrooms, sqft, ownership_type, condition), residents(id, first_name, last_name, phone, email, status)')
        .eq('community_id', req.params.id)
        .order('lot_number');

    if (err) return error(500, err.message);
    return data;
});

router.post('/api/communities/:id/lots', async (req, env: Env) => {
    const body = await req.json() as Record<string, unknown>;
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('lots')
        .insert({ ...body, community_id: req.params.id })
        .select()
        .single();

    if (err) return error(500, err.message);
    return json(data, { status: 201 });
});

router.put('/api/lots/:id', async (req, env: Env) => {
    const body = await req.json();
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('lots')
        .update(body as Record<string, unknown>)
        .eq('id', req.params.id)
        .select()
        .single();

    if (err) return error(500, err.message);
    return data;
});

// ============================================================
// RESIDENTS
// ============================================================
router.get('/api/communities/:id/residents', async (req, env: Env) => {
    const supabase = getSupabase(env);
    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    let query = supabase
        .from('residents')
        .select('*, lots(lot_number, street_name), leases(id, monthly_rent, start_date, end_date, status), homes(ownership_type)')
        .eq('community_id', req.params.id)
        .order('last_name');

    if (status) query = query.eq('status', status);

    const { data, error: err } = await query;
    if (err) return error(500, err.message);
    return data;
});

router.get('/api/residents/:id', async (req, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('residents')
        .select('*, lots(lot_number, street_name, monthly_rent), homes(*), leases(*)')
        .eq('id', req.params.id)
        .single();

    if (err) return error(404, err.message);
    return data;
});

router.post('/api/communities/:id/residents', async (req, env: Env) => {
    const body = await req.json() as Record<string, unknown>;
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('residents')
        .insert({ ...body, community_id: req.params.id })
        .select()
        .single();

    if (err) return error(500, err.message);
    return json(data, { status: 201 });
});

router.put('/api/residents/:id', async (req, env: Env) => {
    const body = await req.json();
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('residents')
        .update(body as Record<string, unknown>)
        .eq('id', req.params.id)
        .select()
        .single();

    if (err) return error(500, err.message);
    return data;
});

// ============================================================
// HOMES
// ============================================================
router.get('/api/communities/:id/homes', async (req, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('homes')
        .select('*, lots(lot_number, street_name, status, monthly_rent)')
        .eq('community_id', req.params.id)
        .order('created_at', { ascending: false });

    if (err) return error(500, err.message);
    return data;
});

router.post('/api/communities/:id/homes', async (req, env: Env) => {
    const body = await req.json() as Record<string, unknown>;
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('homes')
        .insert({ ...body, community_id: req.params.id })
        .select()
        .single();

    if (err) return error(500, err.message);
    return json(data, { status: 201 });
});

// ============================================================
// LEASES
// ============================================================
router.get('/api/communities/:id/leases', async (req, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('leases')
        .select('*, residents(first_name, last_name), lots(lot_number)')
        .eq('community_id', req.params.id)
        .order('start_date', { ascending: false });

    if (err) return error(500, err.message);
    return data;
});

router.post('/api/communities/:id/leases', async (req, env: Env) => {
    const body = await req.json() as Record<string, unknown>;
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('leases')
        .insert({ ...body, community_id: req.params.id })
        .select()
        .single();

    if (err) return error(500, err.message);
    return json(data, { status: 201 });
});

// ============================================================
// CHARGES & BILLING
// ============================================================
router.get('/api/communities/:id/charges', async (req, env: Env) => {
    const supabase = getSupabase(env);
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const month = url.searchParams.get('month');

    let query = supabase
        .from('charges')
        .select('*, residents(first_name, last_name), lots(lot_number)')
        .eq('community_id', req.params.id)
        .order('due_date', { ascending: false });

    if (status) query = query.eq('status', status);
    if (month) {
        query = query.gte('due_date', `${month}-01`).lte('due_date', `${month}-31`);
    }

    const { data, error: err } = await query;
    if (err) return error(500, err.message);
    return data;
});

router.post('/api/communities/:id/charges', async (req, env: Env) => {
    const body = await req.json() as Record<string, unknown>;
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('charges')
        .insert({ ...body, community_id: req.params.id })
        .select()
        .single();

    if (err) return error(500, err.message);
    return json(data, { status: 201 });
});

// Batch generate lot rent charges for all active leases
router.post('/api/communities/:id/charges/generate', async (req, env: Env) => {
    const communityId = req.params.id;
    const body = await req.json() as { month: string };
    const supabase = getSupabase(env);

    const { data: leases, error: leaseErr } = await supabase
        .from('leases')
        .select('id, lot_id, resident_id, monthly_rent')
        .eq('community_id', communityId)
        .eq('status', 'Active');

    if (leaseErr) return error(500, leaseErr.message);

    const charges = (leases || []).map((l: Record<string, unknown>) => ({
        community_id: communityId,
        lot_id: l.lot_id,
        resident_id: l.resident_id,
        lease_id: l.id,
        charge_type: 'Lot Rent',
        description: `${body.month} Lot Rent`,
        amount: l.monthly_rent,
        due_date: `${body.month}-01`,
        status: 'Pending',
        billing_period_start: `${body.month}-01`,
        billing_period_end: `${body.month}-28`,
    }));

    if (charges.length === 0) return { message: 'No active leases found', count: 0 };

    const { data, error: err } = await supabase.from('charges').insert(charges).select();
    if (err) return error(500, err.message);
    return json({ message: `Generated ${charges.length} charges`, count: charges.length, charges: data }, { status: 201 });
});

// ============================================================
// PAYMENTS
// ============================================================
router.get('/api/communities/:id/payments', async (req, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('payments')
        .select('*, residents(first_name, last_name)')
        .eq('community_id', req.params.id)
        .order('payment_date', { ascending: false })
        .limit(100);

    if (err) return error(500, err.message);
    return data;
});

router.post('/api/communities/:id/payments', async (req, env: Env) => {
    const body = await req.json() as { charge_id?: string; resident_id: string; amount: number; payment_method: string; reference_number?: string };
    const supabase = getSupabase(env);

    const { data: payment, error: payErr } = await supabase
        .from('payments')
        .insert({
            community_id: req.params.id,
            resident_id: body.resident_id,
            charge_id: body.charge_id,
            amount: body.amount,
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: body.payment_method,
            reference_number: body.reference_number,
            status: 'Completed',
        })
        .select()
        .single();

    if (payErr) return error(500, payErr.message);

    if (body.charge_id) {
        await supabase.from('charges').update({ status: 'Paid' }).eq('id', body.charge_id);
    }

    return json(payment, { status: 201 });
});

// ============================================================
// MAINTENANCE REQUESTS
// ============================================================
router.get('/api/communities/:id/maintenance', async (req, env: Env) => {
    const supabase = getSupabase(env);
    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    let query = supabase
        .from('maintenance_requests')
        .select('*')
        .eq('community_id', req.params.id)
        .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error: err } = await query;
    if (err) return error(500, err.message);
    return data;
});

router.post('/api/communities/:id/maintenance', async (req, env: Env) => {
    const body = await req.json() as Record<string, unknown>;
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('maintenance_requests')
        .insert({ ...body, community_id: req.params.id })
        .select()
        .single();

    if (err) return error(500, err.message);
    return json(data, { status: 201 });
});

router.patch('/api/maintenance/:id', async (req, env: Env) => {
    const body = await req.json();
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('maintenance_requests')
        .update(body as Record<string, unknown>)
        .eq('id', req.params.id)
        .select()
        .single();

    if (err) return error(500, err.message);
    return data;
});

// ============================================================
// VIOLATIONS
// ============================================================
router.get('/api/communities/:id/violations', async (req, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('violations')
        .select('*')
        .eq('community_id', req.params.id)
        .order('observed_date', { ascending: false });

    if (err) return error(500, err.message);
    return data;
});

router.post('/api/communities/:id/violations', async (req, env: Env) => {
    const body = await req.json() as Record<string, unknown>;
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('violations')
        .insert({ ...body, community_id: req.params.id })
        .select()
        .single();

    if (err) return error(500, err.message);
    return json(data, { status: 201 });
});

router.patch('/api/violations/:id', async (req, env: Env) => {
    const body = await req.json();
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('violations')
        .update(body as Record<string, unknown>)
        .eq('id', req.params.id)
        .select()
        .single();

    if (err) return error(500, err.message);
    return data;
});

// ============================================================
// ANNOUNCEMENTS
// ============================================================
router.get('/api/communities/:id/announcements', async (req, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('announcements')
        .select('*')
        .eq('community_id', req.params.id)
        .order('publish_date', { ascending: false });

    if (err) return error(500, err.message);
    return data;
});

router.post('/api/communities/:id/announcements', async (req, env: Env) => {
    const body = await req.json() as Record<string, unknown>;
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('announcements')
        .insert({ ...body, community_id: req.params.id })
        .select()
        .single();

    if (err) return error(500, err.message);
    return json(data, { status: 201 });
});

// ============================================================
// UTILITY METERS & READINGS
// ============================================================
router.get('/api/communities/:id/meters', async (req, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('utility_meters')
        .select('*')
        .eq('community_id', req.params.id)
        .order('lot_number');

    if (err) return error(500, err.message);
    return data;
});

router.get('/api/communities/:id/readings', async (req, env: Env) => {
    const supabase = getSupabase(env);
    const url = new URL(req.url);
    const month = url.searchParams.get('month');

    let query = supabase
        .from('utility_readings')
        .select('*, utility_meters!inner(community_id, meter_number, utility_type, unit, rate_per_unit, base_fee, lot_number)')
        .eq('utility_meters.community_id', req.params.id)
        .order('reading_date', { ascending: false })
        .limit(100);

    if (month) {
        query = query.gte('reading_date', `${month}-01`).lte('reading_date', `${month}-31`);
    }

    const { data, error: err } = await query;
    if (err) return error(500, err.message);
    return data;
});

router.post('/api/readings', async (req, env: Env) => {
    const body = await req.json() as { utility_meter_id: string; lot_id: string; reading_value: number; read_by?: string };
    const supabase = getSupabase(env);

    const { data: meter } = await supabase
        .from('utility_meters')
        .select('*')
        .eq('id', body.utility_meter_id)
        .single();

    if (!meter) return error(404, 'Meter not found');

    const previousValue = (meter as Record<string, unknown>).last_read_value as number || 0;
    const ratePerUnit = (meter as Record<string, unknown>).rate_per_unit as number || 0;
    const baseFee = (meter as Record<string, unknown>).base_fee as number || 0;
    const consumption = body.reading_value - previousValue;
    const calculatedCharge = baseFee + consumption * ratePerUnit;

    const { data: reading, error: err } = await supabase
        .from('utility_readings')
        .insert({
            utility_meter_id: body.utility_meter_id,
            lot_id: body.lot_id,
            reading_date: new Date().toISOString().split('T')[0],
            reading_value: body.reading_value,
            previous_value: previousValue,
            consumption,
            calculated_charge: calculatedCharge,
            read_by: body.read_by,
        })
        .select()
        .single();

    if (err) return error(500, err.message);

    await supabase
        .from('utility_meters')
        .update({ last_read_value: body.reading_value, last_read_date: new Date().toISOString().split('T')[0] })
        .eq('id', body.utility_meter_id);

    return json(reading, { status: 201 });
});

// ============================================================
// REPORTS
// ============================================================
router.get('/api/communities/:id/reports/rent-roll', async (req, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('rent_roll')
        .select('*')
        .eq('community_id', req.params.id);

    if (err) return error(500, err.message);
    return data;
});

router.get('/api/communities/:id/reports/aging', async (req, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error: err } = await supabase
        .from('charges')
        .select('*, residents(first_name, last_name), lots(lot_number)')
        .eq('community_id', req.params.id)
        .in('status', ['Pending', 'Overdue'])
        .order('due_date');

    if (err) return error(500, err.message);

    const now = new Date();
    const buckets = { current: [] as unknown[], past30: [] as unknown[], past60: [] as unknown[], past90: [] as unknown[], past120: [] as unknown[] };

    (data || []).forEach((charge: Record<string, unknown>) => {
        const daysOverdue = Math.floor((now.getTime() - new Date(charge.due_date as string).getTime()) / (1000 * 60 * 60 * 24));
        if (daysOverdue <= 0) buckets.current.push(charge);
        else if (daysOverdue <= 30) buckets.past30.push(charge);
        else if (daysOverdue <= 60) buckets.past60.push(charge);
        else if (daysOverdue <= 90) buckets.past90.push(charge);
        else buckets.past120.push(charge);
    });

    return {
        buckets,
        totalOutstanding: (data || []).reduce((s: number, c: Record<string, unknown>) => s + Number(c.amount), 0),
    };
});

// ── Worker export ──
export default { ...router };
