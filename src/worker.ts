/**
 * @file worker.ts
 * @description Rental Smart MHC BFF — Cloudflare Worker entrypoint.
 * Routes all API requests and handles CORS, auth, and Supabase integration.
 */

import { Router, IRequest } from 'itty-router';
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

// ── CORS headers ──
function corsHeaders(env: Env): Record<string, string> {
    return {
        'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Community-ID',
        'Access-Control-Max-Age': '86400',
    };
}

function jsonResponse(data: unknown, env: Env, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(env),
        },
    });
}

function errorResponse(message: string, env: Env, status = 400): Response {
    return jsonResponse({ error: message }, env, status);
}

// ── Router ──
const router = Router();

// ─── CORS Preflight ───
router.options('*', (req: IRequest, env: Env) => {
    return new Response(null, { status: 204, headers: corsHeaders(env) });
});

// ─── Health Check ───
router.get('/api/health', (req: IRequest, env: Env) => {
    return jsonResponse({
        status: 'ok',
        service: 'Rental Smart MHC BFF',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    }, env);
});

// ============================================================
// COMMUNITIES
// ============================================================
router.get('/api/communities', async (req: IRequest, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('status', 'Active')
        .order('name');

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env);
});

router.get('/api/communities/:id', async (req: IRequest, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', req.params.id)
        .single();

    if (error) return errorResponse(error.message, env, 404);
    return jsonResponse(data, env);
});

router.put('/api/communities/:id', async (req: IRequest, env: Env) => {
    const body = await req.json();
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('communities')
        .update(body)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env);
});

// ============================================================
// DASHBOARD
// ============================================================
router.get('/api/communities/:id/dashboard', async (req: IRequest, env: Env) => {
    const communityId = req.params.id;
    const supabase = getSupabase(env);

    // Use the dashboard_kpi view
    const { data: kpi, error: kpiErr } = await supabase
        .from('dashboard_kpi')
        .select('*')
        .eq('community_id', communityId)
        .single();

    // Recent maintenance
    const { data: maintenance } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('community_id', communityId)
        .neq('status', 'Completed')
        .order('created_at', { ascending: false })
        .limit(5);

    // Recent announcements
    const { data: announcements } = await supabase
        .from('announcements')
        .select('*')
        .eq('community_id', communityId)
        .eq('status', 'Published')
        .order('publish_date', { ascending: false })
        .limit(5);

    // Collection rate (current month)
    const { data: chargeData } = await supabase
        .from('charges')
        .select('status, amount')
        .eq('community_id', communityId)
        .gte('due_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    let totalCharged = 0, totalCollected = 0;
    (chargeData || []).forEach((c: any) => {
        totalCharged += Number(c.amount);
        if (c.status === 'Paid') totalCollected += Number(c.amount);
    });
    const collectionRate = totalCharged > 0 ? Math.round((totalCollected / totalCharged) * 100) : 0;

    return jsonResponse({
        kpi: kpi ? {
            ...kpi,
            collection_rate: collectionRate,
            monthly_revenue: Number(kpi.monthly_revenue),
        } : null,
        recentMaintenance: maintenance || [],
        recentAnnouncements: announcements || [],
    }, env);
});

// ============================================================
// LOTS
// ============================================================
router.get('/api/communities/:id/lots', async (req: IRequest, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('lots')
        .select('*, homes(id, manufacturer, year_manufactured, home_type, bedrooms, bathrooms), residents(id, first_name, last_name, phone)')
        .eq('community_id', req.params.id)
        .order('lot_number');

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env);
});

router.post('/api/communities/:id/lots', async (req: IRequest, env: Env) => {
    const body = await req.json();
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('lots')
        .insert({ ...(body as Record<string, unknown>), community_id: req.params.id })
        .select()
        .single();

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env, 201);
});

router.put('/api/lots/:id', async (req: IRequest, env: Env) => {
    const body = await req.json();
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('lots')
        .update(body)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env);
});

// ============================================================
// RESIDENTS
// ============================================================
router.get('/api/communities/:id/residents', async (req: IRequest, env: Env) => {
    const supabase = getSupabase(env);
    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    let query = supabase
        .from('residents')
        .select('*, lots(lot_number, street_name), leases(id, monthly_rent, start_date, end_date, status)')
        .eq('community_id', req.params.id)
        .order('last_name');

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env);
});

router.get('/api/residents/:id', async (req: IRequest, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('residents')
        .select('*, lots(lot_number, street_name, monthly_rent), homes(*), leases(*), charges(*, payments(*))')
        .eq('id', req.params.id)
        .single();

    if (error) return errorResponse(error.message, env, 404);
    return jsonResponse(data, env);
});

router.post('/api/communities/:id/residents', async (req: IRequest, env: Env) => {
    const body = await req.json();
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('residents')
        .insert({ ...(body as Record<string, unknown>), community_id: req.params.id })
        .select()
        .single();

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env, 201);
});

router.put('/api/residents/:id', async (req: IRequest, env: Env) => {
    const body = await req.json();
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('residents')
        .update(body)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env);
});

// ============================================================
// HOMES
// ============================================================
router.get('/api/communities/:id/homes', async (req: IRequest, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('homes')
        .select('*, lots(lot_number, street_name, status)')
        .eq('community_id', req.params.id)
        .order('created_at', { ascending: false });

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env);
});

router.post('/api/communities/:id/homes', async (req: IRequest, env: Env) => {
    const body = await req.json();
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('homes')
        .insert({ ...(body as Record<string, unknown>), community_id: req.params.id })
        .select()
        .single();

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env, 201);
});

// ============================================================
// LEASES
// ============================================================
router.get('/api/communities/:id/leases', async (req: IRequest, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('leases')
        .select('*, residents(first_name, last_name), lots(lot_number)')
        .eq('community_id', req.params.id)
        .order('start_date', { ascending: false });

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env);
});

router.post('/api/communities/:id/leases', async (req: IRequest, env: Env) => {
    const body = await req.json();
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('leases')
        .insert({ ...(body as Record<string, unknown>), community_id: req.params.id })
        .select()
        .single();

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env, 201);
});

// ============================================================
// CHARGES & BILLING
// ============================================================
router.get('/api/communities/:id/charges', async (req: IRequest, env: Env) => {
    const supabase = getSupabase(env);
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const month = url.searchParams.get('month'); // YYYY-MM

    let query = supabase
        .from('charges')
        .select('*, residents(first_name, last_name), lots(lot_number)')
        .eq('community_id', req.params.id)
        .order('due_date', { ascending: false });

    if (status) query = query.eq('status', status);
    if (month) {
        query = query.gte('due_date', `${month}-01`).lte('due_date', `${month}-31`);
    }

    const { data, error } = await query;
    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env);
});

router.post('/api/communities/:id/charges', async (req: IRequest, env: Env) => {
    const body = await req.json();
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('charges')
        .insert({ ...(body as Record<string, unknown>), community_id: req.params.id })
        .select()
        .single();

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env, 201);
});

// Batch generate lot rent charges for all active leases
router.post('/api/communities/:id/charges/generate', async (req: IRequest, env: Env) => {
    const communityId = req.params.id;
    const body = await req.json() as { month: string }; // YYYY-MM
    const supabase = getSupabase(env);

    // Get all active leases
    const { data: leases, error: leaseErr } = await supabase
        .from('leases')
        .select('id, lot_id, resident_id, monthly_rent')
        .eq('community_id', communityId)
        .eq('status', 'Active');

    if (leaseErr) return errorResponse(leaseErr.message, env, 500);

    const charges = (leases || []).map(l => ({
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

    if (charges.length === 0) return jsonResponse({ message: 'No active leases found', count: 0 }, env);

    const { data, error } = await supabase
        .from('charges')
        .insert(charges)
        .select();

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse({ message: `Generated ${charges.length} charges`, count: charges.length, charges: data }, env, 201);
});

// ============================================================
// PAYMENTS
// ============================================================
router.get('/api/communities/:id/payments', async (req: IRequest, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('payments')
        .select('*, residents(first_name, last_name)')
        .eq('community_id', req.params.id)
        .order('payment_date', { ascending: false })
        .limit(100);

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env);
});

router.post('/api/communities/:id/payments', async (req: IRequest, env: Env) => {
    const body = await req.json() as { charge_id?: string; resident_id: string; amount: number; payment_method: string; reference_number?: string };
    const supabase = getSupabase(env);

    // Record payment
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

    if (payErr) return errorResponse(payErr.message, env, 500);

    // Update charge status if linked
    if (body.charge_id) {
        await supabase
            .from('charges')
            .update({ status: 'Paid' })
            .eq('id', body.charge_id);
    }

    return jsonResponse(payment, env, 201);
});

// ============================================================
// MAINTENANCE REQUESTS
// ============================================================
router.get('/api/communities/:id/maintenance', async (req: IRequest, env: Env) => {
    const supabase = getSupabase(env);
    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    let query = supabase
        .from('maintenance_requests')
        .select('*')
        .eq('community_id', req.params.id)
        .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env);
});

router.post('/api/communities/:id/maintenance', async (req: IRequest, env: Env) => {
    const body = await req.json();
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('maintenance_requests')
        .insert({ ...(body as Record<string, unknown>), community_id: req.params.id })
        .select()
        .single();

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env, 201);
});

router.patch('/api/maintenance/:id', async (req: IRequest, env: Env) => {
    const body = await req.json();
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('maintenance_requests')
        .update(body)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env);
});

// ============================================================
// VIOLATIONS
// ============================================================
router.get('/api/communities/:id/violations', async (req: IRequest, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('violations')
        .select('*')
        .eq('community_id', req.params.id)
        .order('observed_date', { ascending: false });

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env);
});

router.post('/api/communities/:id/violations', async (req: IRequest, env: Env) => {
    const body = await req.json();
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('violations')
        .insert({ ...(body as Record<string, unknown>), community_id: req.params.id })
        .select()
        .single();

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env, 201);
});

router.patch('/api/violations/:id', async (req: IRequest, env: Env) => {
    const body = await req.json();
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('violations')
        .update(body)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env);
});

// ============================================================
// ANNOUNCEMENTS
// ============================================================
router.get('/api/communities/:id/announcements', async (req: IRequest, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('community_id', req.params.id)
        .order('publish_date', { ascending: false });

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env);
});

router.post('/api/communities/:id/announcements', async (req: IRequest, env: Env) => {
    const body = await req.json();
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('announcements')
        .insert({ ...(body as Record<string, unknown>), community_id: req.params.id })
        .select()
        .single();

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env, 201);
});

// ============================================================
// UTILITY METERS & READINGS
// ============================================================
router.get('/api/communities/:id/meters', async (req: IRequest, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('utility_meters')
        .select('*')
        .eq('community_id', req.params.id)
        .order('lot_number');

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env);
});

router.get('/api/communities/:id/readings', async (req: IRequest, env: Env) => {
    const supabase = getSupabase(env);
    const url = new URL(req.url);
    const month = url.searchParams.get('month');

    let query = supabase
        .from('utility_readings')
        .select('*, utility_meters(meter_number, utility_type, unit, rate_per_unit, base_fee, lot_number)')
        .order('reading_date', { ascending: false })
        .limit(100);

    if (month) {
        query = query.gte('reading_date', `${month}-01`).lte('reading_date', `${month}-31`);
    }

    const { data, error } = await query;
    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env);
});

router.post('/api/readings', async (req: IRequest, env: Env) => {
    const body = await req.json() as {
        utility_meter_id: string;
        lot_id: string;
        reading_value: number;
        read_by?: string;
    };
    const supabase = getSupabase(env);

    // Get meter to calculate consumption
    const { data: meter } = await supabase
        .from('utility_meters')
        .select('*')
        .eq('id', body.utility_meter_id)
        .single();

    if (!meter) return errorResponse('Meter not found', env, 404);

    const previousValue = meter.last_read_value || 0;
    const consumption = body.reading_value - previousValue;
    const calculatedCharge = (meter.base_fee || 0) + consumption * (meter.rate_per_unit || 0);

    // Insert reading
    const { data: reading, error } = await supabase
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

    if (error) return errorResponse(error.message, env, 500);

    // Update meter last read
    await supabase
        .from('utility_meters')
        .update({ last_read_value: body.reading_value, last_read_date: new Date().toISOString().split('T')[0] })
        .eq('id', body.utility_meter_id);

    return jsonResponse(reading, env, 201);
});

// ============================================================
// REPORTS (pre-computed queries)
// ============================================================
router.get('/api/communities/:id/reports/rent-roll', async (req: IRequest, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('rent_roll')
        .select('*')
        .eq('community_id', req.params.id);

    if (error) return errorResponse(error.message, env, 500);
    return jsonResponse(data, env);
});

router.get('/api/communities/:id/reports/aging', async (req: IRequest, env: Env) => {
    const supabase = getSupabase(env);
    const { data, error } = await supabase
        .from('charges')
        .select('*, residents(first_name, last_name), lots(lot_number)')
        .eq('community_id', req.params.id)
        .in('status', ['Pending', 'Overdue'])
        .order('due_date');

    if (error) return errorResponse(error.message, env, 500);

    // Group by aging bucket
    const now = new Date();
    const buckets = { current: [] as any[], past30: [] as any[], past60: [] as any[], past90: [] as any[], past120: [] as any[] };

    (data || []).forEach((charge: any) => {
        const daysOverdue = Math.floor((now.getTime() - new Date(charge.due_date).getTime()) / (1000 * 60 * 60 * 24));
        if (daysOverdue <= 0) buckets.current.push(charge);
        else if (daysOverdue <= 30) buckets.past30.push(charge);
        else if (daysOverdue <= 60) buckets.past60.push(charge);
        else if (daysOverdue <= 90) buckets.past90.push(charge);
        else buckets.past120.push(charge);
    });

    return jsonResponse({ buckets, totalOutstanding: (data || []).reduce((s: number, c: any) => s + Number(c.amount), 0) }, env);
});

// ── 404 catch-all ──
router.all('*', (req: IRequest, env: Env) => {
    return errorResponse('Not found', env, 404);
});

// ── Worker export ──
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        return router.handle(request, env);
    },
};
