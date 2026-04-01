import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jmqjuvfjthwbsbelgccs.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("❌ ERROR: VITE_SUPABASE_SERVICE_ROLE_KEY is required to create buckets.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Checking for 'product-images' bucket...");
    
    // Check if it exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
        console.error("Error listing buckets:", listError.message);
        return;
    }

    const exists = buckets.find(b => b.name === 'product-images');
    if (exists) {
        console.log("✅ Bucket 'product-images' already exists.");
        
        // Ensure it's public (admin update)
        const { error: updateError } = await supabase.storage.updateBucket('product-images', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
            fileSizeLimit: 5242880 // 5MB
        });
        if (updateError) console.error("Could not update public status:", updateError.message);
        else console.log("=> Set bucket to public with image restrictions.");
        
        return;
    }

    console.log("Creating new 'product-images' bucket remotely...");
    const { data, error } = await supabase.storage.createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
    });

    if (error) {
        console.error("❌ Failed to create bucket:", error.message);
    } else {
        console.log("✅ Bucket 'product-images' created globally!");
    }
}

run();
