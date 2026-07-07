'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { apiFetch } from '@/lib/api';

interface ParsedItem {
  name: string;
  qty?: number;
  qty_added?: number;
  unit: string;
  price_per_unit?: number;
  new_price?: number;
}

// Bentuk resep yang dikembalikan aiController.ts untuk action_type "recipe" — field-nya
// beda dari ParsedItem (restock): ingredientName/qtyUsed, bukan name/qty.
interface ParsedRecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  qtyUsed: number;
  unit: string;
}

interface ParsedRecipe {
  menu_name: string;
  ingredients: ParsedRecipeIngredient[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  type?: 'answer' | 'confirmation';
  parsed_items?: ParsedItem[];
  parsed_recipe?: ParsedRecipe;
  actionConfirmed?: boolean | null;
}

export default function AiChatWidget() {
  const pathname = usePathname();
  // TODO(Raihan): Cek ENABLE_AI_CHAT environment variable untuk sembunyikan widget jika fitur dimatikan.
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleSheet = () => setIsOpen(!isOpen);

  // Dynamic suggestions based on current page
  let aiGuideTitle = "Asisten AI Siap Membantu";
  let promptSuggestions: string[] = [];

  if (pathname === '/inventory') {
    aiGuideTitle = "Panduan Restok via AI";
    promptSuggestions = [
      "Saya baru beli 5 kg beras seharga 80000",
      "Restok cabai rawit 2 kg dengan harga total 120000",
      "Ada tambahan minyak goreng 10 liter, harga per liter 15000",
      "Bahan apa saja yang stoknya sedang kritis saat ini?"
    ];
  } else if (pathname === '/dashboard') {
    aiGuideTitle = "Analisa Bisnis via AI";
    promptSuggestions = [
      "Berapa total pendapatan laba kotor hari ini?",
      "Apakah ada menu yang hpp nya merugi?",
      "Menu apa yang paling laris hari ini?"
    ];
  } else {
    aiGuideTitle = "Tanya AI";
    promptSuggestions = [
      "Berapa total pendapatan hari ini?",
      "Bahan apa yang hampir habis?",
      "Menu mana yang marginnya kritis?"
    ];
  }

  const handleSuggestionClick = (text: string) => {
    setInputText(text);
  };

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
        parsed_recipe: data.parsed_recipe,
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
        // Bentuk response beda per action_type: restock -> data.updated, recipe -> data.recipe/menu/hpp
        let resultText = '✅ Aksi berhasil dieksekusi.';
        if (data.updated) {
          resultText = data.updated.map((item: any) =>
            `✅ ${item.name}: +${item.qty_added} | harga baru Rp ${item.new_price}`
          ).join('\n');
        } else if (data.recipe) {
          const recipeList = data.recipe.map((item: any) => `${item.qty}${item.unit} ${item.name}`).join(', ');
          resultText = `✅ Resep menu "${data.menu}" berhasil diperbarui: ${recipeList}. HPP baru: Rp ${Number(data.hpp).toLocaleString('id-ID')}`;
        }

        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: 'system', text: resultText }
        ]);

        // Beritahu seluruh halaman (Inventory, Dashboard, POS) untuk refresh data mereka
        window.dispatchEvent(new Event('sipi_sync_completed'));
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
          bottom: '80px',
          right: '20px',
          width: '60px',
          height: '60px',
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <h4 style={{ margin: 0, color: 'var(--text-primary, #333)', fontSize: '0.95rem' }}>{aiGuideTitle}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>
                    Coba klik salah satu template perintah di bawah ini untuk memulai:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {promptSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          backgroundColor: 'var(--background-alt, #f1f3f5)',
                          border: '1px solid var(--border-color, #ddd)',
                          borderRadius: '8px',
                          color: 'var(--primary-color, #007bff)',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
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
                  {msg.role === 'ai' ? (
                    // Balasan LLM sering berformat Markdown (**bold**, list, dst) — react-markdown
                    // merender ke elemen React asli (bukan dangerouslySetInnerHTML), jadi aman dari
                    // XSS by default: teks HTML mentah di respons AI diperlakukan sebagai teks biasa,
                    // bukan di-parse jadi tag sungguhan, kecuali sengaja diaktifkan (tidak dipakai di sini).
                    <div className="ai-markdown">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p style={{ margin: 0 }}>{msg.text}</p>
                  )}

                  {msg.type === 'confirmation' && (msg.parsed_items || msg.parsed_recipe) && (
                    <div style={{ marginTop: '10px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <p style={{ margin: '0 0 8px', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-primary, #333)' }}>Detail Eksekusi:</p>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-primary, #333)' }}>
                        {msg.parsed_items && msg.parsed_items.map((item, idx) => (
                          <li key={idx}>
                            {item.name} - {item.qty || item.qty_added}{item.unit} @ Rp {item.price_per_unit || item.new_price}/{item.unit}
                          </li>
                        ))}
                        {msg.parsed_recipe && msg.parsed_recipe.ingredients.map((item, idx) => (
                          <li key={idx}>
                            {item.qtyUsed}{item.unit} {item.ingredientName}
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

          {/* Typografi Markdown balasan AI — <style jsx global> karena elemen p/ul/strong/dst
              di sini dirender oleh react-markdown (komponen lain), bukan literal JSX di file
              ini, jadi scoping <style jsx> biasa tidak akan pernah kena ke elemen-elemen itu. */}
          <style jsx global>{`
            .ai-markdown {
              color: inherit;
              font-size: inherit;
              line-height: 1.5;
            }
            .ai-markdown p {
              margin: 0 0 8px;
            }
            .ai-markdown p:last-child {
              margin-bottom: 0;
            }
            .ai-markdown ul,
            .ai-markdown ol {
              margin: 4px 0 8px;
              padding-left: 20px;
            }
            .ai-markdown ul:last-child,
            .ai-markdown ol:last-child {
              margin-bottom: 0;
            }
            .ai-markdown li {
              margin-bottom: 2px;
            }
            .ai-markdown li > p {
              margin: 0;
            }
            .ai-markdown strong {
              font-weight: 700;
            }
            .ai-markdown em {
              font-style: italic;
            }
            .ai-markdown h1,
            .ai-markdown h2,
            .ai-markdown h3,
            .ai-markdown h4 {
              font-size: 1em;
              font-weight: 700;
              margin: 8px 0 4px;
            }
            .ai-markdown h1:first-child,
            .ai-markdown h2:first-child,
            .ai-markdown h3:first-child,
            .ai-markdown h4:first-child {
              margin-top: 0;
            }
            .ai-markdown code {
              background: rgba(0, 0, 0, 0.08);
              padding: 1px 5px;
              border-radius: 4px;
              font-size: 0.85em;
              font-family: monospace;
            }
            .ai-markdown pre {
              background: rgba(0, 0, 0, 0.08);
              padding: 8px;
              border-radius: 8px;
              overflow-x: auto;
              margin: 4px 0 8px;
            }
            .ai-markdown pre code {
              background: none;
              padding: 0;
            }
            .ai-markdown a {
              color: inherit;
              text-decoration: underline;
            }
            .ai-markdown blockquote {
              margin: 4px 0 8px;
              padding-left: 10px;
              border-left: 3px solid rgba(0, 0, 0, 0.15);
              opacity: 0.85;
            }
          `}</style>
        </div>
      )}
    </>
  );
}
