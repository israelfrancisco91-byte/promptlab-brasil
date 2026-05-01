"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"

export default function PromptLabPage() {
  const [showInstructions, setShowInstructions] = useState(false)
  
  // --- STATES ---
  const [repertoire, setRepertoire] = useState("")
  const [repertoireHeader, setRepertoireHeader] = useState("")

  // DETECTOR DE CIFRAS
  const isChordLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 80) return false;
    const chordPattern = /^(\s*([A-G][b#]?(m|min|maj|maj7|m7|add|sus|dim|aug|[\d])?(\/[A-G][b#]?)?|INTRO:|REFRÃO:|PONTE:|SOLO:|VAMP:)(\s+|$))+$/i;
    return chordPattern.test(line);
  };

  // GERADOR E COMPARTILHADOR DE PDF
  const processPDF = async (action: 'download' | 'share') => {
    try {
      const doc = new jsPDF();
      const watermark = "PromptLab Brasil";
      
      if (!repertoire.trim()) return alert("O campo de letras e cifras está vazio!");

      // Regra da Página: Hífen (-) sozinho na linha
      const pages = repertoire.split(/\n\s*-\s*\n/);

      pages.forEach((pageContent, index) => {
        const trimmedPage = pageContent.trim();
        if (!trimmedPage) return;
        if (index > 0) doc.addPage();

        // Cabeçalho
        if (repertoireHeader) {
          doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(100, 116, 139);
          doc.text(repertoireHeader.toUpperCase(), 105, 12, { align: "center" });
          doc.setDrawColor(220, 220, 220); doc.line(15, 15, 195, 15);
        }

        // Marca d'água (Rodapé)
        doc.setFontSize(10); doc.setTextColor(150, 150, 150); doc.setFont("helvetica", "bold");
        doc.text(watermark, 105, 290, { align: "center" });

        const lines = trimmedPage.split('\n');
        
        let currentY = 35; 
        let currentX = 15; 
        let lineCount = 0;
        const maxLinesPerCol = 38;
        
        let emptyLineCount = 0;
        let isNextLineTitle = true; // A primeira linha da página é sempre título

        lines.forEach((line) => {
          const trimmedLine = line.trim();
          
          if (trimmedLine === "") {
            emptyLineCount++;
            currentY += 2.5; // Espaço visual para linhas em branco
            return; 
          }

          // Troca de coluna
          if (lineCount >= maxLinesPerCol && currentX === 15) { 
            currentY = 35; 
            currentX = 110; 
            lineCount = 0;
          }
          if (lineCount >= maxLinesPerCol && currentX === 110) return;

          // REGRA CORRIGIDA: Título apenas no início ou após DUAS ou mais linhas em branco
          if (isNextLineTitle || emptyLineCount >= 2) {
            doc.setFontSize(14); 
            doc.setTextColor(0, 0, 0); 
            doc.setFont("helvetica", "bold");
            doc.text(trimmedLine.toUpperCase(), currentX, currentY);
            currentY += 7; 
            isNextLineTitle = false;
          } else {
            doc.setFontSize(10); 
            doc.setFont("courier", "bold");
            doc.setTextColor(isChordLine(line) ? [37, 99, 235] : [0, 0, 0]);
            doc.text(line, currentX, currentY);
            currentY += 5.5;
          }
          
          lineCount++;
          emptyLineCount = 0; // Reseta o contador ao encontrar texto
        });
      });

      const fileName = "repertorio-promptlab.pdf";
      if (action === 'download') {
        doc.save(fileName);
      } else {
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.share) {
          await navigator.share({ files: [file], title: 'PromptLab', text: 'Crie o seu repertório em promptlabbrasil.com.br' });
        } else {
          doc.save(fileName); alert("PDF baixado!");
        }
      }
    } catch (err) { alert("Erro: " + err); }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans p-4 selection:bg-blue-500/30">
      <style jsx global>{`
        .panel { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }
        label { color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; display: block; letter-spacing: 0.05em; }
        input, textarea { background: #020617; border: 1px solid #334155; color: white; padding: 12px; border-radius: 8px; width: 100%; transition: all 0.2s; margin-bottom: 12px; }
        input:focus, textarea:focus { border-color: #3b82f6; outline: none; }
        .btn { padding: 14px; border-radius: 8px; font-weight: 800; cursor: pointer; border: none; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; text-transform: uppercase; font-size: 0.85rem; }
        .btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
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
              <h2 className="text-xl font-black mb-4 flex items-center gap-2">📚 Repertório Digital</h2>
              
              <div className="mb-6">
                <button 
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="text-xs font-bold text-green-400 hover:text-green-300 underline flex items-center gap-1 mb-2"
                >
                  {showInstructions ? "🔼 Ocultar Instruções" : "🔽 Instruções de Uso"}
                </button>
                {showInstructions && (
                  <div className="bg-black/30 p-4 rounded-lg border border-green-900/50 text-xs text-slate-300 leading-relaxed animate-in fade-in slide-in-from-top-1">
                    <p className="mb-2"><strong>1. Título:</strong> A primeira linha de cada página é sempre um título.</p>
                    <p className="mb-2"><strong>2. Nova Página:</strong> Use um hífen (<strong>-</strong>) sozinho em uma linha para pular de página.</p>
                    <p><strong>3. Nova Música:</strong> Para destacar um novo título na mesma página, deixe duas linhas em branco (tecle Enter 3 vezes).</p>
                  </div>
                )}
              </div>

              <label>Título do Cabeçalho (Topo do PDF)</label>
              <input value={repertoireHeader} onChange={(e) => setRepertoireHeader(e.target.value)} placeholder="Ex: Missa de Domingo" />
              
              <label>Cole aqui as letras e cifras</label>
              <textarea rows={12} value={repertoire} onChange={(e) => setRepertoire(e.target.value)} placeholder="Título da Música&#10;C   G   Am&#10;Letra da música aqui..." className="text-sm font-mono" />
              
              <button onClick={() => processPDF('download')} className="btn btn-green">📄 Gerar PDF do Repertório</button>
              <button onClick={() => processPDF('share')} className="btn btn-blue">📱 Compartilhar no WhatsApp</button>
            </section>
          </div>

          <div className="space-y-6">
            <section className="panel h-full flex flex-col sticky top-6">
              <label>Visualização em Tempo Real</label>
              <div className="flex-1 bg-black/40 rounded-xl p-6 border border-slate-800 font-mono text-sm leading-relaxed text-slate-300 min-h-[450px] whitespace-pre-wrap overflow-y-auto text-left">
                {repertoire || "Digite suas músicas para visualizar..."}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                 <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">PromptLab Brasil - Sistema de Cifras Inteligentes</span>
              </div>
            </section>
          </div>

        </div>
      </main>

      <footer className="max-w-5xl mx-auto text-center py-12 text-slate-500 text-xs">
        © 2026 PromptLab Brasil - Todos os direitos reservados.
      </footer>
    </div>
  )
}
