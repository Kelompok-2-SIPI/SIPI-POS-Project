'use client';

import { useState, useEffect } from 'react';

interface RestockItem {
  id: string;
  name: string;
  unit: string;
  stockQty: number;
  minStockQty: number;
  avgConsumption7d: number;
  sisaHari: number;
}

export default function RestockPage() {
  const [recommendations, setRecommendations] = useState<RestockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Restock modal state
  const [activeIngredient, setActiveIngredient] = useState<RestockItem | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockNote, setRestockNote] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/dashboard/restock-recommendations');
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      } else {
        setError('Gagal mengambil rekomendasi restok.');
      }
    } catch (err) {
      setError('Gagal menghubungkan ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRestock = (item: RestockItem) => {
    setActiveIngredient(item);
    setRestockQty('');
    setRestockNote('Restok cerdas via rekomendasi');
    setModalOpen(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setActiveIngredient(null);
  };

  const submitRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIngredient || !restockQty) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/v1/ingredients/${activeIngredient.id}/restock`, {
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
        fetchRecommendations(); // Refresh list
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

  return (
    <div className="restock-layout">
      {/* Header */}
      <header className="restock-header">
        <div>
          <h1>Restok Cerdas</h1>
          <p>Bahan baku yang diproyeksikan habis kurang dari 2 hari</p>
        </div>
      </header>

      {error && !modalOpen && <div className="error-alert">{error}</div>}

      {/* Recommendations List */}
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

      {/* Restock Form Modal */}
      {modalOpen && activeIngredient && (
        <div className="bottom-sheet-backdrop" onClick={handleCloseModal}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle"></div>
            
            <div className="sheet-header">
              <h2>Restok Cepat: {activeIngredient.name}</h2>
              <button onClick={handleCloseModal} className="btn-close">Tutup</button>
            </div>

            {error && <div className="error-alert">{error}</div>}
            {success && <div className="success-alert">{success}</div>}

            <form onSubmit={submitRestock}>
              <div className="form-group">
                <label className="form-label">Jumlah Masuk ({activeIngredient.unit})</label>
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
                <label className="form-label">Catatan</label>
                <input
                  type="text"
                  className="input-field"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan Restok'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .restock-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .restock-header {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
        }
        .restock-header h1 {
          font-size: 24px;
        }
        .restock-header p {
          font-size: 13px;
          color: var(--text-secondary);
        }
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
        .empty-state {
          text-align: center;
          padding: 40px 24px;
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
        .empty-state h3 {
          margin-bottom: 6px;
        }
        .empty-state p {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
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
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 16px;
          text-align: center;
        }
        .w-full { width: 100%; }
        .mt-4 { margin-top: 16px; }
      `}</style>
    </div>
  );
}
