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
  
  // A Regra da Primeira Impressão para o AdSense (Música Preenchida)
  const [songs, setSongs] = useState<Song[]>([{
    id: 'init-1',
    title: "Exemplo: Te Louvarei",
    content: "G                         D/F#\nDeus está aqui neste momento\nEm                      C\nSua presença é real em meu viver\n\n[REFRÃO]\nG            D/F#\nTe louvarei, te glorificarei\nEm             C\nSenhor, te exaltarei"
  }])

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

  // --- ESTADOS PARA A BUSCA INTELIGENTE (ITUNES + VAGALUME) ---
  const [vagalumeModalIndex, setVagalumeModalIndex] = useState<number | null>(null)
  const [vagalumeQuery, setVagalumeQuery] = useState("")
  const [vagalumeResults, setVagalumeResults] = useState<{artist: string, song: string, thumb: string}[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isVagalumeLoading, setIsVagalumeLoading] = useState(false)
  const [lyricsImportNotice, setLyricsImportNotice] = useState("")
  const [musicImportMode, setMusicImportMode] = useState<'lyrics' | 'chords'>('lyrics')

  // --- EFEITO DE AUTOCOMPLETAR (DEBOUNCE) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (vagalumeQuery.trim().length > 2) {
        searchSuggestions(vagalumeQuery);
      } else {
        setVagalumeResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [vagalumeQuery]);

  const searchSuggestions = async (query: string) => {
    setIsSearching(true);
    try {
      // Usamos a API do iTunes para sugestões ultra-rápidas e com capa de álbum
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=6`);
      const data = await res.json();
      if (data.results) {
        const mapped = data.results.map((item: any) => ({
          artist: item.artistName,
          song: item.trackName,
          thumb: item.artworkUrl60
        }));
        // Remove duplicatas
        const unique = mapped.filter((v: any, i: number, a: any[]) => a.findIndex(t => (t.artist === v.artist && t.song === v.song)) === i);
        setVagalumeResults(unique);
      }
    } catch (e) {
      console.error("Erro na busca de sugestões", e);
    } finally {
      setIsSearching(false);
    }
  };

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

  // --- FUNÇÕES PARA BUSCAR E IMPORTAR LETRAS/CIFRAS COM MAIS ESTABILIDADE ---
  const cleanSongInfo = (artist: string, song: string) => {
    const normalizedArtist = artist.replace(/\s+/g, ' ').trim();
    let normalizedSong = song.replace(/\s+/g, ' ').trim();
    let inferredArtist = normalizedArtist;

    if (!inferredArtist && /\s+-\s+/.test(normalizedSong)) {
      const parts = normalizedSong.split(/\s+-\s+/);
      inferredArtist = parts[0] || '';
      normalizedSong = parts.slice(1).join(' - ') || normalizedSong;
    }

    // Ajuda em buscas como: "Em Teu Altar de Walmir Alencar".
    // Só aplica se a parte depois de "de/do/da" parece nome de artista com 2+ palavras.
    if (!inferredArtist && normalizedSong) {
      const byArtistMatch = normalizedSong.match(/^(.+?)\s+(?:de|do|da|dos|das)\s+([A-Za-zÀ-ÿ0-9'.&\s]{5,})$/i);
      if (byArtistMatch) {
        const possibleSong = byArtistMatch[1].trim();
        const possibleArtist = byArtistMatch[2].trim();
        if (possibleArtist.split(/\s+/).length >= 2 && possibleSong.split(/\s+/).length >= 2) {
          normalizedSong = possibleSong;
          inferredArtist = possibleArtist;
        }
      }
    }

    const cleanArtist = inferredArtist
      .split(/ feat\.? | ft\.? | participação | participacao | & |,/i)[0]
      .trim();

    const cleanSong = normalizedSong
      .replace(/\(.*?\)|\[.*?\]/g, '')
      .replace(/\s+-\s+(ao vivo|live|playback|remaster(ed)?|versão acústica|versao acustica).*$/gi, '')
      .replace(/ ao vivo| live| playback| remaster(ed)?| versão acústica| versao acustica/gi, '')
      .trim();

    return { cleanArtist, cleanSong };
  };

  const openLyricsModal = (index: number, mode: 'lyrics' | 'chords' = 'lyrics') => {
    setMusicImportMode(mode);
    setLyricsImportNotice("");
    setVagalumeResults([]);
    setVagalumeModalIndex(index);
    setVagalumeQuery(songs[index]?.title || "");
  };

  const closeLyricsModal = () => {
    setVagalumeModalIndex(null);
    setVagalumeQuery("");
    setVagalumeResults([]);
    setLyricsImportNotice("");
    setIsVagalumeLoading(false);
  };

  const appendLyricsToSong = (index: number, fallbackTitle: string, lyrics: string) => {
    // Não use trim() aqui: em cifras, os espaços no começo da linha são importantes
    // para manter os acordes alinhados nas sílabas corretas.
    const finalLyrics = lyrics.replace(/^\n+|\n+$/g, '');
    if (!finalLyrics.trim()) return;

    setSongs(prevSongs => {
      const newSongs = [...prevSongs];
      const currentSong = newSongs[index];
      if (!currentSong) return prevSongs;

      newSongs[index] = {
        ...currentSong,
        title: currentSong.title.trim() ? currentSong.title : fallbackTitle,
        content: currentSong.content.trim()
          ? `${currentSong.content.trimEnd()}\n\n${finalLyrics}`
          : finalLyrics
      };

      return newSongs;
    });
  };

  const fillSongTitleIfEmpty = (index: number, fallbackTitle: string) => {
    setSongs(prevSongs => {
      const newSongs = [...prevSongs];
      const currentSong = newSongs[index];
      if (!currentSong || currentSong.title.trim()) return prevSongs;
      newSongs[index] = { ...currentSong, title: fallbackTitle };
      return newSongs;
    });
  };

  const fetchJsonWithTimeout = async (url: string, timeoutMs = 4500) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const separator = url.includes('?') ? '&' : '?';
      const cacheFreeUrl = `${url}${separator}_=${Date.now()}`;

      const response = await fetch(cacheFreeUrl, {
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          Accept: 'application/json, text/plain, */*'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      if (!text.trim()) {
        throw new Error("Resposta vazia");
      }

      return JSON.parse(text);
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const makeProxiedUrls = (targetUrl: string) => {
    const separator = targetUrl.includes('?') ? '&' : '?';
    const targetWithCacheBuster = `${targetUrl}${separator}cacheBust=${Date.now()}`;

    return [
      targetWithCacheBuster,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetWithCacheBuster)}`,
      `https://corsproxy.io/?${encodeURIComponent(targetWithCacheBuster)}`
    ];
  };

  const firstSuccessful = async <T,>(tasks: (() => Promise<T>)[], isValid: (value: T) => boolean) => {
    if (!tasks.length) return null;

    try {
      return await Promise.any(
        tasks.map(async (task) => {
          const value = await task();
          if (isValid(value)) return value;
          throw new Error('empty-result');
        })
      );
    } catch {
      return null;
    }
  };

  const tryJsonUrlList = async (urls: string[], extractor: (data: any) => string) => {
    const uniqueUrls = Array.from(new Set(urls)).slice(0, 8);
    const result = await firstSuccessful(
      uniqueUrls.map(url => async () => {
        try {
          const data = await fetchJsonWithTimeout(url);
          return extractor(data);
        } catch (error) {
          console.warn('Fonte JSON falhou:', url, error);
          return '';
        }
      }),
      value => typeof value === 'string' && value.trim().length > 0
    );

    return result || '';
  };

  const tryTextUrlList = async (urls: string[], extractor: (html: string) => Promise<string> | string) => {
    const uniqueUrls = Array.from(new Set(urls)).slice(0, 8);
    const result = await firstSuccessful(
      uniqueUrls.map(url => async () => {
        try {
          const html = await fetchTextWithTimeout(url);
          const extracted = await extractor(html);
          return extracted || '';
        } catch (error) {
          console.warn('Fonte HTML falhou:', url, error);
          return '';
        }
      }),
      value => typeof value === 'string' && value.trim().length > 0
    );

    return result || '';
  };

  const extractLyricsFromResponse = (data: any) => {
    if ((data?.type === 'exact' || data?.type === 'aprox') && Array.isArray(data?.mus)) {
      const lyrics = data.mus.find((item: any) => typeof item?.text === 'string' && item.text.trim())?.text;
      if (lyrics) return lyrics.trim();
    }

    if (Array.isArray(data?.mus)) {
      const lyrics = data.mus.find((item: any) => typeof item?.text === 'string' && item.text.trim())?.text;
      if (lyrics) return lyrics.trim();
    }

    if (typeof data?.lyrics === 'string' && data.lyrics.trim()) {
      return data.lyrics.trim();
    }

    if (typeof data?.text === 'string' && data.text.trim()) {
      return data.text.trim();
    }

    return "";
  };

  const extractCandidatesFromVagalumeSearch = (data: any) => {
    const docs = data?.response?.docs || data?.docs || data?.results || data?.mus || [];
    if (!Array.isArray(docs)) return [];

    return docs
      .map((item: any) => ({
        artist: String(item?.band || item?.artist || item?.art || item?.band_name || item?.name || "").trim(),
        song: String(item?.title || item?.song || item?.mus || item?.music || item?.name || "").trim(),
        lyrics: String(item?.lyrics || item?.text || item?.content || "").trim()
      }))
      .filter((item: any) => item.song || item.artist || item.lyrics);
  };

  const tryExactLyrics = async (cleanArtist: string, cleanSong: string) => {
    const apiKey = "660a4395f992ff67786584e238f501aa";
    const urls: string[] = [];

    if (cleanArtist && cleanSong) {
      const exactWithKey = `https://api.vagalume.com.br/search.php?art=${encodeURIComponent(cleanArtist)}&mus=${encodeURIComponent(cleanSong)}&apikey=${apiKey}`;
      const exactWithoutKey = `https://api.vagalume.com.br/search.php?art=${encodeURIComponent(cleanArtist)}&mus=${encodeURIComponent(cleanSong)}`;
      urls.push(...makeProxiedUrls(exactWithKey), ...makeProxiedUrls(exactWithoutKey));
      urls.push(`https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanSong)}`);
    }

    return await tryJsonUrlList(urls, extractLyricsFromResponse);
  };

  const trySearchLyricsByQuery = async (cleanArtist: string, cleanSong: string) => {
    const apiKey = "660a4395f992ff67786584e238f501aa";
    const queryVariants = Array.from(new Set([
      `${cleanArtist} ${cleanSong}`.trim(),
      cleanSong.trim()
    ].filter(Boolean)));

    for (const query of queryVariants) {
      const excerptWithKey = `https://api.vagalume.com.br/search.excerpt.php?q=${encodeURIComponent(query)}&limit=5&apikey=${apiKey}`;
      const excerptWithoutKey = `https://api.vagalume.com.br/search.excerpt.php?q=${encodeURIComponent(query)}&limit=5`;
      const urls = Array.from(new Set([
        ...makeProxiedUrls(excerptWithKey),
        ...makeProxiedUrls(excerptWithoutKey)
      ]));

      for (const url of urls) {
        try {
          const data = await fetchJsonWithTimeout(url);
          const directLyrics = extractLyricsFromResponse(data);
          if (directLyrics) return directLyrics;

          const candidates = extractCandidatesFromVagalumeSearch(data);
          for (const candidate of candidates.slice(0, 4)) {
            if (candidate.lyrics && candidate.lyrics.length > 160) {
              return candidate.lyrics;
            }

            const candidateLyrics = await tryExactLyrics(candidate.artist || cleanArtist, candidate.song || cleanSong);
            if (candidateLyrics) return candidateLyrics;
          }
        } catch (error) {
          console.warn("Falha na busca aproximada do Vagalume:", error);
        }
      }
    }

    return "";
  };
  const slugifyMusicUrl = (value: string) => {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, ' e ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const decodeHtmlEntities = (value: string) => {
    if (typeof window === 'undefined') return value;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
  };

  const fetchTextWithTimeout = async (url: string, timeoutMs = 4500) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          Accept: 'text/html,application/xhtml+xml,text/plain,*/*'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      if (!text.trim()) {
        throw new Error('Resposta vazia');
      }

      return text;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const isDefinitelyNavigationText = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length === 0) return true;

    const compactText = lines.join(' ');
    if (/Curta\s+mais\s+m[uú]sicas\s+com\s+op[cç][oõ]es\s+exclusivas/i.test(compactText)) return true;
    if (/Assine\s+e\s+libere\s+benef[ií]cios/i.test(compactText)) return true;
    if (/Explore\s*M[uú]sicas/i.test(compactText)) return true;
    if (/Prote[cç][aã]o\s+de\s+Dados/i.test(compactText) && /Corre[cç][oõ]es\s+de\s+letras/i.test(compactText)) return true;

    const singleAlphabetLines = lines.filter(line => /^[A-Z#]$/i.test(line)).length;
    if (singleAlphabetLines >= 5) return true;

    const navWords = [
      'artistas', 'álbuns', 'albuns', 'playlists', 'atualizações', 'atualizacoes',
      'lançamentos', 'lancamentos', 'participe', 'envie letra', 'envie letras',
      'correções de letras', 'correcoes de letras', 'sobre o letras', 'proteção de dados',
      'protecao de dados', 'blog', 'login', 'cadastro', 'assine'
    ];
    const navCount = lines.filter(line => navWords.some(word => line.toLowerCase() === word || line.toLowerCase().includes(word))).length;
    if (navCount >= 5 && singleAlphabetLines >= 2) return true;
    if (navCount >= 8) return true;

    return false;
  };

  const cleanupImportedLyrics = (rawText: string) => {
    const decoded = decodeHtmlEntities(rawText)
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
      .replace(/[ \t]+\n/g, '\n');

    const noisePatterns = [
      /^letra$/i,
      /^cifra$/i,
      /^informações$/i,
      /^informacoes$/i,
      /^publicidade$/i,
      /^compartilhar$/i,
      /^imprimir$/i,
      /^corrigir letra$/i,
      /^favoritar/i,
      /^adicionar à playlist/i,
      /^adicionar a playlist/i,
      /^ouvir no/i,
      /^modo teatro/i,
      /^visualização padrão/i,
      /^visualizacao padrao/i,
      /^auto rolagem/i,
      /^repetir$/i,
      /^repetir\s+modo\s+teatro/i,
      /^outros\s+vídeos/i,
      /^outros\s+videos/i,
      /^fechar/i,
      /^cancelar ok$/i,
      /^criar$/i,
      /^acordes para/i,
      /^afinação/i,
      /^afinacao/i,
      /^dificuldade/i,
      /^exibições/i,
      /^exibicoes/i,
      /^contribuições/i,
      /^contribuicoes/i,
      /^cifra club pro/i,
      /^entre para o cifra club/i,
      /^blog do cifra club/i,
      /^cifra club:?\s+esta cifra/i,
      /^esta cifra foi revisada/i,
      /^atender aos critérios/i,
      /^atender aos criterios/i,
      /^equipe de qualidade/i,
      /^selo cifra club/i,
      /^cifra:\s*principal/i,
      /^cifra:\s*simplificada/i,
      /^tom:\s*/i,
      /^ver mais/i,
      /^veja mais/i,
      /^todos os artistas/i,
      /^aplicativos/i,
      /^siga-nos/i,
      /^termos de uso/i,
      /^política de privacidade/i,
      /^politica de privacidade/i,
      /^esta informação está errada/i,
      /^esta informacao esta errada/i,
      /^colaboração/i,
      /^colaboracao/i,
      /^composição de/i,
      /^composicao de/i,
      /^listas?aprenda/i,
      /^enviar\s+cifra/i,
      /^p\s*[áa]\s*g\s*i\s*n\s*a\s+i\s*n\s*i\s*c\s*i\s*a\s*l/i,
      /^g\s*o\s*s\s*p\s*e\s*l\s*\/\s*r\s*e\s*l\s*i\s*g\s*i\s*o\s*s\s*o/i,
      /^frei\s+gilson\s*%/i,
      /^%+$/i,
      /^\d+(\.\d+)?\s+em\s+\d+\s+votos/i,
      /^½\s*tom/i,
      /^tom\s*½/i,
      /^curta\s+mais\s+m[uú]sicas/i,
      /^assine(\s+e\s+libere)?/i,
      /^benef[ií]cios/i,
      /^explorar\s*m[uú]sicas/i,
      /^explorem[uú]sicas/i,
      /^artistas$/i,
      /^[áa]lbuns$/i,
      /^playlists$/i,
      /^atualiza[cç][oõ]es$/i,
      /^lan[cç]amentos$/i,
      /^participe$/i,
      /^envie letras?$/i,
      /^corre[cç][oõ]es de letras$/i,
      /^sobre o letras$/i,
      /^prote[cç][aã]o de dados$/i,
      /^[a-z#]$/i
    ];

    const lines = decoded
      .split('\n')
      .map(line => line.trimEnd())
      .filter(line => {
        const compact = line.trim();
        if (!compact) return true;
        return !noisePatterns.some(pattern => pattern.test(compact));
      });

    return lines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+|\n+$/g, '');
  };

  const cleanupImportedChords = (rawText: string) => {
    const base = cleanupImportedLyrics(rawText);
    const lines = base.split('\n');

    const nextNonEmptyIndex = (from: number) => {
      for (let i = from; i < lines.length; i++) {
        if (lines[i].trim()) return i;
      }
      return -1;
    };

    let startIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const current = lines[i];
      if (!current.trim()) continue;

      const nextIndex = nextNonEmptyIndex(i + 1);
      const nextLine = nextIndex >= 0 ? lines[nextIndex] : '';

      // Em uma cifra bem extraída, geralmente aparece: linha de acordes + linha da letra.
      // Cortamos tudo que vem antes disso: menus, título duplicado, artista, aviso do Cifra Club etc.
      if (isChordLine(current) && nextLine.trim() && !isChordLine(nextLine)) {
        startIndex = i;
        break;
      }
    }

    const endPatterns = [
      /^repetir\s+modo\s+teatro/i,
      /^outros\s+vídeos/i,
      /^outros\s+videos/i,
      /^mais\s+cifras/i,
      /^mais\s+músicas/i,
      /^mais\s+musicas/i,
      /^vídeos\s+de/i,
      /^videos\s+de/i,
      /^comentários/i,
      /^comentarios/i,
      /^aprenda\s+a\s+tocar/i
    ];

    let endIndex = lines.length;
    for (let i = startIndex; i < lines.length; i++) {
      const compact = lines[i].trim();
      if (compact && endPatterns.some(pattern => pattern.test(compact))) {
        endIndex = i;
        break;
      }
    }

    return lines
      .slice(startIndex, endIndex)
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+|\n+$/g, '');
  };

  const elementToReadableText = (element: Element) => {
    const clone = element.cloneNode(true) as HTMLElement;

    clone.querySelectorAll('script, style, noscript, svg, iframe, form, button, header, footer, nav, aside').forEach(el => el.remove());
    clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    clone.querySelectorAll('p, div, pre, li, h1, h2, h3, h4, section').forEach(el => el.append('\n'));

    return cleanupImportedLyrics(clone.textContent || '');
  };

  const scoreLyricsCandidate = (text: string) => {
    const clean = cleanupImportedLyrics(text);
    if (!clean || isDefinitelyNavigationText(clean)) return 0;

    const usefulLines = clean.split('\n').map(line => line.trim()).filter(Boolean);
    if (clean.length < 90 || usefulLines.length < 4) return 0;
    if (clean.length > 18000) return 0;

    const chordLikeLines = usefulLines.filter(line => isChordLine(line)).length;
    const lyricLikeLines = usefulLines.filter(line => {
      if (isChordLine(line)) return false;
      if (/^[A-Z#]$/i.test(line)) return false;
      return /[a-záàâãéêíóôõúç]{2,}/i.test(line);
    }).length;

    if (lyricLikeLines < 4) return 0;

    const navIndicators = usefulLines.filter(line => /^(assine|artistas|álbuns|albuns|playlists|lançamentos|lancamentos|participe|envie|correções|correcoes|proteção|protecao|sobre o letras)$/i.test(line)).length;
    if (navIndicators >= 4) return 0;

    const noisePenalty = /(blog|comentários|comentarios|privacidade|cookie|assinatura|aplicativo|login|cadastro|premium|pro|curta mais músicas|curta mais musicas|exploremúsicas|explorar músicas)/i.test(clean) ? 6000 : 0;

    return Math.min(clean.length, 6000) + lyricLikeLines * 80 + chordLikeLines * 20 - noisePenalty;
  };

  const extractJsonEmbeddedLyrics = (html: string) => {
    const patterns = [
      /"lyrics"\s*:\s*"([\s\S]{120,}?)"\s*[,}]/i,
      /"lyric"\s*:\s*"([\s\S]{120,}?)"\s*[,}]/i,
      /"text"\s*:\s*"([\s\S]{120,}?)"\s*[,}]/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        try {
          const parsed = JSON.parse(`"${match[1]}"`);
          const clean = cleanupImportedLyrics(parsed);
          if (scoreLyricsCandidate(clean) > 0) return clean;
        } catch {
          const clean = cleanupImportedLyrics(match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'));
          if (scoreLyricsCandidate(clean) > 0) return clean;
        }
      }
    }

    return '';
  };

  const extractLyricsFromHtmlPage = (html: string) => {
    const jsonLyrics = extractJsonEmbeddedLyrics(html);
    if (jsonLyrics) return jsonLyrics;

    if (typeof window === 'undefined') return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('script, style, noscript, svg, iframe, form, button').forEach(el => el.remove());

    const selectors = [
      '.cnt-letra',
      '[class*="cnt-letra"]',
      '[class*="cnt_traducao"]',
      '[class*="letra-cnt"]',
      '[class*="lyrics"]',
      '[id*="lyrics"]',
      '[class*="lyric"]',
      '[id*="lyric"]',
      '[class*="song-text"]',
      '[class*="songtext"]',
      '[class*="song-lyrics"]',
      '[class*="musica-letra"]',
      'article',
      'main'
    ];

    const candidates: string[] = [];

    selectors.forEach(selector => {
      doc.querySelectorAll(selector).forEach(element => {
        const candidate = elementToReadableText(element);
        if (candidate) candidates.push(candidate);
      });
    });

    // Não usamos o body inteiro como candidato: em sites de letras ele pode trazer menu,
    // alfabeto de artistas e chamadas de assinatura no lugar da letra.

    const ranked = candidates
      .map(text => ({ text: cleanupImportedLyrics(text), score: scoreLyricsCandidate(text) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (!ranked.length) return '';

    let best = ranked[0].text;

    const endMarkers = [
      /\n\s*Composição de[\s\S]*$/i,
      /\n\s*Composicao de[\s\S]*$/i,
      /\n\s*Colaboração[\s\S]*$/i,
      /\n\s*Colaboracao[\s\S]*$/i,
      /\n\s*Outros vídeos[\s\S]*$/i,
      /\n\s*Outros videos[\s\S]*$/i,
      /\n\s*Mais acessadas[\s\S]*$/i,
      /\n\s*Comentários[\s\S]*$/i,
      /\n\s*Comentarios[\s\S]*$/i,
      /\n\s*Veja também[\s\S]*$/i,
      /\n\s*Veja tambem[\s\S]*$/i
    ];

    endMarkers.forEach(marker => {
      best = best.replace(marker, '');
    });

    if (best.length > 9000) {
      best = best.slice(0, 9000).trim();
    }

    return cleanupImportedLyrics(best);
  };

  const tryImportFromPageUrl = async (targetUrl: string) => {
    const urls = Array.from(new Set(makeProxiedUrls(targetUrl)));
    return await tryTextUrlList(urls, async (html) => {
      const lyrics = extractLyricsFromHtmlPage(html);
      return lyrics && scoreLyricsCandidate(lyrics) > 0 ? lyrics : '';
    });
  };

  const extractFirstMusicLinkFromSearchHtml = (html: string, baseUrl: string, site: 'letras' | 'missa') => {
    const links = Array.from(html.matchAll(/href=["']([^"']+)["']/gi))
      .map(match => match[1])
      .map(href => {
        try {
          return new URL(href, baseUrl).href;
        } catch {
          return '';
        }
      })
      .filter(Boolean);

    const uniqueLinks = Array.from(new Set(links));

    if (site === 'missa') {
      return uniqueLinks.find(link => /^https:\/\/musicasparamissa\.com\.br\/musica\/[a-z0-9-]+\/?/i.test(link)) || '';
    }

    return uniqueLinks.find(link => {
      try {
        const url = new URL(link);
        if (!/letras\.mus\.br$/i.test(url.hostname.replace(/^www\./, ''))) return false;
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length < 2) return false;
        const blocked = ['blog', 'playlist', 'playlists', 'mais-acessadas', 'estilos', 'traducao', 'ranking', 'top', 'artistas'];
        return !blocked.some(item => parts.includes(item));
      } catch {
        return false;
      }
    }) || '';
  };

  const trySearchSiteAndImport = async (searchUrl: string, site: 'letras' | 'missa') => {
    const urls = Array.from(new Set(makeProxiedUrls(searchUrl)));
    return await tryTextUrlList(urls, async (html) => {
      const foundLink = extractFirstMusicLinkFromSearchHtml(html, searchUrl, site);
      if (!foundLink) return '';
      return await tryImportFromPageUrl(foundLink);
    });
  };

  const tryKnownWebLyrics = async (cleanArtist: string, cleanSong: string) => {
    const artistSlug = slugifyMusicUrl(cleanArtist);
    const songSlug = slugifyMusicUrl(cleanSong);
    const query = `${cleanArtist} ${cleanSong}`.trim() || cleanSong.trim();

    const directUrls = Array.from(new Set([
      artistSlug && songSlug ? `https://www.letras.mus.br/${artistSlug}/${songSlug}/` : '',
      artistSlug && songSlug ? `https://www.cifraclub.com.br/${artistSlug}/${songSlug}/letra/` : '',
      artistSlug && songSlug ? `https://www.cifraclub.com.br/${artistSlug}/${songSlug}/` : '',
      songSlug ? `https://musicasparamissa.com.br/musica/${songSlug}/` : ''
    ].filter(Boolean)));

    for (const url of directUrls) {
      const lyrics = await tryImportFromPageUrl(url);
      if (lyrics) return lyrics;
    }

    if (query) {
      const siteSearches: { url: string; site: 'letras' | 'missa' }[] = [
        { url: `https://www.letras.mus.br/?q=${encodeURIComponent(query)}`, site: 'letras' },
        { url: `https://www.letras.mus.br/?q=${encodeURIComponent(cleanSong || query)}`, site: 'letras' },
        { url: `https://musicasparamissa.com.br/?s=${encodeURIComponent(query)}`, site: 'missa' },
        { url: `https://musicasparamissa.com.br/?s=${encodeURIComponent(cleanSong || query)}`, site: 'missa' }
      ];

      for (const search of siteSearches) {
        const lyrics = await trySearchSiteAndImport(search.url, search.site);
        if (lyrics) return lyrics;
      }
    }

    return '';
  };

  const tryImportLyricsFromServer = async (cleanArtist: string, cleanSong: string) => {
    const query = `${cleanArtist} ${cleanSong}`.trim() || cleanSong.trim();
    if (!query) return "";

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch('/api/import-letra', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist: cleanArtist, song: cleanSong, query })
      });

      if (!response.ok) return "";

      const data = await response.json();
      const imported = typeof data?.content === 'string' ? cleanupImportedLyrics(data.content) : "";
      return imported && scoreLyricsCandidate(imported) > 0 ? imported : "";
    } catch (error) {
      console.warn('Falha ao importar letra pela API interna:', error);
      return "";
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const tryImportChordsFromServer = async (cleanArtist: string, cleanSong: string) => {
    const query = `${cleanArtist} ${cleanSong}`.trim() || cleanSong.trim();
    if (!query) return "";

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 14000);

    try {
      const response = await fetch('/api/import-cifra', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist: cleanArtist, song: cleanSong, query })
      });

      if (!response.ok) return "";

      const data = await response.json();
      const imported = typeof data?.content === 'string' ? cleanupImportedChords(data.content) : "";
      return imported && scoreLyricsCandidate(imported) > 0 ? imported : "";
    } catch (error) {
      console.warn('Falha ao importar cifra pela API interna:', error);
      return "";
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const tryKnownWebChords = async (cleanArtist: string, cleanSong: string) => {
    const artistSlug = slugifyMusicUrl(cleanArtist);
    const songSlug = slugifyMusicUrl(cleanSong);
    const query = `${cleanArtist} ${cleanSong}`.trim() || cleanSong.trim();

    const directUrls = Array.from(new Set([
      artistSlug && songSlug ? `https://www.cifraclub.com.br/${artistSlug}/${songSlug}/` : '',
      artistSlug && songSlug ? `https://www.cifraclub.com.br/${artistSlug}/${songSlug}/simplificada.html` : '',
      songSlug ? `https://musicasparamissa.com.br/musica/${songSlug}/` : ''
    ].filter(Boolean)));

    for (const url of directUrls) {
      const content = await tryImportFromPageUrl(url);
      if (content) return cleanupImportedChords(content);
    }

    if (query) {
      const siteSearches: { url: string; site: 'missa' }[] = [
        { url: `https://musicasparamissa.com.br/?s=${encodeURIComponent(query)}`, site: 'missa' },
        { url: `https://musicasparamissa.com.br/?s=${encodeURIComponent(cleanSong || query)}`, site: 'missa' }
      ];

      for (const search of siteSearches) {
        const content = await trySearchSiteAndImport(search.url, search.site);
        if (content) return cleanupImportedChords(content);
      }
    }

    return '';
  };

  const handleManualLyricSearch = (source: 'google' | 'letras' | 'missa' | 'cifraclub' = 'google') => {
    const typedQuery = vagalumeQuery.trim();
    const currentTitle = vagalumeModalIndex !== null ? songs[vagalumeModalIndex]?.title?.trim() : "";
    const query = typedQuery || currentTitle;

    if (!query) {
      alert("Digite o nome da música antes de abrir a busca manual.");
      return;
    }

    const urls = {
      google: `https://www.google.com/search?q=${encodeURIComponent(`${query} letra cifra`)}`,
      letras: `https://www.google.com/search?q=${encodeURIComponent(`site:letras.mus.br ${query} letra`)}`,
      missa: `https://www.google.com/search?q=${encodeURIComponent(`site:musicasparamissa.com.br/musica ${query} letra cifra`)}`,
      cifraclub: `https://www.google.com/search?q=${encodeURIComponent(`site:cifraclub.com.br ${query} cifra`)}`
    };

    window.open(urls[source], '_blank');
  };

  const handleFetchLyrics = async (artist: string, song: string) => {
    if (vagalumeModalIndex === null || isVagalumeLoading) return;

    setIsVagalumeLoading(true);
    setLyricsImportNotice("");

    const { cleanArtist, cleanSong } = cleanSongInfo(artist, song);
    const fallbackTitle = cleanArtist ? `${cleanArtist} - ${cleanSong}` : cleanSong;

    try {
      let importedContent = "";

      if (musicImportMode === 'chords') {
        importedContent = await tryImportChordsFromServer(cleanArtist, cleanSong);

        if (!importedContent) {
          importedContent = await tryKnownWebChords(cleanArtist, cleanSong);
        }
      } else {
        importedContent = await tryImportLyricsFromServer(cleanArtist, cleanSong);

        // Fallback leve: se a API interna não retornar nada, ainda tentamos as APIs públicas diretas.
        // A parte pesada de páginas HTML agora fica na rota /api/import-letra, para evitar CORS e demora no navegador.
        if (!importedContent) {
          importedContent = await tryExactLyrics(cleanArtist, cleanSong);
        }

        if (!importedContent) {
          importedContent = await trySearchLyricsByQuery(cleanArtist, cleanSong);
        }
      }

      if (!importedContent) {
        fillSongTitleIfEmpty(vagalumeModalIndex, fallbackTitle);
        setLyricsImportNotice(
          musicImportMode === 'chords'
            ? `Não encontrei uma cifra liberada para importação automática nesta busca. Tentei Cifra Club e Músicas para Missa sem demorar demais. Preenchi o título como "${fallbackTitle}". Você pode abrir uma busca manual abaixo, copiar a cifra e colar no card.`
            : `Não encontrei uma letra liberada para importação automática nesta busca. Tentei a API interna de letras com Vagalume, Lyrics.ovh, Letras.mus e Músicas para Missa. Preenchi o título como "${fallbackTitle}". Você pode abrir uma busca manual abaixo, copiar a letra e colar no card.`
        );
        return;
      }

      appendLyricsToSong(vagalumeModalIndex, fallbackTitle, importedContent);
      closeLyricsModal();
    } catch (err) {
      console.error("Erro na importação:", err);
      fillSongTitleIfEmpty(vagalumeModalIndex, fallbackTitle);
      setLyricsImportNotice(
        musicImportMode === 'chords'
          ? `Não encontrei uma cifra liberada para importação automática nesta busca. Preenchi o título como "${fallbackTitle}". Você pode abrir uma busca manual abaixo, copiar a cifra e colar no card.`
          : `Não encontrei uma letra liberada para importação automática nesta busca. Preenchi o título como "${fallbackTitle}". Você pode abrir uma busca manual abaixo, copiar a letra e colar no card.`
      );
    } finally {
      setIsVagalumeLoading(false);
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

    finalText = finalText.split('\n').map(line => {
      if (isChordLine(line)) {
        return line.replace(/\*\*/g, ''); 
      }
      return line;
    }).join('\n');

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
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        <div className="absolute bottom-0 left-0 right-0 h-[80vh] bg-gradient-to-t from-purple-900/30 to-transparent"></div>
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

      {/* NAVEGAÇÃO GLOBAL (HEADER CLÁSSICO PARA O ADSENSE) */}
      {!prompterSong && (
        <nav className="max-w-3xl mx-auto bg-[#0f172a] border border-slate-800 rounded-xl px-6 py-4 mb-6 flex items-center justify-between shadow-lg">
          <a href="/" className="font-black text-xl tracking-tighter text-white hover:opacity-80 transition-opacity">
            PromptLab<span className="text-purple-500">.</span>
          </a>
          <div className="flex items-center gap-4 sm:gap-6 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
            <a href="/" className="hover:text-blue-400 text-white transition-colors">App / Início</a>
            <a href="/blog" className="hover:text-blue-400 transition-colors">Blog</a>
            <a href="/privacidade" className="hover:text-blue-400 transition-colors hidden sm:inline-block">Privacidade</a>
          </div>
        </nav>
      )}

      {/* CABEÇALHO PADRÃO */}
      {!prompterSong && (
        <header className="max-w-3xl mx-auto text-center pb-8">
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
                    <li className="flex items-start gap-3"><span className="text-lg">📝</span><div><strong className="text-blue-400">Adicionar Músicas:</strong> Insira o título e cole a cifra, ou busque a letra automática.</div></li>
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
                      
                      {/* TOOLBAR DESKTOP */}
                      <div className="hidden sm:flex flex-wrap items-center gap-2 mb-3 bg-[#0f172a] p-2 rounded-lg border border-slate-700/50">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleToggleCase(index)} className="h-8 px-3 bg-[#334155] hover:bg-[#475569] text-xs font-bold rounded-md text-white transition-colors" title="Alternar Maiúsculas/Minúsculas">Aa</button>
                          <button onClick={() => handleToggleBold(index)} className="h-8 px-3 bg-[#334155] hover:bg-[#475569] text-xs font-bold rounded-md text-white transition-colors" title="Selecionar texto e aplicar Negrito">B</button>
                        </div>
                        
                        <div className="w-px h-5 bg-slate-700 mx-1"></div>
                        
                        {/* BOTÕES DE IMPORTAÇÃO DESKTOP */}
                        <button onClick={() => openLyricsModal(index, 'lyrics')} className="h-8 px-3 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-md transition-colors flex items-center gap-1" title="Importar letra automaticamente da internet">
                          🔍 Letra
                        </button>
                        <button onClick={() => openLyricsModal(index, 'chords')} className="h-8 px-3 bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 border border-orange-500/30 text-xs font-bold rounded-md transition-colors flex items-center gap-1" title="Importar cifra automaticamente quando possível">
                          🎸 Cifra
                        </button>
                        
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

                      {/* TOOLBAR MOBILE: PARTE SUPERIOR */}
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

                      {/* TOOLBAR MOBILE: PARTE INFERIOR */}
                      <div className="flex sm:hidden items-center gap-2 mt-2 bg-[#0f172a] p-2 rounded-lg border border-slate-700/50 w-full overflow-x-auto custom-scroll">
                        <button onClick={() => handleToggleCase(index)} className="h-8 px-5 bg-[#334155] hover:bg-[#475569] text-xs font-bold rounded-md text-white transition-colors shrink-0" title="Alternar Maiúsculas/Minúsculas">Aa</button>
                        <button onClick={() => handleToggleBold(index)} className="h-8 px-5 bg-[#334155] hover:bg-[#475569] text-xs font-bold rounded-md text-white transition-colors shrink-0" title="Selecionar texto e aplicar Negrito">B</button>
                        
                        <div className="w-px h-5 bg-slate-700 mx-1 shrink-0"></div>
                        
                        {/* BOTÕES DE IMPORTAÇÃO MOBILE */}
                        <button onClick={() => openLyricsModal(index, 'lyrics')} className="h-8 px-4 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-md transition-colors flex items-center gap-2 shrink-0">
                          🔍 Importar Letra
                        </button>
                        <button onClick={() => openLyricsModal(index, 'chords')} className="h-8 px-4 bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 border border-orange-500/30 text-xs font-bold rounded-md transition-colors flex items-center gap-2 shrink-0">
                          🎸 Importar Cifra
                        </button>
                      </div>

                    </div>
                    
                    <div className="flex justify-center my-2 opacity-60 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => insertSongAfter(index)}
                        className="bg-[#0f172a] text-slate-400 hover:text-blue-400 text-xs font-bold py-1 px-4 rounded-full border border-dashed border-slate-600 hover:border-blue-500 transition-all flex items-center gap-2 shadow-sm"
                        title="Adicionar uma nova música neste espaço"
                      >
                        ➕ Inserir Abaixo
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={addSong} className="w-full p-4 rounded-xl border-2 border-dashed border-slate-600 text-slate-400 font-bold hover:border-blue-500 hover:text-blue-500 transition-colors mb-8 mt-4">➕ Adicionar Nova Música no Final</button>
              
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <button 
                  onClick={handleGenerateShareLink}
                  disabled={isShareLoading}
                  className="btn bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black shadow-[0_4px_15px_rgba(147,51,234,0.3)] disabled:opacity-50"
                >
                  {isShareLoading ? "⏳ Otimizando Arquivo..." : "🔗 Criar Link de Acesso (WhatsApp)"}
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 !mt-2">
                  <button onClick={() => processPDF('download')} className="btn btn-green !mb-0">📄 Gerar PDF</button>
                  <button onClick={() => processPDF('share')} className="btn btn-blue">📱 Enviar PDF via WhatsApp</button>
                </div>
              </div>
            </section>
          )}

          {/* ================= ABA 2: BIBLIOTECA ================= */}
          {activeTab === 'library' && (
            <section className="panel border-l-4 border-blue-500 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-800 pb-4 gap-4">
                <div>
                  <h2 className="text-xl font-black flex items-center gap-2 mb-1">📂 Meus Repertórios Salvos</h2>
                  <p className="text-slate-400 text-sm">Suas listas ficam armazenadas no seu aparelho.</p>
                </div>
                <div>
                  <input type="file" id="import-file" style={{ display: 'none' }} accept=".promptlab" onChange={handleImport} />
                  <button onClick={() => document.getElementById('import-file')?.click()} className="btn-icon !w-auto px-4 !bg-emerald-600 hover:!bg-emerald-500 text-xs font-bold uppercase shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    📥 Importar
                  </button>
                </div>
              </div>

              {savedRepertoires.length > 0 && (
                <div className="mb-6">
                  <input 
                    type="text" 
                    value={librarySearchQuery} 
                    onChange={(e) => setLibrarySearchQuery(e.target.value)} 
                    placeholder="🔍 Pesquisar repertório salvo..." 
                    className="!bg-[#1e293b] !border-slate-700 !mb-0 shadow-inner" 
                  />
                </div>
              )}

              {savedRepertoires.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
                  <div className="text-4xl mb-4 opacity-50">📁</div>
                  <h3 className="text-lg font-bold text-slate-300 mb-2">Sua biblioteca está vazia</h3>
                  <button onClick={() => setActiveTab('setlist')} className="mt-6 text-blue-400 font-bold hover:underline">Criar meu primeiro repertório &rarr;</button>
                </div>
              ) : filteredRepertoires.length === 0 ? (
                <div className="text-center py-10 border border-slate-800 rounded-xl bg-[#0f172a]">
                  <p className="text-slate-400">Nenhum repertório encontrado com <strong className="text-white">"{librarySearchQuery}"</strong></p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredRepertoires.map((rep) => (
                    <div key={rep.id} className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 hover:border-blue-500 transition-colors overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2 gap-3">
                          <h3 className="font-bold text-white text-lg truncate flex-1">{rep.name}</h3>
                          <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded shrink-0 whitespace-nowrap">{rep.date}</span>
                        </div>
                        <p className="text-slate-400 text-xs mb-4 truncate">Músicas: {rep.songs.length}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button onClick={() => loadFromLibrary(rep)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-3 rounded-lg transition-colors truncate">Carregar</button>
                        <button onClick={() => exportRepertoire(rep)} className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg shrink-0" title="Baixar arquivo para enviar no WhatsApp">📤</button>
                        <button onClick={() => deleteFromLibrary(rep.id)} className="bg-slate-700 hover:bg-red-500 text-white p-2 rounded-lg shrink-0" title="Excluir repertório">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ================= ABA 3: CAPOTRASTE ================= */}
          {activeTab === 'capo' && (
            <section className="panel border-l-4 border-purple-500">
               <div className="mb-6 border-b border-slate-800 pb-4">
                <h2 className="text-xl font-black flex items-center gap-2 mb-2">🎸 Calculadora Capo</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-700">
                  <label className="text-blue-400">1. Tom da Música (Cantor)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {notesArray.map(n => <button key={`o-${n}`} onClick={() => setOriginalTone(n)} className={`note-btn ${originalTone === n ? 'active' : ''}`}>{n}</button>)}
                  </div>
                </div>
                <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-700">
                  <label className="text-purple-400">2. Acordes que farei (Shape)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {notesArray.map(n => <button key={`s-${n}`} onClick={() => setShapeTone(n)} className={`note-btn ${shapeTone === n ? 'active' : ''}`}>{n}</button>)}
                  </div>
                </div>
              </div>
              <div className={`p-8 rounded-xl text-center border-2 transition-all ${capoResult === 0 ? 'bg-slate-800/50 border-slate-700' : 'bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-purple-500'}`}>
                <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">Resultado</h3>
                {capoResult === 0 ? <div className="text-3xl font-black text-slate-300">Sem Capotraste</div> : 
                  <div className="text-4xl md:text-5xl font-black text-white mb-2">Capo na <span className="text-purple-400">{capoResult}ª</span> Casa</div>}
              </div>
            </section>
          )}

          {/* ================= ABA 4: PESQUISAR ================= */}
          {activeTab === 'search' && (
            <section className="panel border-l-4 border-yellow-500">
               <div className="mb-6 border-b border-slate-800 pb-4">
                <h2 className="text-xl font-black flex items-center gap-2 mb-2">🔍 Encontrar Letras e Cifras</h2>
              </div>
              <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 mb-8">
                <label className="text-yellow-400 text-sm mb-2">Qual música você está procurando?</label>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch('google')} placeholder="Ex: Te Louvarei Diante do Trono" className="!mb-4 text-lg py-3 px-4" autoFocus />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button onClick={() => handleSearch('cifraclub')} className="bg-[#ff6600]/20 text-[#ff8833] border border-[#ff6600]/50 py-3 rounded-lg font-bold">🎸 Cifra Club</button>
                  <button onClick={() => handleSearch('letras')} className="bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]/50 py-3 rounded-lg font-bold">🎵 Letras.mus</button>
                  <button onClick={() => handleSearch('missa')} className="bg-purple-600/20 text-purple-400 border border-purple-600/50 py-3 rounded-lg font-bold">⛪ Missa</button>
                  <button onClick={() => handleSearch('google')} className="bg-blue-600/20 text-blue-400 border border-blue-600/50 py-3 rounded-lg font-bold">🌐 Google</button>
                </div>
              </div>
            </section>
          )}
        </main>
      )}

      {/* ================= TEXTO DE SEO ================= */}
      {!prompterSong && (
        <section className="max-w-3xl mx-auto mt-16 p-8 bg-[#0f172a] border border-slate-800 rounded-xl text-slate-400 text-sm leading-relaxed shadow-lg">
          <h2 className="text-2xl font-black text-white mb-4">Gerador de Repertório Musical e Cifras em PDF</h2>
          <p className="mb-6">O <strong>PromptLab Brasil</strong> é a ferramenta definitiva para músicos, ministérios de louvor, corais e bandas que precisam organizar setlists de forma rápida e totalmente profissional. Chega de sofrer com formatação bagunçada ou letras que não cabem na tela na hora do show. Aqui, você cola as suas cifras, altera o tom com a nossa ferramenta de transposição automática e gera um PDF limpo, pronto para impressão ou leitura em tablets e celulares, sem poluição visual.</p>
          
          <h3 className="text-lg font-bold text-white mb-2">Como transpor cifras e alterar o tom da música?</h3>
          <p className="mb-6">Mudar o tom de uma música nunca foi tão fácil. Basta colar o texto cifrado no nosso construtor de cards e usar os botões de <strong>+½ Tom</strong> ou <strong>-½ Tom</strong>. O nosso sistema inteligente, desenvolvido para atender a necessidade real dos músicos, reconhece apenas os acordes musicais, mantendo a letra da música intacta. É o recurso ideal para ajustar a música à extensão vocal do cantor na hora do ensaio.</p>
          
          <h3 className="text-lg font-bold text-white mb-2">Calculadora de Capotraste Online</h3>
          <p className="mb-6">Tem dificuldades com pestanas ou acordes complexos? A nossa <strong>Calculadora de Capotraste</strong> ajuda violonistas e guitarristas a encontrarem a casa exata para colocar o acessório no braço do instrumento. Você seleciona o tom original da gravação e o "shape" (formato de acordes fáceis) que acha melhor tocar. O sistema revela instantaneamente a posição correta, facilitando o seu play.</p>

          <h3 className="text-lg font-bold text-white mb-2">Crie Setlists e Compartilhe com a Banda</h3>
          <p>Além de gerar arquivos PDF em alta qualidade e formatados em colunas automáticas, a plataforma permite a reordenação rápida das faixas com o simples clique de um botão. Adicione músicas, ajuste o cabeçalho com o nome do evento e clique em gerar. Você pode fazer o download do documento ou compartilhar o arquivo .promptlab no WhatsApp dos integrantes do seu ministério ou banda. Otimize seu tempo fora dos palcos e foque no que realmente importa: fazer música com excelência!</p>
        </section>
      )}

      {/* RODAPÉ */}
      {!prompterSong && (
        <footer className="max-w-3xl mx-auto text-center py-10 mt-8 border-t border-slate-800/50">
          <nav className="flex flex-wrap items-center justify-center gap-6 mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
            <a href="/blog" className="hover:text-white text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-md transition-colors">Blog do Músico</a>
            <a href="/privacidade" className="hover:text-blue-400">Política de Privacidade</a>
            <a href="/termos" className="hover:text-blue-400">Termos de Uso</a>
          </nav>
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} PromptLab Brasil. Todos os direitos reservados.</p>
        </footer>
      )}

      {/* ================= MODAL DE IMPORTAÇÃO DE LETRA/CIFRA ================= */}
      {vagalumeModalIndex !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <button onClick={closeLyricsModal} className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl font-bold">&times;</button>
            
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{musicImportMode === 'chords' ? '🎸' : '🔍'}</div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">{musicImportMode === 'chords' ? 'Buscar Cifra' : 'Buscar Letra'}</h3>
              <p className="text-slate-400 text-xs mt-1">Digite o nome da música e, se souber, o artista.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-900/60 border border-slate-700 rounded-lg p-1">
              <button
                onClick={() => { setMusicImportMode('lyrics'); setLyricsImportNotice(''); }}
                className={`py-2 rounded-md text-xs font-black uppercase transition-colors ${musicImportMode === 'lyrics' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                🔍 Letra
              </button>
              <button
                onClick={() => { setMusicImportMode('chords'); setLyricsImportNotice(''); }}
                className={`py-2 rounded-md text-xs font-black uppercase transition-colors ${musicImportMode === 'chords' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                🎸 Cifra
              </button>
            </div>

            <div className="mb-4 relative">
              <input 
                value={vagalumeQuery} 
                onChange={(e) => { setVagalumeQuery(e.target.value); setLyricsImportNotice(""); }} 
                placeholder="Ex: Te Louvarei Diante do Trono" 
                className="!mb-0 w-full py-3 text-lg"
                autoFocus
              />
            </div>

            {vagalumeQuery.trim().length > 2 && (
              <button
                onClick={() => handleFetchLyrics('', vagalumeQuery.trim())}
                disabled={isVagalumeLoading}
                className="w-full mb-3 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 text-xs font-bold rounded-lg py-3 px-4 transition-colors text-left disabled:opacity-60"
              >
                {musicImportMode === 'chords' ? '🎸 Buscar/importar cifra: ' : '🔎 Buscar/importar letra: '}<span className="text-white">{vagalumeQuery.trim()}</span>
              </button>
            )}

            {/* Lista de Resultados Sugeridos */}
            <div className="flex-1 overflow-y-auto custom-scroll min-h-[150px] max-h-[300px] mb-4 bg-[#1e293b] rounded-lg border border-slate-700">
              {isSearching ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm py-10">
                  ⏳ Buscando...
                </div>
              ) : vagalumeQuery.length > 2 && vagalumeResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm py-10 px-4 text-center">
                  <span>Nenhuma música encontrada.</span>
                  <span className="text-xs mt-2 opacity-70">Tente incluir o nome do cantor junto.</span>
                </div>
              ) : vagalumeResults.length > 0 ? (
                <div className="flex flex-col">
                  {vagalumeResults.map((item, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleFetchLyrics(item.artist, item.song)}
                      disabled={isVagalumeLoading}
                      className="flex items-center gap-4 p-3 hover:bg-slate-700/50 border-b border-slate-700/50 transition-colors text-left"
                    >
                      {item.thumb ? (
                        <img src={item.thumb} alt={item.song} className="w-10 h-10 rounded shadow-sm object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">🎵</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm truncate">{item.song}</div>
                        <div className="text-slate-400 text-xs truncate">{item.artist}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs py-10 px-4 text-center">
                  Comece a digitar para ver as sugestões de músicas...
                </div>
              )}
            </div>

            <div className="space-y-2 mt-auto">
              {lyricsImportNotice && (
                <div className="w-full bg-amber-500/10 text-amber-200 border border-amber-500/30 text-xs leading-relaxed py-3 px-4 rounded-lg">
                  {lyricsImportNotice}
                </div>
              )}

              {lyricsImportNotice && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleManualLyricSearch('google')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-3 px-3 rounded-lg transition-colors uppercase tracking-wider"
                  >
                    🌐 Google
                  </button>
                  <button
                    onClick={() => handleManualLyricSearch('letras')}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 px-3 rounded-lg transition-colors uppercase tracking-wider"
                  >
                    🎵 Letras.mus
                  </button>
                  <button
                    onClick={() => handleManualLyricSearch('missa')}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs py-3 px-3 rounded-lg transition-colors uppercase tracking-wider"
                  >
                    ⛪ Missa
                  </button>
                  <button
                    onClick={() => handleManualLyricSearch('cifraclub')}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black text-xs py-3 px-3 rounded-lg transition-colors uppercase tracking-wider"
                  >
                    🎸 Cifra
                  </button>
                </div>
              )}

              {isVagalumeLoading && (
                <div className="w-full bg-indigo-600/50 text-white font-black text-xs py-3 px-4 rounded-lg flex items-center justify-center gap-2 uppercase tracking-wider mb-2 animate-pulse">
                  {musicImportMode === 'chords' ? '⏳ Procurando cifra nas fontes liberadas...' : '⏳ Procurando letra nas fontes liberadas...'}
                </div>
              )}
              <button 
                onClick={closeLyricsModal}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 px-4 rounded-lg transition-colors uppercase"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TELA DO TELEPROMPTER ================= */}
      {prompterSong && (
        <div className="fixed inset-0 bg-[#020617] z-50 flex flex-col animate-in fade-in duration-300">
          
          <div className="bg-[#0f172a] border-b border-slate-800 p-4 flex flex-wrap gap-4 items-center justify-between shadow-2xl z-10">
            <div className="flex items-center gap-4">
              <button onClick={closePrompter} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
                &larr; Voltar
              </button>
              <h2 className="text-lg font-black text-white hidden sm:block truncate max-w-xs">{prompterSong.title || "Modo Palco"}</h2>
            </div>

            <div className="flex items-center gap-2 sm:gap-6">
              <div className="flex items-center bg-slate-800 rounded-lg p-1">
                <button onClick={() => setPrompterSpeed(Math.max(1, prompterSpeed - 1))} className="px-3 py-1 font-bold text-slate-300 hover:text-white">-</button>
                <span className="px-2 text-sm font-bold text-blue-400 whitespace-nowrap">Vel: {prompterSpeed}</span>
                <button onClick={() => setPrompterSpeed(Math.min(10, prompterSpeed + 1))} className="px-3 py-1 font-bold text-slate-300 hover:text-white">+</button>
              </div>

              <button 
                onClick={() => setIsPrompterPlaying(!isPrompterPlaying)}
                className={`font-black uppercase py-2 px-6 rounded-lg transition-colors border-2 ${
                  isPrompterPlaying 
                    ? 'bg-amber-500/20 text-amber-500 border-amber-500/50 hover:bg-amber-500/30' 
                    : 'bg-green-500/20 text-green-500 border-green-500/50 hover:bg-green-500/30'
                }`}
              >
                {isPrompterPlaying ? '⏸ Pausar' : '▶️ Tocar'}
              </button>
            </div>
          </div>

          <div 
            ref={prompterRef}
            className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll p-6 sm:p-12 pb-[60vh]"
            style={{ fontSize: 'min(3.8vw, 2.5rem)', lineHeight: '1.6' }} 
          >
            <div className="max-w-4xl mx-auto font-mono">
              <h1 className="text-5xl sm:text-7xl font-black mb-12 text-slate-500 border-b border-slate-800 pb-8">{prompterSong.title}</h1>
              
              {getPrompterLines(prompterSong.content).map((lineObj, idx) => {
                if (lineObj.type === 'empty') return <div key={idx} className="h-6 sm:h-8"></div>;
                
                let displayText = lineObj.text;
                let isBold = false;
                if (displayText.includes('**')) {
                  isBold = true;
                  displayText = displayText.replace(/\*\*/g, '');
                }

                if (lineObj.type === 'chord') {
                  return <div key={idx} className="prompter-line prompter-chord">{displayText}</div>;
                } else {
                  return <div key={idx} className={`prompter-line prompter-lyric ${isBold ? 'text-yellow-400 font-bold' : ''}`}>{displayText}</div>;
                }
              })}
            </div>
          </div>
          
          <div className="h-24 bg-gradient-to-t from-[#020617] to-transparent absolute bottom-0 left-0 right-0 pointer-events-none"></div>
        </div>
      )}

      {/* ================= MODAL DO LINK MÁGICO ================= */}
       {shareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShareModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl font-bold">&times;</button>
            
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🔗</div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Link de Compartilhamento</h3>
              <p className="text-slate-400 text-xs mt-1">Sua banda pode abrir esse repertório instantaneamente clicando nele!</p>
            </div>

            <div className="bg-[#0f172a] border border-slate-700 rounded-lg p-3 mb-6 flex items-center justify-between gap-2 overflow-hidden">
              <span className="text-sm text-blue-400 font-mono truncate select-all flex-1">{shareModal}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(shareModal);
                  alert("📋 Link copiado com sucesso!");
                }} 
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2 px-3 rounded-md shrink-0 transition-colors"
              >
                Copiar
              </button>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => {
                  const msg = encodeURIComponent(`🎵 Fala, pessoal! Montei o nosso repertório digital no PromptLab Brasil. Clica no link para abrir a lista completa com as cifras no tom certo: ${shareModal}`);
                  window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
                }}
                className="w-full bg-[#25d366] hover:bg-[#20ba5a] text-white font-black text-xs py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors uppercase tracking-wider shadow-[0_4px_12px_rgba(37,211,102,0.2)]"
              >
                🟢 Enviar para o WhatsApp
              </button>
              <button 
                onClick={() => setShareModal(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2 px-4 rounded-lg transition-colors uppercase"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
