"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"

export default function PromptLabPage() {
  const [showInstructions, setShowInstructions] = useState(false)
  const [repertoire, setRepertoire] = useState("")
  const [repertoireHeader, setRepertoireHeader] = useState("")

  const isChordLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 120) return false;
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
        pdfDoc.setTextColor(150, 150, 150);
        pdfDoc.setFont("helvetica", "bold");
        pdfDoc.setFontSize(10);
        pdfDoc.text(watermark, 105, 290, { align: "center" });

        if (repertoireHeader) {
          pdfDoc.setTextColor(100, 116, 139);
          pdfDoc.text(repertoireHeader.toUpperCase(), 105, 12, { align: "center" });
          pdfDoc.setDrawColor(220, 220, 220);
          pdfDoc.line(15, 15, 195, 15);
        }
        pdfDoc.setTextColor(0, 0, 0); // Reset para preto garantido
      };

      const checkSpace = (needed: number) => {
        if (currentX === 15 && (currentY + needed) > 282) {
          currentX = 110;
          currentY = 32;
          doc.setTextColor(0, 0, 0);
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
        if (line.trim() === "") {
          emptyLineCount++;
          currentY += 2.5;
          i++;
          continue;
        }

        if (isNextLineTitle || emptyLineCount >= 2) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          
          const wrappedTitle = doc.splitTextToSize(line, 85);
          wrappedTitle.forEach((t: string) => {
            checkSpace(8);
            doc.text(t.toUpperCase().trim(), currentX, currentY);
            currentY += 8;
          });
          isNextLineTitle = false;
          emptyLineCount = 0;
          i++;
        } else {
          doc.setFont("courier", "bold");
          doc.setFontSize(10);

          let chordLine = line;
          let lyricLine = lines[i + 1] || "";
          
          if (isChordLine(chordLine) && lyricLine.trim() !== "" && !isChordLine(lyricLine)) {
            // BLOCO SINCRONIZADO
            while (chordLine.length > 0 || lyricLine.length > 0) {
              checkSpace(12);
              doc.setFont("courier", "bold");
              doc.setFontSize(10);

              let breakIdx = charLimit;
              const maxLen = Math.max(chordLine.length, lyricLine.length);
              
              if (maxLen > charLimit) {
                const lastSpace = lyricLine.lastIndexOf(' ', charLimit);
                const lastSpaceChord = chordLine.lastIndexOf(' ', charLimit);
                const bestSpace = Math.max(lastSpace, lastSpaceChord);
                if (bestSpace > charLimit * 0.5) breakIdx = bestSpace;
              } else {
                breakIdx = maxLen;
              }

              if (breakIdx <= 0) breakIdx = charLimit;

              const cChunk = chordLine.substring(0, breakIdx);
              const lChunk = lyricLine.substring(0, breakIdx);

              if (cChunk.trim() !== "") {
                doc.setTextColor(37, 99, 235);
                doc.text(cChunk, currentX, currentY);
                currentY += 4.5;
              }
              doc.setTextColor(0, 0, 0);
              doc.text(lChunk, currentX, currentY);
              currentY += 6.5;

              chordLine = chordLine.substring(breakIdx).replace(/^\s+/, '');
              lyricLine = lyricLine.substring(breakIdx).replace(/^\s+/, '');
            }
            i += 2; 
          } else {
            // LINHA AVULSA
            let remaining = line;
            while (remaining.length > 0) {
              checkSpace(6);
              doc.setFont("courier", "bold");
              doc.setFontSize(10);

              let breakIdx = charLimit;
              if (remaining.length > charLimit) {
                const lastSpace = remaining.lastIndexOf(' ', charLimit);
                if (lastSpace > charLimit * 0.5) breakIdx = lastSpace;
              } else {
                breakIdx = remaining.length;
              }

              if (breakIdx <= 0) breakIdx = charLimit;

              const chunk = remaining.substring(0, breakIdx);
              
              if (isChordLine(line)) {
                doc.setTextColor(37, 99, 235); 
              } else {
                doc.setTextColor(0, 0, 0); 
              }
              
              doc.text(chunk, currentX, currentY);
              currentY += 5.5;
              remaining = remaining.substring(breakIdx).replace(/^\s+/, '');
            }
            i++;
          }
          emptyLineCount = 0;
        }
      }

      const fName = "repertorio.pdf";
      if (action === 'download') {
        doc.save(fName);
      } else {
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], fName, { type: 'application/pdf' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Repertório' }).catch(() => doc.save(fName));
        } else {
          doc.save(fName);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Erro interno. A geração do PDF foi interrompida.");
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

      <header className="max-w-3xl mx-auto text-center py-12">
        <h1 className="text-5xl font-black tracking-tighter mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">PromptLab BR</h1>
        <p className="text-slate-400 font-medium">Repertório Digital Profissional</p>
      </header>

      <main className="max-w-3xl mx-auto space-y-6">
        <section className="panel border-l-4 border-green-500">
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">📚 Repertório</h2>
          <div className="mb-6">
            <button onClick={() => setShowInstructions(!showInstructions)} className="text-xs font-bold text-green-400 underline mb-2 block">
              {showInstructions ? "🔼 Ocultar" : "🔽 Instruções"}
            </button>
            {showInstructions && (
              <div className="bg-black/30 p-4 rounded text-xs text-slate-300 leading-relaxed space-y-2">
                <p><strong>1. Sincronia:</strong> Cifras e letras quebram juntas sem cortar palavras.</p>
                <p><strong>2. Cores:</strong> Títulos saem em preto nítido, mesmo no topo da página.</p>
                <p><strong>3. Auto-Página:</strong> Tudo é organizado automaticamente em colunas.</p>
                <p><strong>4. Nova Música:</strong> Para iniciar uma nova música tecle enter 3 vezes e automaticamente a primeira linha da música fica como título.</p>
              </div>
            )}
          </div>
          <label>Cabeçalho do PDF</label>
          <input value={repertoireHeader} onChange={(e) => setRepertoireHeader(e.target.value)} placeholder="Ex: Missa de Domingo" />
          <label>Letras e Cifras</label>
          <textarea rows={16} value={repertoire} onChange={(e) => setRepertoire(e.target.value)} placeholder="Cole o título da música e as letras/cifras aqui..." className="text-sm font-mono" />
          <div className="pt-2">
            <button onClick={() => processPDF('download')} className="btn btn-green">📄 Gerar PDF</button>
            <button onClick={() => processPDF('share')} className="btn btn-blue">📱 Compartilhar WhatsApp</button>
          </div>
        </section>
      </main>
    </div>
  )
}
