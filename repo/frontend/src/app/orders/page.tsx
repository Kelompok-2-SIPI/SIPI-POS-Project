'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import styles from './orders.module.css';

interface OrderItem {
  id?: string;
  menuId: string;
  menuName: string;
  qty: number;
  unitPrice: number;
}

interface Order {
  id: string;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod: string;
  totalPrice: number;
  createdAt: string;
  completedAt?: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<'Semua' | 'Pending' | 'Selesai'>('Semua');
  const [isKitchenMode, setIsKitchenMode] = useState(false);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  
  // 'detail' mode views the order. 'payment' mode completes it.
  const [panelMode, setPanelMode] = useState<'detail' | 'payment'>('detail');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'non_cash'>('cash');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Editable cart for pending orders
  const [editCart, setEditCart] = useState<OrderItem[]>([]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // auto refresh
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await apiFetch('/transactions');
      if (res.ok) {
        const data = await res.json();
        
        // Fetch full details (which includes items) for all pending orders for Kitchen Mode
        // because the main endpoint might only return itemsCount
        const pendingOrders = data.filter((o: Order) => o.status === 'pending' && (!o.items || o.items.length === 0));
        if (pendingOrders.length > 0) {
          const details = await Promise.all(
            pendingOrders.map((o: Order) => apiFetch(`/transactions/${o.id}`).then(r => r.json()))
          );
          details.forEach(d => {
            const idx = data.findIndex((o: Order) => o.id === d.id);
            if (idx > -1) data[idx] = d;
          });
        }

        setOrders(data);
        if (selectedOrder) {
          const updatedSelected = data.find((o: Order) => o.id === selectedOrder.id);
          if (updatedSelected && updatedSelected.status !== selectedOrder.status) {
            setSelectedOrder(updatedSelected);
            setEditCart(updatedSelected.items ? updatedSelected.items : []);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    }
  };

  useEffect(() => {
    let result = orders.filter(o => o.status !== 'cancelled');
    if (activeFilter === 'Pending') result = result.filter((o) => o.status === 'pending');
    if (activeFilter === 'Selesai') result = result.filter((o) => o.status === 'completed');
    setFilteredOrders(result);
  }, [orders, activeFilter]);

  const handleSelectOrder = async (order: Order) => {
    let fullOrder = order;
    // If items are missing (e.g. for completed orders which we didn't pre-fetch), fetch them now
    if (!fullOrder.items || fullOrder.items.length === 0) {
      try {
        const res = await apiFetch(`/transactions/${order.id}`);
        if (res.ok) {
          fullOrder = await res.json();
          // Update the list so we don't have to fetch again
          setOrders(prev => prev.map(o => o.id === fullOrder.id ? fullOrder : o));
        }
      } catch (e) {
        console.error('Failed to fetch order detail');
      }
    }
    
    setSelectedOrder(fullOrder);
    setEditCart(fullOrder.items ? fullOrder.items.map(i => ({...i})) : []);
    setPanelMode('detail');
    setIsMobileDetailOpen(true);
  };

  const closeDetail = () => {
    setSelectedOrder(null);
    setIsMobileDetailOpen(false);
    setPanelMode('detail');
  };

  // Fake edit functions (since backend doesn't have an update endpoint for items yet)
  // To truly edit, we'd need a PUT /transactions/:id endpoint.
  // For now, we allow UI edits as requested, but completing the order will use the original logic or we mock it.
  const incrementQty = (menuId: string) => {
    setEditCart(editCart.map(item => item.menuId === menuId ? { ...item, qty: item.qty + 1 } : item));
  };
  const decrementQty = (menuId: string) => {
    setEditCart(editCart.map(item => item.menuId === menuId ? { ...item, qty: item.qty - 1 } : item).filter(item => item.qty > 0));
  };

  const currentTotal = editCart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const changeAmount = paymentMethod === 'cash' && cashAmount ? parseInt(cashAmount.replace(/\D/g, '')) - currentTotal : 0;

  const handleCompleteOrder = async (orderId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/transactions/${orderId}/complete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchOrders();
        closeDetail();
      } else {
        setError(data.error || 'Gagal menyelesaikan pesanan.');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  const Icons = {
    Kasir: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
    Pesanan: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    Laporan: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    Menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    Lainnya: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
    Back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="m15 18-6-6 6-6"/></svg>,
    Chef: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></svg>
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className={`${styles.badge} ${styles.pending}`}>Pending</span>;
      case 'completed': return <span className={`${styles.badge} ${styles.completed}`}>Selesai</span>;
      default: return <span className={styles.badge}>{status}</span>;
    }
  };

  const renderDetailPanel = () => {
    if (!selectedOrder) return (
      <div className={styles.emptyState}>
        <p>Pilih pesanan di sebelah kiri untuk melihat detail</p>
      </div>
    );

    if (panelMode === 'detail') {
      const isEditable = selectedOrder.status === 'pending';
      return (
        <>
          <div className={styles.panelHeader}>
            <h2>Detail Pesanan</h2>
            {isMobileDetailOpen && <button className={styles.iconBtn} onClick={closeDetail}>{Icons.Back}</button>}
          </div>
          <div className={styles.panelBody}>
            <div style={{marginBottom: 16}}>
              <div style={{fontSize: 'var(--text-sm)', color: 'var(--ink-soft)'}}>ID Pesanan</div>
              <div style={{fontSize: 'var(--text-lg)', fontWeight: 700}}>#{selectedOrder.id.slice(0,8).toUpperCase()}</div>
              <div style={{marginTop: 8}}>{getStatusBadge(selectedOrder.status)}</div>
            </div>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
              {editCart.map((item, idx) => (
                <div key={idx} className={styles.detailItem}>
                  <div className={styles.detailItemInfo}>
                    <p className={styles.detailItemName}>{item.menuName}</p>
                    <div className={styles.detailItemPrice}>Rp {item.unitPrice.toLocaleString('id-ID')}</div>
                  </div>
                  {isEditable ? (
                    <div className={styles.qtyControls}>
                      <button className={styles.qtyBtnWrapper} onClick={() => decrementQty(item.menuId)}>
                        <div className={`${styles.qtyBtnRound} ${styles.decrease}`}>−</div>
                      </button>
                      <span className={styles.qtyValue}>{item.qty}</span>
                      <button className={styles.qtyBtnWrapper} onClick={() => incrementQty(item.menuId)}>
                        <div className={`${styles.qtyBtnRound} ${styles.increase}`}>+</div>
                      </button>
                    </div>
                  ) : (
                    <div className={styles.qtyValue}>{item.qty}x</div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.panelFooter}>
            <div className={styles.dividerTicket}></div>
            <div className={styles.summaryRow}>
              <span>Waktu Pesan</span>
              <span>{new Date(selectedOrder.createdAt).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
            </div>
            {selectedOrder.status !== 'pending' && (
              <div className={styles.summaryRow}>
                <span>Metode Pembayaran</span>
                <span style={{textTransform: 'capitalize'}}>{selectedOrder.paymentMethod === 'cash' ? 'Tunai' : 'Non-Tunai (QRIS)'}</span>
              </div>
            )}
            <div className={`${styles.summaryRow} ${styles.total}`} style={{marginTop: 8}}>
              <span>Total</span>
              <span>Rp {currentTotal.toLocaleString('id-ID')}</span>
            </div>
            
            {selectedOrder.status === 'pending' && (
              <button className={styles.primaryBtn} onClick={() => setPanelMode('payment')}>
                Proses Pembayaran
              </button>
            )}
          </div>
        </>
      );
    }

    if (panelMode === 'payment') {
      return (
        <>
          <div className={styles.panelHeader}>
            <button className={styles.iconBtn} onClick={() => setPanelMode('detail')}>{Icons.Back}</button>
            <h2>Pembayaran</h2>
            <div style={{width: 44}}></div>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.paymentOptions}>
              <div 
                className={`${styles.payMethodCard} ${paymentMethod === 'cash' ? styles.active : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <span>Tunai</span>
              </div>
              <div 
                className={`${styles.payMethodCard} ${paymentMethod === 'non_cash' ? styles.active : ''}`}
                onClick={() => setPaymentMethod('non_cash')}
              >
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
              <span>Rp {currentTotal.toLocaleString('id-ID')}</span>
            </div>
            <button 
              className={styles.primaryBtn} 
              disabled={loading}
              onClick={() => handleCompleteOrder(selectedOrder.id)}
            >
              {loading ? 'Memproses...' : 'Selesaikan Pesanan'}
            </button>
          </div>
        </>
      );
    }
  };

  return (
    <div className={styles.ordersWrapper}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>S</div>
        
        <div className={styles.sidebarGroup}>
          <div className={styles.sidebarGroupTitle}>Operasional</div>
          <Link href="/pos" className={styles.sidebarItem}>
            {Icons.Kasir}
            <span className={styles.sidebarLabel}>Kasir</span>
            <div className={styles.tooltip}>Kasir</div>
          </Link>
          <div className={`${styles.sidebarItem} ${styles.active}`}>
            {Icons.Pesanan}
            <span className={styles.sidebarLabel}>Pesanan</span>
          </div>
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

      <main className={styles.mainArea}>
        <header className={styles.header}>
          <h1>Pesanan</h1>
          <div className={styles.headerActions}>
            <button 
              className={`${styles.kitchenToggle} ${isKitchenMode ? styles.active : ''}`}
              onClick={() => setIsKitchenMode(!isKitchenMode)}
            >
              {Icons.Chef} Mode Dapur
            </button>
          </div>
        </header>

        {!isKitchenMode && (
          <div className={styles.filters}>
            {['Semua', 'Pending', 'Selesai'].map((cat) => (
              <button
                key={cat}
                className={`${styles.chip} ${activeFilter === cat ? styles.active : ''}`}
                onClick={() => setActiveFilter(cat as any)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className={styles.ordersGridWrapper}>
          <div className={styles.ordersGridContainer}>
            {filteredOrders.length === 0 ? (
              <div style={{textAlign: 'center', color: 'var(--ink-faint)', marginTop: '2rem'}}>Belum ada pesanan masuk.</div>
            ) : isKitchenMode ? (
              <div className={styles.kitchenGrid}>
                {filteredOrders.filter(o => o.status === 'pending').map(order => (
                  <div key={order.id} className={styles.kitchenCard}>
                    <div className={styles.kitchenCardHeader}>
                      <div className={styles.kitchenOrderId}>#{order.id.slice(0,4).toUpperCase()}</div>
                      <div className={styles.kitchenTime}>{new Date(order.createdAt).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</div>
                    </div>
                    <div className={styles.kitchenItems}>
                      {order.items?.map((item, idx) => (
                        <div key={idx} className={styles.kitchenItemRow}>
                          <span>{item.menuName}</span>
                          <span>{item.qty}x</span>
                        </div>
                      ))}
                    </div>
                    <div className={styles.kitchenAction}>
                      <button 
                        className={styles.primaryBtn} 
                        style={{height: 56, fontSize: 'var(--text-lg)'}}
                        onClick={() => handleCompleteOrder(order.id)}
                      >
                        Tandai Selesai
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.ordersGrid}>
                {filteredOrders.map(order => (
                  <div 
                    key={order.id} 
                    className={`${styles.orderCard} ${selectedOrder?.id === order.id ? styles.active : ''}`}
                    onClick={() => handleSelectOrder(order)}
                  >
                    <div className={styles.cardHeader}>
                      <div>
                        <div className={styles.orderId}>#{order.id.slice(0,8).toUpperCase()}</div>
                        <div className={styles.orderTime}>{new Date(order.createdAt).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div>
                      <div className={styles.orderSummary}>{order.items?.length ?? 0} Item</div>
                      <div className={styles.orderTotal}>Rp {order.totalPrice.toLocaleString('id-ID')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right Detail Panel (Desktop) */}
      {!isKitchenMode && (
        <aside className={styles.detailPanel}>
          {renderDetailPanel()}
        </aside>
      )}

      {/* Mobile Detail Panel Overlay */}
      {isMobileDetailOpen && !isKitchenMode && (
        <div className={styles.mobileDetailOverlay}>
          {renderDetailPanel()}
        </div>
      )}
    </div>
  );
}
