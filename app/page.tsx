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
    if (savedSongs) { try { setSongs(JSON.parse(savedSongs)) } catch (e) { console.error(e) } }
    if (savedHeader) setRepertoireHeader(savedHeader)
    if (savedLibrary) { try { setSavedRepertoires(JSON.parse(savedLibrary)) } catch (e) { console.error(e) } }
  }, [])

  useEffect(() => { localStorage.setItem('promptlab_songs', JSON.stringify(songs)) }, [songs])
  useEffect(() => { localStorage.setItem('promptlab_header', repertoireHeader) }, [repertoireHeader])
  useEffect(() => { localStorage.setItem('promptlab_library', JSON.stringify(savedRepertoires)) }, [savedRepertoires])

  // --- FERRAMENTAS DE EDIÇÃO (NOVO) ---
  const handleToggleCase = (index: number) => {
    const newSongs = [...songs];
    const current = newSongs[index].content;
    const isUpper = current === current.toUpperCase();
    newSongs[index].content = isUpper ? current.toLowerCase() : current.toUpperCase();
    setSongs(newSongs);
  };

  const handleToggleBold = (index: number) => {
    const textarea = document.getElementById(`song-textarea-${index}`) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = songs[index].content;
    const selected = text.substring(start, end);
    const newText = text.substring(0, start) + "**" + selected + "**" + text.substring(end);
    updateSong(index, 'content', newText);
  };

  // --- FILTRO DE LIMPEZA ---
  const cleanText = (text: string) => {
    if (!text) return "";
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ').replace(/\t/g, '    ');
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
    if (!song.content.trim()) { alert("A música está vazia!"); return; }
    setPrompterSong(song); setIsPrompterPlaying(false); setPrompterSpeed(2);
  }

  const closePrompter = () => { setPrompterSong(null); setIsPrompterPlaying(false); }

  const getPrompterLines = (content: string) => {
    const charLimit = 40; 
    const lines = cleanText(content).split('\n');
    let j = 0;
    const result: { type: string, text: string }[] = [];

    while (j < lines.length) {
      const line = lines[j];
      if (line.trim() === "") { result.push({ type: 'empty', text: '' }); j++; continue; }
      let chordLine = line; let lyricLine = lines[j + 1] || "";
      if (isChordLine(chordLine) && lyricLine.trim() !== "" && !isChordLine(lyricLine)) {
        while (chordLine.length > 0 || lyricLine.length > 0) {
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
          if (cChunk.trim() !== "") { result.push({ type: 'chord', text: cChunk }); }
          result.push({ type: 'lyric', text: lChunk });
          chordLine = chordLine.substring(breakIdx + skipChars);
          lyricLine = lyricLine.substring(breakIdx + skipChars);
        }
        j += 2;
      } else {
        let remaining = line;
        while (remaining.length > 0) {
          let breakIdx = charLimit; let skipChars = 0;
          if (remaining.length > charLimit) {
            const lastSpace = remaining.substring(0, charLimit + 1).lastIndexOf(' ');
            if (lastSpace > 0) { breakIdx = lastSpace; skipChars = 1; }
            else { breakIdx = charLimit; skipChars = 0; }
          } else { breakIdx = remaining.length; }
          const chunk = remaining.substring(0, breakIdx);
          if (isChordLine(line)) { result.push({ type: 'chord', text: chunk }); } 
          else { result.push({ type: 'lyric', text: chunk }); }
          remaining = remaining.substring(breakIdx + skipChars);
        }
        j++;
      }
    }
    return result;
  }

  const saveToLibrary = () => {
    const defaultName = repertoireHeader || `Repertório ${new Date().toLocaleDateString('pt-BR')}`
    const name = window.prompt("Dê um nome para salvar este repertório:", defaultName)
    if (!name) return;
    const newRep: SavedRepertoire = { id: Date.now().toString(), name, date: new Date().toLocaleDateString('pt-BR'), header: repertoireHeader, songs: [...songs] }
    setSavedRepertoires([...savedRepertoires, newRep])
    alert("✅ Repertório salvo!")
  }

  const loadFromLibrary = (rep: SavedRepertoire) => {
    if (window.confirm("Atenção: Carregar este repertório vai substituir o que está na tela agora.")) {
      setSongs(rep.songs); setRepertoireHeader(rep.header); setActiveTab('setlist');
    }
  }

  const deleteFromLibrary = (id: string) => { if (window.confirm("Excluir?")) setSavedRepertoires(savedRepertoires.filter(r => r.id !== id)) }
  const clearCurrentSetlist = () => { if (window.confirm("Limpar tela?")) { setSongs([{ id: Date.now().toString(), title: "", content: "" }]); setRepertoireHeader(""); } }

  const handleSearch = (engine: 'google' | 'cifraclub' | 'letras' | 'missa') => {
    if (!searchQuery.trim()) return alert("Digite o nome da música!");
    const query = encodeURIComponent(searchQuery.trim());
    let url = engine === 'google' ? `https://www.google.com/search?q=${query}+cifra` :
              engine === 'cifraclub' ? `https://www.google.com/search?q=site:cifraclub.com.br+${query}` :
              engine === 'missa' ? `https://www.google.com/search?q=site:musicasparamissa.com.br+${query}` :
              `https://www.google.com/search?q=site:letras.mus.br+${query}`;
    window.open(url, '_blank');
  }

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

  const isChordLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 120) return false;
    return /^(\s*([A-G][b#]?(m|min|maj|maj7|m7|add|sus|dim|aug|[\d])?(\/[A-G][b#]?)?|INTRO:|REFRÃO:|PONTE:|SOLO:|VAMP:|\(|\)|\||\d|\+)(\s+|$))+$/i.test(line);
  };

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
      if (!hasContent) return alert("Adicione músicas!");
      let currentX = 15; let currentY = 32;
      const drawFixedElements = (pdfDoc: jsPDF) => {
        pdfDoc.setTextColor(150, 150, 150); pdfDoc.setFont("times", "bold"); pdfDoc.setFontSize(10);
        pdfDoc.text(watermark, 105, 290, { align: "center" });
        if (repertoireHeader) { pdfDoc.setTextColor(100, 116, 139); pdfDoc.text(repertoireHeader.toUpperCase(), 105, 12, { align: "center" }); pdfDoc.setDrawColor(220, 220, 220); pdfDoc.line(15, 15, 195, 15); }
        pdfDoc.setTextColor(0, 0, 0); 
      };
      const checkSpace = (needed: number) => {
        if (currentX === 15 && (currentY + needed) > 282) { currentX = 110; currentY = 32; doc.setTextColor(0, 0, 0); } 
        else if (currentX === 110 && (currentY + needed) > 275) { doc.addPage(); drawFixedElements(doc); currentX = 15; currentY = 32; }
      };
      drawFixedElements(doc);
      songs.forEach((song) => {
        if (!song.title.trim() && !song.content.trim()) return;
        if (song.title.trim() !== "") {
          doc.setFont("times", "bold"); doc.setFontSize(14); doc.setTextColor(0, 0, 0);
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
                else { lastSpace = chordLine.substring(0, charLimit + 1).lastIndexOf(' '); if (lastSpace > 0) { breakIdx = lastSpace; skipChars = 1; } else { breakIdx = charLimit; skipChars = 0; } }
              } else { breakIdx = maxLen; skipChars = 0; }
              const cChunk = chordLine.substring(0, breakIdx); const lChunk = lyricLine.substring(0, breakIdx);
              if (cChunk.trim() !== "") { doc.setFont("courier", "bold"); doc.setFontSize(10); doc.setTextColor(37, 99, 235); doc.text(cChunk, currentX, currentY); currentY += 4.5; }
              doc.setFont("courier", "normal"); doc.setFontSize(10); doc.setTextColor(0, 0, 0); doc.text(lChunk, currentX, currentY); currentY += 6.5;
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
              if (isChordLine(line)) { doc.setFont("courier", "bold"); doc.setTextColor(37, 99, 235); } else { doc.setFont("courier", "normal"); doc.setTextColor(0, 0, 0); }
              doc.setFontSize(10); doc.text(chunk, currentX, currentY); currentY += 5.5;
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
          await navigator.share({ files: [file], title: 'Repertório Digital', text: 'Crie no promptlabbrasil.com.br' }).catch(() => doc.save(fName));
        } else doc.save(fName);
      }
    } catch (err) { alert("Erro ao gerar PDF."); }
  };

  const calculateCapoFret = () => {
    const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatToSharp: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    const getIdx = (n: string) => scale.indexOf(flatToSharp[n] || n);
    const originalIdx = getIdx(originalTone); const shapeIdx = getIdx(shapeTone);
    if (originalIdx === -1 || shapeIdx === -1) return 0;
    return (originalIdx - shapeIdx + 12) % 12;
  };
  const capoResult = calculateCapo
