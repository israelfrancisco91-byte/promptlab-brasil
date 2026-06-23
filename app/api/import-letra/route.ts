import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type ImportLyricsRequest = {
  artist?: string
  song?: string
  query?: string
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const VAGALUME_API_KEY = '660a4395f992ff67786584e238f501aa'

const decodeHtmlEntities = (value: string) => {
  const named: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    aacute: 'á', agrave: 'à', acirc: 'â', atilde: 'ã', ccedil: 'ç',
    eacute: 'é', ecirc: 'ê', iacute: 'í', oacute: 'ó', ocirc: 'ô', otilde: 'õ',
    uacute: 'ú', Aacute: 'Á', Agrave: 'À', Acirc: 'Â', Atilde: 'Ã', Ccedil: 'Ç',
    Eacute: 'É', Ecirc: 'Ê', Iacute: 'Í', Oacute: 'Ó', Ocirc: 'Ô', Otilde: 'Õ', Uacute: 'Ú'
  }

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, entity: string) => {
    if (entity[0] === '#') {
      const isHex = entity[1]?.toLowerCase() === 'x'
      const code = parseInt(isHex ? entity.slice(2) : entity.slice(1), isHex ? 16 : 10)
      return Number.isFinite(code) ? String.fromCharCode(code) : ' '
    }
    return named[entity] ?? ' '
  })
}

const slugify = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const normalizeInput = (artist: string, song: string, query: string) => {
  let cleanArtist = artist.replace(/\s+/g, ' ').trim()
  let cleanSong = song.replace(/\s+/g, ' ').trim()
  const cleanQuery = query.replace(/\s+/g, ' ').trim()

  if ((!cleanArtist || !cleanSong) && /\s+-\s+/.test(cleanQuery)) {
    const parts = cleanQuery.split(/\s+-\s+/)
    cleanArtist = cleanArtist || (parts[0] || '').trim()
    cleanSong = cleanSong || parts.slice(1).join(' - ').trim()
  }

  // Ajuda em buscas digitadas como: "Em Teu Altar de Walmir Alencar".
  // Só aplica quando a parte depois de "de/do/da" parece nome de artista (2+ palavras),
  // para não quebrar títulos como "Nada Além de Ti".
  if (!cleanArtist && !cleanSong && cleanQuery) {
    const byArtistMatch = cleanQuery.match(/^(.+?)\s+(?:de|do|da|dos|das)\s+([A-Za-zÀ-ÿ0-9'.&\s]{5,})$/i)
    if (byArtistMatch) {
      const possibleSong = byArtistMatch[1].trim()
      const possibleArtist = byArtistMatch[2].trim()
      if (possibleArtist.split(/\s+/).length >= 2 && possibleSong.split(/\s+/).length >= 2) {
        cleanSong = possibleSong
        cleanArtist = possibleArtist
      }
    }
  }

  if (!cleanSong) cleanSong = cleanQuery

  cleanArtist = cleanArtist
    .split(/ feat\.? | ft\.? | participação | participacao | & |,/i)[0]
    .trim()

  cleanSong = cleanSong
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/\s+-\s+(ao vivo|live|playback|remaster(ed)?|versão acústica|versao acustica).*$/gi, '')
    .replace(/ ao vivo| live| playback| remaster(ed)?| versão acústica| versao acustica/gi, '')
    .trim()

  return {
    artist: cleanArtist,
    song: cleanSong,
    query: `${cleanArtist} ${cleanSong}`.trim() || cleanQuery || cleanSong
  }
}

const isChordLine = (line: string) => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.length > 90) return false

  const clean = trimmed
    .toUpperCase()
    .replace(/(INTRO|REFRÃO|REFRAO|CORO|PONTE|SOLO|VAMP|BIS|FIM|FINAL|[:||\-~xX*\d+])/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .trim()

  if (!clean) return true

  const words = clean.split(/\s+/)
  const strictChordRegex = /^[A-G][B#]?(M|MIN|MAJ|DIM|AUG|SUS|ADD|[\d]+)*(\/[A-G][B#]?)?$/
  const chordCount = words.filter(w => strictChordRegex.test(w)).length
  return words.length > 0 && chordCount / words.length >= 0.7
}



const isSiteUiOrControlText = (text: string) => {
  const compact = text.replace(/\s+/g, ' ').trim()
  if (!compact) return true

  const uiPhrases = [
    /Adicionar aos favoritos/i,
    /Tamanho do texto/i,
    /Rolagem autom[aá]tica/i,
    /Anota[cç][oõ]es\s+Ativadas\s+Desativadas/i,
    /Curta mais m[uú]sicas com op[cç][oõ]es exclusivas/i,
    /Assine e libere benef[ií]cios/i,
    /Explore\s*M[uú]sicas/i,
    /Prote[cç][aã]o de Dados/i,
    /Corre[cç][oõ]es de letras/i
  ]

  const hits = uiPhrases.filter(pattern => pattern.test(compact)).length
  if (hits >= 2) return true

  // Quando vem só o painel de controle do Cifra Club/Letras, normalmente é curto e sem versos.
  if (compact.length < 260 && /(Adicionar aos favoritos|Tamanho do texto|Rolagem autom[aá]tica|Anota[cç][oõ]es)/i.test(compact)) return true

  return false
}

const isDefinitelyNavigationText = (text: string) => {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  if (lines.length === 0) return true

  const compactText = lines.join(' ')
  if (/Curta\s+mais\s+m[uú]sicas\s+com\s+op[cç][oõ]es\s+exclusivas/i.test(compactText)) return true
  if (/Assine\s+e\s+libere\s+benef[ií]cios/i.test(compactText)) return true
  if (/Explore\s*M[uú]sicas/i.test(compactText)) return true
  if (/Prote[cç][aã]o\s+de\s+Dados/i.test(compactText) && /Corre[cç][oõ]es\s+de\s+letras/i.test(compactText)) return true
  if (isSiteUiOrControlText(compactText)) return true

  const singleAlphabetLines = lines.filter(line => /^[A-Z#]$/i.test(line)).length
  if (singleAlphabetLines >= 5) return true

  const navWords = [
    'artistas', 'álbuns', 'albuns', 'playlists', 'atualizações', 'atualizacoes',
    'lançamentos', 'lancamentos', 'participe', 'envie letra', 'envie letras',
    'correções de letras', 'correcoes de letras', 'sobre o letras', 'proteção de dados',
    'protecao de dados', 'blog', 'login', 'cadastro', 'assine'
  ]
  const navCount = lines.filter(line => navWords.some(word => line.toLowerCase() === word || line.toLowerCase().includes(word))).length
  if (navCount >= 5 && singleAlphabetLines >= 2) return true
  if (navCount >= 8) return true

  return false
}

const cleanupLyrics = (raw: string) => {
  const decoded = decodeHtmlEntities(raw)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    .replace(/[ \t]+\n/g, '\n')

  const noisePatterns = [
    /^letra$/i,
    /^cifra$/i,
    /^informações$/i,
    /^informacoes$/i,
    /^publicidade$/i,
    /^compartilhar$/i,
    /^imprimir$/i,
    /^corrigir letra$/i,
    /^corrigir$/i,
    /^adicionar aos favoritos$/i,
    /^tamanho do texto$/i,
    /^rolagem autom[aá]tica$/i,
    /^anota[cç][oõ]es(\s+ativadas\s+desativadas)?$/i,
    /^ativadas$/i,
    /^desativadas$/i,
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
    /^%+$/i,
    /^\d+(\.\d+)?\s+em\s+\d+\s+votos/i,
    /^½\s*tom/i,
    /^tom\s*½/i,
    /^músicas para missa/i,
    /^musicas para missa/i,
    /^salmo responsorial/i,
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
  ]

  let lines = decoded
    .split('\n')
    .map(line => line.trimEnd())
    .filter(line => {
      const compact = line.trim()
      if (!compact) return true
      if (noisePatterns.some(pattern => pattern.test(compact))) return false
      // No modo letra, linhas de acordes isoladas entram como sujeira.
      if (isChordLine(compact)) return false
      return true
    })

  const startNoise = /^(menu|buscar|entrar|cadastre-se|login|início|inicio|artistas|playlists)$/i
  while (lines.length && (!lines[0].trim() || startNoise.test(lines[0].trim()))) lines.shift()

  const text = lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '')

  if (isDefinitelyNavigationText(text) || isSiteUiOrControlText(text)) return ''

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
  ]

  const cleaned = endMarkers.reduce((acc, marker) => acc.replace(marker, ''), text).replace(/^\n+|\n+$/g, '')
  return (isDefinitelyNavigationText(cleaned) || isSiteUiOrControlText(cleaned)) ? '' : cleaned
}

const scoreLyrics = (text: string) => {
  const clean = cleanupLyrics(text)
  if (!clean || isDefinitelyNavigationText(clean) || isSiteUiOrControlText(clean)) return 0

  const usefulLines = clean.split('\n').map(line => line.trim()).filter(Boolean)
  if (clean.length < 90 || usefulLines.length < 4) return 0
  if (clean.length > 18000) return 0

  const letterLikeLines = usefulLines.filter(line => {
    if (isChordLine(line)) return false
    if (/^[A-Z#]$/i.test(line)) return false
    return /[a-záàâãéêíóôõúç]{2,}/i.test(line)
  })

  if (letterLikeLines.length < 4) return 0

  const navIndicators = usefulLines.filter(line => /^(assine|artistas|álbuns|albuns|playlists|lançamentos|lancamentos|participe|envie|correções|correcoes|proteção|protecao|sobre o letras)$/i.test(line)).length
  if (navIndicators >= 4) return 0

  const chordLines = usefulLines.filter(isChordLine).length
  const noisePenalty = /(blog|comentários|comentarios|privacidade|cookie|assinatura|aplicativo|login|cadastro|premium|pro|newsletter|curta mais músicas|curta mais musicas|exploremúsicas|explorar músicas)/i.test(clean) ? 6000 : 0
  return Math.min(clean.length, 7000) + letterLikeLines.length * 80 - chordLines * 250 - noisePenalty
}

const fetchText = async (url: string, timeoutMs = 4500) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json,text/plain,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.7'
      }
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

const fetchJson = async (url: string, timeoutMs = 4500) => {
  const text = await fetchText(url, timeoutMs)
  if (!text.trim()) throw new Error('Resposta vazia')
  return JSON.parse(text)
}

const extractFromLyricsApi = (data: any) => {
  if ((data?.type === 'exact' || data?.type === 'aprox') && Array.isArray(data?.mus)) {
    const lyrics = data.mus.find((item: any) => typeof item?.text === 'string' && item.text.trim())?.text
    if (lyrics) return cleanupLyrics(lyrics)
  }

  if (Array.isArray(data?.mus)) {
    const lyrics = data.mus.find((item: any) => typeof item?.text === 'string' && item.text.trim())?.text
    if (lyrics) return cleanupLyrics(lyrics)
  }

  if (typeof data?.lyrics === 'string' && data.lyrics.trim()) return cleanupLyrics(data.lyrics)
  if (typeof data?.text === 'string' && data.text.trim()) return cleanupLyrics(data.text)
  return ''
}

const extractCandidatesFromVagalumeSearch = (data: any) => {
  const docs = data?.response?.docs || data?.docs || data?.results || data?.mus || []
  if (!Array.isArray(docs)) return []

  return docs
    .map((item: any) => ({
      artist: String(item?.band || item?.artist || item?.art || item?.band_name || item?.name || '').trim(),
      song: String(item?.title || item?.song || item?.mus || item?.music || item?.name || '').trim(),
      lyrics: String(item?.lyrics || item?.text || item?.content || '').trim()
    }))
    .filter((item: any) => item.song || item.artist || item.lyrics)
}

const tryExactApis = async (artist: string, song: string) => {
  const urls = [
    artist && song ? `https://api.vagalume.com.br/search.php?art=${encodeURIComponent(artist)}&mus=${encodeURIComponent(song)}&apikey=${VAGALUME_API_KEY}` : '',
    artist && song ? `https://api.vagalume.com.br/search.php?art=${encodeURIComponent(artist)}&mus=${encodeURIComponent(song)}` : '',
    artist && song ? `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}` : ''
  ].filter(Boolean)

  const settled = await Promise.allSettled(urls.map(async url => extractFromLyricsApi(await fetchJson(url))))
  return settled
    .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
    .map(result => result.value)
    .filter(text => scoreLyrics(text) > 0)
    .sort((a, b) => scoreLyrics(b) - scoreLyrics(a))[0] || ''
}

const tryVagalumeSearch = async (artist: string, song: string, query: string) => {
  const queries = Array.from(new Set([query, `${artist} ${song}`.trim(), song].filter(Boolean))).slice(0, 3)

  for (const q of queries) {
    const urls = [
      `https://api.vagalume.com.br/search.excerpt.php?q=${encodeURIComponent(q)}&limit=5&apikey=${VAGALUME_API_KEY}`,
      `https://api.vagalume.com.br/search.excerpt.php?q=${encodeURIComponent(q)}&limit=5`
    ]

    for (const url of urls) {
      try {
        const data = await fetchJson(url, 4000)
        const direct = extractFromLyricsApi(data)
        if (scoreLyrics(direct) > 0) return direct

        const candidates = extractCandidatesFromVagalumeSearch(data)
        for (const candidate of candidates.slice(0, 4)) {
          if (candidate.lyrics && scoreLyrics(candidate.lyrics) > 0) return cleanupLyrics(candidate.lyrics)
          const exact = await tryExactApis(candidate.artist || artist, candidate.song || song)
          if (exact) return exact
        }
      } catch {}
    }
  }

  return ''
}

const stripHtmlToText = (html: string) => {
  return cleanupLyrics(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|section|article|h[1-6]|pre)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
}

const extractJsonEmbeddedLyrics = (html: string) => {
  const patterns = [
    /"lyrics"\s*:\s*"([\s\S]{120,}?)"\s*[,}]/i,
    /"lyric"\s*:\s*"([\s\S]{120,}?)"\s*[,}]/i,
    /"text"\s*:\s*"([\s\S]{120,}?)"\s*[,}]/i,
    /"letra"\s*:\s*"([\s\S]{120,}?)"\s*[,}]/i
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (!match?.[1]) continue

    try {
      const parsed = JSON.parse(`"${match[1]}"`)
      const clean = cleanupLyrics(parsed)
      if (scoreLyrics(clean) > 0) return clean
    } catch {
      const clean = cleanupLyrics(match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'))
      if (scoreLyrics(clean) > 0) return clean
    }
  }

  return ''
}

const extractLyricsFromHtml = (html: string) => {
  const candidates: { text: string; score: number; source: string }[] = []

  const addCandidate = (text: string, source: string, bonus = 0) => {
    const clean = cleanupLyrics(text)
    const score = scoreLyrics(clean) + bonus
    if (clean && score > 0) candidates.push({ text: clean, score, source })
  }

  const jsonLyrics = extractJsonEmbeddedLyrics(html)
  if (jsonLyrics) addCandidate(jsonLyrics, 'json', 10000)

  // Importante: não usar classes genéricas como "content", porque elas podem trazer menu inteiro do site.
  const targetedBlocks = Array.from(html.matchAll(/<([a-z0-9]+)[^>]*(class|id)=["'][^"']*(cnt-letra|cnt_traducao|letra-cnt|lyrics?|lyric|song-lyrics?|songtext|song-text|letra__content|musica-letra)[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi))
    .map(match => stripHtmlToText(match[4]))
  targetedBlocks.forEach(text => addCandidate(text, 'targeted', 9000))

  const articleBlocks = Array.from(html.matchAll(/<(article|main)[^>]*>([\s\S]*?)<\/\1>/gi))
    .map(match => stripHtmlToText(match[2]))
  articleBlocks.forEach(text => addCandidate(text, 'article', 2500))

  const paragraphGroups = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map(match => stripHtmlToText(match[1]))
    .filter(Boolean)
  if (paragraphGroups.length >= 4) addCandidate(paragraphGroups.join('\n'), 'paragraphs', 1000)

  // Não usamos o <body> inteiro como candidato. Em sites como Letras.mus isso pode trazer
  // menus, alfabeto de artistas e chamadas de assinatura no lugar da letra.

  const best = candidates.sort((a, b) => b.score - a.score)[0]?.text || ''
  return cleanupLyrics(best.slice(0, 9000))
}

const findFirstLyricsLink = (html: string, baseUrl: string) => {
  const links = Array.from(html.matchAll(/href=["']([^"']+)["']/gi))
    .map(match => {
      try { return new URL(match[1], baseUrl).href } catch { return '' }
    })
    .filter(Boolean)

  const unique = Array.from(new Set(links))

  return unique.find(link => {
    try {
      const url = new URL(link)
      const host = url.hostname.replace(/^www\./, '')
      const parts = url.pathname.split('/').filter(Boolean)

      if (host === 'letras.mus.br') {
        if (parts.length < 2) return false
        const blocked = ['blog', 'playlist', 'playlists', 'mais-acessadas', 'estilos', 'traducao', 'ranking', 'top', 'artistas']
        return !blocked.some(part => parts.includes(part))
      }

      if (host === 'musicasparamissa.com.br') {
        return /^\/musica\//.test(url.pathname)
      }

      return false
    } catch {
      return false
    }
  }) || ''
}

const tryUrl = async (url: string) => {
  const html = await fetchText(url, 4500)
  const lyrics = extractLyricsFromHtml(html)
  if (scoreLyrics(lyrics) > 0) return lyrics
  return ''
}

const trySearchPage = async (searchUrl: string) => {
  const html = await fetchText(searchUrl, 4500)
  const foundLink = findFirstLyricsLink(html, searchUrl)
  if (!foundLink) return ''
  return await tryUrl(foundLink)
}

const pickBest = (contents: string[]) => {
  return contents
    .map(content => cleanupLyrics(content || ''))
    .filter(content => content && scoreLyrics(content) > 0)
    .sort((a, b) => scoreLyrics(b) - scoreLyrics(a))[0] || ''
}

const tryUrlsInParallel = async (urls: string[]) => {
  const unique = Array.from(new Set(urls.filter(Boolean))).slice(0, 6)
  const settled = await Promise.allSettled(unique.map(async url => await tryUrl(url)))
  return pickBest(settled
    .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
    .map(result => result.value))
}

const trySearchesInParallel = async (urls: string[]) => {
  const unique = Array.from(new Set(urls.filter(Boolean))).slice(0, 6)
  const settled = await Promise.allSettled(unique.map(async url => await trySearchPage(url)))
  return pickBest(settled
    .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
    .map(result => result.value))
}

const buildCandidates = (artist: string, song: string, query: string) => {
  const artistSlug = slugify(artist)
  const songSlug = slugify(song)
  const querySlug = slugify(query)

  const direct = [
    artistSlug && songSlug ? `https://www.letras.mus.br/${artistSlug}/${songSlug}/` : '',
    songSlug ? `https://musicasparamissa.com.br/musica/${songSlug}/` : '',
    querySlug ? `https://musicasparamissa.com.br/musica/${querySlug}/` : ''
  ].filter(Boolean)

  const searches = [
    query ? `https://www.letras.mus.br/?q=${encodeURIComponent(query)}` : '',
    song ? `https://www.letras.mus.br/?q=${encodeURIComponent(song)}` : '',
    query ? `https://musicasparamissa.com.br/?s=${encodeURIComponent(query)}` : '',
    song ? `https://musicasparamissa.com.br/?s=${encodeURIComponent(song)}` : ''
  ].filter(Boolean)

  return {
    direct: Array.from(new Set(direct)),
    searches: Array.from(new Set(searches))
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ImportLyricsRequest
    const normalized = normalizeInput(
      String(body.artist || ''),
      String(body.song || ''),
      String(body.query || '')
    )

    if (!normalized.query && !normalized.song) {
      return NextResponse.json({ ok: false, error: 'Informe o nome da música.' }, { status: 400 })
    }

    // 1) APIs de letra primeiro: são mais rápidas e mais limpas.
    const exactApiContent = await tryExactApis(normalized.artist, normalized.song)
    if (exactApiContent) {
      return NextResponse.json({ ok: true, source: 'lyrics-api-exact', content: exactApiContent })
    }

    // 2) Busca aproximada no Vagalume.
    const vagalumeSearchContent = await tryVagalumeSearch(normalized.artist, normalized.song, normalized.query)
    if (vagalumeSearchContent) {
      return NextResponse.json({ ok: true, source: 'vagalume-search', content: vagalumeSearchContent })
    }

    // 3) Páginas acessíveis de letras/músicas de missa.
    const candidates = buildCandidates(normalized.artist, normalized.song, normalized.query)

    const directPageContent = await tryUrlsInParallel(candidates.direct)
    if (directPageContent) {
      return NextResponse.json({ ok: true, source: 'direct-page', content: directPageContent })
    }

    const searchPageContent = await trySearchesInParallel(candidates.searches)
    if (searchPageContent) {
      return NextResponse.json({ ok: true, source: 'search-page', content: searchPageContent })
    }

    return NextResponse.json({ ok: false, error: 'Letra não encontrada automaticamente em fontes liberadas.' }, { status: 404 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Erro interno.' }, { status: 500 })
  }
}
