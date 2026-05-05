"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"

interface Song {
  id: string;
  title: string;
  content: string;
}

export default function PromptLabPage() {
  // Estado para controlar qual aba está ativa no Menu
  const [activeTab, setActiveTab] = useState<'setlist' | 'capo'>('setlist')

  // --- ESTADOS DO REPERTÓRIO ---
  const [showInstructions, setShowInstructions] = useState(false)
  const [repertoireHeader, setRepertoireHeader] = useState("")
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null)
  const [songs, setSongs] = useState<Song[]>([{ id: 'init-1', title: "", content: "" }])

  // --- ESTADOS DO CAPOTRASTE ---
  const [originalTone, setOriginalTone] = useState('F')
  const [shapeTone, setShapeTone] = useState('D')
  const notesArray = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']

  // --- FUNÇÕES DO REPERTÓRIO (INTOUCHÁVEIS) ---
  const addSong = () => setSongs([...songs, { id: Date.now().toString(), title: "", content: "" }])

  const updateSong = (index: number, field: 'title' | 'content', value: string) => {
    const newSongs = [...songs];
    newSongs[index][field] = value;
    setSongs(newSongs);
  }

  const removeSong = (index: number) => {
    if (songs.length === 1) {
      setSongs([{ id: Date.now().toString(), title: "", content: "" }]);
      return;
    }
    setSongs(songs.filter((_, i) => i !== index));
  }

  const moveSong = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === songs.length - 1) return;
    const newSongs = [...songs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSongs[index], newSongs[targetIndex]] = [newSongs[targetIndex], newSongs[index]];
    setSongs(newSongs);
  }

  const isChordLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 120) return false;
    const chordPattern = /^(\s*([A-G][b#]?(m|min|maj|maj7|m7|add|sus|dim|aug|[\d])?(\/[A-G][b#]?)?|INTRO:|REFRÃO:|PONTE:|SOLO:|VAMP:|\(|\)|\||\d|\+)(\s+|$))+$/i;
    return chordPattern.test(line);
  };

  const transposeSong = (index: number, steps: number) => {
    const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatToSharp: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };

    const newSongs = [...songs];
    const lines = newSongs[index].content.split('\n');

    const transposedLines = lines.map(line => {
      if (!isChordLine(line)) return line;

      return line.replace(/(^|[\s()|])([A-G][b#]?)([^\s()|/]*)(?:\/([A-G][b#]?))?(?=[\s()|]|$)/g, (match, prefix, root, suffix, bass) => {
        const getNewNote = (note: string) => {
          if (!note) return '';
          const n = flatToSharp[note] || note; 
          const idx = scale.indexOf(n);
          if (idx === -1) return note;
          const newIdx = (idx + steps + 12) % 12;
          return scale[newIdx];
        };

        const newRoot = getNewNote(root);
        const newBass = bass ? '/' + getNewNote(bass) : '';
        return prefix + newRoot + (suffix || '') + newBass;
      });
    });

    newSongs[index].content = transposedLines.join('\n');
    setSongs(newSongs);
  };

  const processPDF = async (action: 'download' | 'share') => {
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
      const watermark = "PromptLab Brasil";
      const charLimit = 42; 
      
      const hasContent = songs.some(s => s.title.trim() !== "" || s.content.trim() !== "");
      if (!hasContent) return alert("Adicione pelo menos uma música com conteúdo!");

      let currentX = 15;
      let currentY = 32;

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
        pdfDoc.setTextColor(0, 0, 0); 
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

      songs.forEach((song) => {
        if (!song.title.trim() && !song.content.trim()) return;

        if (song.title.trim() !== "") {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          
          const wrappedTitle = doc.splitTextToSize(song.title.trim(), 85);
          wrappedTitle.forEach((t: string) => {
            checkSpace(8);
            doc.text(t.toUpperCase().trim(), currentX, currentY);
            currentY += 8;
          });
        }

        const lines = song.content.split('\n');
        let j = 0;

        while (j < lines.length) {
          const line = lines[j];
          if (line.trim() === "") {
            currentY += 2.5; 
            j++;
            continue;
          }

          doc.setFont("courier", "bold");
          doc.setFontSize(10);

          let chordLine = line;
          let lyricLine = lines[j + 1] || "";
          
          if (isChordLine(chordLine) && lyricLine.trim() !== "" && !isChordLine(lyricLine)) {
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
            j += 2; 
          } else {
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
            j++;
          }
        }
        currentY += 6;
      });

      const fName = "repertorio.pdf";
      if (action === 'download') {
        doc.save(fName);
      } else {
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], fName, { type: 'application/pdf' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ 
            files: [file], 
            title: 'Repertório Digital',
            text: 'Crie o seu repertório digital no promptlabbrasil.com.br'
          }).catch(() => doc.save(fName));
        } else {
          doc.save(fName);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Erro interno. A geração do PDF foi interrompida.");
    }
  };

  // --- FUNÇÃO MATEMÁTICA DO CAPOTRASTE ---
  const calculateCapoFret = () => {
    const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatToSharp: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    
    const getIdx = (n: string) => scale.indexOf(flatToSharp[n] || n);
    
    const originalIdx = getIdx(originalTone);
    const shapeIdx = getIdx(shapeTone);
    
    if (originalIdx === -1 || shapeIdx === -1) return 0;
    
    // Calcula a distância de semitons (casas do violão)
    return (originalIdx - shapeIdx + 12) % 12;
  };

  const capoResult = calculateCapoFret();

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans p-4 relative">
      <style jsx global>{`
        .panel { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-bottom: 16px; transition: 0.2s; }
        .card:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
        label { color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; display: block; letter-spacing: 0.05em; }
        input, textarea { background: #0f172a; border: 1px solid #334155; color: white; padding: 12px; border-radius: 8px; width: 100%; transition: all 0.2s; margin-bottom: 12px; }
        input:focus, textarea:focus { outline: none; border-color: #3b82f6; }
        .btn { padding: 14px; border-radius: 8px; font-weight: 800; cursor: pointer; border: none; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; text-transform: uppercase; font-size: 0.85rem; }
        .btn-green { background: #22c55e; color: white; margin-bottom: 10px; }
        .btn-green:hover { background: #16a34a; }
        .btn-blue { background: #2563eb; color: white; }
        .btn-blue:hover { background: #1d4ed8; }
        .btn-icon { background: #334155; color: white; border: none; border-radius: 6px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .btn-icon:hover { background: #475569; }
        .btn-transpose { background: #475569; font-size: 0.7rem; font-weight: bold; border-radius: 6px; padding: 0 8px; height: 32px; transition: 0.2s; }
        .btn-transpose:hover { background: #3b82f6; }
        .btn-danger { background: #ef4444; }
        .btn-danger:hover { background: #b91c1c; }
        
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #0f172a; border-radius: 8px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 8px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #475569; }

        /* Estilos do Menu e Botões de Nota */
        .nav-tab { padding: 12px 24px; font-weight: 800; text-transform: uppercase; font-size: 0.85rem; border-radius: 8px; cursor: pointer; transition: 0.2s; flex: 1; text-align: center; }
        .nav-tab.active { background: #3b82f6; color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
        .nav-tab.inactive { background: transparent; color: #94a3b8; border: 1px solid transparent; }
        .nav-tab.inactive:hover { background: #1e293b; color: white; }
        
        .note-btn { background: #1e293b; border: 1px solid #334155; padding: 12px 0; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; color: #cbd5e1; }
        .note-btn:hover { background: #334155; }
        .note-btn.active { background: #3b82f6; border-color: #60a5fa; color: white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.4); }
      `}</style>

      <header className="max-w-3xl mx-auto text-center py-8">
        <h1 className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">PromptLab BR</h1>
        <p className="text-slate-400 font-medium mb-8">Ferramentas Profissionais para Músicos</p>
        
        {/* MENU SUPERIOR (TABS) */}
        <div className="flex bg-[#0f172a] p-2 rounded-xl border border-slate-800 gap-2">
          <button 
            className={`nav-tab ${activeTab === 'setlist' ? 'active' : 'inactive'}`}
            onClick={() => setActiveTab('setlist')}
          >
            📚 Repertório PDF
          </button>
          <button 
            className={`nav-tab ${activeTab === 'capo' ? 'active' : 'inactive'}`}
            onClick={() => setActiveTab('capo')}
          >
            🎸 Calculadora Capo
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto space-y-6">
        
        {/* ========================================= */}
        {/* ABA 1: CONSTRUTOR DE REPERTÓRIO (O SEU ORIGINAL) */}
        {/* ========================================= */}
        {activeTab === 'setlist' && (
          <section className="panel border-l-4 border-green-500 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black flex items-center gap-2">📚 Construtor de PDF</h2>
              <button onClick={() => setShowInstructions(!showInstructions)} className="text-xs font-bold text-green-400 underline">
                {showInstructions ? "Ocultar Instruções" : "Ver Instruções"}
              </button>
            </div>
            
            {showInstructions && (
              <div className="bg-black/30 p-4 rounded text-xs text-slate-300 leading-relaxed space-y-2 mb-6">
                <p><strong>1. Nova Organização:</strong> Cada música agora tem o seu próprio bloco (Card). Escreva o título no campo menor e cole a letra no campo maior.</p>
                <p><strong>2. Transposição:</strong> Use os botões "-½" e "+½" na barra de cada música para mudar o tom automaticamente (afeta apenas as linhas com cifras).</p>
                <p><strong>3. Reordenar:</strong> Use as setas (⬆️ ⬇️) para mudar a ordem das músicas no seu PDF final.</p>
              </div>
            )}
            
            <div className="mb-6">
              <label>Cabeçalho do PDF (Título da Página)</label>
              <input 
                value={repertoireHeader} 
                onChange={(e) => setRepertoireHeader(e.target.value)} 
                placeholder="Ex: Missa de Domingo, Show de Rock..." 
                className="bg-[#0f172a]"
              />
            </div>

            <div className="space-y-4 mb-6">
              {songs.map((song, index) => (
                <div key={song.id} className="card relative group">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
                    <div className="flex-1 w-full">
                      <label className="!mb-1 text-slate-400">Título da Música {index + 1}</label>
                      <input 
                        value={song.title}
                        onChange={(e) => updateSong(index, 'title', e.target.value)}
                        placeholder="Ex: Te Louvarei"
                        className="!mb-0 !bg-[#0f172a] font-bold"
                      />
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto md:pt-5 justify-end">
                      <button onClick={() => transposeSong(index, -1)} className="btn-transpose" title="Abaixar meio tom">-½ Tom</button>
                      <button onClick={() => transposeSong(index, 1)} className="btn-transpose mr-2" title="Subir meio tom">+½ Tom</button>
                      <button onClick={() => moveSong(index, 'up')} disabled={index === 0} className="btn-icon disabled:opacity-30" title="Mover para cima">⬆️</button>
                      <button onClick={() => moveSong(index, 'down')} disabled={index === songs.length - 1} className="btn-icon disabled:opacity-30" title="Mover para baixo">⬇️</button>
                      <button onClick={() => removeSong(index)} className="btn-icon btn-danger" title="Excluir música">🗑️</button>
                    </div>
                  </div>
                  
                  <div>
                    <textarea 
                      rows={8} 
                      value={song.content}
                      onChange={(e) => updateSong(index, 'content', e.target.value)}
                      placeholder="Cole as estrofes e refrões cifrados aqui..."
                      className="!mb-0 text-sm font-mono !bg-[#0f172a]"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={addSong} 
              className="w-full p-4 rounded-xl border-2 border-dashed border-slate-600 text-slate-400 font-bold hover:border-blue-500 hover:text-blue-500 transition-colors mb-8"
            >
              ➕ Adicionar Nova Música
            </button>

            <div className="pt-4 border-t border-slate-800">
              <button onClick={() => processPDF('download')} className="btn btn-green">📄 Gerar PDF</button>
              <button onClick={() => processPDF('share')} className="btn btn-blue">📱 Compartilhar WhatsApp</button>
            </div>
          </section>
        )}

        {/* ========================================= */}
        {/* ABA 2: CALCULADORA DE CAPOTRASTE (NOVA) */}
        {/* ========================================= */}
        {activeTab === 'capo' && (
          <section className="panel border-l-4 border-purple-500 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="mb-6 border-b border-slate-800 pb-4">
              <h2 className="text-xl font-black flex items-center gap-2 mb-2">🎸 Onde colocar o Capo?</h2>
              <p className="text-slate-400 text-sm">Simplifique acordes difíceis. Escolha o tom que o cantor vai cantar, e qual acorde mais fácil você quer fazer no braço do violão.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              
              {/* PASSO 1: Tom Original */}
              <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-700">
                <label className="text-blue-400">1. Tom da Música (Cantor)</label>
                <p className="text-xs text-slate-400 mb-4">Em qual tom a música está gravada ou vai ser cantada?</p>
                <div className="grid grid-cols-4 gap-2">
                  {notesArray.map(note => (
                    <button 
                      key={`orig-${note}`}
                      onClick={() => setOriginalTone(note)}
                      className={`note-btn ${originalTone === note ? 'active' : ''}`}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>

              {/* PASSO 2: Shape Desejado */}
              <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-700">
                <label className="text-purple-400">2. Acordes que quero fazer (Shape)</label>
                <p className="text-xs text-slate-400 mb-4">Quais acordes você quer bater no violão? (Ex: C, G, D)</p>
                <div className="grid grid-cols-4 gap-2">
                  {notesArray.map(note => (
                    <button 
                      key={`shape-${note}`}
                      onClick={() => setShapeTone(note)}
                      className={`note-btn ${shapeTone === note ? 'active' : ''}`}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* RESULTADO (VISOR GRANDE) */}
            <div className={`p-8 rounded-xl text-center border-2 transition-all duration-500 ${
              capoResult === 0 
                ? 'bg-slate-800/50 border-slate-700' 
                : 'bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]'
            }`}>
              <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">Resultado</h3>
              
              {capoResult === 0 ? (
                <div className="text-3xl font-black text-slate-300">
                  Sem Capotraste
                </div>
              ) : (
                <div>
                  <div className="text-4xl md:text-5xl font-black text-white mb-2">
                    Capo na <span className="text-purple-400">{capoResult}ª</span> Casa
                  </div>
                  <p className="text-slate-300 font-medium text-sm">
                    Tocar usando os acordes de <strong className="text-white">{shapeTone}</strong> vai soar como <strong className="text-white">{originalTone}</strong>.
                  </p>
                </div>
              )}
            </div>
            
          </section>
        )}

      </main>

      {/* RODAPÉ ADSENSE COMPLIANCE */}
      <footer className="max-w-3xl mx-auto text-center py-10 mt-8 border-t border-slate-800/50">
        <div className="flex flex-wrap justify-center gap-6 mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
          <button onClick={() => setLegalModal('privacy')} className="hover:text-blue-400 transition-colors">Política de Privacidade</button>
          <button onClick={() => setLegalModal('terms')} className="hover:text-blue-400 transition-colors">Termos de Uso</button>
          <a href="mailto:contato@promptlabbrasil.com.br" className="hover:text-blue-400 transition-colors">Contato</a>
        </div>
        <p className="text-xs text-slate-600">© 2026 PromptLab Brasil. Todos os direitos reservados.</p>
      </footer>

      {/* MODAL DE INFORMAÇÕES FORMAIS */}
      {legalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h3 className="text-lg font-black text-white uppercase tracking-wide">
                {legalModal === 'privacy' ? 'Política de Privacidade' : 'Termos de Uso'}
              </h3>
              <button onClick={() => setLegalModal(null)} className="text-slate-400 hover:text-white text-2xl font-bold leading-none">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto custom-scroll text-sm text-slate-300 space-y-4">
              {legalModal === 'privacy' ? (
                <>
                  <p>A sua privacidade é importante para nós. É política do PromptLab Brasil respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site.</p>
                  <p>O Google, como fornecedor de terceiros, usa cookies para exibir anúncios em nosso site. O uso do cookie DART pelo Google permite que ele exiba anúncios para nossos usuários com base em suas visitas ao nosso site e a outros sites na Internet.</p>
                </>
              ) : (
                <>
                  <p>Ao acessar ao site PromptLab Brasil, concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis.</p>
                </>
              )}
            </div>
            <div className="p-6 border-t border-slate-800 text-right bg-slate-900/50 rounded-b-xl">
              <button onClick={() => setLegalModal(null)} className="btn-blue px-6 py-2 rounded font-bold text-xs uppercase inline-block">Entendi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
