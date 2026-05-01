"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"

export default function PromptLabPage() {
  const [activeTab, setActiveTab] = useState<"image" | "music">("image")
  const [showInstructions, setShowInstructions] = useState(false)
  
  // --- STATES ---
  const [musicTheme, setMusicTheme] = useState("")
  const [musicStyle, setMusicStyle] = useState("Worship")
  const [musicVibe, setMusicVibe] = useState("Inspiradora")
  const [compositionResult, setCompositionResult] = useState("")
  const [repertoire, setRepertoire] = useState("")
  const [repertoireHeader, setRepertoireHeader] = useState("")

  // --- FUNÇÕES ---
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copiado com sucesso!")
  }

  const shareWhatsApp = (text: string) => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const generatePDF = (content: string, isRepertoire: boolean) => {
    const doc = new jsPDF();
    const watermark = "PromptLab Brasil";
    
    // Rastreador de Cifras Ultra-Sensível (Ignora espaços no início)
    const isChordLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      // Detecta padrões de notas A-G com sustenidos, menores, sétimas, etc.
      const chordPattern = /^[A-G](?:maj|min|maj7|m7|m|add|dim|sus|[\d\#\b\/])*(\s+[A-G](?:maj|min|maj7|m7|m|add|dim|sus|[\d\#\b\/])*)*\s*$/;
      return chordPattern.test(trimmed);
    };

    const songs = isRepertoire ? content.split(/---+\n?/) : [content];

    songs.forEach((song, index) => {
      const trimmedSong = song.trim();
      if (!trimmedSong) return;

      if (index > 0) doc.addPage();

      // CABEÇALHO (Topo)
      if (repertoireHeader) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139); 
        doc.text(repertoireHeader.toUpperCase(), 105, 12, { align: "center" });
        doc.setDrawColor(220);
        doc.line(15, 15, 195, 15);
      }

      // MARCA D'ÁGUA (Rodapé Centralizado)
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80); 
      doc.setFont("helvetica", "bold");
      doc.text(watermark, 105, 290, { align: "center" });

      const lines = trimmedSong.split('\n');
      const firstLine = lines[0].trim();
      
      let songTitle = "";
      let songBody = [];

      // Lógica de Título Inteligente
      if (isChordLine(firstLine)) {
        songTitle = isRepertoire ? "MÚSICA SEM TÍTULO" : "COMPOSIÇÃO AI";
        songBody = lines;
      } else {
        songTitle = firstLine;
        songBody = lines.slice(1);
      }

      // TÍTULO DA MÚSICA
      doc.setFontSize(15);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(songTitle.toUpperCase(), 15, 25);

      // CORPO (Courier para precisão milimétrica)
      doc.setFontSize(9.5); 
      doc.setFont("courier", "normal"); 
      
      let currentY = 35;
      let currentX = 15;
      let lineCount = 0;
      const maxLinesPerCol = 40; // Zona de segurança para não bater no rodapé

      songBody.forEach((line) => {
        if (lineCount === maxLinesPerCol) {
          currentY = 35;
          currentX = 110;
        }
        
        if (lineCount >= maxLinesPerCol * 2) return; 

        if (isChordLine(line)) {
          // CIFRA: AZUL E NEGRITO (Safe em Courier!)
          doc.setTextColor(37, 99, 235); 
          doc.setFont("courier", "bold");
        } else {
          // LETRA: PRETO NORMAL
          doc.setTextColor(0, 0, 0);
          doc.setFont("courier", "normal");
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
    <div className="min-h-screen bg-[#020617] text-white font-sans p-4">
      <style jsx global>{`
        .panel { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; }
        label { color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; display: block; }
        input, select, textarea { background: #020617; border: 1px solid #334155; color: white; padding: 12px; border-radius: 8px; width: 100%; }
        .btn { padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; border: none; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-whatsapp { background: #22c55e; color: white; }
        .btn-pdf { background: #ef4444; color: white; }
      `}</style>

      <header className="max-w-5xl mx-auto text-center py-12">
        <h1 className="text-5xl font-black mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">PromptLab BR</h1>
        <div className="flex justify-center gap-3">
          <button onClick={() => setActiveTab("image")} className={`px-8 py-3 rounded-full font-bold ${activeTab === 'image' ? 'bg-blue-600' : 'bg-slate-800'}`}>🖼️ Imagens</button>
          <button onClick={() => setActiveTab("music")} className={`px-8 py-3 rounded-full font-bold ${activeTab === 'music' ? 'bg-purple-600' : 'bg-slate-800'}`}>🎸 MusicLab</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {activeTab === "music" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <section className="panel border-l-4 border-purple-500">
                <h2 className="text-xl font-black mb-6">✨ Compositor AI</h2>
                <div className="space-y-4">
                  <input value={musicTheme} onChange={(e) => setMusicTheme(e.target.value)} placeholder="Tema da música..." />
                  <button onClick={handleCompose} className="btn btn-primary w-full">🚀 Gerar Composição</button>
                </div>
              </section>

              <section className="panel border-l-4 border-green-500">
                <h2 className="text-xl font-black mb-4">📚 Repertório Digital</h2>
                
                <button onClick={() => setShowInstructions(!showInstructions)} className="text-xs font-bold text-green-400 underline mb-4">
                  {showInstructions ? "Hide Instructions" : "Instructions for Use"}
                </button>
                
                {showInstructions && (
                  <div className="bg-black/30 p-4 rounded-lg text-xs mb-4">
                    1. First line = Song Title.<br/>
                    2. Use <b>---</b> to separate songs (new page).
                  </div>
                )}

                <input value={repertoireHeader} onChange={(e) => setRepertoireHeader(e.target.value)} placeholder="Header Title (Ex: Sunday Mass)" className="mb-4" />
                <textarea rows={10} value={repertoire} onChange={(e) => setRepertoire(e.target.value)} placeholder="Paste songs here..." className="font-mono text-sm" />
                <button onClick={() => generatePDF(repertoire, true)} className="btn btn-whatsapp w-full mt-4">📄 Generate PDF</button>
              </section>
            </div>

            <section className="panel h-full flex flex-col">
              <label>Composition Preview</label>
              <div className="flex-1 bg-black/40 rounded-xl p-6 mb-6 whitespace-pre-wrap font-mono">
                {compositionResult || "Lyrics will appear here..."}
              </div>
              {compositionResult && (
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => copyToClipboard(compositionResult)} className="btn bg-slate-700">📋 Copy</button>
                  <button onClick={() => shareWhatsApp(compositionResult)} className="btn btn-whatsapp">📱 Zap</button>
                  <button onClick={() => generatePDF(compositionResult, false)} className="btn btn-pdf">📕 PDF</button>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
