"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"

export default function PromptLabPage() {
  const [showInstructions, setShowInstructions] = useState(false)
  const [repertoire, setRepertoire] = useState("")
  const [repertoireHeader, setRepertoireHeader] = useState("")

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
      
      if (!repertoire.trim()) return alert("O campo está vazio!");

      // Divide por Hífen (-) para novas páginas manuais
      const pagesInput = repertoire.split(/\n\s*-\s*\n/);

      pagesInput.forEach((pageContent, pageIdx) => {
        if (pageIdx > 0) doc.addPage();

        // Função interna para desenhar o que é fixo em cada página
        const drawStaticElements = () => {
          if (repertoireHeader) {
            doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(100);
            doc.text(repertoireHeader.toUpperCase(), 105, 12, { align: "center" });
            doc.setDrawColor(220); doc.line(15, 15, 195, 15);
          }
          doc.setFontSize(10); doc.setTextColor(150); doc.setFont("helvetica", "bold");
          doc.text(watermark, 105, 290, { align: "center" });
        };

        drawStaticElements();

        const lines = pageContent.split('\n');
        let currentY = 32; 
        let currentX = 15; 
        let emptyLineCount = 0;
        let isNextLineTitle = true; // Primeira linha é sempre título

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmedLine = line.trim();
          
          if (trimmedLine === "") {
            emptyLineCount++;
            currentY += 2.5;
            continue; 
          }

          // LÓGICA DE COLUNAS E PÁGINAS (Rigorosa)
          if (currentX === 15 && currentY > 282) {
            // Estourou a esquerda? Vai para a direita
            currentX = 110;
            currentY = 32;
          } else if (currentX === 110 && currentY > 275) {
            // Estourou a direita (recuo de segurança)? Cria nova página
            doc.addPage();
            drawStaticElements();
            currentX = 15;
            currentY = 32;
          }

          if (isNextLineTitle || emptyLineCount >= 2) {
            // Desenha como Título
            doc.setFontSize(14); doc.setTextColor(0); doc.setFont("helvetica", "bold");
            doc.text(trimmedLine.toUpperCase(), currentX, currentY);
            currentY += 7; 
            isNextLineTitle = false;
          } else {
            // Desenha como Letra ou Cifra
            doc.setFontSize(10); doc.setFont("courier", "bold");
            if (isChordLine(line)) {
              doc.setTextColor(37, 99, 235); // Azul Royal
            } else {
              doc.setTextColor(0); // Preto
            }
            doc.text(line, currentX, currentY);
            currentY += 5.5;
          }
          
          emptyLineCount = 0;
        }
      });

      const fileName = "repertorio.pdf";
      if (action === 'download') {
        doc.save(fileName);
      } else {
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Repertório' }).catch(() => doc.save(fileName));
        } else {
          doc.save(fileName);
        }
      }
    } catch (err) {
      alert("Houve um erro técnico. Verifique o texto e tente novamente.");
      console.error(err);
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
        <p className="text-slate-400 font-medium">O seu organizador de repertório digital para tablet</p>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <section className="panel border-l-4 border-green-500">
              <h2 className="text-xl font-black mb-4 flex items-center gap-2">📚 Repertório</h2>
              <div className="mb-6">
                <button onClick={() => setShowInstructions(!showInstructions)} className="text-xs font-bold text-green-400 underline flex items-center gap-1 mb-2">
                  {showInstructions ? "🔼 Ocultar Instruções" : "🔽 Instruções de Uso"}
                </button>
                {showInstructions && (
                  <div className="bg-black/30 p-4 rounded-lg border border-green-900/50 text-xs text-slate-300 leading-relaxed">
                    <p className="mb-2"><strong>1. Título:</strong> A primeira linha de cada página é sempre um título.</p>
                    <p className="mb-2"><strong>2. Nova Página:</strong> Use um hífen (<strong>-</strong>) sozinho para pular de página.</p>
                    <p><strong>3. Nova Música:</strong> Para novo título na mesma página, tecle Enter 3 vezes.</p>
                  </div>
                )}
              </div>
              <label>Título do Cabeçalho (Topo do PDF)</label>
              <input value={repertoireHeader} onChange={(e) => setRepertoireHeader(e.target.value)} placeholder="Ex: Missa de Domingo" />
              <label>Cole aqui as letras e cifras</label>
              <textarea rows={12} value={repertoire} onChange={(e) => setRepertoire(e.target.value)} placeholder="Título da Música..." className="text-sm font-mono" />
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
