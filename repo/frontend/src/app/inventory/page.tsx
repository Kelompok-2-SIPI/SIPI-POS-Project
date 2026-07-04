'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AiChatWidget from '@/components/AiChatWidget';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stockQty: number;
  minStockQty: number;
  latestPrice: number;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  hpp: number;
  isAvailable: boolean;
}

interface RestockItem {
  id: string;
  name: string;
  unit: string;
  stockQty: number;
  minStockQty: number;
  avgConsumption7d: number;
  sisaHari: number;
}

interface RecipeLine {
  ingredientId: string;
  ingredientName?: string;
  unit?: string;
  qtyUsed: number;
}

interface PriceHistoryEntry {
  id: string;
  price: number;
  recordedAt: string;
  recordedBy: string;
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'restock' | 'menus'>('ingredients');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [recommendations, setRecommendations] = useState<RestockItem[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Configurable margin parameters
  const [criticalThreshold, setCriticalThreshold] = useState(80);
  const [targetHpp, setTargetHpp] = useState(50);

  // Modals & form state
  const [activeIngredient, setActiveIngredient] = useState<Ingredient | null>(null);
  const [activeMenu, setActiveMenu] = useState<MenuItem | null>(null);
  const [modalType, setModalType] = useState<'restock' | 'price' | 'edit' | 'create' | 'price-history' | 'edit-menu' | 'create-menu' | null>(null);
  
  // Forms inputs for ingredients
  const [restockQty, setRestockQty] = useState('');
  const [restockNote, setRestockNote] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [priceMode, setPriceMode] = useState<'per_unit' | 'bulk'>('per_unit');
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkQty, setBulkQty] = useState('');
  const [editMinStock, setEditMinStock] = useState('');
  const [editName, setEditName] = useState('');
  const [editUnit, setEditUnit] = useState('');

  // Create Ingredient form inputs
  const [createName, setCreateName] = useState('');
  const [createUnit, setCreateUnit] = useState('');
  const [createStock, setCreateStock] = useState('');
  const [createMinStock, setCreateMinStock] = useState('');
  const [createPrice, setCreatePrice] = useState('');

  // Price history entries state
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);

  // Menu Management / Recipe Builder state
  const [menuName, setMenuName] = useState('');
  const [menuCategory, setMenuCategory] = useState('');
  const [menuSellingPrice, setMenuSellingPrice] = useState('');
  const [recipeLines, setRecipeLines] = useState<RecipeLine[]>([]);
  const [selectedIngredientToAdd, setSelectedIngredientToAdd] = useState('');
  const [qtyToAdd, setQtyToAdd] = useState('1');

  const calculateFormHpp = () => {
    let total = 0;
    for (const line of recipeLines) {
      const ing = ingredients.find((i) => i.id === line.ingredientId);
      if (ing) {
        total += Number(line.qtyUsed) * Number(ing.latestPrice);
      }
    }
    return total;
  };

  const formHpp = calculateFormHpp();
  const formRecPrice = targetHpp > 0 ? Math.ceil((formHpp / (targetHpp / 100)) / 1000) * 1000 : 0;

  useEffect(() => {
    // Load config from localStorage
    const thresh = localStorage.getItem('sipi_critical_threshold') || '80';
    const target = localStorage.getItem('sipi_target_hpp') || '50';
    setCriticalThreshold(Number(thresh));
    setTargetHpp(Number(target));

    fetchIngredients();
    fetchMenus();
    fetchRecommendations();
  }, []);

  const fetchIngredients = async () => {
    try {
      const res = await apiFetch('/ingredients');
      if (res.ok) {
        const data = await res.json();
        setIngredients(data);
      }
    } catch (err) {
      console.error('Error fetching ingredients', err);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await apiFetch('/dashboard/restock-recommendations');
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error('Error fetching recommendations', err);
    }
  };

  const fetchMenus = async () => {
    try {
      const res = await apiFetch('/menus');
      if (res.ok) {
        const data = await res.json();
        setMenus(data);
      }
    } catch (err) {
      console.error('Error fetching menus', err);
    }
  };

  const fetchPriceHistory = async (ingredientId: string) => {
    try {
      const res = await apiFetch(`/ingredients/${ingredientId}/price-history`);
      if (res.ok) {
        const data = await res.json();
        setPriceHistory(data);
      }
    } catch (err) {
      console.error('Error fetching price history', err);
    }
  };

  const fetchMenuRecipe = async (menuId: string) => {
    try {
      const res = await apiFetch(`/menus/${menuId}/recipe`);
      if (res.ok) {
        const data = await res.json();
        setRecipeLines(data);
      }
    } catch (err) {
      console.error('Error fetching menu recipe', err);
    }
  };

  const handleOpenModal = (ing: Ingredient, type: 'restock' | 'price' | 'edit' | 'price-history') => {
    setActiveIngredient(ing);
    setModalType(type);
    setError('');
    setSuccess('');
    
    if (type === 'edit') {
      setEditName(ing.name);
      setEditUnit(ing.unit);
      setEditMinStock(ing.minStockQty.toString());
    } else if (type === 'price-history') {
      setPriceHistory([]);
      fetchPriceHistory(ing.id);
    } else {
      setRestockQty('');
      setRestockNote('');
      setBulkPrice('');
      setBulkQty('');
      setPriceMode('per_unit');
      setPriceInput(ing.latestPrice.toString());
    }
  };

  const handleOpenRestock = (item: RestockItem) => {
    setActiveIngredient(item as unknown as Ingredient);
    setModalType('restock');
    setRestockQty('');
    setRestockNote('Restok cerdas via rekomendasi');
    setError('');
    setSuccess('');
  };

  const handleOpenMenuModal = (menu: MenuItem | null, type: 'edit-menu' | 'create-menu') => {
    setModalType(type);
    setError('');
    setSuccess('');
    
    if (type === 'edit-menu' && menu) {
      setActiveMenu(menu);
      setMenuName(menu.name);
      setMenuCategory(menu.category);
      setMenuSellingPrice(menu.sellingPrice.toString());
      setRecipeLines([]);
      setSelectedIngredientToAdd(ingredients[0]?.id || '');
      setQtyToAdd('1');
      fetchMenuRecipe(menu.id);
    } else {
      setActiveMenu(null);
      setMenuName('');
      setMenuCategory('Minuman');
      setMenuSellingPrice('');
      setRecipeLines([]);
      setSelectedIngredientToAdd(ingredients[0]?.id || '');
      setQtyToAdd('1');
    }
  };

  const handleCloseModal = () => {
    setModalType(null);
    setActiveIngredient(null);
    setActiveMenu(null);
  };

  // Submit Restock (FR-06)
  const submitRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIngredient || !restockQty) return;
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch(`/ingredients/${activeIngredient.id}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qtyChange: Number(restockQty),
          note: restockNote,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess('Berhasil menambah stok.');
        fetchIngredients();
        fetchRecommendations();
        setTimeout(() => handleCloseModal(), 1500);
      } else {
        setError(data.error || 'Gagal melakukan restok.');
      }
    } catch (err) {
      setError('Gagal menghubungkan ke server.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Price Update (FR-08)
  const submitPriceUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIngredient || !priceInput) return;
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch(`/ingredients/${activeIngredient.id}/price-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: Number(priceInput),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess('Berhasil mencatat harga pasar terbaru.');
        fetchIngredients();
        setTimeout(() => handleCloseModal(), 1500);
      } else {
        setError(data.error || 'Gagal mengubah harga.');
      }
    } catch (err) {
      setError('Gagal menghubungkan ke server.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Edit Config (OQ-2)
  const submitEditConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIngredient) return;
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch(`/ingredients/${activeIngredient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          unit: editUnit,
          minStockQty: Number(editMinStock),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess('Berhasil menyimpan konfigurasi.');
        fetchIngredients();
        setTimeout(() => handleCloseModal(), 1500);
      } else {
        setError(data.error || 'Gagal menyimpan.');
      }
    } catch (err) {
      setError('Gagal menghubungkan ke server.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Create Ingredient
  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName || !createUnit || !createStock || !createMinStock || !createPrice) return;
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName,
          unit: createUnit,
          stockQty: Number(createStock),
          minStockQty: Number(createMinStock),
          latestPrice: Number(createPrice),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess('Berhasil menambahkan bahan baku baru.');
        fetchIngredients();
        setCreateName('');
        setCreateUnit('');
        setCreateStock('');
        setCreateMinStock('');
        setCreatePrice('');
        setTimeout(() => handleCloseModal(), 1500);
      } else {
        setError(data.error || 'Gagal menambahkan bahan baku.');
      }
    } catch (err) {
      setError('Gagal menghubungkan ke server.');
    } finally {
      setLoading(false);
    }
  };

  // Recipe Builder Helpers
  const addRecipeLine = () => {
    if (!selectedIngredientToAdd || !qtyToAdd) return;
    const ing = ingredients.find(i => i.id === selectedIngredientToAdd);
    if (!ing) return;

    // Check if already in recipe
    if (recipeLines.some(l => l.ingredientId === selectedIngredientToAdd)) {
      setError('Bahan baku sudah ada di resep.');
      return;
    }

    setRecipeLines([
      ...recipeLines,
      {
        ingredientId: selectedIngredientToAdd,
        ingredientName: ing.name,
        unit: ing.unit,
        qtyUsed: Number(qtyToAdd)
      }
    ]);
    setError('');
  };

  const removeRecipeLine = (ingId: string) => {
    setRecipeLines(recipeLines.filter(l => l.ingredientId !== ingId));
  };

  const updateRecipeLineQty = (ingId: string, qty: number) => {
    if (qty <= 0) return;
    setRecipeLines(recipeLines.map(l => l.ingredientId === ingId ? { ...l, qtyUsed: qty } : l));
  };

  // Submit Create Menu / Recipe
  const submitCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuName || !menuCategory || !menuSellingPrice) return;
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: menuName,
          category: menuCategory,
          sellingPrice: Number(menuSellingPrice),
          recipe: recipeLines
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess('Berhasil membuat menu baru.');
        fetchMenus();
        setTimeout(() => handleCloseModal(), 1500);
      } else {
        setError(data.error || 'Gagal membuat menu.');
      }
    } catch (err) {
      setError('Gagal menghubungkan ke server.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Edit Menu & Recipe (OQ-4)
  const submitEditMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMenu || !menuName || !menuCategory || !menuSellingPrice) return;
    setLoading(true);
    setError('');

    try {
      // 1. Update Menu Details
      const resMenu = await apiFetch(`/menus/${activeMenu.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: menuName,
          category: menuCategory,
          sellingPrice: Number(menuSellingPrice),
        }),
      });

      if (!resMenu.ok) {
        const data = await resMenu.json();
        throw new Error(data.error || 'Gagal memperbarui menu.');
      }

      // 2. Update Recipe mapping
      const resRecipe = await apiFetch(`/menus/${activeMenu.id}/recipe`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe: recipeLines
        }),
      });

      if (!resRecipe.ok) {
        const data = await resRecipe.json();
        throw new Error(data.error || 'Gagal memperbarui resep.');
      }

      setSuccess('Berhasil menyimpan menu dan resep.');
      fetchMenus();
      setTimeout(() => handleCloseModal(), 1500);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setLoading(false);
    }
  };

  // Delete Menu
  const deleteMenu = async (menuId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus menu ini?')) return;
    try {
      const res = await apiFetch(`/menus/${menuId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchMenus();
      }
    } catch (err) {
      alert('Gagal menghapus menu.');
    }
  };

  return (
    <div className="inventory-layout">
      {/* Header */}
      <header className="inventory-header">
        <div>
          <h1>Gudang &amp; Inventaris</h1>
          <p>
            {activeTab === 'ingredients' 
              ? 'Pantau persediaan bahan baku secara real-time'
              : 'Atur menu jual beserta komposisi resep bahan baku'}
          </p>
        </div>
        
        {activeTab === 'ingredients' ? (
          <button onClick={() => setModalType('create')} className="btn btn-primary">
            + Bahan Baku
          </button>
        ) : (
          <button onClick={() => handleOpenMenuModal(null, 'create-menu')} className="btn btn-primary">
            + Menu Baru
          </button>
        )}
      </header>

      {/* Sub-Tab Navigation Toggles (OQ-7 / OQ-4 Constraint) */}
      <div className="sub-tab-nav">
        <button
          onClick={() => setActiveTab('ingredients')}
          className={`sub-tab-btn ${activeTab === 'ingredients' ? 'active' : ''}`}
        >
          Stok
        </button>
        <button
          onClick={() => setActiveTab('restock')}
          className={`sub-tab-btn ${activeTab === 'restock' ? 'active' : ''}`}
        >
          Restock
        </button>
        <button
          onClick={() => setActiveTab('menus')}
          className={`sub-tab-btn ${activeTab === 'menus' ? 'active' : ''}`}
        >
          Menu &amp; Resep
        </button>
      </div>

      {/* 1. Ingredients Tab View */}
      {activeTab === 'ingredients' && (
        <div className="ingredients-list">
          {ingredients.length === 0 ? (
            <div className="empty-state">
              <p>Belum ada bahan baku terdaftar.</p>
            </div>
          ) : (
            ingredients.map((ing) => {
              const isLowStock = ing.stockQty <= ing.minStockQty;

              return (
                <div key={ing.id} className="ingredient-card card">
                  <div className="ing-info">
                    <div className="ing-title-row">
                      <h3>{ing.name}</h3>
                      {isLowStock && (
                        <span className="badge badge-danger">Stok Menipis</span>
                      )}
                    </div>
                    <div className="ing-stats-row">
                      <div className="ing-stat">
                        <span className="stat-label">Sisa Stok</span>
                        <span className="stat-value">
                          {ing.stockQty} {ing.unit}
                        </span>
                      </div>
                      <div className="ing-stat">
                        <span className="stat-label">Stok Min</span>
                        <span className="stat-value">
                          {ing.minStockQty} {ing.unit}
                        </span>
                      </div>
                      <div className="ing-stat">
                        <span className="stat-label">Harga Beli</span>
                        <span className="stat-value text-underline" onClick={() => handleOpenModal(ing, 'price-history')} title="Lihat riwayat harga">
                          Rp {ing.latestPrice.toLocaleString('id-ID')}/{ing.unit} 📈
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ing-actions">
                    <button
                      onClick={() => handleOpenModal(ing, 'restock')}
                      className="btn btn-secondary flex-1"
                    >
                      Restok
                    </button>
                    <button
                      onClick={() => handleOpenModal(ing, 'price')}
                      className="btn btn-secondary flex-1"
                    >
                      Atur Harga
                    </button>
                    <button
                      onClick={() => handleOpenModal(ing, 'edit')}
                      className="btn btn-secondary icon-btn"
                      title="Edit Konfigurasi"
                    >
                      ⚙
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. Restock Tab View */}
      {activeTab === 'restock' && (
        <div className="recommendations-list">
          {recommendations.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-icon">✓</div>
              <h3>Stok Anda Aman!</h3>
              <p>Semua bahan baku memiliki persediaan yang cukup untuk minimal 2 hari ke depan berdasarkan rata-rata penjualan.</p>
            </div>
          ) : (
            recommendations.map((item) => {
              const roundedDays = item.sisaHari.toFixed(1);
              const urgentClass = item.sisaHari < 0.5 ? 'critical' : item.sisaHari < 1 ? 'warning' : 'info';

              return (
                <div key={item.id} className="recommendation-card card">
                  <div className="rec-badge-row">
                    <span className={`status-pill ${urgentClass}`}>
                      {item.sisaHari <= 0 ? 'Stok Habis' : `Sisa Proyeksi: ${roundedDays} Hari`}
                    </span>
                    <button
                      onClick={() => handleOpenRestock(item)}
                      className="btn btn-primary btn-sm"
                    >
                      Restok Cepat
                    </button>
                  </div>

                  <div className="rec-details">
                    <h3>{item.name}</h3>
                    <div className="rec-stats">
                      <div className="rec-stat">
                        <span className="label">Stok Saat Ini</span>
                        <span className="val">{item.stockQty} {item.unit}</span>
                      </div>
                      <div className="rec-stat">
                        <span className="label">Rata-rata Harian</span>
                        <span className="val">{item.avgConsumption7d.toFixed(2)} {item.unit}/hari</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 3. Menus Tab View (Recipe Customizer) */}
      {activeTab === 'menus' && (
        <div className="menus-list">
          {menus.length === 0 ? (
            <div className="empty-state">
              <p>Belum ada menu terdaftar.</p>
            </div>
          ) : (
            menus.map((menu) => (
              <div key={menu.id} className="menu-card card">
                <div className="menu-card-header">
                  <div className="menu-meta">
                    <h3>{menu.name}</h3>
                    <span className="badge badge-success">{menu.category}</span>
                  </div>
                  {!menu.isAvailable && (
                    <span className="badge badge-danger">Stok Habis</span>
                  )}
                </div>

                <div className="menu-prices-row">
                  <div className="price-item">
                    <span className="lbl">Harga Jual</span>
                    <span className="val">Rp {menu.sellingPrice.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="price-item">
                    <span className="lbl">Estimasi HPP</span>
                    <span className="val text-primary">Rp {menu.hpp.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="price-item">
                    <span className="lbl">Margin Profit</span>
                    <span className={`val ${(menu.sellingPrice - menu.hpp) / menu.sellingPrice < (1 - (criticalThreshold / 100)) ? 'text-danger' : 'text-success'}`}>
                      {menu.sellingPrice > 0 
                        ? (((menu.sellingPrice - menu.hpp) / menu.sellingPrice) * 100).toFixed(0)
                        : 0}%
                    </span>
                  </div>
                </div>

                {Number(menu.hpp) / Number(menu.sellingPrice) > (criticalThreshold / 100) && (
                  <div className="menu-price-warning-box">
                    <span>⚠️ Margin Kritis! Rekomendasi harga baru: <strong>Rp {(targetHpp > 0 ? Math.ceil((Number(menu.hpp) / (targetHpp / 100)) / 1000) * 1000 : 0).toLocaleString('id-ID')}</strong> (Target HPP {targetHpp}%)</span>
                  </div>
                )}

                <div className="menu-actions">
                  <button
                    onClick={() => handleOpenMenuModal(menu, 'edit-menu')}
                    className="btn btn-secondary flex-1"
                  >
                    Atur Resep &amp; Harga
                  </button>
                  <button
                    onClick={() => deleteMenu(menu.id)}
                    className="btn btn-danger icon-btn"
                    title="Hapus Menu"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Forms Modal Sheet */}
      {modalType && (
        <div className="bottom-sheet-backdrop" onClick={handleCloseModal}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle"></div>
            
            <div className="sheet-header">
              <h2>
                {modalType === 'restock' && `Restok ${activeIngredient?.name}`}
                {modalType === 'price' && `Update Harga ${activeIngredient?.name}`}
                {modalType === 'edit' && `Konfigurasi ${activeIngredient?.name}`}
                {modalType === 'create' && 'Tambah Bahan Baku Baru'}
                {modalType === 'price-history' && `Riwayat Harga ${activeIngredient?.name}`}
                {modalType === 'edit-menu' && `Edit Menu & Resep: ${activeMenu?.name}`}
                {modalType === 'create-menu' && 'Daftarkan Menu Jual Baru'}
              </h2>
              <button onClick={handleCloseModal} className="btn-close">Tutup</button>
            </div>

            {error && <div className="error-alert">{error}</div>}
            {success && <div className="success-alert">{success}</div>}

            {/* Restock Form */}
            {modalType === 'restock' && (
              <form onSubmit={submitRestock}>
                <div className="form-group">
                  <label className="form-label">Jumlah Masuk ({activeIngredient?.unit})</label>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    placeholder="Contoh: 1000"
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Catatan Restok</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Contoh: Pembelian Pasar Senen"
                    value={restockNote}
                    onChange={(e) => setRestockNote(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Simpan Restok'}
                </button>
              </form>
            )}

            {/* Price Form */}
            {modalType === 'price' && (
              <form onSubmit={submitPriceUpdate}>
                <div className="price-mode-toggle">
                  <button 
                    type="button"
                    className={`toggle-btn ${priceMode === 'per_unit' ? 'active' : ''}`}
                    onClick={() => setPriceMode('per_unit')}
                  >
                    Per {activeIngredient?.unit}
                  </button>
                  <button 
                    type="button"
                    className={`toggle-btn ${priceMode === 'bulk' ? 'active' : ''}`}
                    onClick={() => setPriceMode('bulk')}
                  >
                    Per Kemasan Beli
                  </button>
                </div>

                {priceMode === 'per_unit' ? (
                  <div className="form-group">
                    <label className="form-label">Harga Beli Baru Per {activeIngredient?.unit}</label>
                    <input
                      type="number"
                      step="any"
                      className="input-field"
                      placeholder="Contoh: 18"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Harga Beli Kemasan (Rp)</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="Contoh: 120000"
                        value={bulkPrice}
                        onChange={(e) => {
                          setBulkPrice(e.target.value);
                          if (e.target.value && bulkQty) {
                            setPriceInput((Number(e.target.value) / Number(bulkQty)).toString());
                          }
                        }}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Isi Kemasan ({activeIngredient?.unit})</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder={`Contoh: 1000 (jika beli 1kg = 1000 ${activeIngredient?.unit})`}
                        value={bulkQty}
                        onChange={(e) => {
                          setBulkQty(e.target.value);
                          if (bulkPrice && e.target.value) {
                            setPriceInput((Number(bulkPrice) / Number(e.target.value)).toString());
                          }
                        }}
                        required
                        disabled={loading}
                      />
                    </div>
                  </>
                )}

                <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Perbarui Harga'}
                </button>
              </form>
            )}

            {/* Edit Ingredient Form */}
            {modalType === 'edit' && (
              <form onSubmit={submitEditConfig}>
                <div className="form-group">
                  <label className="form-label">Nama Bahan Baku</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Satuan</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stok Minimal Pemicu Peringatan</label>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    value={editMinStock}
                    onChange={(e) => setEditMinStock(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </form>
            )}

            {/* Create Ingredient Form */}
            {modalType === 'create' && (
              <form onSubmit={submitCreate}>
                <div className="form-group">
                  <label className="form-label">Nama Bahan Baku</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Contoh: Biji Kopi Arabika"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Satuan (gram, ml, pcs, dll)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Contoh: gram"
                    value={createUnit}
                    onChange={(e) => setCreateUnit(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stok Awal</label>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    placeholder="Contoh: 5000"
                    value={createStock}
                    onChange={(e) => setCreateStock(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Batas Minimal Stok</label>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    placeholder="Contoh: 1000"
                    value={createMinStock}
                    onChange={(e) => setCreateMinStock(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Harga Beli Per Satuan (Rp)</label>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    placeholder="Contoh: 150"
                    value={createPrice}
                    onChange={(e) => setCreatePrice(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Daftarkan Bahan Baku'}
                </button>
              </form>
            )}

            {/* Market Price History Timeline (FR-08 / Price Tracker) */}
            {modalType === 'price-history' && (
              <div className="price-history-container">
                {priceHistory.length === 0 ? (
                  <p className="no-history">Belum ada riwayat perubahan harga beli.</p>
                ) : (
                  <div className="timeline">
                    {priceHistory.map((entry) => (
                      <div key={entry.id} className="timeline-entry">
                        <div className="entry-dot"></div>
                        <div className="entry-content">
                          <div className="entry-header-row">
                            <span className="entry-price font-bold">
                              Rp {Number(entry.price).toLocaleString('id-ID')}
                            </span>
                            <span className="entry-date text-secondary">
                              {new Date(entry.recordedAt).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <p className="entry-author">Oleh: {entry.recordedBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={handleCloseModal} className="btn btn-secondary w-full mt-6">
                  Tutup Riwayat
                </button>
              </div>
            )}

            {/* Menu Edit & Recipe mapping form (OQ-4 / Recipe Setter) */}
            {(modalType === 'edit-menu' || modalType === 'create-menu') && (
              <form onSubmit={modalType === 'edit-menu' ? submitEditMenu : submitCreateMenu}>
                <div className="form-group">
                  <label className="form-label">Nama Menu</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Contoh: Kopi Latte Segar"
                    value={menuName}
                    onChange={(e) => setMenuName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label">Kategori</label>
                    <select
                      className="input-field"
                      value={menuCategory}
                      onChange={(e) => setMenuCategory(e.target.value)}
                      required
                      disabled={loading}
                    >
                      <option value="Minuman">Minuman</option>
                      <option value="Makanan">Makanan</option>
                      <option value="Snack">Snack</option>
                    </select>
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label">Harga Jual (Rp)</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Contoh: 18000"
                      value={menuSellingPrice}
                      onChange={(e) => setMenuSellingPrice(e.target.value)}
                      required
                      disabled={loading}
                    />
                    {formHpp > 0 && (
                      <span className="input-helper-text">
                        💡 Rekomendasi: Rp {formRecPrice.toLocaleString('id-ID')} (Target HPP {targetHpp}%, HPP: Rp {formHpp.toLocaleString('id-ID')})
                      </span>
                    )}
                  </div>
                </div>

                {/* Recipe Settings Section */}
                <div className="recipe-builder-section">
                  <span className="form-label">Komposisi Resep</span>
                  
                  {/* Current recipe lines */}
                  <div className="recipe-lines-list">
                    {recipeLines.length === 0 ? (
                      <p className="no-ingredients-text">Menu ini belum memiliki resep bahan baku.</p>
                    ) : (
                      recipeLines.map((line) => (
                        <div key={line.ingredientId} className="recipe-line-row">
                          <span className="line-name">{line.ingredientName}</span>
                          <div className="line-input-control">
                            <input
                              type="number"
                              className="input-field line-qty-input"
                              value={line.qtyUsed}
                              onChange={(e) => updateRecipeLineQty(line.ingredientId, Number(e.target.value))}
                              required
                              disabled={loading}
                            />
                            <span className="line-unit">{line.unit}</span>
                            <button
                              type="button"
                              onClick={() => removeRecipeLine(line.ingredientId)}
                              className="line-delete-btn"
                              disabled={loading}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add ingredient row */}
                  {ingredients.length > 0 && (
                    <div className="recipe-add-row card">
                      <select
                        className="input-field select-ing flex-2"
                        value={selectedIngredientToAdd}
                        onChange={(e) => setSelectedIngredientToAdd(e.target.value)}
                        disabled={loading}
                      >
                        {ingredients.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name} ({i.unit})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className="input-field input-qty flex-1"
                        placeholder="Qty"
                        value={qtyToAdd}
                        onChange={(e) => setQtyToAdd(e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={addRecipeLine}
                        className="btn btn-secondary"
                        disabled={loading}
                      >
                        + Tambah
                      </button>
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary w-full mt-6" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Simpan Menu & Resep'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .inventory-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .inventory-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
        }
        .inventory-header h1 {
          font-size: 24px;
        }
        .inventory-header p {
          font-size: 13px;
          color: var(--text-secondary);
        }
        
        /* Sub-Tab Navigation Toggle */
        .sub-tab-nav {
          display: flex;
          background: #e8e2d5;
          padding: 4px;
          border-radius: var(--radius-md);
        }
        .sub-tab-btn {
          flex: 1;
          background: transparent;
          border: none;
          padding: 10px;
          font-family: var(--font-jakarta);
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: calc(var(--radius-md) - 2px);
          transition: var(--transition-fast);
        }
        .sub-tab-btn.active {
          background: white;
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }

        .ingredients-list, .menus-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-bottom: 60px;
        }
        .ingredient-card, .menu-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ing-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ing-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ing-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          border-top: 1px solid var(--border-color);
          padding-top: 10px;
        }
        .ing-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .stat-label {
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--text-tertiary);
          letter-spacing: 0.05em;
        }
        .stat-value {
          font-size: 13px;
          font-weight: 600;
        }
        .text-underline {
          text-decoration: underline;
          cursor: pointer;
          color: var(--primary-color);
        }
        .ing-actions, .menu-actions {
          display: flex;
          gap: 10px;
        }
        .flex-1 { flex: 1; }
        .flex-2 { flex: 2; }
        .icon-btn {
          width: 42px;
          padding: 0;
          font-size: 16px;
        }

        /* Restock Tab Specifics */
        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-bottom: 60px;
        }
        .recommendation-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .rec-badge-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .status-pill {
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 30px;
        }
        .status-pill.critical {
          background-color: var(--danger-light);
          color: var(--danger-color);
        }
        .status-pill.warning {
          background-color: var(--warning-light);
          color: var(--warning-color);
        }
        .status-pill.info {
          background-color: hsl(200, 100%, 96%);
          color: hsl(200, 100%, 40%);
        }
        .rec-details h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .rec-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          border-top: 1px solid var(--border-color);
          padding-top: 10px;
        }
        .rec-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .rec-stat .label {
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--text-tertiary);
        }
        .rec-stat .val {
          font-size: 13px;
          font-weight: 600;
        }
        .empty-icon {
          width: 60px;
          height: 60px;
          background-color: var(--success-light);
          color: var(--success-color);
          border-radius: 50%;
          font-size: 30px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px auto;
        }
        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }
        
        /* Menu Cards specifics */
        .menu-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .menu-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .menu-prices-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          border-top: 1px solid var(--border-color);
          padding-top: 10px;
        }
        .price-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .price-item .lbl {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-tertiary);
          text-transform: uppercase;
        }
        .price-item .val {
          font-size: 13px;
          font-weight: 600;
        }
        .text-success { color: var(--success-color); }
        .text-danger { color: var(--danger-color); }

        .sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .btn-close {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }
        .form-row {
          display: flex;
          gap: 12px;
        }
        .error-alert {
          background-color: var(--danger-light);
          color: var(--danger-color);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 16px;
          text-align: center;
        }
        .success-alert {
          background-color: var(--success-light);
          color: var(--success-color);
          padding: 10px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          text-align: center;
          margin-bottom: 16px;
        }
        
        .price-mode-toggle {
          display: flex;
          background-color: #f2ede4;
          border-radius: var(--radius-sm);
          padding: 4px;
          margin-bottom: 16px;
        }
        .toggle-btn {
          flex: 1;
          background: transparent;
          border: none;
          padding: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .toggle-btn.active {
          background-color: white;
          color: var(--primary-color);
          box-shadow: var(--shadow-sm);
        }

        .w-full { width: 100%; }
        .mt-4 { margin-top: 16px; }
        .mt-6 { margin-top: 24px; }
        .font-bold { font-weight: 700; }

        /* Price History Timeline style */
        .timeline {
          position: relative;
          padding-left: 20px;
          margin: 16px 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-left: 2px solid var(--border-color);
          text-align: left;
        }
        .timeline-entry {
          position: relative;
        }
        .entry-dot {
          position: absolute;
          left: -26px;
          top: 6px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: var(--primary-color);
          border: 2px solid white;
          box-shadow: 0 0 0 2px var(--border-color);
        }
        .entry-content {
          background: #fafaf9;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
        }
        .entry-header-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .entry-price {
          font-size: 14px;
          color: var(--primary-color);
        }
        .entry-date {
          font-size: 11px;
        }
        .entry-author {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .no-history {
          text-align: center;
          color: var(--text-secondary);
          margin: 30px 0;
        }

        /* Recipe Builder specifics */
        .recipe-builder-section {
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
          margin-top: 16px;
        }
        .recipe-lines-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 10px 0 16px 0;
          max-height: 25vh;
          overflow-y: auto;
          text-align: left;
        }
        .no-ingredients-text {
          font-size: 12px;
          color: var(--text-secondary);
          font-style: italic;
        }
        .recipe-line-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px;
          background: #fafaf9;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
        }
        .line-name {
          font-size: 13px;
          font-weight: 500;
        }
        .line-input-control {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .line-qty-input {
          width: 70px;
          padding: 6px;
          font-size: 13px;
          text-align: center;
        }
        .line-unit {
          font-size: 12px;
          color: var(--text-secondary);
          min-width: 30px;
        }
        .line-delete-btn {
          background: transparent;
          border: none;
          color: var(--danger-color);
          cursor: pointer;
          font-weight: bold;
          padding: 4px;
        }
        .recipe-add-row {
          display: flex;
          gap: 8px;
          padding: 8px;
          background-color: var(--background-color);
        }
        .select-ing {
          padding: 8px;
          font-size: 12px;
        }
        .input-qty {
          padding: 8px;
          font-size: 12px;
          width: 60px;
          text-align: center;
        }
        .menu-price-warning-box {
          background-color: var(--danger-light);
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          color: var(--danger-color);
          text-align: left;
          margin-top: -8px;
        }
        .input-helper-text {
          font-size: 11px;
          color: var(--text-secondary);
          font-style: italic;
          margin-top: 4px;
          display: block;
        }
      `}</style>

      <AiChatWidget />
    </div>
  );
}
