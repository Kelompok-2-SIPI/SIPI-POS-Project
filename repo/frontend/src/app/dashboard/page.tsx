'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface SummaryData {
  transactionsCount: number;
  totalRevenue: number;
  totalHpp: number;
  grossProfit: number;
  topMenu: { name: string; quantity: number };
  summaryText: string;
}

interface TopMenu {
  id: string;
  name: string;
  quantitySold: number;
  totalSales: number;
}

interface CriticalMenu {
  id: string;
  name: string;
  sellingPrice: number;
  hpp: number;
  marginRatio: number;
}

interface PriceAlert {
  ingredientId: string;
  ingredientName: string;
  baselinePrice: number;
  currentPrice: number;
  increasePercent: number;
  affectedMenus: { menuId: string; menuName: string; currentHpp: number }[];
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [topMenus, setTopMenus] = useState<TopMenu[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Configurable margin parameters
  const [criticalThreshold, setCriticalThreshold] = useState(80);
  const [targetHpp, setTargetHpp] = useState(50);
  const [tempCritical, setTempCritical] = useState('80');
  const [tempTarget, setTempTarget] = useState('50');
  const [allMenus, setAllMenus] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Load config from localStorage
    const thresh = localStorage.getItem('sipi_critical_threshold') || '80';
    const target = localStorage.getItem('sipi_target_hpp') || '50';
    setCriticalThreshold(Number(thresh));
    setTargetHpp(Number(target));
    setTempCritical(thresh);
    setTempTarget(target);

    fetchDashboardData();
    
    // Listen to sync completed event to reload dashboard stats
    const handleSyncComplete = () => {
      fetchDashboardData();
    };
    window.addEventListener('sipi_sync_completed', handleSyncComplete);
    return () => window.removeEventListener('sipi_sync_completed', handleSyncComplete);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch summary
      const summaryRes = await apiFetch('/dashboard/summary');
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }

      // Fetch top menus
      const topMenusRes = await apiFetch('/dashboard/top-menus');
      if (topMenusRes.ok) {
        const topMenusData = await topMenusRes.json();
        setTopMenus(topMenusData);
      }

      // Fetch all menus to calculate critical margins dynamically on the client
      const menusRes = await apiFetch('/menus');
      if (menusRes.ok) {
        const menusData = await menusRes.json();
        setAllMenus(menusData);
      }

      // Fetch price alerts
      const alertsRes = await apiFetch('/dashboard/price-alerts');
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setPriceAlerts(alertsData);
      }
    } catch (err) {
      setError('Gagal memuat data laporan bisnis.');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('sipi_critical_threshold', tempCritical);
    localStorage.setItem('sipi_target_hpp', tempTarget);
    setCriticalThreshold(Number(tempCritical));
    setTargetHpp(Number(tempTarget));
    setShowSettings(false);
  };

  // Dynamically calculate critical margins based on user settings
  const criticalMargins = allMenus
    .map((menu) => {
      const sellingPrice = Number(menu.sellingPrice);
      const hpp = Number(menu.hpp);
      const marginRatio = sellingPrice > 0 ? hpp / sellingPrice : 0;
      return {
        id: menu.id,
        name: menu.name,
        sellingPrice,
        hpp,
        marginRatio,
      };
    })
    .filter((menu) => menu.marginRatio > (criticalThreshold / 100));

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1>Laporan Bisnis Owner</h1>
          <p>Tinjauan performa outlet dan margin profit hari ini</p>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="btn-settings" title="Pengaturan Parameter Margin">
          ⚙️ Parameter
        </button>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel card">
          <div className="sheet-header">
            <h3>Pengaturan Batas Margin</h3>
            <button onClick={() => setShowSettings(false)} className="btn-close">Tutup</button>
          </div>
          <form onSubmit={saveSettings}>
            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Peringatan Margin Kritis HPP (&gt; %)</label>
                <input
                  type="number"
                  className="input-field"
                  value={tempCritical}
                  onChange={(e) => setTempCritical(e.target.value)}
                  min="10"
                  max="95"
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">Target HPP Rekomendasi Harga (%)</label>
                <input
                  type="number"
                  className="input-field"
                  value={tempTarget}
                  onChange={(e) => setTempTarget(e.target.value)}
                  min="10"
                  max="90"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full">Simpan Batas Margin</button>
          </form>
        </div>
      )}

      {error && <div className="error-alert">{error}</div>}

      {/* Summary Text Alert Banner (FR-14) */}
      {summary && (
        <div className="summary-banner card">
          <div className="banner-icon">⚡</div>
          <p>{summary.summaryText}</p>
        </div>
      )}

      {/* Numerical Stats Grid */}
      {summary && (
        <div className="stats-grid">
          <div className="stat-card card">
            <span className="label">Pendapatan Kotor</span>
            <span className="value text-primary">
              Rp {summary.totalRevenue.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="stat-card card">
            <span className="label">Transaksi Selesai</span>
            <span className="value text-secondary">
              {summary.transactionsCount} Selesai
            </span>
          </div>
          <div className="stat-card card">
            <span className="label">Estimasi Laba Kotor</span>
            <span className="value text-success">
              Rp {summary.grossProfit.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      )}

      {/* Price Alerts Warning Box (FR-16) */}
      {priceAlerts.length > 0 && (
        <div className="price-alerts-section">
          <h2>⚠️ Kenaikan Harga Bahan Baku ({priceAlerts.length})</h2>
          <div className="alerts-list">
            {priceAlerts.map((alert, idx) => (
              <div key={idx} className="alert-item card border-danger">
                <div className="alert-item-header">
                  <h3>{alert.ingredientName}</h3>
                  <span className="badge badge-danger">
                    Naik {alert.increasePercent.toFixed(0)}%
                  </span>
                </div>
                <p className="alert-meta">
                  Harga baseline: Rp {alert.baselinePrice.toLocaleString('id-ID')} ➜ Sekarang: Rp {alert.currentPrice.toLocaleString('id-ID')} (7 hari terakhir)
                </p>
                {alert.affectedMenus.length > 0 && (
                  <div className="affected-menus">
                    <span className="sub-label">Menu Terdampak:</span>
                    <ul className="affected-list">
                      {alert.affectedMenus.map((menu, mIdx) => (
                        <li key={mIdx}>
                          {menu.menuName} (HPP baru: Rp {menu.currentHpp.toLocaleString('id-ID')})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Margin Kritis Warning (FR-10) */}
      {criticalMargins.length > 0 && (
        <div className="critical-margins-section">
          <h2>🚨 Margin Kritis (HPP &gt; {criticalThreshold}%)</h2>
          <p className="section-desc">Menu berikut memerlukan penyesuaian harga jual segera.</p>
          <div className="critical-grid">
            {criticalMargins.map((menu) => {
              const hppPct = (menu.marginRatio * 100).toFixed(0);
              const recPrice = Math.ceil((Number(menu.hpp) / (targetHpp / 100)) / 1000) * 1000;
              return (
                <div key={menu.id} className="critical-card card">
                  <div className="critical-header">
                    <h3>{menu.name}</h3>
                    <span className="badge badge-danger">HPP {hppPct}%</span>
                  </div>
                  <div className="critical-details">
                    <div className="row">
                      <span>Harga Jual:</span>
                      <span>Rp {menu.sellingPrice.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="row">
                      <span>HPP:</span>
                      <span className="text-danger font-bold">Rp {menu.hpp.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="row rec-row">
                      <span>Rekomendasi Harga:</span>
                      <span className="text-success font-bold">Rp {recPrice.toLocaleString('id-ID')}</span>
                    </div>
                    <span className="rec-hint">*Target HPP {targetHpp}% (Gross Margin {100 - targetHpp}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Menus Today (FR-11) */}
      <div className="top-menus-section">
        <h2>🔥 Menu Terlaris Hari Ini</h2>
        <div className="top-menus-list card">
          {topMenus.length === 0 ? (
            <div className="empty-state">
              <p>Belum ada menu yang terjual hari ini.</p>
            </div>
          ) : (
            topMenus.map((menu, idx) => (
              <div key={menu.id} className="top-menu-row">
                <div className="top-menu-left">
                  <span className="top-rank">#{idx + 1}</span>
                  <div>
                    <h4>{menu.name}</h4>
                    <span className="top-sales-count">{menu.quantitySold} porsi terjual</span>
                  </div>
                </div>
                <span className="top-total-sales">
                  Rp {menu.totalSales.toLocaleString('id-ID')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
