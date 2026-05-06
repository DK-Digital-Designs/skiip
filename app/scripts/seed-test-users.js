import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://jmqjuvfjthwbsbelgccs.supabase.co';

// Prefer server-side env names for Node scripts, while still supporting the older local setup.
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is missing.');
  console.error(
    'Set SUPABASE_SERVICE_ROLE_KEY (preferred) or VITE_SUPABASE_SERVICE_ROLE_KEY before seeding test accounts.',
  );
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
      role,
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log(`=> Skipping: ${email} already exists.`);
      const {
        data: { users },
      } = await supabase.auth.admin.listUsers();
      return users.find((user) => user.email === email);
    }

    console.error(`=> Error creating ${email}:`, error.message);
    return null;
  }

  console.log(`=> Success: ${email} created (ID: ${data.user?.id})`);
  return data.user;
}

async function createStore(userId, email) {
  console.log(`Creating store for vendor ${email}...`);
  const { error } = await supabase
    .from('stores')
    .insert([
      {
        user_id: userId,
        name: 'Skiip Test Kitchen',
        slug: 'skiip-test-kitchen',
        description: 'Premium testing store for Stripe Connect integration',
        status: 'active',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('=> Error creating store:', error.message);
  } else {
    console.log("=> Success: Store 'Skiip Test Kitchen' created for vendor.");
  }
}

async function run() {
  const password = 'password2026';

  await createAccount('admin2026@example.com', password, 'admin', 'Super Admin 2026');
  const vendor = await createAccount('vendor2026@example.com', password, 'seller', 'Vendor 2026');
  await createAccount('buyer2026@example.com', password, 'buyer', 'Buyer 2026');

  if (vendor?.id) {
    // Give the user-profile trigger time to finish before inserting the store row.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await createStore(vendor.id, 'vendor2026@example.com');
  }

  console.log(
    'Seeding complete. Check your Supabase Authentication dashboard to ensure they are confirmed.',
  );
}

run();
