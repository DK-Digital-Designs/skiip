import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSupabaseConfigured } from '../../lib/supabase';
import { AuthService } from '../../lib/services/auth.service';
import { StoreService } from '../../lib/services/store.service';
import { ProductService } from '../../lib/services/product.service';

export default function VendorProducts() {
    const navigate = useNavigate();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'Burgers', // Default
        image_url: ''
    });

    useEffect(() => {
        checkAuthAndFetch();
    }, []);

    async function checkAuthAndFetch() {
        try {
            if (!isSupabaseConfigured()) {
                // Demo mode
                setStore({ id: '1', name: 'Demo Store' });
                setProducts([
                    { id: '1', name: 'Demo Burger', price: 90, category: 'Burgers', description: 'tasty' }
                ]);
                setLoading(false);
                return;
            }

            const session = await AuthService.getSession();
            if (!session) {
                navigate('/vendor/login');
                return;
            }

            const storeData = await StoreService.getMyStore();
            if (!storeData) {
                navigate('/');
                return;
            }
            setStore(storeData);

            const { data } = await ProductService.getProducts({ storeId: storeData.id, limit: 100 });
            setProducts(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    function handleEdit(product) {
        setCurrentProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price,
            category: product.category,
            image_url: product.image_url || ''
        });
        setIsEditing(true);
    }

    function handleAddNew() {
        setCurrentProduct(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            category: 'Burgers',
            image_url: ''
        });
        setIsEditing(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            if (!isSupabaseConfigured()) {
                alert('Demo mode: Changes not saved.');
                setIsEditing(false);
                return;
            }

            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                store_id: store.id,
                status: 'active'
            };

            if (currentProduct) {
                await ProductService.updateProduct(currentProduct.id, payload);
            } else {
                await ProductService.createProduct(payload);
            }

            // Refresh
            const { data } = await ProductService.getProducts({ storeId: store.id, limit: 100 });
            setProducts(data || []);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product');
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            if (!isSupabaseConfigured()) return;
            await ProductService.deleteProduct(id);
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            console.error('Error deleting:', error);
        }
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
            <header style={{ padding: '20px 0', borderBottom: '1px solid var(--stroke)', marginBottom: '40px' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Inventory</h1>
                        <p className="text-muted">{store?.name}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => navigate('/vendor/dashboard')} className="btn btn-ghost">Back to Dashboard</button>
                        <button onClick={handleAddNew} className="btn btn-primary">+ Add Product</button>
                    </div>
                </div>
            </header>

            <div className="container">
                {isEditing && (
                    <div className="card" style={{ marginBottom: '40px', background: 'var(--card-hover)' }}>
                        <h2 style={{ marginBottom: '20px' }}>{currentProduct ? 'Edit Product' : 'New Product'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                                <div>
                                    <label>Name</label>
                                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '8px' }} />
                                </div>
                                <div>
                                    <label>Price (R)</label>
                                    <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} style={{ width: '100%', padding: '8px' }} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label>Category</label>
                                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: '8px' }}>
                                    <option>Burgers</option>
                                    <option>Pizza</option>
                                    <option>Sides</option>
                                    <option>Drinks</option>
                                    <option>Desserts</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label>Description</label>
                                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '8px', minHeight: '80px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setIsEditing(false)} className="btn btn-ghost">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Product</button>
                            </div>
                        </form>
                    </div>
                )}

                <div style={{ display: 'grid', gap: '16px' }}>
                    {products.map(product => (
                        <div key={product.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ marginBottom: '4px' }}>{product.name}</h3>
                                <p className="text-muted">{product.category} • R{product.price}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleEdit(product)} className="btn btn-ghost">Edit</button>
                                <button onClick={() => handleDelete(product.id)} className="btn btn-ghost" style={{ color: '#ef4444' }}>Delete</button>
                            </div>
                        </div>
                    ))}
                    {products.length === 0 && !isEditing && (
                        <p className="text-muted" style={{ textAlign: 'center', padding: '40px' }}>No products found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
