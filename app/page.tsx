"use client"

import { useState, useEffect, useRef } from "react"
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

  // --- ESTADOS DO TELEPROMPTER ---
  const [prompterSong, setPrompterSong] = useState<Song | null>(null)
  const [prompterSpeed, setPrompterSpeed] = useState(2)
  const [isPrompterPlaying, setIsPrompterPlaying] = useState(false)
  const prompterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedSongs = localStorage.getItem('promptlab_songs')
    const savedHeader = localStorage.getItem('promptlab_header')
    const savedLibrary = localStorage.getItem('promptlab_library')
    
    if (savedSongs) {
      try { setSongs(JSON.parse(savedSongs)) } catch (e) { console.error(e) }
    }
    if (savedHeader) setRepertoireHeader(savedHeader)
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

  // Função utilitária de detecção de cifra (precisa ser declarada antes para o handleToggleCase usar)
  const isChordLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 120) return false;
    return /^(\s*([A-G][b#]?(m|min|maj|maj7|m7|add|sus|dim|aug|[\d])?(\/[A-G][b#]?)?|INTRO:|REFRÃO:|PONTE:|SOLO:|VAMP:|\(|\)|\||\d|\+)(\s+|$))+$/i.test(line);
  };

  // --- FERRAMENTAS DE EDIÇÃO DE TEXTO ---
  const handleToggleCase = (index: number) => {
    const newSongs = [...songs];
    const current = newSongs[index].content;
    if (!current) return;

    const lines = current.split('\n');
    
    // Verifica o estado atual focando apenas nas linhas que são LETRA (ignora cifras)
    const lyricLines = lines.filter(line => !isChordLine(line) && line.trim().length > 0);
    const lyricsText = lyricLines.join('');
    
    if (lyricsText.length === 0) return; // Se for só cifra, não faz nada

    const isUpper = lyricsText === lyricsText.toUpperCase();

    newSongs[index].content = lines.map(line => {
      // Mantém as cifras e as quebras de linha exatamente como são
      if (isChordLine(line) || line.trim() === "") {
        return line;
      }
      
      // Se a letra estava toda em maiúscula, converte para minúscula capitalizando a primeira letra
      if (isUpper) {
        const lower = line.toLowerCase();
        // Capitaliza apenas a primeira letra da linha (ex: "Senhor que viestes salvar")
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      } else {
        // Se estava minúscula, transforma tudo em MAIÚSCULA
        return line.toUpperCase();
      }
    }).join('\n');

    setSongs(newSongs);
  };

  const handleToggleBold = (index: number) => {
    const textarea = document.getElementById(`song-textarea-${index}`) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = songs[index].content;
    
    if (start === end) {
      alert("Selecione uma palavra ou trecho para colocar em negrito.");
      return;
    }
    
    const selected = text.substring(start, end);
    const newText = text.substring(0, start) + "**" + selected + "**" + text.substring(end);
    updateSong(index, 'content', newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, end + 4);
    }, 10);
  };

  // --- FILTRO DE LIMPEZA DE HTML ---
  const cleanText = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
      .replace(/\t/g, '    ');
  }

  // --- MOTOR DO TELEPROMPTER ---
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let accumulatedScroll = 0;

    const scrollPrompter = (time: number) => {
      if (isPrompterPlaying && prompterRef.current) {
        const deltaTime = time - lastTime;
        const pixelsPerSecond = prompterSpeed * 12; 
        accumulatedScroll += (pixelsPerSecond * deltaTime) / 1000;

        if (accumulatedScroll >= 1) {
          prompterRef.current.scrollTop += Math.floor(accumulatedScroll);
          accumulatedScroll -= Math.floor(accumulatedScroll);
        }
      }
      lastTime = time;
      animationFrameId = requestAnimationFrame(scrollPrompter);
    };

    if (isPrompterPlaying) {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(scrollPrompter);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPrompterPlaying, prompterSpeed]);

  const openPrompter = (song: Song) => {
    if (!song.content.trim()) {
      alert("A música está vazia! Adicione a letra antes de abrir o Teleprompter.");
      return;
    }
    setPrompterSong(song);
    setIsPrompterPlaying(false);
    setPrompterSpeed(2);
  }

  const closePrompter = () => {
    setPrompterSong(null);
    setIsPrompterPlaying(false);
  }

  // --- INTELIGÊNCIA DE QUEBRA DE LINHA DO PROMPTER ---
  const getPrompterLines = (content: string) => {
    const charLimit = 40; 
    const lines = cleanText(content).split('\n');
    let j = 0;
    const result: { type: string, text: string }[] = [];

    while (j < lines.length) {
      const line = lines[j];
      if (line.trim() === "") {
        result.push({ type: 'empty', text: '' });
        j++;
        continue;
      }

      let chordLine = line;
      let lyricLine = lines[j + 1] || "";

      if (isChordLine(chordLine) && lyricLine.trim() !== "" && !isChordLine(lyricLine)) {
        while (chordLine.length > 0 || lyricLine.length > 0) {
          let breakIdx = charLimit;
          let skipChars = 0;
          const maxLen = Math.max(chordLine.length, lyricLine.length);

          if (maxLen > charLimit) {
            let lastSpace = lyricLine.substring(0, charLimit + 1).lastIndexOf(' ');
            if (lastSpace > 0) { breakIdx = lastSpace; skipChars = 1; }
            else {
              lastSpace = chordLine.substring(0, charLimit + 1).lastIndexOf(' ');
              if (lastSpace > 0) { breakIdx = lastSpace; skipChars = 1; }
              else { breakIdx = charLimit; skipChars = 0; }
            }
          } else { breakIdx = maxLen; skipChars = 0; }

          const cChunk = chordLine.substring(0, breakIdx);
          const lChunk = lyricLine.substring(0, breakIdx);

          if (cChunk.trim() !== "") {
            result.push({ type: 'chord', text: cChunk });
          }
          result.push({ type: 'lyric', text: lChunk });

          chordLine = chordLine.substring(breakIdx + skipChars);
          lyricLine = lyricLine.substring(breakIdx + skipChars);
        }
        j += 2;
      } else {
        let remaining = line;
        while (remaining.length > 0) {
          let breakIdx = charLimit;
          let skipChars = 0;
          if (remaining.length > charLimit) {
            const lastSpace = remaining.substring(0, charLimit + 1).lastIndexOf(' ');
            if (lastSpace > 0) { breakIdx = lastSpace; skipChars = 1; }
            else { breakIdx = charLimit; skipChars = 0; }
          } else { breakIdx = remaining.length; }

          const chunk = remaining.substring(0, breakIdx);
          if (isChordLine(line)) {
            result.push({ type: 'chord', text: chunk });
          } else {
            result.push({ type: 'lyric', text: chunk });
          }
          remaining = remaining.substring(breakIdx + skipChars);
        }
        j++;
      }
    }
    return result;
  }

  // --- FUNÇÕES DA BIBLIOTECA ---
  const saveToLibrary = () => {
    const defaultName = repertoireHeader || `Repertório ${new Date().toLocaleDateString('pt-BR')}`
    const name = window.prompt("Dê um nome para salvar este repertório:", defaultName)
    if (!name) return;
    const newRep: SavedRepertoire = {
      id: Date.now().toString(), name, date: new Date().toLocaleDateString('pt-BR'), header: repertoireHeader, songs: [...songs]
    }
    setSavedRepertoires([...savedRepertoires, newRep])
    alert("✅ Repertório salvo na sua biblioteca com sucesso!")
  }

  const loadFromLibrary = (rep: SavedRepertoire) => {
    if (window.confirm("Atenção: Carregar este repertório vai substituir o que está na tela agora. Deseja continuar?")) {
      setSongs(rep.songs); setRepertoireHeader(rep.header); setActiveTab('setlist');
    }
  }

  const deleteFromLibrary = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este repertório salvo?")) {
      setSavedRepertoires(savedRepertoires.filter(r => r.id !== id))
    }
  }

  const clearCurrentSetlist = () => {
    if (window.confirm("Deseja limpar a tela para começar um repertório do zero?")) {
      setSongs([{ id: Date.now().toString(), title: "", content: "" }]); setRepertoireHeader("");
    }
  }

  // --- FUNÇÕES DE PESQUISA ---
  const handleSearch = (engine: 'google' | 'cifraclub' | 'letras' | 'missa') => {
    if (!searchQuery.trim()) return alert("Digite o nome de uma música antes de pesquisar!");
    const query = encodeURIComponent(searchQuery.trim());
    let url = engine === 'google' ? `https://www.google.com/search?q=${query}+cifra` :
              engine === 'cifraclub' ? `https://www.google.com/search?q=site:cifraclub.com.br+${query}` :
              engine === 'missa' ? `https://www.google.com/search?q=site:musicasparamissa.com.br+${query}` :
              `https://www.google.com/search?q=site:letras.mus.br+${query}`;
    window.open(url, '_blank');
  }

  // --- FUNÇÕES DO REPERTÓRIO ---
  const addSong = () => setSongs([...songs, { id: Date.now().toString(), title: "", content: "" }])
  const updateSong = (index: number, field: 'title' | 'content', value: string) => {
    const newSongs = [...songs]; newSongs[index][field] = value; setSongs(newSongs);
  }
  const removeSong = (index: number) => {
    if (songs.length === 1) return setSongs([{ id: Date.now().toString(), title: "", content: "" }]);
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

  const transposeSong = (index: number, steps: number) => {
    const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatToSharp: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    const newSongs = [...songs];
    const lines = newSongs[index].content.split('\n');

    newSongs[index].content = lines.map(line => {
      if (!isChordLine(line)) return line;
      return line.replace(/(^|[\s()|])([A-G][b#]?)([^\s()|/]*)(?:\/([A-G][b#]?))?(?=[\s()|]|$)/g, (match, prefix, root, suffix, bass) => {
        const getNewNote = (note: string) => {
          if (!note) return '';
          const n = flatToSharp[note] || note; 
          const idx = scale.indexOf(n);
          if (idx === -1) return note;
          return scale[(idx + steps + 12) % 12];
        };
        return prefix + getNewNote(root) + (suffix || '') + (bass ? '/' + getNewNote(bass) : '');
      });
    }).join('\n');
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
          currentX = 110; currentY = 32; doc.setTextColor(0, 0, 0);
        } else if (currentX === 110 && (currentY + needed) > 275) {
          doc.addPage(); drawFixedElements(doc); currentX = 15; currentY = 32;
        }
      };

      drawFixedElements(doc);

      songs.forEach((song) => {
        if (!song.title.trim() && !song.content.trim()) return;

        if (song.title.trim() !== "") {
          doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(0, 0, 0);
          const wrappedTitle = doc.splitTextToSize(cleanText(song.title.trim()), 85);
          wrappedTitle.forEach((t: string) => { checkSpace(8); doc.text(t.trim(), currentX, currentY); currentY += 8; });
        }

        const lines = cleanText(song.content).split('\n');
        let j = 0;

        while (j < lines.length) {
          const line = lines[j];
          if (line.trim() === "") { currentY += 2.5; j++; continue; }

          let chordLine = line; let lyricLine = lines[j + 1] || "";
          
          if (isChordLine(chordLine) && lyricLine.trim() !== "" && !isChordLine(lyricLine)) {
            while (chordLine.length > 0 || lyricLine.length > 0) {
              checkSpace(12);
              let breakIdx = charLimit; let skipChars = 0;
              const maxLen = Math.max(chordLine.length, lyricLine.length);
              
              if (maxLen > charLimit) {
                let lastSpace = lyricLine.substring(0, charLimit + 1).lastIndexOf(' ');
                if (lastSpace > 0) { breakIdx = lastSpace; skipChars = 1; }
                else {
                  lastSpace = chordLine.substring(0, charLimit + 1).lastIndexOf(' ');
                  if (lastSpace > 0) { breakIdx = lastSpace; skipChars = 1; }
                  else { breakIdx = charLimit; skipChars = 0; }
                }
              } else { breakIdx = maxLen; skipChars = 0; }

              const cChunk = chordLine.substring(0, breakIdx); const lChunk = lyricLine.substring(0, breakIdx);

              if (cChunk.trim() !== "") {
                doc.setFont("courier", "bold"); doc.setFontSize(10); doc.setTextColor(37, 99, 235);
                doc.text(cChunk.replace(/\*\*/g, ''), currentX, currentY); currentY += 4.5;
              }
              
              doc.setFontSize(10); doc.setTextColor(0, 0, 0);
              if (lChunk.includes('**')) {
                doc.setFont("courier", "bold");
                doc.text(lChunk.replace(/\*\*/g, ''), currentX, currentY);
              } else {
                doc.setFont("courier", "normal");
                doc.text(lChunk, currentX, currentY);
              }
              currentY += 6.5;

              chordLine = chordLine.substring(breakIdx + skipChars); lyricLine = lyricLine.substring(breakIdx + skipChars);
            }
            j += 2; 
          } else {
            let remaining = line;
            while (remaining.length > 0) {
              checkSpace(6);
              let breakIdx = charLimit; let skipChars = 0;
              if (remaining.length > charLimit) {
                const lastSpace = remaining.substring(0, charLimit + 1).lastIndexOf(' ');
                if (lastSpace > 0) { breakIdx = lastSpace; skipChars = 1; } else { breakIdx = charLimit; skipChars = 0; }
              } else { breakIdx = remaining.length; }

              const chunk = remaining.substring(0, breakIdx);
              doc.setFontSize(10); doc.setTextColor(0, 0, 0);
              
              if (isChordLine(line)) { 
                doc.setFont("courier", "bold"); doc.setTextColor(37, 99, 235); 
                doc.text(chunk.replace(/\*\*/g, ''), currentX, currentY);
              } else { 
                if (chunk.includes('**')) {
                  doc.setFont("courier", "bold");
                  doc.text(chunk.replace(/\*\*/g, ''), currentX, currentY);
                } else {
                  doc.setFont("courier", "normal"); 
                  doc.text(chunk, currentX, currentY);
                }
              }
              
              currentY += 5.5;
              remaining = remaining.substring(breakIdx + skipChars);
            }
            j++;
          }
        }
        currentY += 6;
      });

      const fName = "repertorio.pdf";
      if (action === 'download') doc.save(fName);
      else {
        const pdfBlob = doc.output('blob'); const file = new File([pdfBlob], fName, { type: 'application/pdf' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Repertório Digital', text: 'Crie o seu repertório digital no promptlabbrasil.com.br' }).catch(() => doc.save(fName));
        } else doc.save(fName);
      }
    } catch (err) { alert("Erro interno. A geração do PDF foi interrompida."); }
  };

  const calculateCapoFret = () => {
    const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatToSharp: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    const getIdx = (n: string) => scale.indexOf(flatToSharp[n] || n);
    const originalIdx = getIdx(originalTone); const shapeIdx = getIdx(shapeTone);
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
        .btn-play { background: #10b981; color: white; font-size: 0.75rem; font-weight: bold; border-radius: 6px; padding: 0 12px; height: 32px; transition: 0.2s; display: flex; align-items: center; gap: 4px; }
        .btn-play:hover { background: #059669; }
        
        .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
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
