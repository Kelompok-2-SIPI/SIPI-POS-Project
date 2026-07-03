'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import styles from './pos.module.css';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  hpp: number;
  isAvailable: boolean;
  imageUrl?: string;
}

interface CartItem {
  menuId: string;
  name: string;
  price: number;
  qty: number;
  imageUrl?: string;
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
  
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [cartPanelMode, setCartPanelMode] = useState<'cart' | 'payment' | 'receipt'>('cart');
  
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'non_cash'>('cash');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMenus();
    const storedCart = localStorage.getItem('sipi_cart');
    if (storedCart) {
      try { setCart(JSON.parse(storedCart)); } catch (e) { localStorage.removeItem('sipi_cart'); }
    }
    const handleSync = () => fetchMenus();
    window.addEventListener('sipi_sync_completed', handleSync);
    return () => window.removeEventListener('sipi_sync_completed', handleSync);
  }, []);

  const fetchMenus = async () => {
    try {
      const res = await apiFetch('/menus');
      if (res.ok) {
        const data = await res.json();
        setMenus(data);
        const cats = ['Semua', ...Array.from(new Set(data.map((m: MenuItem) => m.category))) as string[]];
        setCategories(cats);
      }
    } catch (err) {
      console.error('Offline - loading menus from cache if any');
    }
  };

  useEffect(() => {
    let result = menus;
    if (activeCategory !== 'Semua') result = result.filter((m) => m.category === activeCategory);
    if (searchQuery.trim() !== '') {
      result = result.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    setFilteredMenus(result);
  }, [menus, activeCategory, searchQuery]);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('sipi_cart', JSON.stringify(newCart));
  };

  const addToCart = (menu: MenuItem) => {
    if (!menu.isAvailable) return;
    const existingIndex = cart.findIndex((item) => item.menuId === menu.id);
    const newCart = [...cart];
    if (existingIndex > -1) newCart[existingIndex].qty += 1;
    else newCart.push({ menuId: menu.id, name: menu.name, price: menu.sellingPrice, qty: 1, imageUrl: menu.imageUrl });
    saveCart(newCart);
  };

  const incrementQty = (menuId: string) => saveCart(cart.map((item) => item.menuId === menuId ? { ...item, qty: item.qty + 1 } : item));
  const decrementQty = (menuId: string) => saveCart(cart.map((item) => item.menuId === menuId ? { ...item, qty: item.qty - 1 } : item).filter((item) => item.qty > 0));

  const clearCart = () => {
    saveCart([]);
    setCartPanelMode('cart');
    setIsMobileCartOpen(false);
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const changeAmount = paymentMethod === 'cash' && cashAmount ? parseInt(cashAmount.replace(/\D/g, '')) - totalCartPrice : 0;

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
        setReceipt({
          id: data.transaction.id,
          paymentMethod: data.transaction.paymentMethod === 'cash' ? 'Tunai' : 'Non-tunai',
          totalPrice: data.transaction.totalPrice,
          createdAt: data.transaction.createdAt,
          items: data.transaction.items.map((i: any) => ({
            menuName: i.menuName, qty: i.qty, unitPrice: i.unitPrice,
          })),
        });
        setCartPanelMode('receipt');
        saveCart([]);
        fetchMenus();
      } else {
        setError(data.error || 'Terjadi kesalahan saat memproses transaksi.');
      }
    } catch (err) {
      console.log('Offline: saving transaction locally');
      const offlineId = 'offline_' + Math.random().toString(36).substr(2, 9);
      const offlineTx = { id: offlineId, items: cart, paymentMethod, createdAt: new Date().toISOString() };
      
      const existingOffline = localStorage.getItem('sipi_offline_transactions');
      const queue = existingOffline ? JSON.parse(existingOffline) : [];
      queue.push(offlineTx);
      localStorage.setItem('sipi_offline_transactions', JSON.stringify(queue));

      setReceipt({
        id: offlineId,
        paymentMethod: paymentMethod === 'cash' ? 'Tunai' : 'Non-tunai',
        totalPrice: totalCartPrice,
        createdAt: new Date().toISOString(),
        items: cart.map((i) => ({ menuName: i.name, qty: i.qty, unitPrice: i.price })),
        isOffline: true,
      });
      setCartPanelMode('receipt');
      saveCart([]);
    } finally {
      setLoading(false);
    }
  };

  const getMenuInitials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // Shared Icons
  const Icons = {
    Kasir: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
    Pesanan: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    Laporan: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    Menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    Lainnya: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
    Cart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>,
    Back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="m15 18-6-6 6-6"/></svg>,
    Check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="32" height="32"><path d="M20 6 9 17l-5-5"/></svg>,
    Search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  };

  const renderCartPanel = () => {
    if (cartPanelMode === 'cart') {
      return (
        <>
          <div className={styles.panelHeader}>
            <h2>Keranjang</h2>
            {isMobileCartOpen && (
              <button className={styles.iconBtn} onClick={() => setIsMobileCartOpen(false)}>{Icons.Back}</button>
            )}
          </div>
          <div className={styles.panelBody}>
            {cart.length === 0 ? (
              <div className={styles.emptyState}>
                {Icons.Cart}
                <p>Belum ada item, pilih menu di sebelah kiri</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.menuId} className={styles.cartItem}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className={styles.cartItemAvatar} />
                  ) : (
                    <div className={`${styles.avatarFallback} ${styles.cartItemAvatar}`} style={{fontSize: '16px'}}>
                      {getMenuInitials(item.name)}
                    </div>
                  )}
                  <div className={styles.cartItemInfo}>
                    <p className={styles.cartItemName}>{item.name}</p>
                    <div className={styles.cartItemPrice}>Rp {item.price.toLocaleString('id-ID')}</div>
                  </div>
                  <div className={styles.qtyControls}>
                    <button className={styles.qtyBtnWrapper} onClick={() => decrementQty(item.menuId)}>
                      <div className={`${styles.qtyBtnRound} ${styles.decrease}`}>−</div>
                    </button>
                    <span className={styles.qtyValue}>{item.qty}</span>
                    <button className={styles.qtyBtnWrapper} onClick={() => incrementQty(item.menuId)}>
                      <div className={`${styles.qtyBtnRound} ${styles.increase}`}>+</div>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className={styles.panelFooter}>
            {cart.length > 0 && <div className={styles.dividerTicket}></div>}
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>Rp {totalCartPrice.toLocaleString('id-ID')}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>Total</span>
              <span>Rp {totalCartPrice.toLocaleString('id-ID')}</span>
            </div>
            <button 
              className={styles.primaryBtn} 
              disabled={cart.length === 0}
              onClick={() => setCartPanelMode('payment')}
            >
              Lanjut ke Pembayaran
            </button>
          </div>
        </>
      );
    }

    if (cartPanelMode === 'payment') {
      return (
        <>
          <div className={styles.panelHeader}>
            <button className={styles.iconBtn} onClick={() => setCartPanelMode('cart')}>{Icons.Back}</button>
            <h2>Pembayaran</h2>
            <div style={{width: 44}}></div>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.paymentOptions}>
              <div 
                className={`${styles.payMethodCard} ${paymentMethod === 'cash' ? styles.active : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <div style={{width: 24, height: 24, borderRadius: '50%', border: '2px solid', borderColor: paymentMethod==='cash' ? 'currentColor' : 'var(--ink-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  {paymentMethod === 'cash' && <div style={{width: 12, height: 12, borderRadius: '50%', background: 'currentColor'}}></div>}
                </div>
                <span>Tunai</span>
              </div>
              <div 
                className={`${styles.payMethodCard} ${paymentMethod === 'non_cash' ? styles.active : ''}`}
                onClick={() => setPaymentMethod('non_cash')}
              >
                <div style={{width: 24, height: 24, borderRadius: '50%', border: '2px solid', borderColor: paymentMethod==='non_cash' ? 'currentColor' : 'var(--ink-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  {paymentMethod === 'non_cash' && <div style={{width: 12, height: 12, borderRadius: '50%', background: 'currentColor'}}></div>}
                </div>
                <span>QRIS / Transfer</span>
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div style={{marginTop: 16}}>
                <label style={{fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', marginBottom: 8, display: 'block'}}>Uang Diterima</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  className={styles.inputAmount}
                  placeholder="0"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                />
                {changeAmount > 0 && (
                  <div style={{marginTop: 8, fontSize: 'var(--text-sm)', color: 'var(--brand)'}}>
                    Kembalian: <strong>Rp {changeAmount.toLocaleString('id-ID')}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className={styles.panelFooter}>
            {error && <div style={{color: 'var(--danger)', fontSize: 'var(--text-sm)', marginBottom: 8}}>{error}</div>}
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>Total Tagihan</span>
              <span>Rp {totalCartPrice.toLocaleString('id-ID')}</span>
            </div>
            <button 
              className={styles.primaryBtn} 
              disabled={loading}
              onClick={handleCheckout}
            >
              {loading ? 'Memproses...' : 'Selesaikan Transaksi'}
            </button>
          </div>
        </>
      );
    }

    if (cartPanelMode === 'receipt' && receipt) {
      return (
        <>
          <div className={styles.panelHeader} style={{justifyContent: 'center'}}>
            <h2>Struk Transaksi</h2>
          </div>
          <div className={styles.panelBody} style={{alignItems: 'center', justifyContent: 'center'}}>
            <div className={styles.receiptArea}>
              <div className={styles.successIcon}>{Icons.Check}</div>
              <h2>Pembayaran Berhasil</h2>
              <div className={styles.receiptId}>TRX-{receipt.id.slice(0,8).toUpperCase()}</div>
              
              <div className={styles.dividerTicket} style={{width: '100%', margin: '24px 0'}}></div>
              
              <div className={styles.receiptList}>
                {receipt.items.map((item, idx) => (
                  <div key={idx} className={styles.summaryRow}>
                    <span>{item.qty}x {item.menuName}</span>
                    <span>Rp {(item.unitPrice * item.qty).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
              
              <div className={styles.dividerTicket} style={{width: '100%', margin: '24px 0'}}></div>
              
              <div className={styles.receiptList}>
                <div className={styles.summaryRow}>
                  <span>Metode Pembayaran</span>
                  <span>{receipt.paymentMethod}</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.total}`}>
                  <span>Total Bayar</span>
                  <span>Rp {Number(receipt.totalPrice).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.panelFooter}>
            <button className={styles.primaryBtn} onClick={() => {
              setReceipt(null);
              setCartPanelMode('cart');
              setIsMobileCartOpen(false);
            }}>
              Transaksi Baru
            </button>
          </div>
        </>
      );
    }
  };

  return (
    <div className={styles.posWrapper}>
      {/* Sidebar (Tablet & Desktop) */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>S</div>
        
        <div className={styles.sidebarGroup}>
          <div className={styles.sidebarGroupTitle}>Operasional</div>
          <div className={`${styles.sidebarItem} ${styles.active}`}>
            {Icons.Kasir}
            <span className={styles.sidebarLabel}>Kasir</span>
          </div>
          <Link href="/orders" className={styles.sidebarItem}>
            {Icons.Pesanan}
            <span className={styles.sidebarLabel}>Pesanan</span>
            <div className={styles.tooltip}>Pesanan</div>
          </Link>
        </div>

        <div className={styles.sidebarGroup}>
          <div className={styles.sidebarGroupTitle}>Data</div>
          <Link href="/dashboard" className={styles.sidebarItem}>
            {Icons.Laporan}
            <span className={styles.sidebarLabel}>Laporan</span>
            <div className={styles.tooltip}>Laporan</div>
          </Link>
        </div>

        <div className={styles.sidebarGroup}>
          <div className={styles.sidebarGroupTitle}>Kelola</div>
          <Link href="/inventory" className={styles.sidebarItem}>
            {Icons.Menu}
            <span className={styles.sidebarLabel}>Menu</span>
            <div className={styles.tooltip}>Menu</div>
          </Link>
        </div>
      </aside>

      {/* Main Area */}
      <main className={styles.mainArea}>
        <header className={styles.header}>
          <h1>Kasir</h1>
          <div className={styles.searchBox}>
            {Icons.Search}
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Cari menu..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <div className={styles.categories}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.chip} ${activeCategory === cat ? styles.active : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={styles.menuGridWrapper}>
          <div className={styles.menuGridContainer}>
            {filteredMenus.length === 0 ? (
              <div style={{textAlign: 'center', color: 'var(--ink-faint)', marginTop: '2rem'}}>Tidak ada menu ditemukan.</div>
            ) : (
              <div className={styles.menuGrid}>
                {filteredMenus.map((menu) => (
                  <div 
                    key={menu.id} 
                    className={`${styles.menuCard} ${!menu.isAvailable ? styles.disabled : ''}`}
                    onClick={() => menu.isAvailable && addToCart(menu)}
                  >
                    {menu.imageUrl ? (
                      <img src={menu.imageUrl} alt={menu.name} className={styles.menuPhoto} />
                    ) : (
                      <div className={styles.avatarFallback}>
                        {getMenuInitials(menu.name)}
                      </div>
                    )}
                    <div className={styles.menuInfo}>
                      <h3 className={styles.menuName} title={menu.name}>{menu.name}</h3>
                      <span className={styles.menuPrice}>Rp {menu.sellingPrice.toLocaleString('id-ID')}</span>
                    </div>
                    {!menu.isAvailable && <div className={styles.badgeDanger}>Habis</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right Cart Panel (Desktop / Tablet) */}
      <aside className={styles.cartPanel}>
        {renderCartPanel()}
      </aside>

      {/* Mobile Right Cart Panel Overlay */}
      {isMobileCartOpen && (
        <div className={styles.mobileCartOverlay}>
          {renderCartPanel()}
        </div>
      )}

      {/* Mobile Floating Cart Bar */}
      {totalCartItems > 0 && !isMobileCartOpen && (
        <div className={styles.mobileFloatingCart} onClick={() => setIsMobileCartOpen(true)}>
          <div className={styles.fcInfo}>
            <span className={styles.fcTitle}>{totalCartItems} Item</span>
            <span className={styles.fcPrice}>Rp {totalCartPrice.toLocaleString('id-ID')}</span>
          </div>
          <button className={styles.fcBtn}>Bayar</button>
        </div>
      )}

    </div>
  );
}
