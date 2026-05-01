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
      // Configuração inicial rigorosa para A4
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
      const watermark = "PromptLab Brasil";
      
      if (!repertoire.trim()) return alert("O campo está vazio!");

      const pages = repertoire.split(/\n\s*-\s*\n/);

      pages.forEach((pageContent, index) => {
        const trimmedPage = pageContent.trim();
        if (!trimmedPage) return;
        if (index > 0) doc.addPage();

        // Cabeçalho (Topo)
        if (repertoireHeader) {
          doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(100, 116, 139);
          doc.text(repertoireHeader.toUpperCase(), 105, 12, { align: "center" });
          doc.setDrawColor(220, 220, 220); doc.line(15, 15, 195, 15);
        }

        // Marca d'água (Rodapé fixo)
        doc.setFontSize(10); doc.setTextColor(150, 150, 150); doc.setFont("helvetica", "bold");
        doc.text(watermark, 105, 290, { align: "center" });

        const lines = trimmedPage.split('\n');
        let currentY = 32; 
        let currentX = 15; 
        let emptyLineCount = 0;
        let isNextLineTitle = true; 

        lines.forEach((line) => {
          const trimmedLine = line.trim();
          
          if (trimmedLine === "") {
            emptyLineCount++;
            currentY += 2.5;
            return; 
          }

          // AJUSTE DE COLUNAS (Solicitado: Esquerda desce mais, Direita recua antes)
          if (currentX === 15 && currentY > 282) { // Limite da Esquerda
              currentY = 32; 
              currentX = 110; 
          }

          if (currentX === 110 && currentY > 275) return; // Limite da Direita (livra marca d'água)

          if (isNextLineTitle || emptyLineCount >= 2) {
            doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold");
            doc.text(trimmedLine.toUpperCase(), currentX, currentY);
            currentY += 7; 
            isNextLineTitle = false;
          } else {
            doc.setFontSize(10); doc.setFont("courier", "bold");
            if (isChordLine(line)) {
              doc.setTextColor(37, 99, 235); 
            } else {
              doc.setTextColor(0, 0, 0); 
            }
            doc.text(line, currentX, currentY);
            currentY += 5.5;
          }
          emptyLineCount = 0;
        });
      });

      const fileName = "meu-repertorio.pdf";

      if (action === 'download') {
        doc.save(fileName);
      } else {
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

        // BLINDAGEM MOBILE PARA COMPARTILHAMENTO
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Repertório PromptLab',
            });
          } catch (err: any) {
            if (err.name !== 'AbortError') alert("Erro ao enviar: " + err.message);
          }
        } else {
          // Fallback para quando o compartilhamento falha ou não é suportado
          doc.save(fileName);
          alert("Compartilhamento direto não disponível. O PDF foi baixado para você anexar manualmente.");
        }
      }
    } catch (err) {
      alert("Houve um erro técnico ao gerar o PDF no celular. Tente reduzir o texto por página.");
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

      <header className="max-w-5xl mx-auto text-center py-10">
        <h1 className="text-4xl font-black tracking-tighter mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">PromptLab BR</h1>
        <p className="text-slate-400 text-sm">Organizador de Repertório Profissional</p>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <section className="panel border-l-4 border-green-500">
              <h2 className="text-xl font-black mb-4">📚 Repertório</h2>
              <div className="mb-4">
                <button onClick={() => setShowInstructions(!showInstructions)} className="text-xs font-bold text-green-400 underline mb-2 block">
                  {showInstructions ? "🔼 Ocultar Instruções" : "🔽 Instruções de Uso"}
                </button>
                {showInstructions && (
                  <div className="bg-black/30 p-4 rounded text-xs text-slate-300 space-y-1">
                    <p>1. Primeira linha = Título.</p>
                    <p>2. Hífen (-) sozinho = Nova página.</p>
                    <p>3. Três Enters = Novo título na mesma página.</p>
                  </div>
                )}
              </div>
              <label>Título do Cabeçalho</label>
              <input value={repertoireHeader} onChange={(e) => setRepertoireHeader(e.target.value)} placeholder="Ex: Missa de Domingo" />
              <label>Letras e Cifras</label>
              <textarea rows={10} value={repertoire} onChange={(e) => setRepertoire(e.target.value)} placeholder="Cole aqui..." className="text-sm font-mono" />
              <button onClick={() => processPDF('download')} className="btn btn-green">📄 Gerar PDF (Download)</button>
              <button onClick={() => processPDF('share')} className="btn btn-blue">📱 Compartilhar WhatsApp</button>
            </section>
          </div>
          <div className="hidden lg:block">
            <section className="panel h-full sticky top-6">
              <label>Visualização</label>
              <div className="bg-black/40 rounded-xl p-6 border border-slate-800 font-mono text-sm text-slate-300 min-h-[400px] whitespace-pre-wrap overflow-y-auto">
                {repertoire || "Aguardando conteúdo..."}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
