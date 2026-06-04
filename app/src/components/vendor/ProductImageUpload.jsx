import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import Icon from '../ui/Icon';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
};

export default function ProductImageUpload({
    onUpload,
    currentImageUrl,
    storeId,
    label = 'Product image',
    helperText = 'PNG, JPG, or WebP up to 5MB.',
    successMessage = 'Product image uploaded.',
}) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentImageUrl);
    const { addToast } = useToast();

    async function handleUpload(event) {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
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
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            setPreview(publicUrl);
            onUpload(publicUrl);
            addToast(successMessage, 'success');
        } catch (error) {
            addToast(error.message, 'error');
        } finally {
            setUploading(false);
        }
    }

    return (
        <div style={{ marginBottom: '16px' }}>
            <label htmlFor="product-image-input">{label}</label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{
                    width: '104px',
                    height: '104px',
                    borderRadius: '22px',
                    background: 'var(--surface-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '1px solid var(--stroke)',
                    color: 'var(--ink)',
                }}>
                    {preview ? (
                        <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <Icon name="bag" size={28} />
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
                        style={{ cursor: 'pointer', marginBottom: '6px' }}
                    >
                        {uploading ? 'Uploading...' : 'Upload image'}
                    </label>
                    <p className="text-muted" style={{ fontSize: '12px' }}>{helperText}</p>
                </div>
            </div>
        </div>
    );
}
