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

  const shareWhatsApp = (text: string) => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  // --- GERADOR DE PDF (VERSÃO CORRIGIDA) ---
  const generatePDF = (content: string, isRepertoire: boolean) => {
    const doc = new jsPDF();
    const watermark = "PromptLab Brasil";
    
    // Detector de Cifras Refinado (Consertado o erro de sintaxe)
    const isChordLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length > 25) return false;
      // Regex corrigido com as barras escapadas (\/)
      const chordPattern = /^(\s*([A-G][b#]?(m|min|maj|maj7|m7|add|sus|dim|aug|[\d])?(\/[A-G][b#]?)?)(\s+|$))+$/;
      return chordPattern.test(line);
    };

    const songs = isRepertoire ? content.split(/---+\n?/) : [content];

    songs.forEach((song, index) => {
      const trimmedSong = song.trim();
      if (!trimmedSong) return;
      if (index > 0) doc.addPage();

      // CABEÇALHO
      if (repertoireHeader) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139); 
        doc.text(repertoireHeader.toUpperCase(), 105, 12, { align: "center" });
        doc.setDrawColor(220);
        doc.line(15, 15, 195, 15);
      }

      // MARCA D'ÁGUA
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80); 
      doc.setFont("helvetica", "bold");
      doc.text(watermark, 105, 290, { align: "center" });

      const lines = trimmedSong.split('\n');
      const firstLine = lines[0].trim();
      let songTitle = "";
      let songBody = [];

      if (isChordLine(firstLine)) {
        songTitle = isRepertoire ? "MÚSICA SEM TÍTULO" : "COMPOSIÇÃO AI";
        songBody = lines;
      } else {
        songTitle = firstLine;
        songBody = lines.slice(1);
      }

      // TÍTULO DA MÚSICA (Sempre em negrito e preto)
      doc.setFontSize(15);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(songTitle.toUpperCase(), 15, 25);

      // CORPO (Tudo em negrito para facilitar a leitura)
      doc.setFontSize(9.5); 
      doc.setFont("courier", "bold"); 
      
      let currentY = 35;
      let currentX = 15;
      let lineCount = 0;
      const maxLinesPerCol = 38; 

      songBody.forEach((line) => {
        if (lineCount === maxLinesPerCol) {
          currentY = 35;
          currentX = 110;
        }
        
        if (lineCount >= maxLinesPerCol * 2) return; 

        if (isChordLine(line)) {
          doc.setTextColor(37, 99, 235); // AZUL PARA CIFRAS
        } else {
          doc.setTextColor(0, 0, 0); // PRETO PARA LETRAS
        }

        doc.text(line, currentX, currentY);
        currentY += 5.5; 
        lineCount++;
      });
    });

    doc.save(isRepertoire ? "repertorio-digital.pdf" : "composicao.pdf");
  }

  const handleCompose = () => {
    const result = `SUA NOVA MÚSICA\n\n[Tema: ${musicTheme}]\n[Estilo: ${musicStyle} | Vibe: ${musicVibe}]\n\nC          G          Am\nNo silêncio do meu peito floresceu\nF          C          G\nUm rastro de luz que o céu me deu`
    setCompositionResult(result)
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans p-4 selection:bg-blue-500/30">
      <style jsx global>{`
        .panel { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }
        label { color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; display: block; }
        input, select, textarea { background: #020617; border: 1px solid #334155; color: white; padding: 12px; border-radius: 8px; width: 100%; transition: all 0.2s; }
        input:focus, select:focus, textarea:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
        .btn { padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; border: none; }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-whatsapp { background: #22c55e; color: white; }
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
                    <input value={musicTheme} onChange={(e) => setMusicTheme(e.target.value)} placeholder="Ex: Amor de verão..." />
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
                  <button onClick={handleCompose} className="btn btn-primary w-full mt-2">🚀 Gerar Composição</button>
                </div>
              </section>

              <section className="panel border-l-4 border-green-500">
                <h2 className="text-xl font-black mb-4 flex items-center gap-2">📚 Repertório Digital</h2>
                
                <div className="mb-4">
                  <button 
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="text-xs font-bold text-green-400 hover:text-green-300 underline flex items-center gap-1 mb-2"
                  >
                    {showInstructions ? "🔼 Ocultar Instruções" : "🔽 Instruções de Uso"}
                  </button>
                  
                  {showInstructions && (
                    <div className="bg-black/30 p-4 rounded-lg border border-green-900/50 text-xs text-slate-300 leading-relaxed">
                      <p className="mb-2"><strong>1. Título:</strong> Primeira linha = Nome da música.</p>
                      <p><strong>2. Divisão:</strong> Use <strong>---</strong> entre as músicas para criar novas páginas.</p>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label>Título do Cabeçalho (Topo do PDF)</label>
                  <input 
                    value={repertoireHeader} 
                    onChange={(e) => setRepertoireHeader(e.target.value)} 
                    placeholder="Ex: Repertório da Igreja - Maio 2026" 
                  />
                </div>

                <label>Cole aqui as letras e cifras</label>
                <textarea 
                  rows={10} 
                  value={repertoire} 
                  onChange={(e) => setRepertoire(e.target.value)} 
                  placeholder="Título da Música&#10;C   G   Am&#10;Letra aqui..." 
                  className="text-sm font-mono"
                />
                <button onClick={() => generatePDF(repertoire, true)} className="btn btn-whatsapp w-full mt-4">📄 Gerar PDF do Repertório (Tablet)</button>
              </section>
            </div>

            <div className="space-y-6">
              <section className="panel h-full flex flex-col">
                <label>Resultado da Composição</label>
                <div className="flex-1 bg-black/40 rounded-xl p-6 border border-slate-800 font-serif text-lg leading-relaxed text-slate-300 min-h-[400px] whitespace-pre-wrap">
                  {compositionResult || "As letras e acordes aparecerão aqui..."}
                </div>
                
                {compositionResult && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                    <button onClick={() => copyToClipboard(compositionResult)} className="btn btn-copy text-xs">📋 Copiar</button>
                    <button onClick={() => shareWhatsApp(compositionResult)} className="btn btn-whatsapp text-xs">📱 WhatsApp</button>
                    <button onClick={() => generatePDF(compositionResult, false)} className="btn btn-pdf text-xs">📕 Gerar PDF</button>
                  </div>
                )}
                <div className="mt-4 text-center">
                   <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">PromptLab Brasil - Marca D'água Ativa</span>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
