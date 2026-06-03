import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSupabaseConfigured } from '../../lib/supabase';
import { AuthService } from '../../lib/services/auth.service';
import { StoreService } from '../../lib/services/store.service';
import { ProductService } from '../../lib/services/product.service';
import ProductImageUpload from '../../components/vendor/ProductImageUpload';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, getInitials } from '../../lib/ui-format';
import { canPersistProductModifierEditor, canShowProductModifierEditor } from '../../lib/features/productModifiers';

const EMPTY_MODIFIER_GROUP = {
    name: '',
    required: false,
    minSelect: 0,
    maxSelect: 1,
    active: true,
    options: [],
};

const EMPTY_MODIFIER_OPTION = {
    name: '',
    priceDelta: 0,
    active: true,
};

function toModifierDraftGroups(product) {
    return (product?.modifierGroups || []).map((group, groupIndex) => ({
        id: group.id || `draft-group-${groupIndex + 1}`,
        name: group.name || '',
        required: Boolean(group.required),
        minSelect: group.required ? Math.max(Number(group.minSelect || 1), 1) : 0,
        maxSelect: Math.max(Number(group.maxSelect || 1), 1),
        sortOrder: Number(group.sortOrder || groupIndex + 1),
        active: group.active !== false && group.status !== 'inactive',
        options: (group.options || []).map((option, optionIndex) => ({
            id: option.id || `draft-option-${groupIndex + 1}-${optionIndex + 1}`,
            name: option.name || '',
            priceDelta: Number(option.priceDelta || 0),
            sortOrder: Number(option.sortOrder || optionIndex + 1),
            active: option.active !== false && option.status !== 'inactive',
        })),
    }));
}

export default function VendorProducts() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [modifierDraftGroups, setModifierDraftGroups] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'Mains',
        images: [],
        inventory_quantity: 0,
    });

    useEffect(() => {
        checkAuthAndFetch();
    }, []);

    async function checkAuthAndFetch() {
        try {
            if (!isSupabaseConfigured()) {
                setStore({ id: '1', name: 'Burger Bliss (Demo)' });
                setProducts([
                    { id: '1', name: 'Classic Burger', price: 8.5, category: 'Mains', description: 'Beef patty, lettuce, tomato, cheese', inventory_quantity: 18 },
                ]);
                setLoading(false);
                return;
            }

            const session = await AuthService.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const storeData = await StoreService.getStoreByUserId(session.user.id);
            if (!storeData) {
                navigate('/');
                return;
            }
            setStore(storeData);

            const { data } = await ProductService.getProducts({ storeId: storeData.id }, 1, 100);
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
            images: product.images || [],
            inventory_quantity: product.inventory_quantity || 0,
        });
        setModifierDraftGroups(toModifierDraftGroups(product));
        setIsEditing(true);
    }

    function handleAddNew() {
        setCurrentProduct(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            category: 'Mains',
            images: [],
            inventory_quantity: 0,
        });
        setModifierDraftGroups([]);
        setIsEditing(true);
    }

    function addModifierGroup() {
        setModifierDraftGroups((groups) => [
            ...groups,
            {
                ...EMPTY_MODIFIER_GROUP,
                id: `draft-group-${crypto.randomUUID()}`,
                sortOrder: groups.length + 1,
            },
        ]);
    }

    function updateModifierGroup(groupId, updates) {
        setModifierDraftGroups((groups) => groups.map((group) => (
            group.id === groupId ? { ...group, ...updates } : group
        )));
    }

    function removeModifierGroup(groupId) {
        setModifierDraftGroups((groups) => groups.filter((group) => group.id !== groupId));
    }

    function addModifierOption(groupId) {
        setModifierDraftGroups((groups) => groups.map((group) => (
            group.id === groupId
                ? {
                    ...group,
                    options: [
                        ...group.options,
                        {
                            ...EMPTY_MODIFIER_OPTION,
                            id: `draft-option-${crypto.randomUUID()}`,
                            sortOrder: group.options.length + 1,
                        },
                    ],
                }
                : group
        )));
    }

    function updateModifierOption(groupId, optionId, updates) {
        setModifierDraftGroups((groups) => groups.map((group) => (
            group.id === groupId
                ? {
                    ...group,
                    options: group.options.map((option) => (
                        option.id === optionId ? { ...option, ...updates } : option
                    )),
                }
                : group
        )));
    }

    function removeModifierOption(groupId, optionId) {
        setModifierDraftGroups((groups) => groups.map((group) => (
            group.id === groupId
                ? { ...group, options: group.options.filter((option) => option.id !== optionId) }
                : group
        )));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        try {
            if (!isSupabaseConfigured()) {
                setIsEditing(false);
                return;
            }

            const slug = formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.random().toString(36).substring(2, 7);
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                store_id: store.id,
                status: 'active',
                slug: currentProduct ? currentProduct.slug : slug,
            };

            if (currentProduct) {
                const savedProduct = await ProductService.updateProduct(currentProduct.id, payload);
                if (canPersistProductModifierEditor()) {
                    await ProductService.saveProductModifiers(savedProduct.id, modifierDraftGroups);
                }
            } else {
                const savedProduct = await ProductService.createProduct(payload);
                setCurrentProduct(savedProduct);
                if (canPersistProductModifierEditor()) {
                    await ProductService.saveProductModifiers(savedProduct.id, modifierDraftGroups);
                }
            }

            const { data } = await ProductService.getProducts({ storeId: store.id }, 1, 100);
            setProducts(data || []);
            setIsEditing(false);
            addToast('Product saved.', 'success');
        } catch (error) {
            console.error('Error saving product:', error);
            addToast(error.message || 'Could not save product.', 'error');
        }
    }

    async function handleDeleteConfirmed() {
        if (!deleteTarget) return;

        try {
            if (isSupabaseConfigured()) {
                await ProductService.deleteProduct(deleteTarget.id);
            }
            setProducts((current) => current.filter((product) => product.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (error) {
            console.error('Error deleting:', error);
        }
    }

    if (loading) {
        return (
            <main className="app-page">
                <div className="surface empty-state">
                    <div className="spinner" />
                    <p>Loading products</p>
                </div>
            </main>
        );
    }

    return (
        <main className="app-page">
            <div className="container" style={{ display: 'grid', gap: '22px' }}>
                <section style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                        <p className="page-kicker">Vendor products</p>
                        <h1 className="page-title" style={{ fontSize: 'clamp(30px, 4vw, 42px)' }}>Inventory</h1>
                        <p className="page-subtitle">{store?.name}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => navigate('/vendor/dashboard')} className="btn btn-ghost">Back to Dashboard</button>
                        <button type="button" onClick={handleAddNew} className="btn btn-primary">
                            <Icon name="plus" size={17} />
                            Add Product
                        </button>
                    </div>
                </section>

                {isEditing && (
                    <section className="card">
                        <h2 style={{ color: 'var(--ink)', marginBottom: '18px' }}>{currentProduct ? 'Edit product' : 'New product'}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
                                <div>
                                    <label htmlFor="product-name">Name</label>
                                    <input id="product-name" required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} />
                                </div>
                                <div>
                                    <label htmlFor="product-price">Price</label>
                                    <input id="product-price" type="number" step="0.01" required value={formData.price} onChange={(event) => setFormData({ ...formData, price: event.target.value })} />
                                </div>
                                <div>
                                    <label htmlFor="product-stock">Stock quantity</label>
                                    <input id="product-stock" type="number" required value={formData.inventory_quantity} onChange={(event) => setFormData({ ...formData, inventory_quantity: parseInt(event.target.value, 10) || 0 })} />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="product-category">Category</label>
                                <select id="product-category" value={formData.category} onChange={(event) => setFormData({ ...formData, category: event.target.value })}>
                                    <option>Mains</option>
                                    <option>Pizza</option>
                                    <option>Sides</option>
                                    <option>Snacks</option>
                                    <option>Drinks</option>
                                    <option>Desserts</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="product-description">Description</label>
                                <textarea id="product-description" value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} style={{ minHeight: '88px' }} />
                            </div>

                            <ProductImageUpload
                                onUpload={(url) => setFormData({ ...formData, images: [url] })}
                                currentImageUrl={formData.images?.[0]}
                                storeId={store?.id}
                            />
                            {canShowProductModifierEditor() && (
                                <section style={{ display: 'grid', gap: '14px', padding: '16px', border: '1px solid var(--stroke)', borderRadius: '18px', background: 'var(--surface-muted)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <div>
                                            <h3 style={{ color: 'var(--ink)', fontSize: '18px' }}>Modifier editor</h3>
                                            <p className="text-muted" style={{ fontSize: '13px' }}>
                                                {canPersistProductModifierEditor() ? 'Saved separately from product details.' : 'UI preview only. Backend modifier save is not enabled yet.'}
                                            </p>
                                        </div>
                                        <button type="button" className="btn btn-ghost" onClick={addModifierGroup}>
                                            <Icon name="plus" size={16} />
                                            Add group
                                        </button>
                                    </div>

                                    {modifierDraftGroups.length === 0 ? (
                                        <div className="empty-state" style={{ minHeight: '110px', padding: '20px' }}>
                                            <p>Add a group to draft required choices or optional extras.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gap: '12px' }}>
                                            {modifierDraftGroups.map((group) => (
                                                <div key={group.id} className="card" style={{ display: 'grid', gap: '12px', boxShadow: 'none' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', alignItems: 'end' }}>
                                                        <div>
                                                            <label htmlFor={`${group.id}-name`}>Group name</label>
                                                            <input
                                                                id={`${group.id}-name`}
                                                                value={group.name}
                                                                onChange={(event) => updateModifierGroup(group.id, { name: event.target.value })}
                                                                placeholder="Choose a drink"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label htmlFor={`${group.id}-min`}>Min</label>
                                                            <input
                                                                id={`${group.id}-min`}
                                                                type="number"
                                                                min="0"
                                                                value={group.minSelect}
                                                                onChange={(event) => updateModifierGroup(group.id, { minSelect: Number(event.target.value || 0) })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label htmlFor={`${group.id}-max`}>Max</label>
                                                            <input
                                                                id={`${group.id}-max`}
                                                                type="number"
                                                                min="1"
                                                                value={group.maxSelect}
                                                                onChange={(event) => updateModifierGroup(group.id, { maxSelect: Number(event.target.value || 1) })}
                                                            />
                                                        </div>
                                                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: 0 }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={group.required}
                                                                onChange={(event) => updateModifierGroup(group.id, { required: event.target.checked, minSelect: event.target.checked ? Math.max(group.minSelect, 1) : 0 })}
                                                                style={{ width: '18px' }}
                                                            />
                                                            Required
                                                        </label>
                                                        <button type="button" className="btn btn-ghost" onClick={() => removeModifierGroup(group.id)} style={{ color: 'var(--red)' }}>
                                                            Remove
                                                        </button>
                                                    </div>

                                                    <div style={{ display: 'grid', gap: '8px' }}>
                                                        {group.options.map((option) => (
                                                            <div key={option.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', alignItems: 'end' }}>
                                                                <div>
                                                                    <label htmlFor={`${option.id}-name`}>Option name</label>
                                                                    <input
                                                                        id={`${option.id}-name`}
                                                                        value={option.name}
                                                                        onChange={(event) => updateModifierOption(group.id, option.id, { name: event.target.value })}
                                                                        placeholder="Coke"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor={`${option.id}-price`}>Delta</label>
                                                                    <input
                                                                        id={`${option.id}-price`}
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={option.priceDelta}
                                                                        onChange={(event) => updateModifierOption(group.id, option.id, { priceDelta: Number(event.target.value || 0) })}
                                                                    />
                                                                </div>
                                                                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: 0 }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={option.active}
                                                                        onChange={(event) => updateModifierOption(group.id, option.id, { active: event.target.checked })}
                                                                        style={{ width: '18px' }}
                                                                    />
                                                                    Active
                                                                </label>
                                                                <button type="button" className="btn btn-ghost" onClick={() => removeModifierOption(group.id, option.id)} style={{ color: 'var(--red)' }}>
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button type="button" className="btn btn-ghost" onClick={() => addModifierOption(group.id)} style={{ width: 'fit-content' }}>
                                                            <Icon name="plus" size={16} />
                                                            Add option
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button type="button" onClick={() => setIsEditing(false)} className="btn btn-ghost">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Product</button>
                            </div>
                        </form>
                    </section>
                )}

                <section style={{ display: 'grid', gap: '14px' }}>
                    {products.map((product) => (
                        <article key={product.id} className="menu-row" style={{ gridTemplateColumns: '72px minmax(0, 1fr) auto' }}>
                            <div className="menu-row__image" style={{ width: 72, height: 72 }}>
                                {product.images?.[0] ? (
                                    <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    getInitials(product.name)
                                )}
                            </div>
                            <div>
                                <h3 style={{ color: 'var(--ink)', fontSize: '19px' }}>{product.name}</h3>
                                <p className="text-muted">{product.category} - {formatCurrency(product.price)}</p>
                                <span className={product.inventory_quantity > 0 ? 'chip chip--green' : 'chip'} style={{ marginTop: '8px' }}>
                                    {product.inventory_quantity > 0 ? `${product.inventory_quantity} in stock` : 'Sold out'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => handleEdit(product)} className="btn btn-ghost">Edit</button>
                                <button type="button" onClick={() => setDeleteTarget(product)} className="btn btn-ghost" style={{ color: 'var(--red)' }}>Delete</button>
                            </div>
                        </article>
                    ))}
                    {products.length === 0 && !isEditing && (
                        <div className="surface empty-state">
                            <h3>No products found</h3>
                            <p>Add your first product to start building the menu.</p>
                        </div>
                    )}
                </section>
            </div>

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                title="Delete product?"
                description={deleteTarget ? `${deleteTarget.name} will be removed from this menu.` : ''}
                confirmLabel="Delete"
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setDeleteTarget(null)}
            />
        </main>
    );
}
