"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"

export default function PromptLabPage() {
  const [showInstructions, setShowInstructions] = useState(false)
  const [repertoire, setRepertoire] = useState("")
  const [repertoireHeader, setRepertoireHeader] = useState("")

  // DETECTOR DE CIFRAS (Aprimorado)
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
      
      // Limite de caracteres para Courier Bold 10pt em uma coluna de 85mm
      const charLimit = 42; 
      
      if (!repertoire.trim()) return alert("O campo está vazio!");

      let currentX = 15;
      let currentY = 32;
      let emptyLineCount = 0;
      let isNextLineTitle = true;

      const drawFixedElements = (pdfDoc: jsPDF) => {
        if (repertoireHeader) {
          pdfDoc.setFont("helvetica", "bold");
          pdfDoc.setFontSize(10);
          pdfDoc.setTextColor(100, 116, 139);
          pdfDoc.text(repertoireHeader.toUpperCase(), 105, 12, { align: "center" });
          pdfDoc.setDrawColor(220, 220, 220);
          pdfDoc.line(15, 15, 195, 15);
        }
        pdfDoc.setFont("helvetica", "bold");
        pdfDoc.setFontSize(10);
        pdfDoc.setTextColor(150, 150, 150);
        pdfDoc.text(watermark, 105, 290, { align: "center" });
      };

      const checkColumnAndPage = () => {
        if (currentX === 15 && currentY > 282) {
          currentX = 110;
          currentY = 32;
        } else if (currentX === 110 && currentY > 275) {
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
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          
          const wrappedTitle = doc.splitTextToSize(line, 85);
          wrappedTitle.forEach((t: string) => {
            checkColumnAndPage();
            doc.text(t.toUpperCase().trim(), currentX, currentY);
            currentY += 7.5;
          });
          
          isNextLineTitle = false;
          emptyLineCount = 0;
          i++;
        } else {
          doc.setFont("courier", "bold");
          doc.setFontSize(10);

          const nextLine = lines[i + 1] || "";
          
          // LÓGICA DE SINCRONIA: Cifra + Letra
          if (isChordLine(line) && nextLine.trim() !== "" && !isChordLine(nextLine)) {
            const chordLine = line;
            const lyricLine = nextLine;
            
            // Quebra as duas linhas juntas no mesmo índice
            for (let charIdx = 0; charIdx < Math.max(chordLine.length, lyricLine.length); charIdx += charLimit) {
              checkColumnAndPage();
              
              // Parte da Cifra
              const chordChunk = chordLine.substring(charIdx, charIdx + charLimit);
              if (chordChunk.trim() !== "" || chordLine.length > charIdx) {
                doc.setTextColor(37, 99, 235); // Azul para cifras
                doc.text(chordChunk, currentX, currentY);
                currentY += 4.5;
              }
              
              // Parte da Letra
              const lyricChunk = lyricLine.substring(charIdx, charIdx + charLimit);
              doc.setTextColor(0, 0, 0); // Preto para letras
              doc.text(lyricChunk, currentX, currentY);
              currentY += 6; // Espaço entre versos
            }
            i += 2; // Pula as duas linhas processadas
          } else {
            // Linha avulsa (só letra ou só cifra sem par)
            const wrappedLine = doc.splitTextToSize(line, 85);
            wrappedLine.forEach((l: string) => {
              checkColumnAndPage();
              doc.setTextColor(isChordLine(line) ? [37, 99, 235] : [0, 0, 0]);
              doc.text(l, currentX, currentY);
              currentY += 5.5;
            });
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
      alert("Erro na geração. Verifique o conteúdo.");
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
                    <p className="mb-2"><strong>1. Alinhamento:</strong> Cifras e letras são sincronizadas automaticamente na quebra.</p>
                    <p className="mb-2"><strong>2. Títulos:</strong> Primeira linha e textos após 3 "Enters" viram títulos.</p>
                    <p><strong>3. Auto-Página:</strong> O sistema cuida das quebras de coluna e página para você.</p>
                  </div>
                )}
              </div>
              <label>Título do Cabeçalho</label>
              <input value={repertoireHeader} onChange={(e) => setRepertoireHeader(e.target.value)} placeholder="Ex: Missa de Domingo" />
              <label>Letras e Cifras</label>
              <textarea rows={12} value={repertoire} onChange={(e) => setRepertoire(e.target.value)} placeholder="Cole seu repertório aqui..." className="text-sm font-mono" />
              <button onClick={() => processPDF('download')} className="btn btn-green">📄 Gerar PDF do Repertório</button>
              <button onClick={() => processPDF('share')} className="btn btn-blue">📱 Compartilhar no WhatsApp</button>
            </section>
          </div>
          <div className="space-y-6">
            <section className="panel h-full flex flex-col sticky top-6">
              <label>Visualização em Tempo Real</label>
              <div className="flex-1 bg-black/40 rounded-xl p-6 border border-slate-800 font-mono text-sm leading-relaxed text-slate-300 min-h-[450px] whitespace-pre-wrap overflow-y-auto">
                {repertoire || "Digite suas músicas..."}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
