import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
};

export default function ProductImageUpload({ onUpload, currentImageUrl, storeId }) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentImageUrl);

    async function handleUpload(e) {
        try {
            setUploading(true);

            if (!e.target.files || e.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = e.target.files[0];
            const fileExt = ALLOWED_IMAGE_TYPES[file.type];

            if (!fileExt) {
                throw new Error('Product images must be PNG, JPG, or WebP.');
            }

            if (file.size > MAX_IMAGE_SIZE_BYTES) {
                throw new Error('Product images must be 5MB or smaller.');
            }

            if (!storeId) {
                throw new Error('Store context is required before uploading product images.');
            }

            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = `products/${storeId}/${fileName}`;

            // Upload the file to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            setPreview(publicUrl);
            onUpload(publicUrl);
        } catch (error) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    }

    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Product Image</label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '8px',
                    background: 'var(--stroke)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '1px solid var(--stroke)'
                }}>
                    {preview ? (
                        <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <span style={{ fontSize: '24px' }}>🖼️</span>
                    )}
                </div>
                <div>
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleUpload}
                        disabled={uploading}
                        style={{ display: 'none' }}
                        id="product-image-input"
                    />
                    <label
                        htmlFor="product-image-input"
                        className="btn btn-ghost"
                        style={{ cursor: 'pointer', marginBottom: '4px', display: 'inline-block' }}
                    >
                        {uploading ? 'Uploading...' : 'Upload Image'}
                    </label>
                    <p className="text-muted" style={{ fontSize: '12px' }}>PNG, JPG up to 5MB</p>
                </div>
            </div>
        </div>
    );
}
