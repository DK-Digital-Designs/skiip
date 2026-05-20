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

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const password = process.env.SEED_TEST_USER_PASSWORD || 'password2026';

const accounts = [
  {
    role: 'admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin2026@example.com',
    fullName: 'Super Admin 2026',
  },
  {
    role: 'seller',
    email: process.env.SEED_SELLER_EMAIL || 'vendor2026@example.com',
    fullName: 'Vendor 2026',
  },
  {
    role: 'buyer',
    email: process.env.SEED_BUYER_EMAIL || 'buyer2026@example.com',
    fullName: 'Buyer 2026',
  },
];

const storeFixture = {
  name: 'Skiip Test Kitchen',
  slug: 'skiip-test-kitchen',
  description: 'Stable smoke-test vendor fixture for staging role checks',
  tags: ['Burgers', 'Food'],
  status: 'active',
};

const productFixture = {
  name: 'Smoke Test Burger',
  slug: 'smoke-test-burger',
  description: 'Stable smoke-test product fixture',
  price: 8.5,
  category: 'Burgers',
  inventory_quantity: 25,
  status: 'active',
  images: [],
};

async function failOnError(label, error) {
  if (!error) return;
  throw new Error(`${label}: ${error.message}`);
}

async function findUserByEmail(email) {
  const perPage = 100;

  for (let page = 1; page <= 100; page += 1) {
    const {
      data: { users = [] } = {},
      error,
    } = await supabase.auth.admin.listUsers({ page, perPage });

    await failOnError(`Failed to list auth users while looking for ${email}`, error);

    const user = users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (users.length < perPage) return null;
  }

  throw new Error(`Could not find ${email}; auth user pagination exceeded 100 pages.`);
}

async function ensureAccount({ email, role, fullName }) {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    console.log(`Updating ${role} account: ${email}`);
    const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
      },
    });
    await failOnError(`Failed to update auth user ${email}`, error);
    await ensureProfile(data.user || existingUser, { email, role, fullName });
    return data.user || existingUser;
  }

  console.log(`Creating ${role} account: ${email}`);
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
    },
  });

  await failOnError(`Failed to create auth user ${email}`, error);
  await ensureProfile(data.user, { email, role, fullName });
  return data.user;
}

async function ensureProfile(user, { email, role, fullName }) {
  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        id: user.id,
        email,
        role,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

  await failOnError(`Failed to upsert profile for ${email}`, error);
}

async function ensureStore(userId) {
  console.log(`Upserting store fixture: ${storeFixture.slug}`);
  const { data, error } = await supabase
    .from('stores')
    .upsert(
      {
        ...storeFixture,
        user_id: userId,
        deleted_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'slug' },
    )
    .select('id, name, slug')
    .single();

  await failOnError(`Failed to upsert store ${storeFixture.slug}`, error);
  return data;
}

async function ensureProduct(storeId) {
  const { data: existing, error: selectError } = await supabase
    .from('products')
    .select('id')
    .eq('store_id', storeId)
    .eq('slug', productFixture.slug)
    .maybeSingle();

  await failOnError(`Failed to inspect product ${productFixture.slug}`, selectError);

  const payload = {
    ...productFixture,
    store_id: storeId,
    deleted_at: null,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    console.log(`Updating product fixture: ${productFixture.slug}`);
    const { error } = await supabase.from('products').update(payload).eq('id', existing.id);
    await failOnError(`Failed to update product ${productFixture.slug}`, error);
    return;
  }

  console.log(`Creating product fixture: ${productFixture.slug}`);
  const { error } = await supabase.from('products').insert(payload);
  await failOnError(`Failed to create product ${productFixture.slug}`, error);
}

async function run() {
  const users = {};

  for (const account of accounts) {
    users[account.role] = await ensureAccount(account);
  }

  const store = await ensureStore(users.seller.id);
  await ensureProduct(store.id);

  console.log('Seeding complete. Stable smoke credentials:');
  for (const account of accounts) {
    console.log(`- ${account.role}: ${account.email}`);
  }
  console.log('Set PLAYWRIGHT_* credentials to these values for authenticated smoke checks.');
}

run().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
