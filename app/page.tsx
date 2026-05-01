"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"

export default function PromptLabPage() {
  const [activeTab, setActiveTab] = useState<"image" | "music">("music")
  const [showInstructions, setShowInstructions] = useState(false)
  
  const [musicTheme, setMusicTheme] = useState("")
  const [musicStyle, setMusicStyle] = useState("Worship")
  const [musicVibe, setMusicVibe] = useState("Inspiradora")
  const [compositionResult, setCompositionResult] = useState("")
  const [repertoire, setRepertoire] = useState("")
  const [repertoireHeader, setRepertoireHeader] = useState("")

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Texto copiado!")
  }

  // FUNÇÃO DE DETECÇÃO SIMPLIFICADA (Para não travar)
  const isChordLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 60) return false;
    // Se a linha tiver muitos espaços e poucas letras minúsculas, é cifra
    const words = trimmed.split(/\s+/);
    const isChord = words.every(word => /^[A-G][b#]?(m|maj|dim|aug|sus|add|[0-9/])*$/i.test(word));
    return isChord || trimmed.includes("INTRO:") || trimmed.includes("REFRÃO:");
  };

  // GERADOR DE PDF E COMPARTILHAMENTO
  const processPDF = async (content: string, isRepertoire: boolean, action: 'download' | 'share') => {
    try {
      const doc = new jsPDF();
      const watermark = "PromptLab Brasil";
      
      if (!content.trim()) {
        alert("Por favor, cole as músicas antes de gerar o PDF.");
        return;
      }

      // Separa por hífen (-) sozinho na linha
      const songs = isRepertoire ? content.split(/\n\s*-\s*\n/) : [content];

      songs.forEach((song, index) => {
        const trimmedSong = song.trim();
        if (!trimmedSong) return;
        if (index > 0) doc.addPage();

        // Cabeçalho
        if (repertoireHeader) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 116, 139);
          doc.text(repertoireHeader.toUpperCase(), 105, 12, { align: "center" });
          doc.setDrawColor(200);
          doc.line(15, 15, 195, 15);
        }

        // Marca d'água
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "bold");
        doc.text(watermark, 105, 290, { align: "center" });

        const lines = trimmedSong.split('\n');
        const firstLine = lines[0].trim();
        
        let title = isChordLine(firstLine) ? "MÚSICA SEM TÍTULO" : firstLine;
        let body = isChordLine(firstLine) ? lines : lines.slice(1);

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(title.toUpperCase(), 15, 25);

        doc.setFontSize(10);
        doc.setFont("courier", "bold");

        let currentY = 35;
        let currentX = 15;
        let lineCount = 0;

        body.forEach((line) => {
          if (lineCount === 38) { // Pula para segunda coluna
            currentY = 35;
            currentX = 110;
          }
          if (lineCount >= 76) return;

          if (isChordLine(line)) {
            doc.setTextColor(37, 99, 235); // Azul
          } else {
            doc.setTextColor(0, 0, 0); // Preto
          }

          doc.text(line, currentX, currentY);
          currentY += 6;
          lineCount++;
        });
      });

      if (action === 'download') {
        doc.save("meu-repertorio.pdf");
      } else {
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], "repertorio.pdf", { type: 'application/pdf' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Meu Repertório',
            text: 'Crie o seu repertório em promptlabbrasil.com.br',
          });
        } else {
          doc.save("repertorio.pdf");
          alert("Seu navegador não permite o envio direto. O PDF foi baixado, agora anexe-o no WhatsApp!");
        }
      }
    } catch (err) {
      alert("Erro ao processar PDF: " + err);
    }
  };

  const handleCompose = () => {
    if (!musicTheme) {
      alert("Digite um tema para a música!");
      return;
    }
    const result = `SUA NOVA MÚSICA\n\n[Tema: ${musicTheme}]\n[Estilo: ${musicStyle}]\n\nC          G          Am\nNo silêncio do meu peito floresceu\nF          C          G\nUm rastro de luz que o céu me deu`;
    setCompositionResult(result);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans p-4">
      <style jsx global>{`
        .panel { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }
        label { color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; display: block; }
        input, select, textarea { background: #020617; border: 1px solid #334155; color: white; padding: 12px; border-radius: 8px; width: 100%; margin-bottom: 15px; }
        .btn { padding: 14px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; border: none; width: 100%; display: block; text-align: center; }
        .btn-green { background: #22c55e; color: white; margin-bottom: 10px; }
        .btn-blue { background: #2563eb; color: white; }
        .btn-purple { background: #9333ea; color: white; }
      `}</style>

      <header className="max-w-5xl mx-auto text-center py-10">
        <h1 className="text-5xl font-black mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">PromptLab BR</h1>
        <div className="flex justify-center gap-3">
          <button onClick={() => setActiveTab("image")} className={`px-8 py-2 rounded-full font-bold ${activeTab === 'image' ? 'bg-blue-600' : 'bg-slate-800'}`}>🖼️ Imagens</button>
          <button onClick={() => setActiveTab("music")} className={`px-8 py-2 rounded-full font-bold ${activeTab === 'music' ? 'bg-purple-600' : 'bg-slate-800'}`}>🎸 MusicLab</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {activeTab === "music" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <section className="panel border-l-4 border-purple-500">
                <h2 className="text-xl font-bold mb-4">✨ Compositor AI</h2>
                <input value={musicTheme} onChange={(e) => setMusicTheme(e.target.value)} placeholder="Tema da música..." />
                <button onClick={handleCompose} className="btn btn-purple">🚀 Gerar Composição</button>
              </section>

              <section className="panel border-l-4 border-green-500">
                <h2 className="text-xl font-bold mb-4">📚 Repertório Digital</h2>
                <button onClick={() => setShowInstructions(!showInstructions)} className="text-xs text-green-400 underline mb-4 block">Instruções de Uso</button>
                {showInstructions && (
                  <div className="bg-black/30 p-3 rounded mb-4 text-xs">
                    1. Título na primeira linha.<br/>
                    2. Use um hífen (-) sozinho na linha para nova página.
                  </div>
                )}
                <label>Título do Cabeçalho</label>
                <input value={repertoireHeader} onChange={(e) => setRepertoireHeader(e.target.value)} placeholder="Ex: Missa de Domingo" />
                <label>Músicas</label>
                <textarea rows={8} value={repertoire} onChange={(e) => setRepertoire(e.target.value)} placeholder="Cole aqui..." />
                
                <button onClick={() => processPDF(repertoire, true, 'download')} className="btn btn-green">📄 Gerar PDF (Tablet)</button>
                <button onClick={() => processPDF(repertoire, true, 'share')} className="btn btn-blue">📱 Compartilhar no WhatsApp</button>
              </section>
            </div>

            <section className="panel h-full flex flex-col">
              <label>Resultado da Composição</label>
              <div className="flex-1 bg-black/40 rounded-xl p-4 mb-4 whitespace-pre-wrap font-mono text-sm border border-slate-800 min-h-[300px]">
                {compositionResult || "As letras aparecerão aqui..."}
              </div>
              {compositionResult && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => processPDF(compositionResult, false, 'download')} className="btn btn-green !p-2 text-xs">Baixar PDF</button>
                  <button onClick={() => processPDF(compositionResult, false, 'share')} className="btn btn-blue !p-2 text-xs">Enviar Zap</button>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
