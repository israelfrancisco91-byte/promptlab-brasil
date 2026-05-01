"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"

export default function PromptLabPage() {
  const [activeTab, setActiveTab] = useState<"image" | "music">("music")
  const [showInstructions, setShowInstructions] = useState(false)
  
  // --- STATES ---
  const [musicTheme, setMusicTheme] = useState("")
  const [musicStyle, setMusicStyle] = useState("Worship")
  const [musicVibe, setMusicVibe] = useState("Inspiradora")
  const [compositionResult, setCompositionResult] = useState("")
  const [repertoire, setRepertoire] = useState("")
  const [repertoireHeader, setRepertoireHeader] = useState("")

  // --- FUNÇÕES DE UTILIDADE ---
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copiado com sucesso!")
  }

  // --- GERADOR E COMPARTILHADOR DE PDF ---
  const handlePDF = async (content: string, isRepertoire: boolean, action: 'download' | 'share') => {
    const doc = new jsPDF();
    const watermark = "PromptLab Brasil";
    const caption = "Crie o seu repertório em promptlabbrasil.com.br";
    
    const isChordLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length > 80) return false;
      const chordPattern = /^(\s*([A-G][b#]?(m|min|maj|maj7|m7|add|sus|dim|aug|[\d])?(\/[A-G][b#]?)?|INTRO:|REFRÃO:|PONTE:|SOLO:|VAMP:)(\s+|$))+$/i;
      return chordPattern.test(line);
    };

    // REGRA: Separa por apenas UM hífen (-) sozinho na linha
    const songs = isRepertoire ? content.split(/\n\s*-\s*\n/) : [content];

    songs.forEach((song, index) => {
      const trimmedSong = song.trim();
      if (!trimmedSong) return;
      if (index > 0) doc.addPage();

      if (repertoireHeader) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139); 
        doc.text(repertoireHeader.toUpperCase(), 105, 12, { align: "center" });
        doc.setDrawColor(220);
        doc.line(15, 15, 195, 15);
      }

      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80); 
      doc.setFont("helvetica", "bold");
      doc.text(watermark, 105, 290, { align: "center" });

      const lines = trimmedSong.split('\n');
      const firstLine = lines[0].trim();
      let songTitle = isChordLine(firstLine) ? (isRepertoire ? "MÚSICA SEM TÍTULO" : "COMPOSIÇÃO PROMPTLAB") : firstLine;
      let songBody = isChordLine(firstLine) ? lines : lines.slice(1);

      doc.setFontSize(15);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(songTitle.toUpperCase(), 15, 25);

      doc.setFontSize(9.5); 
      doc.setFont("courier", "bold"); 
      
      let currentY = 35;
      let currentX = 15;
      let lineCount = 0;
      const maxLinesPerCol = 39; 

      songBody.forEach((line) => {
        if (lineCount === maxLinesPerCol) {
          currentY = 35;
          currentX = 110;
        }
        if (lineCount >= maxLinesPerCol * 2) return; 

        doc.setTextColor(isChordLine(line) ? [37, 99, 235] : [0, 0, 0]);
        doc.text(line, currentX, currentY);
        currentY += 5.5; 
        lineCount++;
      });
    });

    const fileName = isRepertoire ? "repertorio-digital.pdf" : "composicao.pdf";

    if (action === 'download') {
      doc.save(fileName);
    } else {
      // Lógica de Compartilhamento
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Meu Repertório',
            text: caption,
          });
        } catch (error) {
          console.error('Erro ao compartilhar:', error);
        }
      } else {
        alert("Seu navegador não suporta o compartilhamento direto de arquivos. Por favor, baixe o PDF e envie manualmente pelo WhatsApp com a legenda: " + caption);
        doc.save(fileName);
      }
    }
  }

  const handleCompose = () => {
    const result = `SUA NOVA MÚSICA\n\n[Tema: ${musicTheme}]\n[Estilo: ${musicStyle} | Vibe: ${musicVibe}]\n\nINTRO: C  G  Am  F\n\nC          G          Am\nNo silêncio do meu peito floresceu\nF          C          G\nUm rastro de luz que o céu me deu`
    setCompositionResult(result)
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans p-4 selection:bg-blue-500/30">
      <style jsx global>{`
        .panel { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }
        label { color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; display: block; }
        input, select, textarea { background: #020617; border: 1px solid #334155; color: white; padding: 12px; border-radius: 8px; width: 100%; transition: all 0.2s; }
        input:focus, select:focus, textarea:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
        .btn { padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; border: none; width: 100%; }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-whatsapp-repertorio { background: #2563eb; color: white; margin-top: 12px; }
        .btn-green { background: #22c55e; color: white; }
        .btn-pdf { background: #ef4444; color: white; }
        .btn-copy { background: #64748b; color: white; }
      `}</style>

      <header className="max-w-5xl mx-auto text-center py-12">
        <h1 className="text-5xl font-black tracking-tighter mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">PromptLab BR</h1>
        <div className="flex justify-center gap-3">
          <button onClick={() => setActiveTab("image")} className={`px-8 py-3 rounded-full font-bold transition ${activeTab === 'image' ? 'bg-blue-600 shadow-lg shadow-blue-900/20' : 'bg-slate-800'}`}>🖼️ Imagens</button>
          <button onClick={() => setActiveTab("music")} className={`px-8 py-3 rounded-full font-bold transition ${activeTab === 'music' ? 'bg-purple-600 shadow-lg shadow-purple-900/20' : 'bg-slate-800'}`}>🎸 MusicLab</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        {activeTab === "image" ? (
           <div className="text-center p-10 panel">Em desenvolvimento...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <section className="panel border-l-4 border-purple-500">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2">✨ Compositor AI</h2>
                <div className="space-y-4">
                  <div>
                    <label>Tema da música</label>
                    <input value={musicTheme} onChange={(e) => setMusicTheme(e.target.value)} placeholder="Ex: Amor de verão, Saudade..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label>Estilo</label>
                      <select value={musicStyle} onChange={(e) => setMusicStyle(e.target.value)}>
                        <option>Worship</option><option>Sertanejo</option><option>Samba</option>
                        <option>Pagode</option><option>MPB</option><option>Rock</option>
                        <option>Pop</option><option>Trap</option><option>Funk</option>
                      </select>
                    </div>
                    <div>
                      <label>Vibe</label>
                      <select value={musicVibe} onChange={(e) => setMusicVibe(e.target.value)}>
                        <option>Inspiradora</option><option>Animada</option><option>Melancólica</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={handleCompose} className="btn btn-primary">🚀 Gerar Composição</button>
                </div>
              </section>

              <section className="panel border-l-4 border-green-500">
                <h2 className="text-xl font-black mb-4 flex items-center gap-2">📚 Repertório Digital</h2>
                
                <div className="mb-4">
                  <button onClick={() => setShowInstructions(!showInstructions)} className="text-xs font-bold text-green-400 hover:text-green-300 underline flex items-center gap-1 mb-2">
                    {showInstructions ? "🔼 Ocultar Instruções" : "🔽 Instruções de Uso"}
                  </button>
                  {showInstructions && (
                    <div className="bg-black/30 p-4 rounded-lg border border-green-900/50 text-xs text-slate-300 leading-relaxed">
                      <p className="mb-2"><strong>1. Título:</strong> Primeira linha = Nome da música.</p>
                      <p><strong>2. Divisão:</strong> Use apenas um hífen (<strong>-</strong>) entre as músicas para separar as páginas.</p>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label>Título do Cabeçalho (Topo do PDF)</label>
                  <input value={repertoireHeader} onChange={(e) => setRepertoireHeader(e.target.value)} placeholder="Ex: Repertório da Igreja - Maio 2026" />
                </div>

                <label>Cole aqui as letras e cifras</label>
                <textarea rows={10} value={repertoire} onChange={(e) => setRepertoire(e.target.value)} placeholder="Título da Música&#10;C   G   Am&#10;Letra..." className="text-sm font-mono" />
                
                <button onClick={() => handlePDF(repertoire, true, 'download')} className="btn btn-green mt-4">📄 Gerar PDF do Repertório (Tablet)</button>
                
                {/* NOVO BOTÃO DE COMPARTILHAR */}
                <button onClick={() => handlePDF(repertoire, true, 'share')} className="btn btn-whatsapp-repertorio">
                  📱 Compartilhar no WhatsApp
                </button>
              </section>
            </div>

            <div className="space-y-6">
              <section className="panel h-full flex flex-col">
                <label>Resultado da Composição</label>
                <div className="flex-1 bg-black/40 rounded-xl p-6 border border-slate-800 font-serif text-lg leading-relaxed text-slate-300 min-h-[400px] whitespace-pre-wrap">
                  {compositionResult || "A letra da música aparecerá aqui..."}
                </div>
                
                {compositionResult && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                    <button onClick={() => copyToClipboard(compositionResult)} className="btn btn-copy text-xs">📋 Copiar</button>
                    <button onClick={() => handlePDF(compositionResult, false, 'share')} className="btn btn-whatsapp-repertorio !m-0 text-xs">📱 WhatsApp</button>
                    <button onClick={() => handlePDF(compositionResult, false, 'download')} className="btn btn-pdf text-xs">📕 Gerar PDF</button>
                  </div>
                )}
                <div className="mt-4 text-center">
                   <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">PromptLab Brasil - MARCA D'ÁGUA ATIVA</span>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
