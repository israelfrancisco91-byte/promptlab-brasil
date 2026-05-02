"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"

export default function PromptLabPage() {
  const [showInstructions, setShowInstructions] = useState(false)
  const [repertoire, setRepertoire] = useState("")
  const [repertoireHeader, setRepertoireHeader] = useState("")

  // DETECTOR DE CIFRAS
  const isChordLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 80) return false;
    const chordPattern = /^(\s*([A-G][b#]?(m|min|maj|maj7|m7|add|sus|dim|aug|[\d])?(\/[A-G][b#]?)?|INTRO:|REFRÃO:|PONTE:|SOLO:|VAMP:)(\s+|$))+$/i;
    return chordPattern.test(line);
  };

  const processPDF = async (action: 'download' | 'share') => {
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
      const watermark = "PromptLab Brasil";
      const colWidth = 85; // Limite rigoroso para evitar sobreposição
      
      if (!repertoire.trim()) return alert("O campo está vazio!");

      let currentX = 15;
      let currentY = 32;
      let emptyLineCount = 0;
      let isNextLineTitle = true;

      // Função interna para elementos fixos
      const drawFixedElements = (pdfDoc: jsPDF) => {
        if (repertoireHeader) {
          pdfDoc.setFontSize(10); pdfDoc.setFont("helvetica", "bold"); pdfDoc.setTextColor(100);
          pdfDoc.text(repertoireHeader.toUpperCase(), 105, 12, { align: "center" });
          pdfDoc.setDrawColor(220); pdfDoc.line(15, 15, 195, 15);
        }
        pdfDoc.setFontSize(10); pdfDoc.setTextColor(150); pdfDoc.setFont("helvetica", "bold");
        pdfDoc.text(watermark, 105, 290, { align: "center" });
      };

      drawFixedElements(doc);

      const allLines = repertoire.split('\n');

      allLines.forEach((line) => {
        const trimmedLine = line.trim();

        if (trimmedLine === "") {
          emptyLineCount++;
          currentY += 2.5;
          return;
        }

        // Detecta se a próxima linha deve ser título baseado nos Enters (3 Enters = 2 linhas vazias)
        const isTitle = isNextLineTitle || emptyLineCount >= 2;
        
        // Configura estilo para medição
        if (isTitle) {
          doc.setFontSize(14); doc.setFont("helvetica", "bold");
        } else {
          doc.setFontSize(10); doc.setFont("courier", "bold");
        }

        // QUEBRA AUTOMÁTICA: Divide a linha se ela for maior que a largura da coluna
        const wrappedSubLines = doc.splitTextToSize(line, colWidth);

        wrappedSubLines.forEach((subLine: string) => {
          // GESTÃO DE ESPAÇO (COLUNAS E PÁGINAS)
          if (currentX === 15 && currentY > 282) {
            currentX = 110;
            currentY = 32;
          } else if (currentX === 110 && currentY > 275) {
            doc.addPage();
            drawFixedElements(doc);
            currentX = 15;
            currentY = 32;
          }

          if (isTitle) {
            doc.setTextColor(0);
            doc.text(subLine.toUpperCase().trim(), currentX, currentY);
            currentY += 7;
            isNextLineTitle = false;
          } else {
            if (isChordLine(subLine)) {
              doc.setTextColor(37, 99, 235);
            } else {
              doc.setTextColor(0);
            }
            doc.text(subLine, currentX, currentY);
            currentY += 5.5;
          }
        });

        emptyLineCount = 0;
      });

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
        .panel { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; }
        label { color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; display: block; }
        input, textarea { background: #020617; border: 1px solid #334155; color: white; padding: 12px; border-radius: 8px; width: 100%; margin-bottom: 12px; }
        .btn { padding: 14px; border-radius: 8px; font-weight: 800; cursor: pointer; border: none; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; text-transform: uppercase; font-size: 0.85rem; }
        .btn-green { background: #22c55e; color: white; margin-bottom: 10px; }
        .btn-blue { background: #2563eb; color: white; }
      `}</style>

      <header className="max-w-5xl mx-auto text-center py-12">
        <h1 className="text-5xl font-black tracking-tighter mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">PromptLab BR</h1>
        <p className="text-slate-400 font-medium">Repertório Digital Inteligente</p>
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
                  <div className="bg-black/30 p-4 rounded text-xs text-slate-300 space-y-2">
                    <p><strong>1. Títulos:</strong> A primeira linha e textos após 3 "Enters" viram títulos automaticamente.</p>
                    <p><strong>2. Auto-Página:</strong> O sistema gera novas páginas sozinho quando o espaço acaba.</p>
                    <p><strong>3. Auto-Quebra:</strong> Linhas compridas são quebradas automaticamente para não invadir outras colunas.</p>
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
                {repertoire || "Seu texto aparecerá aqui..."}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
