'use client';

import { useState } from 'react';
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

interface PriceAlert {
  ingredientId: string;
  ingredientName: string;
  baselinePrice: number;
  currentPrice: number;
  increasePercent: number;
  affectedMenus: { menuId: string; menuName: string; currentHpp: number }[];
}

interface CriticalMargin {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  hpp: number;
  marginRatio: number;
  recordedAt: string;
}

export default function LaporanRangeSection() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [topMenus, setTopMenus] = useState<TopMenu[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [criticalMargins, setCriticalMargins] = useState<CriticalMargin[]>([]);

  const fetchLaporan = async () => {
    if (!startDate || !endDate) {
      setErrorMsg('Pilih tanggal mulai dan akhir.');
      return;
    }
    if (startDate > endDate) {
      setErrorMsg('Tanggal mulai tidak boleh melebihi tanggal akhir.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      const q = `?startDate=${startDate}&endDate=${endDate}`;
      
      const threshold = localStorage.getItem('sipi_critical_threshold') || '80';

      const [sumRes, topRes, alertsRes, marginsRes] = await Promise.all([
        apiFetch(`/dashboard/summary-range${q}`),
        apiFetch(`/dashboard/top-menus-range${q}`),
        apiFetch(`/dashboard/price-alerts-range${q}`),
        apiFetch(`/dashboard/critical-margins-range${q}&threshold=${threshold}`)
      ]);

      setSummary(await sumRes.json());
      setTopMenus(await topRes.json());
      setPriceAlerts(await alertsRes.json());
      setCriticalMargins(await marginsRes.json());
    } catch (err) {
      setErrorMsg('Gagal memuat laporan. Periksa koneksi atau coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="laporan-range-section" style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px dashed var(--border-color)' }}>
      <div className="no-print" style={{ marginBottom: '20px' }}>
        <h2>Laporan Rentang Waktu</h2>
        <p className="section-desc">Pilih rentang tanggal untuk melihat laporan spesifik dan mencetaknya.</p>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tanggal Mulai</label>
            <input 
              type="date" 
              className="input-field" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tanggal Akhir</label>
            <input 
              type="date" 
              className="input-field" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </div>
          <button className="btn btn-primary" onClick={fetchLaporan} disabled={isLoading}>
            {isLoading ? 'Memuat...' : 'Tampilkan Laporan'}
          </button>
          
          {summary && (
            <button className="btn btn-secondary" onClick={handlePrint} style={{ marginLeft: 'auto' }}>
              🖨️ Cetak PDF
            </button>
          )}
        </div>

        {errorMsg && <div className="error-alert" style={{ marginTop: '12px' }}>{errorMsg}</div>}
      </div>

      {summary && (
        <div className="print-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="summary-banner" style={{ borderRadius: 'var(--radius-md)' }}>
            <span className="banner-icon">📊</span>
            <p>{summary.summaryText}</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card card">
              <span className="label">Total Pendapatan</span>
              <span className="value text-success">Rp {summary.totalRevenue.toLocaleString('id-ID')}</span>
            </div>
            <div className="stat-card card">
              <span className="label">Total HPP</span>
              <span className="value text-danger">Rp {summary.totalHpp.toLocaleString('id-ID')}</span>
            </div>
            <div className="stat-card card">
              <span className="label">Estimasi Laba Kotor</span>
              <span className="value text-primary">Rp {summary.grossProfit.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="top-menus-section">
            <h2>🔥 Top 5 Menu ({startDate} s.d. {endDate})</h2>
            <div className="top-menus-list card">
              {topMenus.length === 0 ? (
                <div className="empty-state">Belum ada transaksi dalam rentang ini.</div>
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
                    <span className="top-total-sales">Rp {menu.totalSales.toLocaleString('id-ID')}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="price-alerts-section">
            <h2>📈 Kenaikan Harga Bahan Baku</h2>
            <div className="alerts-list">
              {priceAlerts.length === 0 ? (
                <div className="card empty-state">Tidak ada kenaikan harga signifikan dalam rentang ini.</div>
              ) : (
                priceAlerts.map(alert => (
                  <div key={alert.ingredientId} className="card alert-item border-danger">
                    <div className="alert-item-header">
                      <h3>{alert.ingredientName}</h3>
                      <span className="badge badge-danger">+{alert.increasePercent.toFixed(1)}%</span>
                    </div>
                    <div className="alert-meta">
                      Rp {alert.baselinePrice.toLocaleString('id-ID')} ➔ <strong className="text-danger">Rp {alert.currentPrice.toLocaleString('id-ID')}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="critical-margins-section">
            <h2>⚠️ Rekor Margin Kritis</h2>
            <p className="section-desc">Menu yang marginnya (HPP/Harga Jual) sempat melebihi ambang batas dalam rentang ini.</p>
            <div className="critical-grid">
              {criticalMargins.length === 0 ? (
                <div className="card empty-state" style={{ gridColumn: '1 / -1' }}>Margin aman selama rentang ini.</div>
              ) : (
                criticalMargins.map(menu => (
                  <div key={menu.id} className="card critical-card border-danger">
                    <div className="critical-header">
                      <h3>{menu.name}</h3>
                      <span className="badge badge-danger">{(menu.marginRatio * 100).toFixed(1)}% HPP</span>
                    </div>
                    <div className="critical-details">
                      <div className="row">
                        <span className="text-secondary">Harga Jual</span>
                        <span className="font-bold">Rp {menu.sellingPrice.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="row">
                        <span className="text-secondary">HPP (Saat itu)</span>
                        <span className="font-bold text-danger">Rp {menu.hpp.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="rec-hint">Terjadi pada: {new Date(menu.recordedAt).toLocaleDateString('id-ID')}</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
