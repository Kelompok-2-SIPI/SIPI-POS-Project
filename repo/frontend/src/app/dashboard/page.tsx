'use client';

import { useState, useEffect, useId } from 'react';
import { apiFetch, resolveAssetUrl } from '@/lib/api';
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
  imageUrl?: string | null;
}

interface MonthlySales {
  month: string;
  label: string;
  totalRevenue: number;
  transactionsCount: number;
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
  affectedMenus: { menuId: string; menuName: string; currentHpp: number; sellingPrice: number }[];
}

interface PriceHistory {
  id: string;
  price: number;
  recordedAt: string;
  recordedBy: string;
}

function SimpleLineChart({ data, baselinePrice }: { data: PriceHistory[], baselinePrice: number }) {
  const [hovered, setHovered] = useState<{x: number, y: number, price: number, time: number} | null>(null);
  const uid = useId();

  const width = 500;
  const height = 170;
  const paddingLeft = 50;
  const paddingRight = 60; // Provide enough space on the right for the tooltip
  const paddingTop = 40; // Provide enough space on the top for the tooltip
  const paddingBottom = 26;
  
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

  // Titik layar (px) dari chartPoints — dipakai untuk menggambar kurva halus, bukan garis lurus.
  const screenPoints = chartPoints.map(d => ({ x: getX(d.time), y: getY(d.price) }));

  // Kurva halus lewat tiap titik data (quadratic bezier via titik tengah antar titik) — murni presentasi,
  // tidak mengubah perhitungan getX/getY/data asli sama sekali.
  const buildSmoothLinePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      d += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
    }
    const last = pts[pts.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
  };

  const linePath = buildSmoothLinePath(screenPoints);
  const bottomY = paddingTop + innerHeight;
  const firstX = screenPoints[0]?.x ?? paddingLeft;
  const lastX = screenPoints[screenPoints.length - 1]?.x ?? paddingLeft;
  const areaPath = `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

  const gradientId = `chart-gradient-${uid}`;
  const shadowId = `chart-tooltip-shadow-${uid}`;

  return (
    <div className="price-trend-chart" style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ minWidth: '280px', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
          <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Y Axis */}
        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + innerHeight} stroke="var(--color-outline)" strokeWidth="1" />
        <text x={paddingLeft - 8} y={paddingTop + 4} fontSize="10" fill="var(--text-secondary)" textAnchor="end">Rp {(maxPrice/1000).toFixed(0)}k</text>
        <text x={paddingLeft - 8} y={paddingTop + innerHeight} fontSize="10" fill="var(--text-secondary)" textAnchor="end">Rp {(minPrice/1000).toFixed(0)}k</text>

        {/* X Axis */}
        <line x1={paddingLeft} y1={paddingTop + innerHeight} x2={paddingLeft + innerWidth} y2={paddingTop + innerHeight} stroke="var(--color-outline)" strokeWidth="1" />
        <text x={paddingLeft} y={paddingTop + innerHeight + 16} fontSize="10" fill="var(--text-secondary)" textAnchor="middle">30 Hari Lalu</text>
        <text x={paddingLeft + innerWidth} y={paddingTop + innerHeight + 16} fontSize="10" fill="var(--text-secondary)" textAnchor="middle">Hari Ini</text>

        {/* Grid line untuk baseline */}
        <line
          x1={paddingLeft}
          y1={getY(baselinePrice)}
          x2={paddingLeft + innerWidth}
          y2={getY(baselinePrice)}
          stroke="var(--color-outline)" strokeWidth="1" strokeDasharray="4 4"
        />

        {/* Gradient fill tipis di bawah kurva */}
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />

        {/* Kurva harga (smooth, bukan garis lurus) */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-danger)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
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
              fill="var(--color-canvas)"
              stroke="var(--color-danger)"
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
            <rect x="-55" y="-36" width="110" height="32" rx="10" fill="var(--color-ink-deep)" filter={`url(#${shadowId})`} />
            <text x="0" y="-21" fontSize="11" fill="var(--color-canvas)" textAnchor="middle" fontWeight="bold">
              Rp {hovered.price.toLocaleString('id-ID')}
            </text>
            <text x="0" y="-9" fontSize="9" fill="rgba(255,255,255,0.7)" textAnchor="middle">
              {new Date(hovered.time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </text>
            <polygon points="-5,-4 5,-4 0,1" fill="var(--color-ink-deep)" />
          </g>
        )}
      </svg>
    </div>
  );
}

function MonthlySalesChart({ data }: { data: MonthlySales[] }) {
  const [hovered, setHovered] = useState<{ x: number; y: number; item: MonthlySales } | null>(null);

  const width = 500;
  const height = 240;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 60;
  const paddingBottom = 30;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const maxRevenue = Math.max(...data.map(d => d.totalRevenue), 1);
  const maxIndex = data.reduce((maxI, d, i, arr) => (d.totalRevenue > arr[maxI].totalRevenue ? i : maxI), 0);

  const barGap = 12;
  const barWidth = data.length > 0 ? (innerWidth - barGap * (data.length - 1)) / data.length : 0;
  const getBarHeight = (rev: number) => (maxRevenue > 0 ? (rev / maxRevenue) * innerHeight : 0);
  const fmtShort = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}jt` : n >= 1_000 ? `${Math.round(n / 1000)}rb` : `${n}`);

  return (
    <div className="monthly-sales-chart" style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ minWidth: '280px', overflow: 'visible' }}>
        {/* Y Axis */}
        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + innerHeight} stroke="var(--color-outline)" strokeWidth="1" />
        <text x={paddingLeft - 8} y={paddingTop + 4} fontSize="10" fill="var(--text-secondary)" textAnchor="end">Rp {fmtShort(maxRevenue)}</text>
        <text x={paddingLeft - 8} y={paddingTop + innerHeight} fontSize="10" fill="var(--text-secondary)" textAnchor="end">Rp 0</text>

        {/* X Axis */}
        <line x1={paddingLeft} y1={paddingTop + innerHeight} x2={paddingLeft + innerWidth} y2={paddingTop + innerHeight} stroke="var(--color-outline)" strokeWidth="1" />

        {data.map((d, i) => {
          const barH = getBarHeight(d.totalRevenue);
          const x = paddingLeft + i * (barWidth + barGap);
          const y = paddingTop + innerHeight - barH;
          const isMax = i === maxIndex && d.totalRevenue > 0;
          return (
            <g key={d.month}>
              {isMax && (
                <text x={x + barWidth / 2} y={y - 8} fontSize="9" fontWeight="bold" fill="var(--color-success)" textAnchor="middle">
                  Tertinggi
                </text>
              )}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, 2)}
                rx="4"
                fill={isMax ? 'var(--color-success)' : 'var(--color-primary)'}
                opacity={isMax ? 1 : 0.85}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={() => setHovered({ x: x + barWidth / 2, y, item: d })}
                onMouseLeave={() => setHovered(null)}
              />
              <text x={x + barWidth / 2} y={paddingTop + innerHeight + 16} fontSize="10" fill="var(--text-secondary)" textAnchor="middle">
                {d.label.split(' ')[0]}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {hovered && (
          <g transform={`translate(${hovered.x}, ${hovered.y - 12})`} style={{ pointerEvents: 'none' }}>
            <rect x="-72" y="-50" width="144" height="42" rx="10" fill="var(--color-ink-deep)" />
            <text x="0" y="-32" fontSize="12" fill="var(--color-canvas)" textAnchor="middle" fontWeight="bold">
              Rp {hovered.item.totalRevenue.toLocaleString('id-ID')}
            </text>
            <text x="0" y="-18" fontSize="10" fill="rgba(255,255,255,0.7)" textAnchor="middle">
              {hovered.item.label} · {hovered.item.transactionsCount} transaksi
            </text>
            <polygon points="-5,-8 5,-8 0,-2" fill="var(--color-ink-deep)" />
          </g>
        )}
      </svg>
    </div>
  );
}

function PriceAlertItem({ alert, targetHpp }: { alert: PriceAlert; targetHpp: number }) {
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
    <div className="alert-item" onClick={toggleExpand} style={{ cursor: 'pointer' }}>
      <div className="alert-item-header">
        <h3>{alert.ingredientName}</h3>
        <span className="badge badge-danger">
          <svg width="12" height="12" viewBox="0 -960 960 960" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="m136-240-56-56 296-298 160 160 208-206H600v-80h240v240h-80v-144L536-408 376-568 136-240Z"/>
          </svg>
          Naik {alert.increasePercent.toFixed(0)}%
        </span>
      </div>
      <p className="alert-meta">
        Harga baseline: Rp {alert.baselinePrice.toLocaleString('id-ID')} ➜ Sekarang: Rp {alert.currentPrice.toLocaleString('id-ID')} (30 hari terakhir)
      </p>
      {alert.affectedMenus.length > 0 && (
        <div className="affected-menus">
          <span className="sub-label">Menu Terdampak &amp; Rekomendasi Harga:</span>
          <ul className="affected-list">
            {alert.affectedMenus.map((menu, mIdx) => {
              const recPrice = targetHpp > 0
                ? Math.ceil((menu.currentHpp / (targetHpp / 100)) / 1000) * 1000
                : 0;
              return (
                <li key={mIdx}>
                  <div className="affected-menu-row">
                    <span>{menu.menuName}</span>
                    <span>HPP baru: Rp {menu.currentHpp.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="affected-menu-rec">
                    Rekomendasi harga baru: <strong>Rp {recPrice.toLocaleString('id-ID')}</strong>
                    {menu.sellingPrice > 0 && (
                      <span className="affected-menu-rec-note"> (saat ini Rp {menu.sellingPrice.toLocaleString('id-ID')}, target HPP {targetHpp}%)</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {expanded && (
        <div className="alert-history-chart" onClick={(e) => e.stopPropagation()}>
          <h4>Tren Harga (30 Hari Terakhir)</h4>
          {loading ? (
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Memuat grafik...</p>
          ) : error ? (
            <p className="text-danger" style={{ fontSize: '0.85rem' }}>{error}</p>
          ) : chartData ? (
            <SimpleLineChart data={chartData} baselinePrice={alert.baselinePrice} />
          ) : null}
        </div>
      )}

      <style jsx>{`
        .alert-item {
          background-color: var(--color-canvas);
          border: 1px solid var(--color-danger);
          border-radius: var(--radius-lg);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: var(--transition-fast);
        }
        .alert-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .alert-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .alert-item-header h3 {
          font-size: 15px;
          font-weight: 700;
        }
        .badge-danger {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .affected-list li {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .affected-menu-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }
        .affected-menu-rec {
          color: var(--color-success);
        }
        .affected-menu-rec-note {
          color: var(--text-tertiary);
          font-weight: 400;
        }
        .alert-history-chart {
          margin-top: 12px;
          border-top: 1px solid var(--color-outline);
          padding-top: 12px;
        }
        .alert-history-chart h4 {
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [topMenus, setTopMenus] = useState<TopMenu[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
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

      // Fetch tren penjualan 6 bulan terakhir
      const monthlySalesRes = await apiFetch('/dashboard/monthly-sales?months=6');
      if (monthlySalesRes.ok) {
        const monthlySalesData = await monthlySalesRes.json();
        setMonthlySales(monthlySalesData);
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
          <div className="banner-icon">
            <svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/>
            </svg>
          </div>
          <p>{summary.summaryText}</p>
        </div>
      )}

      {/* Numerical Stats Grid */}
      {summary && (
        <div className="stats-grid">
          <div className="stat-card card">
            <svg className="stat-watermark" width="72" height="72" viewBox="0 -960 960 960" fill="currentColor">
              <path d="M320-240q-83 0-141.5-58.5T120-440q0-83 58.5-141.5T320-640h320q83 0 141.5 58.5T840-440q0 83-58.5 141.5T640-240H320Zm0-80h320q50 0 85-35t35-85q0-50-35-85t-85-35H320q-50 0-85 35t-35 85q0 50 35 85t85 35Zm160-40q33 0 56.5-23.5T560-440q0-33-23.5-56.5T480-520q-33 0-56.5 23.5T400-440q0 33 23.5 56.5T480-360Z"/>
            </svg>
            <span className="label">Pendapatan Kotor</span>
            <span className="value text-primary">
              Rp {summary.totalRevenue.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="stat-card card">
            <svg className="stat-watermark" width="72" height="72" viewBox="0 -960 960 960" fill="currentColor">
              <path d="M240-80q-33 0-56.5-23.5T160-160v-480l40-40 40 40 40-40 40 40 40-40 40 40 40-40 40 40 40-40 40 40 40-40 40 40v480q0 33-23.5 56.5T760-80H240Zm0-80h480v-424l-8 8-40-40-40 40-40-40-40 40-40-40-40 40-40-40-40 40-8-8v424Zm120-120h240v-80H360v80Zm0-160h240v-80H360v80Z"/>
            </svg>
            <span className="label">Transaksi Selesai</span>
            <span className="value text-secondary">
              {summary.transactionsCount} Selesai
            </span>
          </div>
          <div className="stat-card card">
            <svg className="stat-watermark" width="72" height="72" viewBox="0 -960 960 960" fill="currentColor">
              <path d="M160-200q-33 0-56.5-23.5T80-280v-400q0-33 23.5-56.5T160-760h640q33 0 56.5 23.5T880-680v400q0 33-23.5 56.5T800-200H160Zm0-80h640v-400H160v400Zm480-120q33 0 56.5-23.5T720-480q0-33-23.5-56.5T640-560q-33 0-56.5 23.5T560-480q0 33 23.5 56.5T640-400ZM160-600h640v-80H160v80Z"/>
            </svg>
            <span className="label">Estimasi Laba Kotor</span>
            <span className="value text-success">
              Rp {summary.grossProfit.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      )}

      {/* Tren Penjualan Bulanan — data asli dari histori transaksi, untuk lihat bulan mana yang ramai */}
      {monthlySales.length > 0 && (
        <div className="monthly-sales-section card">
          <div className="monthly-sales-header">
            <h2>📈 Tren Penjualan Bulanan</h2>
            <p className="section-desc">Pendapatan per bulan (6 bulan terakhir) — bandingkan bulan mana yang paling ramai.</p>
          </div>
          <MonthlySalesChart data={monthlySales} />
        </div>
      )}

      {/* Price Alerts Warning Box (FR-16) */}
      {priceAlerts.length > 0 && (
        <div className="price-alerts-section">
          <h2>⚠️ Kenaikan Harga Bahan Baku ({priceAlerts.length})</h2>
          <div className="alerts-list">
            {priceAlerts.map((alert, idx) => (
              <PriceAlertItem key={idx} alert={alert} targetHpp={targetHpp} />
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
            topMenus.map((menu, idx) => {
              const maxQty = topMenus[0]?.quantitySold || 1;
              const barPct = maxQty > 0 ? Math.max(6, (menu.quantitySold / maxQty) * 100) : 0;
              return (
                <div key={menu.id} className="top-menu-row">
                  <div className="top-menu-left">
                    <div className="top-menu-photo">
                      {menu.imageUrl ? (
                        <img src={resolveAssetUrl(menu.imageUrl) || ''} alt={menu.name} />
                      ) : (
                        <svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor" style={{ flexShrink: 0 }}>
                          <path d="M280-80v-366q-51-14-85.5-56T160-600v-280h80v280h40v-280h80v280h40v-280h80v280q0 56-34.5 98T400-446v366h-120Zm400 0v-320H560v-280q0-83 58.5-141.5T760-880v800h-80Z"/>
                        </svg>
                      )}
                      <span className="top-rank">{idx + 1}</span>
                    </div>
                    <div className="top-menu-info">
                      <h4>{menu.name}</h4>
                      <span className="top-sales-count">{menu.quantitySold} porsi terjual</span>
                      <div className="top-menu-bar-track">
                        <div className="top-menu-bar-fill" style={{ width: `${barPct}%` }} />
                      </div>
                    </div>
                  </div>
                  <span className="top-total-sales">
                    Rp {menu.totalSales.toLocaleString('id-ID')}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
      </div>

      <LaporanRangeSection />

      <AiChatWidget />

      {/* Tahap 5a: banner ringkasan, stat cards, dan Menu Terlaris — styling scoped di sini.
          Margin Kritis, Price Alerts, SimpleLineChart, LaporanRangeSection tidak disentuh. */}
      <style jsx>{`
        .summary-banner {
          background-color: var(--color-info-light);
          border: 1px solid var(--color-info);
          align-items: flex-start;
        }
        .banner-icon {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: var(--radius-sm);
          background-color: var(--color-info);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .summary-banner p {
          line-height: 1.5;
        }
        .monthly-sales-header {
          margin-bottom: 8px;
        }
        .monthly-sales-header h2 {
          font-size: 18px;
          margin-bottom: 4px;
        }
        .monthly-sales-header .section-desc {
          margin: 0;
        }
        .stat-card {
          position: relative;
          overflow: hidden;
        }
        .stat-watermark {
          position: absolute;
          top: -8px;
          right: -8px;
          color: var(--color-primary);
          opacity: 0.08;
        }
        .stat-card .label {
          position: relative;
        }
        .stat-card .value {
          position: relative;
          font-size: 22px;
          font-weight: 700;
        }
        @media (min-width: 768px) {
          .stat-card .value {
            font-size: 26px;
          }
        }
        .top-menu-left {
          align-items: center;
        }
        .top-menu-photo {
          position: relative;
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          border-radius: var(--radius-sm);
          background-color: var(--color-surface-soft);
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .top-menu-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .top-menu-photo .top-rank {
          position: absolute;
          bottom: -4px;
          left: -4px;
          width: 20px;
          height: 20px;
          font-family: var(--font-jakarta);
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          background-color: var(--color-primary);
          border: 2px solid var(--color-canvas);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .top-menu-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .top-menu-bar-track {
          width: 100%;
          min-width: 120px;
          height: 5px;
          border-radius: var(--radius-pill);
          background-color: var(--color-surface-soft);
          overflow: hidden;
          margin-top: 2px;
        }
        .top-menu-bar-fill {
          height: 100%;
          border-radius: var(--radius-pill);
          background-color: var(--color-primary);
        }
      `}</style>
    </div>
  );
}
