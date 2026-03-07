/**
 * @file run-schema.mjs
 * @description Execute the SQL schema against Supabase using the direct PostgreSQL connection.
 * Usage: node supabase/run-schema.mjs
 */

const SUPABASE_URL = 'https://flrjhhfsffjdtkaiplld.supabase.co';
const SUPABASE_SERVICE_KEY_PLACEHOLDER = ''; // We'll use the SQL editor API or pg module

// Since we don't have psql, use Supabase's REST SQL endpoint via management API
// Alternative: use the @supabase/supabase-js to read schema status

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');

// Split into individual statements (handling $$ blocks)
function splitStatements(sql) {
    const statements = [];
    let current = '';
    let inDollarQuote = false;

    for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        if (char === '$' && sql[i + 1] === '$') {
            inDollarQuote = !inDollarQuote;
            current += '$$';
            i++;
            continue;
        }
        if (char === ';' && !inDollarQuote) {
            const stmt = current.trim();
            if (stmt && !stmt.startsWith('--') && stmt.length > 5) {
                statements.push(stmt);
            }
            current = '';
            continue;
        }
        current += char;
    }
    // handle last statement
    const last = current.trim();
    if (last && !last.startsWith('--') && last.length > 5) {
        statements.push(last);
    }
    return statements;
}

async function runSQL(sql) {
    // Use Supabase's pg REST wrapper - execute via the REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`SQL execution failed: ${response.status} ${text}`);
    }
    return response.json();
}

// Main
async function main() {
    console.log('📦 Rental Smart MHC — Schema Deployment');
    console.log('========================================');
    console.log(`Target: ${SUPABASE_URL}`);
    console.log('');

    // We need to use the Supabase SQL Editor API
    // For programmatic SQL execution, we'll use pg module
    console.log('⚠️  This script requires the Supabase SQL Editor.');
    console.log('');
    console.log('To deploy the schema:');
    console.log(`1. Open: https://supabase.com/dashboard/project/flrjhhfsffjdtkaiplld/sql/new`);
    console.log('2. Paste the contents of supabase/schema.sql');
    console.log('3. Click "Run"');
    console.log('');
    console.log('Or install pg module and use the direct connection:');
    console.log('  npm install pg');
    console.log('  Then re-run this script.');
    console.log('');

    // Try pg if available
    try {
        const pg = await import('pg');
        const { Client } = pg.default || pg;

        const client = new Client({
            connectionString: 'postgresql://postgres:He110XTechLtd.@db.flrjhhfsffjdtkaiplld.supabase.co:5432/postgres',
            ssl: { rejectUnauthorized: false },
        });

        await client.connect();
        console.log('✅ Connected to Supabase PostgreSQL');

        // Run as single transaction
        await client.query('BEGIN');
        
        // Remove the RAISE NOTICE at the end and run the whole schema
        const cleanSQL = schemaSQL.replace(/RAISE NOTICE.*?;/g, '');
        await client.query(cleanSQL);
        
        await client.query('COMMIT');
        console.log('✅ Schema deployed successfully!');
        
        // Verify tables
        const result = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        console.log('\\n📋 Tables created:');
        result.rows.forEach(r => console.log(`   • ${r.table_name}`));
        
        await client.end();
    } catch (err) {
        if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message?.includes('Cannot find')) {
            console.log('pg module not found. Installing...');
            const { execSync } = await import('child_process');
            execSync('npm install pg', { stdio: 'inherit', cwd: join(__dirname, '..') });
            console.log('\\n✅ pg installed. Please re-run this script.');
        } else {
            console.error('❌ Error:', err.message);
            process.exit(1);
        }
    }
}

main();
