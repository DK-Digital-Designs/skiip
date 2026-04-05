import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jmqjuvfjthwbsbelgccs.supabase.co';
// The Service Role key is REQUIRED to bypass email signup rate limits and forcefully confirm accounts
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("❌ ERROR: VITE_SUPABASE_SERVICE_ROLE_KEY is missing from your .env file.");
  console.error("Please add it to app/.env to programmatically seed test accounts.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAccount(email, password, role, fullName) {
  console.log(`Creating ${role} account: ${email}...`);
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: role
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log(`=> Skipping: ${email} already exists.`);
      // Fetch the existing user ID so we can still setup their store
      const { data: { users } } = await supabase.auth.admin.listUsers();
      return users.find(u => u.email === email);
    }
    console.error(`=> Error creating ${email}:`, error.message);
    return null;
  }
  
  console.log(`=> Success: ${email} created (ID: ${data.user?.id})`);
  return data.user;
}

async function createStore(userId, email) {
    console.log(`Creating store for vendor ${email}...`);
    const { data, error } = await supabase
        .from('stores')
        .insert([{
            user_id: userId,
            name: 'Skiip Test Kitchen',
            slug: 'skiip-test-kitchen',
            description: 'Premium testing store for Stripe Connect integration',
            status: 'active'
        }])
        .select()
        .single();
        
    if (error) {
        console.error(`=> Error creating store:`, error.message);
    } else {
        console.log(`=> Success: Store 'Skiip Test Kitchen' created for vendor.`);
    }
}

async function run() {
  const password = "password2026";
  
  const superAdmin = await createAccount('admin2026@example.com', password, 'admin', 'Super Admin 2026');
  const vendor = await createAccount('vendor2026@example.com', password, 'seller', 'Vendor 2026');
  const buyer = await createAccount('buyer2026@example.com', password, 'buyer', 'Buyer 2026');
  
  if (vendor?.id) {
     // A short delay to ensure trigger has completed user_profile insert first
     await new Promise(r => setTimeout(r, 1000));
     await createStore(vendor.id, 'vendor2026@example.com');
  }

  console.log("Seeding complete! Check your Supabase Authentication dashboard to ensure they are confirmed.");
}

run();
