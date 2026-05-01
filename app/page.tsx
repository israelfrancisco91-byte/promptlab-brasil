"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"

const IMAGE_LIBRARY = [
  {
    key: "style",
    title: "Estilo visual",
    options: [
      { id: "realismo", label: "Realismo", en: "photorealistic, 8k" },
      { id: "cyberpunk", label: "Cyberpunk", en: "cyberpunk aesthetic" },
      { id: "pixar", label: "Pixar 3D", en: "3D animated pixar style" },
      { id: "anime", label: "Anime", en: "anime style" }
    ]
  }
]

export default function PromptLabPage() {
  const [activeTab, setActiveTab] = useState<"image" | "music">("image")
  
  // --- STATES IMAGEM ---
  const [idea, setIdea] = useState("")
  const [selections, setSelections] = useState<Record<string, string[]>>({ style: [] })

  // --- STATES MUSICLAB ---
  const [musicTheme, setMusicTheme] = useState("")
  const [musicStyle, setMusicStyle] = useState("Worship")
  const [musicVibe, setMusicVibe] = useState("Inspiradora")
  const [compositionResult, setCompositionResult] = useState("")
  const [repertoire, setRepertoire] = useState("")
  const [repertoireHeader, setRepertoireHeader] = useState("") // Novo campo para o cabeçalho

  // --- FUNÇÕES DE UTILIDADE ---
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copiado com sucesso!")
  }

  const shareWhatsApp = (text: string) => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  // --- GERADOR DE PDF ---
  const generatePDF = (content: string, isRepertoire: boolean) => {
    const doc = new jsPDF();
    const watermark = "PromptLab Brasil";
    
    // Função para detectar se a linha é uma cifra
    const isChordLine = (line: string) => {
      // Regex que identifica notas (A-G), sustenidos, bemóis e variações de acordes
      const chordPattern = /^[A-G](?:maj|min|maj7|m7|m|add|dim|sus|[\d\#\b\/])*(\s+[A-G](?:maj|min|maj7|m7|m|add|dim|sus|[\d\#\b\/])*)*\s*$/;
      const trimmed = line.trim();
      return trimmed.length > 0 && chordPattern.test(trimmed);
    };

    const songs = isRepertoire ? content.split(/---+\n?/) : [content];

    songs.forEach((song, index) => {
      const trimmedSong = song.trim();
      if (!trimmedSong) return;

      if (index > 0) doc.addPage();

      // 1. CABEÇALHO PERSONALIZADO (Topo e Centralizado)
      if (repertoireHeader) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139); 
        doc.text(repertoireHeader.toUpperCase(), 105, 12, { align: "center" });
        doc.setDrawColor(200);
        doc.line(10, 15, 200, 15); // Linha divisória
      }

      // 2. MARCA D'ÁGUA (Rodapé Centralizado e mais forte)
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60); 
      doc.setFont("helvetica", "bold");
      doc.text(watermark, 105, 292, { align: "center" });

      // 3. TÍTULO DA MÚSICA (Primeira linha)
      const lines = trimmedSong.split('\n');
      const songTitle = isRepertoire ? lines[0].trim() : "Minha Composição AI";
      const songBody = isRepertoire ? lines.slice(1) : lines;

      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(songTitle.toUpperCase(), 10, 25);

      // 4. CORPO DA MÚSICA (Letras e Cifras)
      doc.setFontSize(11);
      let currentY = 35;
      let currentX = 10;
      let lineCount = 0;

      songBody.forEach((line) => {
        // Lógica de duas colunas
        if (lineCount === 50) {
          currentY = 35;
          currentX = 110;
        }
        if (lineCount > 100) return; 

        if (isChordLine(line)) {
          // CIFRA: Azul e Negrito
          doc.setTextColor(37, 99, 235); 
          doc.setFont("helvetica", "bold");
        } else {
          // LETRA: Preto e Normal
          doc.setTextColor(0, 0, 0);
          doc.setFont("helvetica", "normal");
        }

        doc.text(line, currentX, currentY);
        currentY += 5.5; 
        lineCount++;
      });
    });

    doc.save(isRepertoire ? "repertorio-digital.pdf" : "composicao.pdf");
  }

  const handleCompose = () => {
    const result = `SUA NOVA MÚSICA\n\n[Tema: ${musicTheme}]\n[Estilo: ${musicStyle} | Vibe: ${musicVibe}]\n\nC          G          Am\nNo silêncio do meu peito floresceu\nF          C          G\nUm rastro de luz que o céu me deu\n\n(Refrão)\nC          G\nOh esse ${musicTheme}\nAm         F\nQue faz a gente sonhar`
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
                <h2 className="text-xl font-black mb-6 flex items-center gap-2">📚 Repertório Digital</h2>
                
                <div className="mb-4">
                  <label>Título do Cabeçalho (Topo do PDF)</label>
                  <input 
                    value={repertoireHeader} 
                    onChange={(e) => setRepertoireHeader(e.target.value)} 
                    placeholder="Ex: Repertório da Igreja - Maio 2026" 
                  />
                </div>

                <label>Músicas (Use --- entre elas)</label>
                <textarea 
                  rows={10} 
                  value={repertoire} 
                  onChange={(e) => setRepertoire(e.target.value)} 
                  placeholder="Título da Música&#10;C   G   Am&#10;Letra aqui...&#10;&#10;---&#10;&#10;Próxima Música..." 
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
