'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AiChatWidget from '@/components/AiChatWidget';
import LaporanRangeSection from '@/components/LaporanRangeSection';

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

interface PriceHistory {
  id: string;
  price: number;
  recordedAt: string;
  recordedBy: string;
}

function SimpleLineChart({ data, baselinePrice }: { data: PriceHistory[], baselinePrice: number }) {
  const [hovered, setHovered] = useState<{x: number, y: number, price: number, time: number} | null>(null);

  const width = 500;
  const height = 210;
  const paddingLeft = 50;
  const paddingRight = 60; // Provide enough space on the right for the tooltip
  const paddingTop = 45; // Provide enough space on the top for the tooltip
  const paddingBottom = 30;
  
  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;
  
  const timeEnd = new Date().getTime();
  const timeStart = timeEnd - (30 * 24 * 60 * 60 * 1000);
  const timeRange = timeEnd - timeStart;

  const chartPoints = [
    { price: baselinePrice, time: timeStart },
    ...data.map(d => ({ price: Number(d.price), time: new Date(d.recordedAt).getTime() })),
    { price: data.length > 0 ? Number(data[data.length - 1].price) : baselinePrice, time: timeEnd }
  ];
  
  const minPrice = Math.min(...chartPoints.map(d => d.price));
  const maxPrice = Math.max(...chartPoints.map(d => d.price));
  
  const priceRange = (maxPrice - minPrice) || 1; 
  const yPadding = priceRange * 0.1;
  const displayMin = minPrice - yPadding;
  const displayMax = maxPrice + yPadding;
  const displayRange = displayMax - displayMin;

  const getX = (t: number) => paddingLeft + ((t - timeStart) / timeRange) * innerWidth;
  const getY = (p: number) => paddingTop + innerHeight - (((p - displayMin) / displayRange) * innerHeight);
  
  const points = chartPoints.map(d => `${getX(d.time)},${getY(d.price)}`).join(' ');

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ minWidth: '400px', overflow: 'visible' }}>
        {/* Y Axis */}
        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + innerHeight} stroke="#cbd5e1" strokeWidth="1" />
        <text x={paddingLeft - 8} y={paddingTop + 4} fontSize="10" fill="#64748b" textAnchor="end">Rp {(maxPrice/1000).toFixed(0)}k</text>
        <text x={paddingLeft - 8} y={paddingTop + innerHeight} fontSize="10" fill="#64748b" textAnchor="end">Rp {(minPrice/1000).toFixed(0)}k</text>
        
        {/* X Axis */}
        <line x1={paddingLeft} y1={paddingTop + innerHeight} x2={paddingLeft + innerWidth} y2={paddingTop + innerHeight} stroke="#cbd5e1" strokeWidth="1" />
        <text x={paddingLeft} y={paddingTop + innerHeight + 16} fontSize="10" fill="#64748b" textAnchor="middle">30 Hari Lalu</text>
        <text x={paddingLeft + innerWidth} y={paddingTop + innerHeight + 16} fontSize="10" fill="#64748b" textAnchor="middle">Hari Ini</text>

        {/* Grid line untuk baseline */}
        <line 
          x1={paddingLeft} 
          y1={getY(baselinePrice)} 
          x2={paddingLeft + innerWidth} 
          y2={getY(baselinePrice)} 
          stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" 
        />
        
        {/* Line */}
        <polyline
          fill="none"
          stroke="#dc2626"
          strokeWidth="2.5"
          strokeLinejoin="round"
          points={points}
        />

        {/* Data points */}
        {chartPoints.map((d, i) => {
          if (i === 0 || i === chartPoints.length - 1) return null;
          const cx = getX(d.time);
          const cy = getY(d.price);
          return (
            <circle 
              key={i} 
              cx={cx} 
              cy={cy} 
              r="4.5" 
              fill="#ffffff" 
              stroke="#dc2626" 
              strokeWidth="2" 
              style={{ cursor: 'pointer', transition: 'r 0.2s' }}
              onMouseEnter={() => setHovered({ x: cx, y: cy, price: d.price, time: d.time })}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}

        {/* Tooltip */}
        {hovered && (
          <g transform={`translate(${hovered.x}, ${hovered.y - 8})`} style={{ pointerEvents: 'none' }}>
            <rect x="-55" y="-36" width="110" height="32" rx="6" fill="#1e293b" />
            <text x="0" y="-21" fontSize="11" fill="#f8fafc" textAnchor="middle" fontWeight="bold">
              Rp {hovered.price.toLocaleString('id-ID')}
            </text>
            <text x="0" y="-9" fontSize="9" fill="#cbd5e1" textAnchor="middle">
              {new Date(hovered.time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </text>
            <polygon points="-5,-4 5,-4 0,1" fill="#1e293b" />
          </g>
        )}
      </svg>
    </div>
  );
}

function PriceAlertItem({ alert }: { alert: PriceAlert }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState<PriceHistory[] | null>(null);

  const toggleExpand = async () => {
    if (!expanded) {
      if (!chartData && !loading) {
        setLoading(true);
        setError('');
        try {
          const res = await apiFetch(`/ingredients/${alert.ingredientId}/price-history`);
          if (res.ok) {
            const data: PriceHistory[] = await res.json();
            
            // Filter 30 hari terakhir, sort ascending
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const filtered = data
              .filter((d: PriceHistory) => new Date(d.recordedAt) >= thirtyDaysAgo)
              .sort((a: PriceHistory, b: PriceHistory) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
              
            setChartData(filtered);
          } else {
            setError('Gagal memuat riwayat harga.');
          }
        } catch (err) {
          setError('Terjadi kesalahan saat memuat grafik.');
        } finally {
          setLoading(false);
        }
      }
      setExpanded(true);
    } else {
      setExpanded(false);
    }
  };

  return (
    <div className="alert-item card border-danger" onClick={toggleExpand} style={{ cursor: 'pointer' }}>
      <div className="alert-item-header">
        <h3>{alert.ingredientName}</h3>
        <span className="badge badge-danger">
          Naik {alert.increasePercent.toFixed(0)}%
        </span>
      </div>
      <p className="alert-meta">
        Harga baseline: Rp {alert.baselinePrice.toLocaleString('id-ID')} ➜ Sekarang: Rp {alert.currentPrice.toLocaleString('id-ID')} (30 hari terakhir)
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
      
      {expanded && (
        // TODO(Raihan): polish styling/animasi/aksesibilitas warna
        <div className="alert-history-chart" style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }} onClick={(e) => e.stopPropagation()}>
          <h4 style={{ fontSize: '0.85rem', marginBottom: '10px' }}>Tren Harga (30 Hari Terakhir)</h4>
          {loading ? (
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Memuat grafik...</p>
          ) : error ? (
            <p className="text-danger" style={{ fontSize: '0.85rem' }}>{error}</p>
          ) : chartData ? (
            <SimpleLineChart data={chartData} baselinePrice={alert.baselinePrice} />
          ) : null}
        </div>
      )}
    </div>
  );
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

      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
              <PriceAlertItem key={idx} alert={alert} />
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

      <LaporanRangeSection />
      
      <AiChatWidget />
    </div>
  );
}
