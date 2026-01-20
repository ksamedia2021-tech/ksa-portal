import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
    console.log("Checking remote database schema...");

    // Check for 'admin_note' column in 'applicants'
    // We can't query information_schema easily via Postgrest often, 
    // so we'll try to select the column from a single row.

    try {
        const { data, error } = await supabase
            .from('applicants')
            .select('admin_note')
            .limit(1);

        if (error) {
            console.error("❌ 'admin_note' column check FAILED:", error.message);
            console.log("\nLikely cause: The migration scripts have not been run on the remote Supabase project.");
        } else {
            console.log("✅ 'admin_note' column exists.");
        }

        // Check if RLS is enabled/working by trying an anonymous update (should fail if blocked, or succeed if not)
        // Actually, checking RLS state specifically is hard without a specific test.
        // Let's just assume if the column is missing, the migrations are missing.

    } catch (e) {
        console.error("Unexpected error:", e);
    }
}

checkSchema();
