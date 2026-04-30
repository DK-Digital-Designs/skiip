import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('ERROR: SUPABASE_URL is required to create or verify storage buckets.');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is required to create or verify storage buckets.');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Using legacy VITE_SUPABASE_SERVICE_ROLE_KEY. Prefer SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const bucketConfig = {
  public: true,
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  fileSizeLimit: 5 * 1024 * 1024,
};

async function run() {
  console.log("Checking for 'product-images' bucket...");

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('Error listing buckets:', listError.message);
    process.exit(1);
  }

  const exists = buckets.some((bucket) => bucket.name === 'product-images');
  const { error } = exists
    ? await supabase.storage.updateBucket('product-images', bucketConfig)
    : await supabase.storage.createBucket('product-images', bucketConfig);

  if (error) {
    console.error(`Failed to ${exists ? 'update' : 'create'} product-images bucket:`, error.message);
    process.exit(1);
  }

  console.log(`Bucket 'product-images' ${exists ? 'verified' : 'created'} with public image restrictions.`);
}

run();
