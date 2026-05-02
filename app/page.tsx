"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"

export default function PromptLabPage() {
  const [showInstructions, setShowInstructions] = useState(false)
  const [repertoire, setRepertoire] = useState("")
  const [repertoireHeader, setRepertoireHeader] = useState("")

  const isChordLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 100) return false;
    const chordPattern = /^(\s*([A-G][b#]?(m|min|maj|maj7|m7|add|sus|dim|aug|[\d])?(\/[A-G][b#]?)?|INTRO:|REFRÃO:|PONTE:|SOLO:|VAMP:|\(|\)|\||\d|\+)(\s+|$))+$/i;
    return chordPattern.test(line);
  };

  const processPDF = async (action: 'download' | 'share') => {
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
      const watermark = "PromptLab Brasil";
      const charLimit = 42; 
      
      if (!repertoire.trim()) return alert("O campo está vazio!");

      let currentX = 15;
      let currentY = 32;
      let emptyLineCount = 0;
      let isNextLineTitle = true;

      const drawFixedElements = (pdfDoc: jsPDF) => {
        // Cabeçalho
        if (repertoireHeader) {
          pdfDoc.setFont("helvetica", "bold");
          pdfDoc.setFontSize(10);
          pdfDoc.setTextColor(100, 116, 139);
          pdfDoc.text(repertoireHeader.toUpperCase(), 105, 12, { align: "center" });
          pdfDoc.setDrawColor(220, 220, 220);
          pdfDoc.line(15, 15, 195, 15);
        }
        // Marca d'água
        pdfDoc.setFont("helvetica", "bold");
        pdfDoc.setFontSize(10);
        pdfDoc.setTextColor(150, 150, 150);
        pdfDoc.text(watermark, 105, 290, { align: "center" });
        // Reset crucial para evitar transparência/cinza no texto
        pdfDoc.setTextColor(0, 0, 0);
      };

      const checkSpace = (needed: number) => {
        if (currentX === 15 && (currentY + needed) > 282) {
          currentX = 110;
          currentY = 32;
        } else if (currentX === 110 && (currentY + needed) > 275) {
          doc.addPage();
          drawFixedElements(doc);
          currentX = 15;
          currentY = 32;
        }
      };

      drawFixedElements(doc);

      const lines = repertoire.split('\n');
      let i = 0;

      while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed === "") {
          emptyLineCount++;
          currentY += 2.5;
          i++;
          continue;
        }

        const isTitle = isNextLineTitle || emptyLineCount >= 2;
        
        if (isTitle) {
          doc.setTextColor(0, 0, 0);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          
          const wrappedTitle = doc.splitTextToSize(line, 85);
          wrappedTitle.forEach((t: string) => {
            checkSpace(8);
            doc.text(t.toUpperCase().trim(), currentX, currentY);
            currentY += 7.5;
          });
          
          isNextLineTitle = false;
          emptyLineCount = 0;
          i++;
        } else {
          doc.setFont("courier", "bold");
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);

          let chordLine = line;
          let lyricLine = lines[i + 1] || "";
          
          if (isChordLine(chordLine) && lyricLine.trim() !== "" && !isChordLine(lyricLine)) {
            // Bloco Sincronizado
            while (chordLine.length > 0 || lyricLine.length > 0) {
              checkSpace(11);
              
              // Encontra o ponto de quebra ideal (espaço)
              let breakIdx = charLimit;
              if (Math.max(chordLine.length, lyricLine.length) > charLimit) {
                const tempLyric = lyricLine.substring(0, charLimit + 1);
                const lastSpace = tempLyric.lastIndexOf(' ');
                if (lastSpace > 0) breakIdx = lastSpace;
              } else {
                breakIdx = Math.max(chordLine.length, lyricLine.length);
              }

              const chordChunk = chordLine.substring(0, breakIdx);
              const lyricChunk = lyricLine.substring(0, breakIdx);

              // Desenha Cifra
              if (chordChunk.trim() !== "") {
                doc.setTextColor(37, 99, 235);
                doc.text(chordChunk, currentX, currentY);
                currentY += 4.5;
              }
              
              // Desenha Letra
              doc.setTextColor(0, 0, 0);
              doc.text(lyricChunk.trimEnd(), currentX, currentY);
              currentY += 6;

              // Remove o que já foi desenhado
              chordLine = chordLine.substring(breakIdx).trimStart();
              lyricLine = lyricLine.substring(breakIdx).trimStart();
            }
            i += 2; 
          } else {
            // Linha avulsa com Smart Wrap
            let remaining = line;
            while (remaining.length > 0) {
              checkSpace(6);
              let breakIdx = charLimit;
              if (remaining.length > charLimit) {
                const lastSpace = remaining.substring(0, charLimit + 1).lastIndexOf(' ');
                if (lastSpace > 0) breakIdx = lastSpace;
              } else {
                breakIdx = remaining.length;
              }

              const chunk = remaining.substring(0, breakIdx);
              doc.setTextColor(isChordLine(line) ? [37, 99, 235] : [0, 0, 0]);
              doc.text(chunk.trimEnd(), currentX, currentY);
              currentY += 5.5;
              remaining = remaining.substring(breakIdx).trimStart();
            }
            i++;
          }
          emptyLineCount = 0;
        }
      }

      const fileName = "repertorio.pdf";
      if (action === 'download') {
        doc.save(fileName);
      } else {
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Meu Repertório' }).catch(() => doc.save(fileName));
        } else {
          doc.save(fileName);
        }
      }
    } catch (err) {
      alert("Houve um erro na geração do PDF.");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans p-4">
      <style jsx global>{`
        .panel { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }
        label { color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; display: block; letter-spacing: 0.05em; }
        input, textarea { background: #020617; border: 1px solid #334155; color: white; padding: 12px; border-radius: 8px; width: 100%; transition: all 0.2s; margin-bottom: 12px; }
        .btn { padding: 14px; border-radius: 8px; font-weight: 800; cursor: pointer; border: none; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; text-transform: uppercase; font-size: 0.85rem; }
        .btn-green { background: #22c55e; color: white; margin-bottom: 10px; }
        .btn-blue { background: #2563eb; color: white; }
      `}</style>

      <header className="max-w-5xl mx-auto text-center py-12">
        <h1 className="text-5xl font-black tracking-tighter mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">PromptLab BR</h1>
        <p className="text-slate-400 font-medium">Repertório Digital Profissional</p>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <section className="panel border-l-4 border-green-500">
              <h2 className="text-xl font-black mb-4 flex items-center gap-2">📚 Repertório</h2>
              <div className="mb-6">
                <button onClick={() => setShowInstructions(!showInstructions)} className="text-xs font-bold text-green-400 underline mb-2 block">
                  {showInstructions ? "🔼 Ocultar" : "🔽 Instruções de Uso"}
                </button>
                {showInstructions && (
                  <div className="bg-black/30 p-4 rounded-lg border border-green-900/50 text-xs text-slate-300 leading-relaxed">
                    <p className="mb-2"><strong>1. Títulos:</strong> O primeiro título da página agora sai sempre em preto sólido.</p>
                    <p className="mb-2"><strong>2. Quebra de Linha:</strong> Palavras não são mais cortadas ao meio na troca de linha.</p>
                    <p><strong>3. Sincronia:</strong> Cifras acompanham a quebra das palavras automaticamente.</p>
                  </div>
                )}
              </div>
              <label>Título do Cabeçalho</label>
              <input value={repertoireHeader} onChange={(e) => setRepertoireHeader(e.target.value)} placeholder="Ex: Missa de Domingo" />
              <label>Letras e Cifras</label>
              <textarea rows={12} value={repertoire} onChange={(e) => setRepertoire(e.target.value)} placeholder="Título da Música..." className="text-sm font-mono" />
              <button onClick={() => processPDF('download')} className="btn btn-green">📄 Gerar PDF do Repertório</button>
              <button onClick={() => processPDF('share')} className="btn btn-blue">📱 Compartilhar no WhatsApp</button>
            </section>
          </div>
          <div className="space-y-6">
            <section className="panel h-full flex flex-col sticky top-6">
              <label>Visualização em Tempo Real</label>
              <div className="flex-1 bg-black/40 rounded-xl p-6 border border-slate-800 font-mono text-sm leading-relaxed text-slate-300 min-h-[450px] whitespace-pre-wrap overflow-y-auto">
                {repertoire || "Aguardando conteúdo..."}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
