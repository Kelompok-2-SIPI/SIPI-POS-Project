'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  hpp: number;
  isAvailable: boolean;
}

interface CartItem {
  menuId: string;
  name: string;
  price: number;
  qty: number;
}

interface ReceiptData {
  id: string;
  paymentMethod: string;
  totalPrice: number;
  createdAt: string;
  items: { menuName: string; qty: number; unitPrice: number }[];
  isOffline?: boolean;
}

export default function PosPage() {
  const router = useRouter();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [filteredMenus, setFilteredMenus] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['Semua']);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Modals & Sheets visibility
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'non_cash'>('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Initial Load & Auth Sync
  useEffect(() => {
    fetchMenus();

    // Load cart from localStorage
    const storedCart = localStorage.getItem('sipi_cart');
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        localStorage.removeItem('sipi_cart');
      }
    }

    // Listen to sync completion event to update menus
    const handleSyncComplete = () => {
      fetchMenus();
    };
    window.addEventListener('sipi_sync_completed', handleSyncComplete);
    return () => window.removeEventListener('sipi_sync_completed', handleSyncComplete);
  }, []);

  // 2. Fetch Menus from API
  const fetchMenus = async () => {
    try {
      const res = await apiFetch('/menus');
      if (res.ok) {
        const data = await res.json();
        setMenus(data);
        // Extract unique categories
        const cats = ['Semua', ...Array.from(new Set(data.map((m: MenuItem) => m.category))) as string[]];
        setCategories(cats);
      }
    } catch (err) {
      console.error('Offline - loading menus from cache if any');
      // If offline, try to get cached menus (Next.js/Browser handles SW caching,
      // but let's check if we had any cached or fallback to hardcoded mock)
    }
  };

  // 3. Filter menus whenever activeCategory, searchQuery or menus changes
  useEffect(() => {
    let result = menus;

    if (activeCategory !== 'Semua') {
      result = result.filter((m) => m.category === activeCategory);
    }

    if (searchQuery.trim() !== '') {
      result = result.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMenus(result);
  }, [menus, activeCategory, searchQuery]);

  // 4. Save cart helper
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('sipi_cart', JSON.stringify(newCart));
  };

  // 5. Add item to cart
  const addToCart = (menu: MenuItem) => {
    if (!menu.isAvailable) return;

    const existingIndex = cart.findIndex((item) => item.menuId === menu.id);
    const newCart = [...cart];

    if (existingIndex > -1) {
      newCart[existingIndex].qty += 1;
    } else {
      newCart.push({
        menuId: menu.id,
        name: menu.name,
        price: menu.sellingPrice,
        qty: 1,
      });
    }
    saveCart(newCart);
  };

  // 6. Qty buttons
  const incrementQty = (menuId: string) => {
    const newCart = cart.map((item) => {
      if (item.menuId === menuId) {
        return { ...item, qty: item.qty + 1 };
      }
      return item;
    });
    saveCart(newCart);
  };

  const decrementQty = (menuId: string) => {
    const newCart = cart
      .map((item) => {
        if (item.menuId === menuId) {
          return { ...item, qty: item.qty - 1 };
        }
        return item;
      })
      .filter((item) => item.qty > 0);
    saveCart(newCart);
  };

  // 7. Clear Cart / Batal Transaksi (FR-05)
  const clearCart = () => {
    saveCart([]);
    setIsCartOpen(false);
  };

  // 8. Logout helper
  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      await apiFetch('/auth/logout', { method: 'POST' });
      localStorage.removeItem('sipi_token');
      localStorage.removeItem('sipi_logged_in');
      localStorage.removeItem('sipi_user');
      router.replace('/login');
    }
  };

  // 9. Checkout / Bayar (FR-02, FR-03, FR-04)
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setError('');

    const transactionData = {
      items: cart.map((i) => ({ menuId: i.menuId, qty: i.qty })),
      paymentMethod,
    };

    try {
      const res = await apiFetch('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Show receipt from API
        setReceipt({
          id: data.transaction.id,
          paymentMethod: data.transaction.paymentMethod === 'cash' ? 'Tunai' : 'Non-tunai',
          totalPrice: data.transaction.totalPrice,
          createdAt: data.transaction.createdAt,
          items: data.transaction.items.map((i: any) => ({
            menuName: i.menuName,
            qty: i.qty,
            unitPrice: i.unitPrice,
          })),
        });
        saveCart([]); // Clear cart
        setIsCartOpen(false);
        fetchMenus(); // Refresh menu availability
      } else {
        setError(data.error || 'Terjadi kesalahan saat memproses transaksi.');
      }
    } catch (err) {
      // Offline fallback: save offline transaction (PWA Requirement)
      console.log('Offline: saving transaction locally');
      
      const offlineId = 'offline_' + Math.random().toString(36).substr(2, 9);
      const offlineTx = {
        id: offlineId,
        items: cart,
        paymentMethod,
        createdAt: new Date().toISOString(),
      };

      // Push to offline queue
      const existingOffline = localStorage.getItem('sipi_offline_transactions');
      const queue = existingOffline ? JSON.parse(existingOffline) : [];
      queue.push(offlineTx);
      localStorage.setItem('sipi_offline_transactions', JSON.stringify(queue));

      // Show receipt locally
      setReceipt({
        id: offlineId,
        paymentMethod: paymentMethod === 'cash' ? 'Tunai' : 'Non-tunai',
        totalPrice: totalCartPrice,
        createdAt: new Date().toISOString(),
        items: cart.map((i) => ({
          menuName: i.name,
          qty: i.qty,
          unitPrice: i.price,
        })),
        isOffline: true,
      });

      saveCart([]); // Clear cart
      setIsCartOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="pos-layout">
      {/* Header */}
      <header className="pos-header">
        <div className="header-info">
          <h1>Kasir POS</h1>
          <p>Kelola pesanan pelanggan dengan cepat</p>
        </div>
        <button onClick={handleLogout} className="btn-logout" title="Keluar">
          <svg viewBox="0 0 24 24" width="16" height="16" style={{flexShrink: 0}}>
            <path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
          Keluar
        </button>
      </header>

      {/* Search & Categories */}
      <div className="pos-controls">
        <div className="search-box">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            type="text"
            className="input-field"
            placeholder="Cari menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="category-scroll">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="menu-grid">
        {filteredMenus.length === 0 ? (
          <div className="empty-state">
            <p>Tidak ada menu dalam kategori ini.</p>
          </div>
        ) : (
          filteredMenus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => addToCart(menu)}
              disabled={!menu.isAvailable}
              className={`menu-card ${!menu.isAvailable ? 'disabled' : ''}`}
            >
              <div className="menu-photo">
                <svg width="40" height="40" viewBox="0 -960 960 960" fill="currentColor" style={{ flexShrink: 0 }}>
                  <path d="M280-80v-366q-51-14-85.5-56T160-600v-280h80v280h40v-280h80v280h40v-280h80v280q0 56-34.5 98T400-446v366h-120Zm400 0v-320H560v-280q0-83 58.5-141.5T760-880v800h-80Z"/>
                </svg>
                {!menu.isAvailable && <span className="sold-out-badge">Habis</span>}
              </div>
              <div className="menu-details">
                <h3>{menu.name}</h3>
                <span className="menu-cat">{menu.category}</span>
                <span className="menu-price">Rp {menu.sellingPrice.toLocaleString('id-ID')}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Floating Cart Bar (FR-01) */}
      {totalCartItems > 0 && (
        <div className="floating-cart-bar" onClick={() => setIsCartOpen(true)}>
          <div className="cart-bar-info">
            <span className="cart-qty">{totalCartItems} Item</span>
            <span className="cart-total">Total: Rp {totalCartPrice.toLocaleString('id-ID')}</span>
          </div>
          <button className="btn btn-primary">Lihat Keranjang</button>
        </div>
      )}

      {/* Cart Bottom Sheet */}
      {isCartOpen && (
        <div className="bottom-sheet-backdrop" onClick={() => setIsCartOpen(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle"></div>
            <div className="sheet-header">
              <h2>Keranjang Belanja</h2>
              <button onClick={() => setIsCartOpen(false)} className="btn-close">Tutup</button>
            </div>

            {error && <div className="error-alert">{error}</div>}

            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.menuId} className="cart-item-row">
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <span>Rp {item.price.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="item-qty-controls">
                    <button onClick={() => decrementQty(item.menuId)} className="qty-btn">−</button>
                    <span className="qty-val">{item.qty}</span>
                    <button onClick={() => incrementQty(item.menuId)} className="qty-btn">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="sheet-footer">
              <div className="payment-selector">
                <span className="form-label">Metode Pembayaran</span>
                <div className="payment-options">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`pay-opt-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                  >
                    Tunai
                  </button>
                  <button
                    onClick={() => setPaymentMethod('non_cash')}
                    className={`pay-opt-btn ${paymentMethod === 'non_cash' ? 'active' : ''}`}
                  >
                    Non-tunai
                  </button>
                </div>
              </div>

              <div className="checkout-summary">
                <div className="summary-row font-bold">
                  <span>Total Bayar</span>
                  <span>Rp {totalCartPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="cart-action-buttons">
                <button onClick={clearCart} className="btn btn-secondary flex-1">
                  Batal Transaksi
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading || cart.length === 0}
                  className="btn btn-primary flex-2"
                >
                  {loading ? 'Memproses...' : 'Konfirmasi Bayar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Digital Receipt Modal (Bottom Sheet - OQ-1, FR-02) */}
      {receipt && (
        <div className="bottom-sheet-backdrop">
          <div className="bottom-sheet receipt-sheet">
            <div className="bottom-sheet-handle"></div>
            <div className="receipt-container">
              <div className="receipt-header">
                <div className="success-icon">✓</div>
                <h2>Transaksi Sukses!</h2>
                <p className="receipt-id">ID: #{receipt.id.slice(0, 12).toUpperCase()}</p>
                <p className="receipt-date">{new Date(receipt.createdAt).toLocaleString('id-ID')}</p>
                {receipt.isOffline && (
                  <span className="badge badge-warning">Tersimpan Offline</span>
                )}
              </div>

              <div className="receipt-divider"></div>

              <div className="receipt-items">
                {receipt.items.map((item, idx) => (
                  <div key={idx} className="receipt-item-row">
                    <span>{item.menuName} x {item.qty}</span>
                    <span>Rp {(item.unitPrice * item.qty).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              <div className="receipt-divider"></div>

              <div className="receipt-summary">
                <div className="receipt-summary-row">
                  <span>Metode Pembayaran</span>
                  <span>{receipt.paymentMethod}</span>
                </div>
                <div className="receipt-summary-row font-bold">
                  <span>Total</span>
                  <span>Rp {Number(receipt.totalPrice).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <button onClick={() => setReceipt(null)} className="btn btn-primary w-full mt-6">
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tahap 4a: search bar, filter kategori, grid card menu — styling scoped di sini.
          Sisanya (header, floating cart, bottom sheet, receipt) masih pakai globals.css,
          belum disentuh (Tahap 4b). */}
      <style jsx>{`
        .pos-controls {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 16px;
          fill: var(--text-tertiary);
          pointer-events: none;
        }
        .search-box input {
          width: 100%;
          background-color: var(--color-surface-soft);
          border: 1px solid var(--color-outline);
          border-radius: var(--radius-pill);
          padding: 12px 16px 12px 48px;
          font-family: var(--font-jakarta);
          font-size: 14px;
          color: var(--text-primary);
          transition: var(--transition-fast);
        }
        .search-box input:focus {
          outline: none;
          border-color: var(--color-primary);
          background-color: var(--color-canvas);
          box-shadow: 0 0 0 3px rgba(0, 100, 224, 0.15);
        }
        .category-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .category-scroll::-webkit-scrollbar {
          display: none;
        }
        .cat-btn {
          font-family: var(--font-jakarta);
          font-weight: 600;
          font-size: 13px;
          padding: 8px 18px;
          background: var(--color-surface-soft);
          color: var(--text-secondary);
          border: none;
          border-radius: var(--radius-pill);
          cursor: pointer;
          white-space: nowrap;
          transition: var(--transition-fast);
        }
        .cat-btn.active {
          background-color: var(--color-primary);
          color: #fff;
        }
        .menu-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding-bottom: 60px;
        }
        @media (min-width: 768px) {
          .menu-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (min-width: 1200px) {
          .menu-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .menu-card {
          background: var(--color-canvas);
          border: 1px solid var(--color-outline);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: stretch;
          text-align: left;
          cursor: pointer;
          transition: var(--transition-fast);
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .menu-card:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .menu-card:active:not(.disabled) {
          transform: scale(0.97);
        }
        .menu-card.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .menu-photo {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          background-color: var(--color-surface-soft);
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .menu-card.disabled .menu-photo {
          background-color: var(--color-outline);
        }
        .menu-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 12px 14px 0;
        }
        .menu-details h3 {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .menu-cat {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .menu-price {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-primary);
          padding: 4px 14px 14px;
        }
        .menu-card.disabled .menu-price {
          color: var(--text-secondary);
        }
        .sold-out-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 10px;
          font-weight: 700;
          background-color: var(--color-canvas);
          color: var(--color-danger);
          border: 1px solid var(--color-danger);
          padding: 3px 10px;
          border-radius: var(--radius-pill);
          text-transform: uppercase;
        }
      `}</style>

      {/* Styles below still sourced from globals.css — untouched (Tahap 4b: cart, receipt) */}
      {false && <style>{`
        .floating-cart-bar {
          position: fixed;
          bottom: 84px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 24px);
          max-width: 456px;
          background-color: var(--text-primary);
          color: white;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          box-shadow: var(--shadow-lg);
          z-index: 800;
        }
        .cart-bar-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .cart-qty {
          font-size: 12px;
          color: var(--text-tertiary);
        }
        .cart-total {
          font-size: 15px;
          font-weight: 700;
        }
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
        .cart-items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 40vh;
          overflow-y: auto;
          margin-bottom: 20px;
        }
        .cart-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
        }
        .item-info h4 {
          font-size: 14px;
          margin-bottom: 2px;
        }
        .item-info span {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .item-qty-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .qty-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background: #fafaf9;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qty-val {
          font-weight: 600;
          min-width: 20px;
          text-align: center;
        }
        .payment-selector {
          margin-bottom: 20px;
        }
        .payment-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 6px;
        }
        .pay-opt-btn {
          font-family: var(--font-jakarta);
          font-weight: 600;
          font-size: 13px;
          padding: 10px;
          background: #fafaf9;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .pay-opt-btn.active {
          background-color: var(--primary-light);
          color: var(--primary-color);
          border-color: var(--primary-color);
        }
        .checkout-summary {
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
          margin-bottom: 24px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }
        .font-bold {
          font-weight: 700;
          font-size: 16px;
        }
        .cart-action-buttons {
          display: flex;
          gap: 12px;
        }
        .flex-1 { flex: 1; }
        .flex-2 { flex: 2; }
        
        /* Receipt Modal Specifics */
        .receipt-sheet {
          border-radius: var(--radius-lg);
          padding: 32px 24px;
        }
        .receipt-container {
          text-align: center;
        }
        .success-icon {
          width: 56px;
          height: 56px;
          background-color: var(--success-light);
          color: var(--success-color);
          border-radius: 50%;
          font-size: 28px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px auto;
        }
        .receipt-id {
          font-size: 12px;
          color: var(--text-tertiary);
          margin-top: 4px;
        }
        .receipt-date {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .receipt-divider {
          border-top: 2px dashed var(--border-color);
          margin: 20px 0;
        }
        .receipt-items {
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-align: left;
        }
        .receipt-item-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: var(--text-secondary);
        }
        .receipt-summary {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
        }
        .receipt-summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
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
        .w-full { width: 100%; }
        .mt-6 { margin-top: 24px; }
      `}</style>}
    </div>
  );
}
