"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"

export default function PromptLabPage() {
  const [activeTab, setActiveTab] = useState<"image" | "music">("music")
  const [showInstructions, setShowInstructions] = useState(false)
  
  // --- STATES MUSICLAB ---
  const [musicTheme, setMusicTheme] = useState("")
  const [musicStyle, setMusicStyle] = useState("Worship")
  const [musicVibe, setMusicVibe] = useState("Inspiradora")
  const [compositionResult, setCompositionResult] = useState("")
  const [repertoire, setRepertoire] = useState("")
  const [repertoireHeader, setRepertoireHeader] = useState("")

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copiado com sucesso!")
  }

  // DETECTOR DE CIFRAS
  const isChordLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 80) return false;
    const chordPattern = /^(\s*([A-G][b#]?(m|min|maj|maj7|m7|add|sus|dim|aug|[\d])?(\/[A-G][b#]?)?|INTRO:|REFRÃO:|PONTE:|SOLO:|VAMP:)(\s+|$))+$/i;
    return chordPattern.test(line);
  };

  // GERADOR E COMPARTILHADOR DE PDF
  const processPDF = async (content: string, isRepertoire: boolean, action: 'download' | 'share') => {
    try {
      const doc = new jsPDF();
      const watermark = "PromptLab Brasil";
      if (!content.trim()) return alert("O campo está vazio!");

      // REGRA: Separa por apenas UM hífen (-) sozinho na linha
      const songs = isRepertoire ? content.split(/\n\s*-\s*\n/) : [content];

      songs.forEach((song, index) => {
        const trimmedSong = song.trim();
        if (!trimmedSong) return;
        if (index > 0) doc.addPage();

        // Cabeçalho (Se houver)
        if (repertoireHeader) {
          doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(100, 116, 139);
          doc.text(repertoireHeader.toUpperCase(), 105, 12, { align: "center" });
          doc.setDrawColor(220, 220, 220); doc.line(15, 15, 195, 15);
        }

        // Marca d'água (Rodapé)
        doc.setFontSize(10); doc.setTextColor(150, 150, 150); doc.setFont("helvetica", "bold");
        doc.text(watermark, 105, 290, { align: "center" });

        const lines = trimmedSong.split('\n');
        
        // FILTRO: Remove linhas de metadados como [Tema: ...] ou [Estilo: ...]
        const cleanLines = lines.filter(line => !line.trim().startsWith('[Tema:') && !line.trim().startsWith('[Estilo:'));
        
        const firstLine = cleanLines[0]?.trim() || "";
        let title = isChordLine(firstLine) ? (isRepertoire ? "MÚSICA SEM TÍTULO" : "COMPOSIÇÃO PROMPTLAB") : firstLine;
        let body = isChordLine(firstLine) ? cleanLines : cleanLines.slice(1);

        // Renderiza Título
        doc.setFontSize(15); doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold");
        doc.text(title.toUpperCase(), 15, 25);

        // Renderiza Corpo (Courier Bold para alinhamento)
        doc.setFontSize(10); doc.setFont("courier", "bold");
        let currentY = 35; let currentX = 15; let lineCount = 0;
        const maxLinesPerCol = 38;

        body.forEach((line) => {
          if (lineCount === maxLinesPerCol) { currentY = 35; currentX = 110; }
          if (lineCount >= maxLinesPerCol * 2) return;

          doc.setTextColor(isChordLine(line) ? [37, 99, 235] : [0, 0, 0]);
          doc.text(line, currentX, currentY);
          currentY += 5.5; lineCount++;
        });
      });

      const fileName = isRepertoire ? "repertorio.pdf" : "composicao.pdf";
      if (action === 'download') {
        doc.save(fileName);
      } else {
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.share) {
          await navigator.share({ files: [file], title: 'PromptLab', text: 'Crie o seu repertório em promptlabbrasil.com.br' });
        } else {
          doc.save(fileName); alert("PDF baixado! Anexe manualmente no WhatsApp.");
        }
      }
    } catch (err) { alert("Erro: " + err); }
  };

  // COMPOSITOR COM ESTRUTURA COMPLETA
  const handleCompose = () => {
    if (!musicTheme) return alert("Digite um tema!");
    
    const result = `[Tema: ${musicTheme} | Estilo: ${musicStyle}]\n\n` + 
      `O CAMINHO DA LUZ\n\n` +
      `INTRO: G  D/F#  Em7  C9\n\n` +
      `(Verso 1)\n` +
      `G              D/F#\n` +
      `Neste ${musicTheme} que invade o olhar\n` +
      `Em7            C9\n` +
      `Sinto a paz que vem me guiar\n` +
      `G              D/F#\n` +
      `No estilo ${musicStyle} a canção vai fluir\n` +
      `Em7            C9\n` +
      `Com essa vibe ${musicVibe} a sorrir\n\n` +
      `(Refrão)\n` +
      `D              C9\n` +
      `Oh, luz que brilha na escuridão\n` +
      `G              D/F#\n` +
      `Traz o ${musicTheme} pro meu coração\n` +
      `Em7            C9\n` +
      `Em cada nota, um novo sentido\n` +
      `D              G\n` +
      `Pelo Teu amor, sinto-me fortalecido\n\n` +
      `(Verso 2)\n` +
      `G              D/F#\n` +
      `As pedras do caminho ficaram pra trás\n` +
      `Em7            C9\n` +
      `Onde havia guerra, hoje reina a paz\n` +
      `G              D/F#\n` +
      `A melodia ${musicVibe} ecoa no ar\n` +
      `Em7            C9\n` +
      `Ensinando a gente a sempre amar\n\n` +
      `(Refrão Final)\n` +
      `D              C9\n` +
      `Oh, luz que brilha na escuridão\n` +
      `G              D/F#\n` +
      `Traz o ${musicTheme} pro meu coração\n` +
      `Em7            C9\n` +
      `Canto a vida, canto a esperança\n` +
      `D              G\n` +
      `Como o sorriso de uma criança`;
      
    setCompositionResult(result);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans p-4 selection:bg-blue-500/30">
      <style jsx global>{`
        .panel { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }
        label { color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; display: block; }
        input, select, textarea { background: #020617; border: 1px solid #334155; color: white; padding: 12px; border-radius: 8px; width: 100%; transition: all 0.2s; margin-bottom: 12px; }
        .btn { padding: 14px; border-radius: 8px; font-weight: 700; cursor: pointer; border: none; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
        .btn-primary { background: #9333ea; color: white; }
        .btn-green { background: #22c55e; color: white; margin-bottom: 10px; }
        .btn-blue { background: #2563eb; color: white; }
        .btn-copy { background: #64748b; color: white; }
      `}</style>

      <header className="max-w-5xl mx-auto text-center py-10">
        <h1 className="text-5xl font-black tracking-tighter mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">PromptLab BR</h1>
        <div className="flex justify-center gap-3">
          <button onClick={() => setActiveTab("image")} className={`px-8 py-3 rounded-full font-bold transition ${activeTab === 'image' ? 'bg-blue-600 shadow-lg shadow-blue-900/20' : 'bg-slate-800'}`}>🖼️ Imagens</button>
          <button onClick={() => setActiveTab("music")} className={`px-8 py-3 rounded-full font-bold transition ${activeTab === 'music' ? 'bg-purple-600 shadow-lg shadow-purple-900/20' : 'bg-slate-800'}`}>🎸 MusicLab</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        {activeTab === "music" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <section className="panel border-l-4 border-purple-500">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2">✨ Compositor AI</h2>
                <label>Tema da música</label>
                <input value={musicTheme} onChange={(e) => setMusicTheme(e.target.value)} placeholder="Ex: Amor de verão..." />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>Estilo</label>
                    <select value={musicStyle} onChange={(e) => setMusicStyle(e.target.value)}>
                      <option>Worship</option><option>Sertanejo</option><option>Samba</option>
                      <option>MPB</option><option>Rock</option><option>Pop</option>
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
              </section>

              <section className="panel border-l-4 border-green-500">
                <h2 className="text-xl font-black mb-4 flex items-center gap-2">📚 Repertório Digital</h2>
                <button onClick={() => setShowInstructions(!showInstructions)} className="text-xs font-bold text-green-400 underline mb-4 block">Instruções</button>
                {showInstructions && <div className="bg-black/30 p-4 rounded text-xs mb-4">1. Título na 1ª linha. 2. Use "-" para nova página.</div>}
                <input value={repertoireHeader} onChange={(e) => setRepertoireHeader(e.target.value)} placeholder="Título do Cabeçalho..." />
                <textarea rows={10} value={repertoire} onChange={(e) => setRepertoire(e.target.value)} placeholder="Título da música..." />
                <button onClick={() => processPDF(repertoire, true, 'download')} className="btn btn-green">📄 Gerar PDF (Tablet)</button>
                <button onClick={() => processPDF(repertoire, true, 'share')} className="btn btn-blue">📱 Compartilhar no WhatsApp</button>
              </section>
            </div>

            <div className="space-y-6">
              <section className="panel h-full flex flex-col sticky top-4">
                <label>Resultado da Composição</label>
                <div className="flex-1 bg-black/40 rounded-xl p-6 border border-slate-800 font-serif text-lg text-slate-300 min-h-[400px] whitespace-pre-wrap">
                  {compositionResult || "As letras e cifras aparecerão aqui..."}
                </div>
                {compositionResult && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                    <button onClick={() => copyToClipboard(compositionResult)} className="btn btn-copy text-xs">📋 Copiar</button>
                    <button onClick={() => processPDF(compositionResult, false, 'share')} className="btn btn-blue text-xs">📱 WhatsApp</button>
                    <button onClick={() => processPDF(compositionResult, false, 'download')} className="btn btn-primary text-xs">📕 Gerar PDF</button>
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
