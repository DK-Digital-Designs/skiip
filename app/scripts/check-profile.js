import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Fetching users and profiles...');
    
    // First, get the user
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('Auth error:', authError.message);
        return;
    }
    
    const vendor = users.find(u => u.email === 'vendor@example.com') || users.find(u => u.email === 'vendor2026@example.com');
    if (!vendor) {
        console.log('Vendor user not found in auth.users.');
        return;
    }
    
    console.log(`Found vendor user: ${vendor.email} (${vendor.id})`);
    
    // Check user_profiles
    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', vendor.id);
        
    if (profileError) {
        console.error('Profile error:', profileError.message);
    } else {
        console.log(`Profile rows for ${vendor.id}:`, profile.length);
        console.log(profile);
    }
}

run();
