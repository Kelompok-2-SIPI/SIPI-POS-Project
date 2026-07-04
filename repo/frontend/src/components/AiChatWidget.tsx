'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

interface ParsedItem {
  name: string;
  qty?: number;
  qty_added?: number;
  unit: string;
  price_per_unit?: number;
  new_price?: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  type?: 'answer' | 'confirmation';
  parsed_items?: ParsedItem[];
  actionConfirmed?: boolean | null;
}

export default function AiChatWidget() {
  // TODO(Raihan): Cek ENABLE_AI_CHAT environment variable untuk sembunyikan widget jika fitur dimatikan.
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleSheet = () => setIsOpen(!isOpen);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await apiFetch('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: 'system', text: data.error || 'Terjadi kesalahan pada server.' }
        ]);
        return;
      }

      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'ai',
        text: data.message,
        type: data.type,
        parsed_items: data.parsed_items,
        actionConfirmed: null,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'system', text: 'Gagal menghubungi AI. Periksa koneksi Anda.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmAction = async (msgId: string, confirmed: boolean) => {
    // Sembunyikan tombol optimistically mencegah double click
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, actionConfirmed: confirmed } : msg
      )
    );
    setIsLoading(true);

    try {
      const res = await apiFetch('/ai/confirm-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed }),
      });

      const data = await res.json();

      if (!res.ok) {
         setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: 'system', text: data.error || 'Tidak ada aksi pending. Mulai ulang dari chat.' }
        ]);
        return;
      }

      if (confirmed && data.success) {
        const updatedList = data.updated?.map((item: any) => 
          `✅ ${item.name}: +${item.qty_added} | harga baru Rp ${item.new_price}`
        ).join('\n') || '✅ Aksi berhasil dieksekusi.';

        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: 'system', text: updatedList }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: 'system', text: data.message || 'Dibatalkan.' }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'system', text: 'Terjadi kesalahan saat mengonfirmasi aksi.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {/* TODO(Raihan): Polish animasi hover/muncul button, warna dan posisi z-index */}
      <button 
        onClick={toggleSheet}
        style={{
          position: 'fixed',
          bottom: '90px', // Offset for bottom nav (76px padding-bottom on body)
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-color, #007bff)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          fontSize: '24px',
          zIndex: 9999,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        💬
      </button>

      {/* Bottom Sheet */}
      {isOpen && (
        <div className="bottom-sheet-backdrop" onClick={toggleSheet}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()} style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="bottom-sheet-handle"></div>
            
            <div className="sheet-header" style={{ borderBottom: '1px solid var(--border-color, #ddd)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Asisten AI</h3>
                <button onClick={toggleSheet} className="btn-close">Tutup</button>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary, #666)' }}>
                <em>* Jawaban AI bersifat estimasi</em>
              </p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary, #888)', marginTop: '20px', fontSize: '0.9rem' }}>
                  Silakan sapa Asisten AI atau berikan perintah untuk restok/ubah harga.
                </p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.role === 'user' ? 'var(--primary-color, #007bff)' : msg.role === 'system' ? 'var(--danger-light, #f8d7da)' : 'var(--background-alt, #f1f3f5)',
                  color: msg.role === 'user' ? 'white' : msg.role === 'system' ? 'var(--danger-color, #dc2626)' : 'var(--text-primary, #333)',
                  padding: '10px 15px',
                  borderRadius: '16px',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                  borderBottomLeftRadius: msg.role === 'ai' || msg.role === 'system' ? '4px' : '16px',
                  maxWidth: '85%',
                  fontSize: '0.9rem',
                  whiteSpace: 'pre-wrap'
                }}>
                  {/* TODO(Raihan): Polish transisi animasi bubble chat */}
                  <p style={{ margin: 0 }}>{msg.text}</p>
                  
                  {msg.type === 'confirmation' && msg.parsed_items && (
                    <div style={{ marginTop: '10px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <p style={{ margin: '0 0 8px', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-primary, #333)' }}>Detail Eksekusi:</p>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-primary, #333)' }}>
                        {msg.parsed_items.map((item, idx) => (
                          <li key={idx}>
                            {item.name} - {item.qty || item.qty_added}{item.unit} @ Rp {item.price_per_unit || item.new_price}/{item.unit}
                          </li>
                        ))}
                      </ul>
                      
                      {msg.actionConfirmed === null && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                          <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => confirmAction(msg.id, true)} disabled={isLoading}>Ya, Lanjutkan</button>
                          <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => confirmAction(msg.id, false)} disabled={isLoading}>Batal</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary, #888)', fontSize: '0.85rem', fontStyle: 'italic', padding: '4px 8px' }}>
                  AI sedang mengetik...
                </div>
              )}
            </div>

            <form onSubmit={sendMessage} style={{ padding: '15px', borderTop: '1px solid var(--border-color, #ddd)', display: 'flex', gap: '8px', backgroundColor: 'var(--background-color, #fff)' }}>
              <input
                type="text"
                className="input-field"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ketik perintah..."
                disabled={isLoading}
                style={{ flex: 1, margin: 0, borderRadius: '20px' }}
              />
              <button type="submit" className="btn btn-primary" disabled={isLoading || !inputText.trim()} style={{ borderRadius: '20px' }}>
                Kirim
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
