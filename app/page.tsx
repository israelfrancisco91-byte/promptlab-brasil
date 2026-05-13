"use client"

import { useState, useEffect } from "react"
import { jsPDF } from "jspdf"

interface Song {
  id: string;
  title: string;
  content: string;
}

interface SavedRepertoire {
  id: string;
  name: string;
  date: string;
  header: string;
  songs: Song[];
}

export default function PromptLabPage() {
  const [activeTab, setActiveTab] = useState<'setlist' | 'capo' | 'library' | 'search'>('setlist')

  const [showInstructions, setShowInstructions] = useState(false)
  const [repertoireHeader, setRepertoireHeader] = useState("")
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null)
  const [songs, setSongs] = useState<Song[]>([{ id: 'init-1', title: "", content: "" }])

  const [originalTone, setOriginalTone] = useState('F')
  const [shapeTone, setShapeTone] = useState('D')
  const notesArray = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']

  const [savedRepertoires, setSavedRepertoires] = useState<SavedRepertoire[]>([])
  
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const savedSongs = localStorage.getItem('promptlab_songs')
    const savedHeader = localStorage.getItem('promptlab_header')
    const savedLibrary = localStorage.getItem('promptlab_library')
    
    if (savedSongs) {
      try { setSongs(JSON.parse(savedSongs)) } catch (e) { console.error(e) }
    }
    if (savedHeader) {
      setRepertoireHeader(savedHeader)
    }
    if (savedLibrary) {
      try { setSavedRepertoires(JSON.parse(savedLibrary)) } catch (e) { console.error(e) }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('promptlab_songs', JSON.stringify(songs))
  }, [songs])

  useEffect(() => {
    localStorage.setItem('promptlab_header', repertoireHeader)
  }, [repertoireHeader])

  useEffect(() => {
    localStorage.setItem('promptlab_library', JSON.stringify(savedRepertoires))
  }, [savedRepertoires])

  const saveToLibrary = () => {
    const defaultName = repertoireHeader || `Repertório ${new Date().toLocaleDateString('pt-BR')}`
    const name = window.prompt("Dê um nome para salvar este repertório:", defaultName)
    
    if (!name) return;

    const newRep: SavedRepertoire = {
      id: Date.now().toString(),
      name: name,
      date: new Date().toLocaleDateString('pt-BR'),
      header: repertoireHeader,
      songs: [...songs]
    }
    
    setSavedRepertoires([...savedRepertoires, newRep])
    alert("✅ Repertório salvo na sua biblioteca com sucesso!")
  }

  const loadFromLibrary = (rep: SavedRepertoire) => {
    if (window.confirm("Atenção: Carregar este repertório vai substituir o que está na tela agora. Deseja continuar?")) {
      setSongs(rep.songs)
      setRepertoireHeader(rep.header)
      setActiveTab('setlist')
    }
  }

  const deleteFromLibrary = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este repertório salvo?")) {
      setSavedRepertoires(savedRepertoires.filter(r => r.id !== id))
    }
  }

  const clearCurrentSetlist = () => {
    if (window.confirm("Deseja limpar a tela para começar um repertório do zero?")) {
      setSongs([{ id: Date.now().toString(), title: "", content: "" }])
      setRepertoireHeader("")
    }
  }

  const handleSearch = (engine: 'google' | 'cifraclub' | 'letras') => {
    if (!searchQuery.trim()) {
      alert("Digite o nome de uma música antes de pesquisar!");
      return;
    }
    
    let url = "";
    const query = encodeURIComponent(searchQuery.trim());
    
    if (engine === 'google') {
      url = `https://www.google.com/search?q=${query}+cifra`;
    } else if (engine === 'cifraclub') {
      url = `https://www.google.com/search?q=site:cifraclub.com.br+${query}`;
    } else if (engine === 'letras') {
      url = `https://www.google.com/search?q=site:letras.mus.br+${query}`;
    }
    
    window.open(url, '_blank');
  }

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
        pdfDoc.setFont("times", "bold"); 
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
          doc.setFont("times", "bold"); 
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          
          const wrappedTitle = doc.splitTextToSize(song.title.trim(), 85);
          wrappedTitle.forEach((t: string) => {
            checkSpace(8);
            doc.text(t.trim(), currentX, currentY); 
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

          let chordLine = line;
          let lyricLine = lines[j + 1] || "";
          
          if (isChordLine(chordLine) && lyricLine.trim() !== "" && !isChordLine(lyricLine)) {
            while (chordLine.length > 0 || lyricLine.length > 0) {
              checkSpace(12);
              
              let breakIdx = charLimit;
              let skipChars = 0;
              const maxLen = Math.max(chordLine.length, lyricLine.length);
              
              if (maxLen > charLimit) {
                let lastSpace = lyricLine.substring(0, charLimit + 1).lastIndexOf(' ');
                
                if (lastSpace > 0) {
                  breakIdx = lastSpace;
                  skipChars = 1;
                } else {
                  lastSpace = chordLine.substring(0, charLimit + 1).lastIndexOf(' ');
                  if (lastSpace > 0) {
                    breakIdx = lastSpace;
                    skipChars = 1;
                  } else {
                    breakIdx = charLimit;
                    skipChars = 0;
                  }
                }
              } else {
                breakIdx = maxLen;
                skipChars = 0;
              }

              const cChunk = chordLine.substring(0, breakIdx);
              const lChunk = lyricLine.substring(0, breakIdx);

              if (cChunk.trim() !== "") {
                doc.setFont("courier", "bold");
                doc.setFontSize(10);
                doc.setTextColor(37, 99, 235);
                doc.text(cChunk, currentX, currentY);
                currentY += 4.5;
              }
              
              doc.setFont("courier", "normal");
              doc.setFontSize(10);
              doc.setTextColor(0, 0, 0);
              doc.text(lChunk, currentX, currentY);
              currentY += 6.5;

              chordLine = chordLine.substring(breakIdx + skipChars);
              lyricLine = lyricLine.substring(breakIdx + skipChars);
            }
            j += 2; 
            
          } else {
            let remaining = line;
            while (remaining.length > 0) {
              checkSpace(6);
              
              let breakIdx = charLimit;
              let skipChars = 0;
              
              if (remaining.length > charLimit) {
                const lastSpace = remaining.substring(0, charLimit + 1).lastIndexOf(' ');
                if (lastSpace > 0) {
                  breakIdx = lastSpace;
                  skipChars = 1;
                } else {
                  breakIdx = charLimit;
                  skipChars = 0;
                }
              } else {
                breakIdx = remaining.length;
              }

              const chunk = remaining.substring(0, breakIdx);
              
              if (isChordLine(line)) {
                doc.setFont("courier", "bold");
                doc.setTextColor(37, 99, 235); 
              } else {
                doc.setFont("courier", "normal");
                doc.setTextColor(0, 0, 0); 
              }
              
              doc.setFontSize(10);
              doc.text(chunk, currentX, currentY);
              currentY += 5.5;
              
              remaining = remaining.substring(breakIdx + skipChars);
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

  const calculateCapoFret = () => {
    const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatToSharp: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    
    const getIdx = (n: string) => scale.indexOf(flatToSharp[n] || n);
    
    const originalIdx = getIdx(originalTone);
    const shapeIdx = getIdx(shapeTone);
    
    if (originalIdx === -1 || shapeIdx === -1) return 0;
    
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

        .nav-tab { padding: 10px 12px; font-weight: 800; text-transform: uppercase; font-size: 0.70rem; border-radius: 8px; cursor: pointer; transition: 0.2s; flex: 1 1 auto; text-align: center; white-space: nowrap; }
        @media (min-width: 640px) { .nav-tab { font-size: 0.80rem; padding: 12px 20px; } }
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
        
        <div className="grid grid-cols-2 sm:flex sm:flex-row bg-[#0f172a] p-2 rounded-xl border border-slate-800 gap-2">
          <button 
            className={`nav-tab flex-1 ${activeTab === 'setlist' ? 'active' : 'inactive'}`}
            onClick={() => setActiveTab('setlist')}
          >
            📚 Repertório
          </button>
          <button 
            className={`nav-tab flex-1 ${activeTab === 'library' ? 'active' : 'inactive'}`}
            onClick={() => setActiveTab('library')}
          >
            📂 Salvos
          </button>
          <button 
            className={`nav-tab flex-1 ${activeTab === 'capo' ? 'active' : 'inactive'}`}
            onClick={() => setActiveTab('capo')}
          >
            🎸 Capo
          </button>
          <button 
            className={`nav-tab flex-1 ${activeTab === 'search' ? 'active' : 'inactive'}`}
            onClick={() => setActiveTab('search')}
          >
            🔍 Buscar
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto space-y-6">
        
        {activeTab === 'setlist' && (
          <section className="panel border-l-4 border-green-500 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-800 pb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">📚 Construtor de PDF</h2>
                <button 
                  onClick={() => setShowInstructions(!showInstructions)} 
                  className="text-xs text-slate-400 hover:text-white underline ml-2"
                >
                  {showInstructions ? "Ocultar" : "Como usar"}
                </button>
              </div>
              <div className="flex w-full sm:w-auto gap-2">
                <button onClick={clearCurrentSetlist} className="btn-icon !w-auto px-4 !bg-slate-800 hover:!bg-slate-700 text-xs font-bold uppercase" title="Apagar tudo e começar do zero">
                  📄 Novo
                </button>
                <button onClick={saveToLibrary} className="btn-icon !w-auto px-4 !bg-blue-600 hover:!bg-blue-500 text-xs font-bold uppercase shadow-[0_0_15px_rgba(37,99,235,0.4)]" title="Salvar este repertório na sua biblioteca">
                  💾 Salvar Repertório
                </button>
              </div>
            </div>
            
            {showInstructions && (
              <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 text-sm text-slate-300 leading-relaxed space-y-4 mb-8 shadow-inner">
                <h3 className="font-bold text-white text-base mb-2 border-b border-slate-700 pb-2">Guia Rápido de Uso</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-lg">📝</span>
                    <div><strong className="text-blue-400">Adicionar Músicas:</strong> Utilize os blocos individuais. Insira o título no campo superior e cole a cifra completa na área de texto. Seu progresso é salvo automaticamente.</div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-lg">🔍</span>
                    <div><strong className="text-yellow-400">Pesquisar Cifras:</strong> Vá na aba "Buscar" para encontrar letras rapidamente na internet, copie e cole aqui no construtor.</div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-lg">🎛️</span>
                    <div><strong className="text-purple-400">Transposição Inteligente:</strong> Altere o tom da música clicando nos botões -½ Tom e +½ Tom. O sistema ajusta exclusivamente os acordes.</div>
                  </li>
                </ul>
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

        {activeTab === 'library' && (
          <section className="panel border-l-4 border-blue-500 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="mb-6 border-b border-slate-800 pb-4">
              <h2 className="text-xl font-black flex items-center gap-2 mb-2">📂 Meus Repertórios Salvos</h2>
              <p className="text-slate-400 text-sm">Suas listas ficam armazenadas localmente no seu aparelho para você reutilizar quando quiser.</p>
            </div>

            {savedRepertoires.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
                <div className="text-4xl mb-4 opacity-50">📁</div>
                <h3 className="text-lg font-bold text-slate-300 mb-2">Sua biblioteca está vazia</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">Vá para a aba "Repertório", monte o seu setlist e clique no botão azul "Salvar Repertório" para guardá-lo aqui.</p>
                <button onClick={() => setActiveTab('setlist')} className="mt-6 text-blue-400 font-bold hover:underline">Criar meu primeiro repertório &rarr;</button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {savedRepertoires.map((rep) => (
                  <div key={rep.id} className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 hover:border-blue-500 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-white text-lg truncate pr-4" title={rep.name}>{rep.name}</h3>
                      <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded whitespace-nowrap">{rep.date}</span>
                    </div>
                    <p className="text-slate-400 text-xs mb-4">Músicas: {rep.songs.length}</p>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => loadFromLibrary(rep)} 
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-4 rounded-lg transition-colors"
                      >
                        Carregar e Editar
                      </button>
                      <button 
                        onClick={() => deleteFromLibrary(rep.id)} 
                        className="bg-slate-700 hover:bg-red-500 text-white p-2 rounded-lg transition-colors"
                        title="Excluir este repertório"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'capo' && (
          <section className="panel border-l-4 border-purple-500 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="mb-6 border-b border-slate-800 pb-4">
              <h2 className="text-xl font-black flex items-center gap-2 mb-2">🎸 Onde colocar o Capo?</h2>
              <p className="text-slate-400 text-sm">Simplifique acordes difíceis. Escolha o tom que o cantor vai cantar, e qual acorde mais fácil você quer fazer no braço do violão.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-700">
                <label className="text-blue-400">1. Tom da Música (Cantor)</label>
                <div className="grid grid-cols-4 gap-2">
                  {notesArray.map(note => (
                    <button key={`orig-${note}`} onClick={() => setOriginalTone(note)} className={`note-btn ${originalTone === note ? 'active' : ''}`}>{note}</button>
                  ))}
                </div>
              </div>

              <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-700">
                <label className="text-purple-400">2. Acordes que quero fazer (Shape)</label>
                <div className="grid grid-cols-4 gap-2">
                  {notesArray.map(note => (
                    <button key={`shape-${note}`} onClick={() => setShapeTone(note)} className={`note-btn ${shapeTone === note ? 'active' : ''}`}>{note}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className={`p-8 rounded-xl text-center border-2 transition-all duration-500 ${capoResult === 0 ? 'bg-slate-800/50 border-slate-700' : 'bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]'}`}>
              <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">Resultado</h3>
              {capoResult === 0 ? (
                <div className="text-3xl font-black text-slate-300">Sem Capotraste</div>
              ) : (
                <div>
                  <div className="text-4xl md:text-5xl font-black text-white mb-2">Capo na <span className="text-purple-400">{capoResult}ª</span> Casa</div>
                  <p className="text-slate-300 font-medium text-sm">Tocar usando os acordes de <strong className="text-white">{shapeTone}</strong> vai soar como <strong className="text-white">{originalTone}</strong>.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'search' && (
          <section className="panel border-l-4 border-yellow-500 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="mb-6 border-b border-slate-800 pb-4">
              <h2 className="text-xl font-black flex items-center gap-2 mb-2">🔍 Encontrar Letras e Cifras</h2>
              <p className="text-slate-400 text-sm">Precisa da letra de uma música? Pesquise aqui. Nós abriremos o site com a cifra em uma nova aba. Basta copiar, fechar a aba e colar no seu repertório!</p>
            </div>

            <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 mb-8">
              <label className="text-yellow-400 text-sm mb-2">Qual música você está procurando?</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch('google')}
                  placeholder="Ex: Te Louvarei Diante do Trono"
                  className="!mb-0 flex-1 text-lg py-3 px-4"
                  autoFocus
                />
              </div>
              
              <div className="mt-6">
                <p className="text-xs text-slate-400 font-bold uppercase mb-3 text-center">Escolha onde deseja pesquisar:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button 
                    onClick={() => handleSearch('cifraclub')}
                    className="bg-[#ff6600]/20 hover:bg-[#ff6600]/40 text-[#ff8833] border border-[#ff6600]/50 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    🎸 Cifra Club
                  </button>
                  <button 
                    onClick={() => handleSearch('letras')}
                    className="bg-[#22c55e]/20 hover:bg-[#22c55e]/40 text-[#4ade80] border border-[#22c55e]/50 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    🎵 Letras.mus
                  </button>
                  <button 
                    onClick={() => handleSearch('google')}
                    className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/50 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    🌐 Google Geral
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg text-sm text-slate-400 text-center border border-slate-700">
              💡 <strong>Dica de Mestre:</strong> Seu repertório é salvo automaticamente! Você pode clicar nos botões acima para copiar a música e voltar para o PromptLab sem medo de perder o que já fez.
            </div>
            
          </section>
        )}

      </main>

      <section className="max-w-3xl mx-auto mt-16 p-8 bg-[#0f172a] border border-slate-800 rounded-xl text-slate-400 text-sm leading-relaxed shadow-lg">
        <h2 className="text-2xl font-black text-white mb-4">Gerador de Repertório Musical e Cifras em PDF</h2>
        <p className="mb-6">O <strong>PromptLab Brasil</strong> é a ferramenta definitiva para músicos, ministérios de louvor, corais e bandas que precisam organizar setlists de forma rápida e totalmente profissional. Chega de sofrer com formatação bagunçada ou letras que não cabem na tela na hora do show. Aqui, você cola as suas cifras, altera o tom com a nossa ferramenta de transposição automática e gera um PDF limpo, pronto para impressão ou leitura em tablets e celulares, sem poluição visual.</p>
        
        <h3 className="text-lg font-bold text-white mb-2">Como transpor cifras e alterar o tom da música?</h3>
        <p className="mb-6">Mudar o tom de uma música nunca foi tão fácil. Basta colar o texto cifrado no nosso construtor de cards e usar os botões de <strong>+½ Tom</strong> ou <strong>-½ Tom</strong>. O nosso sistema inteligente, desenvolvido para atender a necessidade real dos músicos, reconhece apenas os acordes musicais, mantendo a letra da música intacta. É o recurso ideal para ajustar a música à extensão vocal do cantor na hora do ensaio.</p>
        
        <h3 className="text-lg font-bold text-white mb-2">Calculadora de Capotraste Online</h3>
        <p className="mb-6">Tem dificuldades com pestanas ou acordes complexos? A nossa <strong>Calculadora de Capotraste</strong> ajuda violonistas e guitarristas a encontrarem a casa exata para colocar o acessório no braço do instrumento. Você seleciona o tom original da gravação e o "shape" (formato de acordes fáceis) que acha melhor tocar. O sistema revela instantaneamente a posição correta, facilitando o seu play.</p>

        <h3 className="text-lg font-bold text-white mb-2">Crie Setlists e Compartilhe com a Banda</h3>
        <p>Além de gerar arquivos PDF em alta qualidade e formatados em colunas automáticas, a plataforma permite a reordenação rápida das faixas com o simples clique de um botão. Adicione músicas, ajuste o cabeçalho com o nome do evento e clique em gerar. Você pode fazer o download do documento ou compartilhar o link direto no WhatsApp dos integrantes do seu ministério ou banda. Otimize seu tempo fora dos palcos e foque no que realmente importa: fazer música com excelência!</p>
      </section>

      <footer className="max-w-3xl mx-auto text-center py-10 mt-8 border-t border-slate-800/50">
        <div className="flex flex-wrap justify-center gap-6 mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
          <button onClick={() => setLegalModal('privacy')} className="hover:text-blue-400 transition-colors">Política de Privacidade</button>
          <button onClick={() => setLegalModal('terms')} className="hover:text-blue-400 transition-colors">Termos de Uso</button>
          <a href="mailto:contato@promptlabbrasil.com.br" className="hover:text-blue-400 transition-colors">Contato</a>
        </div>
        <p className="text-xs text-slate-600">© 2026 PromptLab Brasil. Todos os direitos reservados.</p>
      </footer>

      {legalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h3 className="text-lg font-black text-white uppercase tracking-wide">
                {legalModal === 'privacy' ? 'Política de Privacidade' : 'Termos de Uso'}
              </h3>
              <button onClick={() => setLegalModal(null)} className="text-slate-400 hover:text-white text-2xl font-bold leading-none">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto custom-scroll text-sm text-slate-300">
              {legalModal === 'privacy' ? (
                <div className="space-y-4">
                  <p>A sua privacidade é fundamental para nós no <strong>PromptLab Brasil</strong>. Esta política descreve como as suas informações são tratadas ao utilizar a nossa plataforma.</p>
                  <h4 className="text-white font-bold mt-4">1. Armazenamento Local (Local Storage)</h4>
                  <p>O PromptLab Brasil foi projetado com foco na sua privacidade e segurança. Os repertórios, letras de músicas e configurações que você insere <strong>não são enviados ou salvos em nossos servidores</strong>. Utilizamos a tecnologia de <em>Local Storage</em> do seu navegador para garantir que você não perca seus dados ao fechar a aba acidentalmente, bem como para a sua Biblioteca pessoal de repertórios. Você tem controle total e pode apagar esses dados a qualquer momento limpando o cache do seu próprio navegador.</p>
                  <h4 className="text-white font-bold mt-4">2. Cookies e Google AdSense</h4>
                  <p>Para manter a ferramenta gratuita para todos os músicos, exibimos anúncios de parceiros fornecidos pelo Google AdSense. O Google utiliza cookies para veicular anúncios com base em suas visitas a este e a outros sites na Internet.</p>
                  <h4 className="text-white font-bold mt-4">3. Coleta de Dados Analíticos</h4>
                  <p>Utilizamos ferramentas padrão da indústria para análise de tráfego a fim de entender, de forma totalmente anônima, o volume de acesso ao site. Nenhuma informação pessoal é coletada neste processo.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p>Bem-vindo ao <strong>PromptLab Brasil</strong>. Ao acessar e utilizar nossa plataforma, você concorda expressamente com os seguintes Termos de Uso.</p>
                  <h4 className="text-white font-bold mt-4">1. Natureza do Serviço</h4>
                  <p>O PromptLab Brasil é uma ferramenta utilitária e gratuita projetada exclusivamente para auxiliar músicos na formatação, transposição algorítmica e geração de PDFs para cifras musicais e setlists.</p>
                  <h4 className="text-white font-bold mt-4">2. Responsabilidade sobre o Conteúdo</h4>
                  <p>A nossa plataforma <strong>não hospeda, não distribui e não possui</strong> direitos autorais sobre nenhuma letra de música ou cifra. O sistema funciona estritamente como um processador de texto no lado do cliente (no seu dispositivo). O usuário é o único e exclusivo responsável por qualquer conteúdo que decida inserir.</p>
                  <h4 className="text-white font-bold mt-4">3. Isenção de Garantias</h4>
                  <p>O serviço é fornecido "no estado em que se encontra". Não garantimos que a plataforma estará 100% livre de erros ou interrupções. Não nos responsabilizamos por eventuais perdas de dados armazenados localmente (Local Storage) ou problemas técnicos durante apresentações.</p>
                  <h4 className="text-white font-bold mt-4">4. Modificações dos Termos</h4>
                  <p>O PromptLab Brasil reserva-se o direito de revisar estes termos de serviço a qualquer momento, sem aviso prévio.</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-800 text-right bg-slate-900/50 rounded-b-xl">
              <button onClick={() => setLegalModal(null)} className="btn-blue px-6 py-2 rounded font-bold text-xs uppercase inline-block">Compreendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
