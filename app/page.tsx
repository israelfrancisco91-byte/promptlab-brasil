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
  
  const [librarySearchQuery, setLibrarySearchQuery] = useState("")

  const [shareModal, setShareModal] = useState<string | null>(null)
  const [isShareLoading, setIsShareLoading] = useState(false)

  const [prompterSong, setPrompterSong] = useState<Song | null>(null)
  const [prompterSpeed, setPrompterSpeed] = useState(2)
  const [isPrompterPlaying, setIsPrompterPlaying] = useState(false)
  const prompterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let loadedFromUrl = false;

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const sharedData = urlParams.get('rep');
      
      if (sharedData) {
        try {
          const fixedBase64 = sharedData.replace(/ /g, '+');
          const decodedStr = decodeURIComponent(escape(atob(fixedBase64)));
          const parsed = JSON.parse(decodedStr);
          
          const hasNewFormat = parsed && parsed.s && parsed.s.length > 0;
          const hasOldFormat = parsed && parsed.songs && parsed.songs.length > 0;

          if (hasNewFormat || hasOldFormat) {
            const listName = parsed.h || parsed.header || parsed.name || "Compartilhado";
            
            if (window.confirm(`🎵 Você recebeu o repertório "${listName}". Deseja carregar esta lista de cifras na sua tela agora?`)) {
              
              if (hasNewFormat) {
                const expandedSongs = parsed.s.map((song: any, idx: number) => ({
                  id: `shared-${Date.now()}-${idx}`,
                  title: song.t || "",
                  content: song.c || ""
                }));
                setSongs(expandedSongs);
              } else {
                setSongs(parsed.songs);
              }
              
              setRepertoireHeader(parsed.h || parsed.header || "");
              loadedFromUrl = true;
              
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        } catch (e) {
          console.error("Erro ao processar link compartilhado:", e);
          alert("Ops! O link compartilhado parece estar inválido ou corrompido.");
        }
      }
    }

    if (!loadedFromUrl) {
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


  const isChordLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 120) return false;
    
    let clean = trimmed
      .toUpperCase()
      .replace(/(INTRO|REFRÃO|CORO|PONTE|SOLO|VAMP|BIS|FIM|FINAL|[:||\-~xX*\d+])/g, ' ')
      .replace(/\([^)]*\)/g, ' ')
      .trim();
      
    if (!clean) return true; 
    
    const words = clean.split(/\s+/);
    const strictChordRegex = /^[A-G][B#]?(M|MIN|MAJ|DIM|AUG|SUS|ADD|[\d]+)*(\/[A-G][B#]?)?$/;
    
    let chordCount = 0;
    for (const w of words) {
      if (strictChordRegex.test(w)) chordCount++;
    }
    
    return (chordCount / words.length) >= 0.7;
  };

  const handleGenerateShareLink = async () => {
    const hasContent = songs.some(s => s.title.trim() !== "" || s.content.trim() !== "");
    if (!hasContent) return alert("Adicione pelo menos uma música antes de gerar o link!");
    
    setIsShareLoading(true);
    try {
      const minifiedSongs = songs.map(s => ({
        t: s.title,
        c: s.content
      }));
      
      const dataObj = {
        h: repertoireHeader,
        s: minifiedSongs
      };
      
      const jsonStr = JSON.stringify(dataObj);
      const base64Data = btoa(unescape(encodeURIComponent(jsonStr)));
      
      const encodedParam = encodeURIComponent(base64Data);
      const longUrl = `${window.location.origin}${window.location.pathname}?rep=${encodedParam}`;
      
      try {
        const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
        if (response.ok) {
          const shortUrl = await response.text();
          if (shortUrl && shortUrl.startsWith('http')) {
            setShareModal(shortUrl);
            setIsShareLoading(false);
            return;
          }
        }
      } catch (corsOrNetworkError) {
        console.log("Utilizando fallback de link direto de segurança.");
      }
      
      setShareModal(longUrl);
    } catch (err) {
      alert("Não foi possível gerar o link de compartilhamento.");
    } finally {
      setIsShareLoading(false);
    }
  };

  const handleToggleCase = (index: number) => {
    const newSongs = [...songs];
    const current = newSongs[index].content;
    if (!current) return;

    const lines = current.split('\n');
    const lyricLines = lines.filter(line => !isChordLine(line) && line.trim().length > 0);
    const lyricsText = lyricLines.join('');
    
    if (lyricsText.length === 0) return; 

    const isUpper = lyricsText === lyricsText.toUpperCase();

    newSongs[index].content = lines.map(line => {
      if (isChordLine(line) || line.trim() === "") {
        return line;
      }
      
      if (isUpper) {
        const lower = line.toLowerCase();
        return lower.replace(/^([^a-z-záàâãéèêíïóôõöúçñ]*)([a-z-záàâãéèêíïóôõöúçñ])/i, (match, prefix, letter) => {
          return prefix + letter.toUpperCase();
        });
      } else {
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

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>, index: number) => {
    const htmlData = e.clipboardData.getData('text/html');
    const textData = e.clipboardData.getData('text/plain');

    if (!htmlData) return;
    e.preventDefault();

    let cleanHtml = htmlData
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n') 
      .replace(/<br\s*[\/]?>/gi, '\n'); 

    cleanHtml = cleanHtml.replace(/<(b|strong)\b[^>]*>([\s\S]*?)<\/\1>/gi, (match, tag, inner) => {
      return inner.split('\n').map((line: string) => {
        if (line.trim() === '') return line;
        return `**${line}**`;
      }).join('\n');
    });

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanHtml;
    
    let finalText = tempDiv.textContent || textData;
    finalText = finalText.replace(/\n{3,}/g, '\n\n').trim();

    // --- NOVA LÓGICA DE LIMPEZA DE NEGRITO NAS CIFRAS ---
    // Removemos os asteriscos (**) de qualquer linha que for identificada como cifra
    finalText = finalText.split('\n').map(line => {
      if (isChordLine(line)) {
        return line.replace(/\*\*/g, ''); 
      }
      return line;
    }).join('\n');
    // ----------------------------------------------------

    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = songs[index].content;

    const newContent = currentContent.substring(0, start) + finalText + currentContent.substring(end);
    updateSong(index, 'content', newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + finalText.length, start + finalText.length);
    }, 10);
  };

  const cleanText = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
      .replace(/\t/g, '    ');
  }

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

  const exportRepertoire = (rep: SavedRepertoire) => {
    try {
      const dataStr = JSON.stringify(rep, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = rep.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `${safeName}.promptlab`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erro ao exportar o repertório.");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const importedData = JSON.parse(content) as SavedRepertoire;
        
        if (importedData.songs && importedData.name) {
          if (window.confirm(`Deseja carregar o repertório "${importedData.name}" na tela agora?`)) {
            setSongs(importedData.songs);
            setRepertoireHeader(importedData.header || importedData.name);
            setActiveTab('setlist');
          }
        } else {
          alert("Arquivo inválido. Certifique-se de usar um arquivo .promptlab gerado pelo sistema.");
        }
      } catch (err) {
        alert("Erro ao ler o arquivo. Ele pode estar corrompido.");
      }
      e.target.value = ''; 
    };
    reader.readAsText(file);
  };

  const filteredRepertoires = savedRepertoires.filter(rep => 
    rep.name.toLowerCase().includes(librarySearchQuery.toLowerCase())
  );

  const clearCurrentSetlist = () => {
    if (window.confirm("Deseja limpar a tela para começar um repertório do zero?")) {
      setSongs([{ id: Date.now().toString(), title: "", content: "" }]); setRepertoireHeader("");
    }
  }

  const handleSearch = (engine: 'google' | 'cifraclub' | 'letras' | 'missa') => {
    if (!searchQuery.trim()) return alert("Digite o nome de uma música antes de pesquisar!");
    const query = encodeURIComponent(searchQuery.trim());
    let url = engine === 'google' ? `https://www.google.com/search?q=${query}+cifra` :
              engine === 'cifraclub' ? `https://www.google.com/search?q=site:cifraclub.com.br+${query}` :
              engine === 'missa' ? `https://www.google.com/search?q=site:musicasparamissa.com.br+${query}` :
              `https://www.google.com/search?q=site:letras.mus.br+${query}`;
    window.open(url, '_blank');
  }

  const addSong = () => setSongs([...songs, { id: Date.now().toString(), title: "", content: "" }])
  
  const insertSongAfter = (index: number) => {
    const newSongs = [...songs];
    newSongs.splice(index + 1, 0, { id: Date.now().toString(), title: "", content: "" });
    setSongs(newSongs);
  }

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
      
      return line.replace(/(^|[\s()|])([A-G][b#]?)((?:m|min|maj|M|dim|aug|sus|add|[\d]+)*)(\/[A-G][b#]?)?(?=[\s()|]|$)/g, (match, prefix, root, suffix, bass) => {
        const getNewNote = (note: string) => {
          if (!note) return '';
          const cleanNote = note.replace('/', '');
          const n = flatToSharp[cleanNote] || cleanNote; 
          const idx = scale.indexOf(n);
          if (idx === -1) return note;
          return scale[(idx + steps + 12) % 12];
        };
        
        const newRoot = getNewNote(root);
        const newBass = bass ? '/' + getNewNote(bass) : '';
        return prefix + newRoot + (suffix || '') + newBass;
      });
    }).join('\n');
    setSongs(newSongs);
  };

  // --- PDF ENGINE ATUALIZADA (FONTES 100% ESPELHADAS) ---
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

              const cChunk = chordLine.substring(0, breakIdx); 
              const lChunk = lyricLine.substring(0, breakIdx);

              if (cChunk.trim() !== "") {
                doc.setFont("Courier", "bold"); doc.setFontSize(10); doc.setTextColor(37, 99, 235);
                doc.text(cChunk.replace(/\*\*/g, ''), currentX, currentY); 
              }
              currentY += 4.5;
              
              doc.setFontSize(10); doc.setTextColor(0, 0, 0);
              if (lChunk.includes('**')) {
                doc.setFont("Courier", "bold");
                doc.text(lChunk.replace(/\*\*/g, ''), currentX, currentY);
              } else {
                doc.setFont("Courier", "normal");
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
                doc.setFont("Courier", "bold"); doc.setTextColor(37, 99, 235); 
                doc.text(chunk.replace(/\*\*/g, ''), currentX, currentY);
              } else { 
                if (chunk.includes('**')) {
                  doc.setFont("Courier", "bold");
                  doc.text(chunk.replace(/\*\*/g, ''), currentX, currentY);
                } else {
                  doc.setFont("Courier", "normal"); 
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
     <div className="min-h-screen text-white font-sans p-4 relative z-0">
      
      {/* BACKGROUND TEMA SÃO JOÃO SOFISTICADO */}
      <div className="fixed inset-0 z-[-1] bg-[#020617]">
        {/* Textura de estrelas/ruído suave */}
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        {/* Degradê Lilás vindo de baixo (Cores da sua logo) */}
        <div className="absolute bottom-0 left-0 right-0 h-[80vh] bg-gradient-to-t from-purple-900/30 to-transparent"></div>
        {/* Reflexo quente da Fogueira no canto superior direito */}
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none"></div>
      </div>

      <style jsx global>{`
        .panel { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(30, 41, 59, 0.8); border-radius: 16px; padding: 24px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.7); }
        .card { background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(8px); border: 1px solid rgba(51, 65, 85, 0.8); border-radius: 12px; padding: 16px; transition: 0.2s; }
        .card:focus-within { border-color: #a855f7; box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.2); }
        label { color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; display: block; letter-spacing: 0.05em; }
        
        input { background: rgba(15, 23, 42, 0.9); border: 1px solid #334155; color: white; padding: 12px; border-radius: 8px; width: 100%; transition: all 0.2s; margin-bottom: 12px; }
        textarea { background: rgba(15, 23, 42, 0.9); border: 1px solid #334155; color: white; padding: 12px; border-radius: 8px; width: 100%; transition: all 0.2s; margin-bottom: 12px; font-family: 'Courier New', Courier, monospace !important; }
        input:focus, textarea:focus { outline: none; border-color: #a855f7; }
        
        .font-mono { font-family: 'Courier New', Courier, monospace !important; }

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
        .custom-scroll::-webkit-scrollbar-track { background: transparent; border-radius: 8px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #475569; border-radius: 8px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #64748b; }

        .nav-tab { padding: 10px 12px; font-weight: 800; text-transform: uppercase; font-size: 0.70rem; border-radius: 8px; cursor: pointer; transition: 0.2s; flex: 1 1 auto; text-align: center; white-space: nowrap; }
        @media (min-width: 640px) { .nav-tab { font-size: 0.80rem; padding: 12px 20px; } }
        .nav-tab.active { background: linear-gradient(135deg, #3b82f6 0%, #a855f7 100%); color: white; box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4); }
        .nav-tab.inactive { background: transparent; color: #94a3b8; border: 1px solid transparent; }
        .nav-tab.inactive:hover { background: rgba(30, 41, 59, 0.8); color: white; }
        
        .note-btn { background: rgba(30, 41, 59, 0.8); border: 1px solid #334155; padding: 12px 0; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; color: #cbd5e1; }
        .note-btn:hover { background: #475569; }
        .note-btn.active { background: #a855f7; border-color: #d8b4fe; color: white; box-shadow: 0 0 15px rgba(168, 85, 247, 0.5); }

        .prompter-line { white-space: pre-wrap; min-height: 1.5em; word-break: break-word; }
        .prompter-chord { color: #d8b4fe; font-weight: bold; }
        .prompter-lyric { color: #ffffff; }
      `}</style>

      {/* CABEÇALHO PADRÃO */}
      {!prompterSong && (
        <header className="max-w-3xl mx-auto text-center py-8">
          <h1 className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">PromptLab BR</h1>
          <p className="text-slate-400 font-medium mb-8">Ferramentas Profissionais para Músicos</p>
          
          <div className="grid grid-cols-2 sm:flex sm:flex-row bg-[#0f172a] p-2 rounded-xl border border-slate-800 gap-2">
            <button className={`nav-tab flex-1 ${activeTab === 'setlist' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('setlist')}>📚 Repertório</button>
            <button className={`nav-tab flex-1 ${activeTab === 'library' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('library')}>📂 Salvos</button>
            <button className={`nav-tab flex-1 ${activeTab === 'capo' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('capo')}>🎸 Capo</button>
            <button className={`nav-tab flex-1 ${activeTab === 'search' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('search')}>🔍 Buscar</button>
          </div>
        </header>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      {!prompterSong && (
        <main className="max-w-3xl mx-auto space-y-6">
          
          {/* ================= ABA 1: REPERTÓRIO ================= */}
          {activeTab === 'setlist' && (
            <section className="panel border-l-4 border-green-500 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">📚 Construtor de PDF</h2>
                  <button onClick={() => setShowInstructions(!showInstructions)} className="text-xs text-slate-400 hover:text-white underline ml-2">
                    {showInstructions ? "Ocultar" : "Como usar"}
                  </button>
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                  <button onClick={clearCurrentSetlist} className="btn-icon !w-auto px-4 !bg-slate-800 hover:!bg-slate-700 text-xs font-bold uppercase" title="Apagar tudo e começar do zero">📄 Novo</button>
                  <button onClick={saveToLibrary} className="btn-icon !w-auto px-4 !bg-blue-600 hover:!bg-blue-500 text-xs font-bold uppercase shadow-[0_0_15px_rgba(37,99,235,0.4)]" title="Salvar este repertório na sua biblioteca">💾 Salvar Repertório</button>
                </div>
              </div>
              
              {showInstructions && (
                <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 text-sm text-slate-300 leading-relaxed space-y-4 mb-8 shadow-inner">
                  <h3 className="font-bold text-white text-base mb-2 border-b border-slate-700 pb-2">Guia Rápido de Uso</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3"><span className="text-lg">📝</span><div><strong className="text-blue-400">Adicionar Músicas:</strong> Insira o título e cole a cifra. Tudo é salvo automaticamente.</div></li>
                    <li className="flex items-start gap-3"><span className="text-lg">▶️</span><div><strong className="text-green-400">Teleprompter:</strong> Clique no botão Play verde em qualquer música para entrar no Modo Palco e rolar a tela automaticamente.</div></li>
                    <li className="flex items-start gap-3"><span className="text-lg">🎛️</span><div><strong className="text-purple-400">Transposição:</strong> Altere o tom clicando em -½ Tom e +½ Tom.</div></li>
                    <li className="flex items-start gap-3"><span className="text-lg">✏️</span><div><strong className="text-yellow-400">Edição:</strong> Use <span className="bg-slate-700 px-1 rounded">Aa</span> para alterar Maiúsculas/Minúsculas e <span className="bg-slate-700 px-1 rounded">B</span> para negrito.</div></li>
                  </ul>
                </div>
              )}
              
              <div className="mb-6">
                <label>Cabeçalho do PDF (Título da Página)</label>
                <input value={repertoireHeader} onChange={(e) => setRepertoireHeader(e.target.value)} placeholder="Ex: Missa de Domingo, Show de Rock..." className="bg-[#0f172a]" />
              </div>

              {/* LISTA DE MÚSICAS */}
              <div className="mb-6 space-y-1">
                {songs.map((song, index) => (
                  <div key={song.id} className="relative">
                    <div className="card relative group border-l-4 border-l-transparent focus-within:border-l-blue-500 z-10">
                      
                      <div className="mb-3">
                        <label className="!mb-1 text-slate-400">Título da Música {index + 1}</label>
                        <input value={song.title} onChange={(e) => updateSong(index, 'title', e.target.value)} placeholder="Ex: Te Louvarei" className="!mb-0 !bg-[#0f172a] font-bold" />
                      </div>
                      
                      {/* TOOLBAR DESKTOP (Invisível no Mobile) */}
                      <div className="hidden sm:flex flex-wrap items-center gap-2 mb-3 bg-[#0f172a] p-2 rounded-lg border border-slate-700/50">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleToggleCase(index)} className="h-8 px-3 bg-[#334155] hover:bg-[#475569] text-xs font-bold rounded-md text-white transition-colors" title="Alternar Maiúsculas/Minúsculas">Aa</button>
                          <button onClick={() => handleToggleBold(index)} className="h-8 px-3 bg-[#334155] hover:bg-[#475569] text-xs font-bold rounded-md text-white transition-colors" title="Selecionar texto e aplicar Negrito">B</button>
                        </div>
                        
                        <div className="w-px h-5 bg-slate-700 mx-1"></div>
                        
                        <div className="flex items-center gap-1">
                          <button onClick={() => transposeSong(index, -1)} className="btn-transpose !m-0">-½ Tom</button>
                          <button onClick={() => transposeSong(index, 1)} className="btn-transpose !m-0">+½ Tom</button>
                        </div>

                        <div className="w-px h-5 bg-slate-700 mx-1"></div>

                        <button onClick={() => openPrompter(song)} className="btn-play !m-0 flex-none justify-center whitespace-nowrap" title="Modo Palco: Rolar letra automaticamente">
                          ▶️ Prompter
                        </button>

                        <div className="flex items-center gap-1 ml-auto justify-end border-l border-slate-700 pl-3">
                          <button onClick={() => moveSong(index, 'up')} disabled={index === 0} className="btn-icon disabled:opacity-30 !h-8 !w-9">⬆️</button>
                          <button onClick={() => moveSong(index, 'down')} disabled={index === songs.length - 1} className="btn-icon disabled:opacity-30 !h-8 !w-9">⬇️</button>
                          <button onClick={() => removeSong(index)} className="btn-icon btn-danger !h-8 !w-9">🗑️</button>
                        </div>
                      </div>

                      {/* TOOLBAR MOBILE: PARTE SUPERIOR (Invisível no Desktop) */}
                      <div className="flex sm:hidden flex-col gap-3 mb-3 bg-[#0f172a] p-3 rounded-lg border border-slate-700/50">
                        <button onClick={() => openPrompter(song)} className="btn-play !m-0 w-full justify-center whitespace-nowrap !h-10 text-sm" title="Modo Palco: Rolar letra automaticamente">
                          ▶️ Prompter
                        </button>

                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <button onClick={() => transposeSong(index, -1)} className="btn-transpose !m-0 !px-3 !h-9 text-xs">-½ Tom</button>
                            <button onClick={() => transposeSong(index, 1)} className="btn-transpose !m-0 !px-3 !h-9 text-xs">+½ Tom</button>
                          </div>

                          <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
                            <button onClick={() => moveSong(index, 'up')} disabled={index === 0} className="btn-icon disabled:opacity-30 !h-9 !w-10 text-sm">⬆️</button>
                            <button onClick={() => moveSong(index, 'down')} disabled={index === songs.length - 1} className="btn-icon disabled:opacity-30 !h-9 !w-10 text-sm">⬇️</button>
                            <button onClick={() => removeSong(index)} className="btn-icon btn-danger !h-9 !w-10 text-sm">🗑️</button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <textarea 
                          id={`song-textarea-${index}`} 
                          rows={8} 
                          value={song.content} 
                          onChange={(e) => updateSong(index, 'content', e.target.value)}
                          onPaste={(e) => handlePaste(e, index)} 
                          placeholder="Cole as estrofes e refrões cifrados aqui..." 
                          className="!mb-0 text-sm font-mono !bg-[#0f172a]" 
                        />
                      </div>

                      {/* TOOLBAR MOBILE: PARTE INFERIOR (Invisível no Desktop) */}
                      <div className="flex sm:hidden items-center gap-2 mt-2 bg-[#0f172a] p-2 rounded-lg border border-slate-700/50 w-max">
                        <button onClick={() => handleToggleCase(index)} className="h-8 px-5 bg-[#334155] hover:bg-[#475569] text-xs font-bold rounded-md text-white transition-colors" title="Alternar Maiúsculas/Minúsculas">Aa</button>
                        <button onClick={() => handleToggleBold(index)} className="h-8 px-5 bg-[#334155] hover:bg-[#475569] text-xs font-bold rounded-md text-white transition-colors" title="Selecionar texto e aplicar Negrito">B</button>
                      </div>

                    </div>
                    
                    <div className="flex justify-center my-2 opacity-60 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => insertSongAfter(index)}
                        className="bg-[#0f172a] text-slate-400 hover:text-blue-400 text-xs font-bold py-1 px-4 rounded-full border border-dashed border-slate-600 hover:border-blue-500 transition-all flex items-center gap-2
