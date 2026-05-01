"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"

export default function PromptLabPage() {
  const [showInstructions, setShowInstructions] = useState(false)
  
  // --- STATES (Apenas o necessário para o Repertório) ---
  const [repertoire, setRepertoire] = useState("")
  const [repertoireHeader, setRepertoireHeader] = useState("")

  // DETECTOR DE CIFRAS (A alma do alinhamento azul)
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

      // Regra: Separa por apenas UM hífen (-) sozinho na linha
      const songs = repertoire.split(/\n\s*-\s*\n/);

      songs.forEach((song, index) => {
        const trimmedSong = song.trim();
        if (!trimmedSong) return;
        if (index > 0) doc.addPage();

        // Cabeçalho do PDF
        if (repertoireHeader) {
          doc.setFontSize(10); 
          doc.setFont("helvetica", "bold"); 
          doc.setTextColor(100, 116, 139);
          doc.text(repertoireHeader.toUpperCase(), 105, 12, { align: "center" });
          doc.setDrawColor(220, 220, 220); 
          doc.line(15, 15, 195, 15);
        }

        // Marca d'água (Rodapé)
        doc.setFontSize(10); 
        doc.setTextColor(150, 150, 150); 
        doc.setFont("helvetica", "bold");
        doc.text(watermark, 105, 290, { align: "center" });

        const lines = trimmedSong.split('\n');
        const firstLine = lines[0]?.trim() || "";
        
        // Define título e corpo
        let title = isChordLine(firstLine) ? "MÚSICA SEM TÍTULO" : firstLine;
        let body = isChordLine(firstLine) ? lines : lines.slice(1);

        // Desenha Título
        doc.setFontSize(15); 
        doc.setTextColor(0, 0, 0); 
        doc.setFont("helvetica", "bold");
        doc.text(title.toUpperCase(), 15, 25);

        // Desenha Corpo (Courier Bold para alinhamento perfeito)
        doc.setFontSize(10); 
        doc.setFont("courier", "bold");
        let currentY = 35; 
        let currentX = 15; 
        let lineCount = 0;
        const maxLinesPerCol = 38;

        body.forEach((line) => {
          if (lineCount === maxLinesPerCol) { 
            currentY = 35; 
            currentX = 110; 
          }
          if (lineCount >= maxLinesPerCol * 2) return;

          // Se for cifra, azul. Se for letra, preto.
          if (isChordLine(line)) {
            doc.setTextColor(37, 99, 235); // Azul Royal
          } else {
            doc.setTextColor(0, 0, 0); // Preto
          }

          doc.text(line, currentX, currentY);
          currentY += 5.5; 
          lineCount++;
        });
      });

      if (action === 'download') {
        doc.save("meu-repertorio.pdf");
      } else {
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], "repertorio.pdf", { type: 'application/pdf' });
        if (navigator.share) {
          await navigator.share({ 
            files: [file], 
            title: 'PromptLab Brasil', 
            text: 'Crie o seu repertório em promptlabbrasil.com.br' 
          });
        } else {
          doc.save("repertorio.pdf"); 
          alert("PDF baixado! Agora é só anexar no WhatsApp.");
        }
      }
    } catch (err) { 
      alert("Erro ao processar PDF: " + err); 
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans p-4 selection:bg-blue-500/30">
      <style jsx global>{`
        .panel { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }
        label { color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; display: block; letter-spacing: 0.05em; }
        input, textarea { background: #020617; border: 1px solid #334155; color: white; padding: 12px; border-radius: 8px; width: 100%; transition: all 0.2s; margin-bottom: 12px; }
        input:focus, textarea:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
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
          
          {/* COLUNA ESQUERDA: ENTRADA DE DADOS */}
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
                    <p className="mb-2"><strong>1. Título:</strong> A primeira linha de cada música será o título no PDF.</p>
                    <p><strong>2. Nova Página:</strong> Coloque um hífen (<strong>-</strong>) sozinho em uma linha entre as músicas.</p>
                  </div>
                )}
              </div>

              <label>Título do Cabeçalho (Topo do PDF)</label>
              <input 
                value={repertoireHeader} 
                onChange={(e) => setRepertoireHeader(e.target.value)} 
                placeholder="Ex: Repertório da Igreja - Maio 2026" 
              />
              
              <label>Cole aqui as letras e cifras</label>
              <textarea 
                rows={12} 
                value={repertoire} 
                onChange={(e) => setRepertoire(e.target.value)} 
                placeholder="Título da Música&#10;C   G   Am&#10;Letra da música aqui..." 
                className="text-sm font-mono"
              />
              
              <button onClick={() => processPDF('download')} className="btn btn-green">
                📄 Gerar PDF do Repertório
              </button>
              <button onClick={() => processPDF('share')} className="btn btn-blue">
                📱 Compartilhar no WhatsApp
              </button>
            </section>
          </div>

          {/* COLUNA DIREITA: PRÉ-VISUALIZAÇÃO EM TEMPO REAL */}
          <div className="space-y-6">
            <section className="panel h-full flex flex-col sticky top-6">
              <label>Visualização em Tempo Real</label>
              <div className="flex-1 bg-black/40 rounded-xl p-6 border border-slate-800 font-mono text-sm leading-relaxed text-slate-300 min-h-[450px] whitespace-pre-wrap overflow-y-auto">
                {repertoire || "A estrutura do seu repertório aparecerá aqui conforme você digita..."}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                 <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">
                   PromptLab Brasil - Sistema de Cifras Inteligentes
                 </span>
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
