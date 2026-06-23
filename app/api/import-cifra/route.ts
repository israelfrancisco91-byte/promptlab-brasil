import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type ImportRequest = {
  artist?: string
  song?: string
  query?: string
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

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

const isChordLine = (line: string) => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.length > 120) return false

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

const cleanupContent = (raw: string) => {
  const decoded = decodeHtmlEntities(raw)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    .replace(/[ \t]+\n/g, '\n')

  const noisePatterns = [
    /^cifra club$/i,
    /^cifra club pro/i,
    /^entre para o cifra club/i,
    /^blog do cifra club/i,
    /^cifra club:?\s+esta cifra/i,
    /^esta cifra foi revisada/i,
    /^atender aos critérios/i,
    /^atender aos criterios/i,
    /^equipe de qualidade/i,
    /^selo cifra club/i,
    /^imprimir/i,
    /^corrigir/i,
    /^compartilhar/i,
    /^favoritar/i,
    /^tom:?/i,
    /^capotraste/i,
    /^afinação/i,
    /^afinacao/i,
    /^dificuldade/i,
    /^composição/i,
    /^composicao/i,
    /^publicidade/i,
    /^letra$/i,
    /^cifra$/i,
    /^cifra:\s*principal/i,
    /^cifra:\s*simplificada/i,
    /^ver mais/i,
    /^veja mais/i,
    /^mais acessadas/i,
    /^termos de uso/i,
    /^política de privacidade/i,
    /^politica de privacidade/i,
    /^adicionar à playlist/i,
    /^adicionar a playlist/i,
    /^ouvir no/i,
    /^baixar aplicativo/i,
    /^menu/i,
    /^buscar/i,
    /^entrar/i,
    /^cadastre-se/i,
    /^login/i,
    /^músicas para missa/i,
    /^musicas para missa/i,
    /^salmo responsorial/i,
    /^listas?aprenda/i,
    /^enviar\s+cifra/i,
    /^p\s*[áa]\s*g\s*i\s*n\s*a\s+i\s*n\s*i\s*c\s*i\s*a\s*l/i,
    /^g\s*o\s*s\s*p\s*e\s*l\s*\/\s*r\s*e\s*l\s*i\s*g\s*i\s*o\s*s\s*o/i,
    /^frei\s+gilson\s*%/i,
    /^%+$/i,
    /^repetir\s+modo\s+teatro/i,
    /^visualização\s+padrão/i,
    /^visualizacao\s+padrao/i,
    /^outros\s+vídeos/i,
    /^outros\s+videos/i
  ]

  const lines = decoded
    .split('\n')
    .map(line => line.trimEnd())
    .filter(line => {
      const compact = line.trim()
      if (!compact) return true
      return !noisePatterns.some(pattern => pattern.test(compact))
    })

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '')
}

const cleanupChordContent = (raw: string) => {
  const base = cleanupContent(raw)
  const lines = base.split('\n')

  const nextNonEmptyIndex = (from: number) => {
    for (let i = from; i < lines.length; i++) {
      if (lines[i].trim()) return i
    }
    return -1
  }

  let startIndex = 0
  for (let i = 0; i < lines.length; i++) {
    const current = lines[i]
    if (!current.trim()) continue
    const nextIndex = nextNonEmptyIndex(i + 1)
    const nextLine = nextIndex >= 0 ? lines[nextIndex] : ''
    if (isChordLine(current) && nextLine.trim() && !isChordLine(nextLine)) {
      startIndex = i
      break
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
    /^aprenda\s+a\s+tocar/i,
    /^acordes\s+para/i
  ]

  let endIndex = lines.length
  for (let i = startIndex; i < lines.length; i++) {
    const compact = lines[i].trim()
    if (compact && endPatterns.some(pattern => pattern.test(compact))) {
      endIndex = i
      break
    }
  }

  return lines.slice(startIndex, endIndex).join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '')
}

const stripHtmlToText = (html: string) => {
  return cleanupContent(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|section|article|h[1-6]|pre)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
}

const scoreCandidate = (text: string) => {
  const clean = cleanupContent(text)
  const usefulLines = clean.split('\n').map(line => line.trim()).filter(Boolean)
  if (clean.length < 80 || usefulLines.length < 4) return 0
  if (clean.length > 20000) return 0

  const chordLines = usefulLines.filter(isChordLine).length
  const chordBonus = chordLines * 350
  const usefulBonus = usefulLines.length * 15
  const noisePenalty = /(cookie|privacidade|cadastro|assinatura|premium|comentários|comentarios|menu|login|blog)/i.test(clean) ? 1200 : 0

  return Math.min(clean.length, 9000) + chordBonus + usefulBonus - noisePenalty
}

const extractJsonContent = (html: string) => {
  const patterns = [
    /"cifra"\s*:\s*"([\s\S]{80,}?)"\s*[,}]/i,
    /"cipher"\s*:\s*"([\s\S]{80,}?)"\s*[,}]/i,
    /"content"\s*:\s*"([\s\S]{80,}?)"\s*[,}]/i,
    /"lyrics"\s*:\s*"([\s\S]{80,}?)"\s*[,}]/i,
    /"lyric"\s*:\s*"([\s\S]{80,}?)"\s*[,}]/i
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (!match?.[1]) continue

    try {
      const parsed = JSON.parse(`"${match[1]}"`)
      const clean = cleanupContent(parsed)
      if (scoreCandidate(clean) > 0) return clean
    } catch {
      const clean = cleanupContent(match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'))
      if (scoreCandidate(clean) > 0) return clean
    }
  }

  return ''
}

const extractContentFromHtml = (html: string) => {
  const candidates: { text: string; score: number; source: string }[] = []

  const addCandidate = (text: string, source: string, bonus = 0) => {
    const clean = cleanupChordContent(text)
    const score = scoreCandidate(clean) + bonus
    if (clean && score > 0) candidates.push({ text: clean, score, source })
  }

  const jsonContent = extractJsonContent(html)
  if (jsonContent) addCandidate(jsonContent, 'json', 12000)

  // O bloco <pre> é o mais confiável para cifra, porque preserva espaços e alinhamento.
  const preBlocks = Array.from(html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/gi)).map(match => stripHtmlToText(match[1]))
  preBlocks.forEach(text => addCandidate(text, 'pre', 15000))

  const targetedBlocks = Array.from(html.matchAll(/<([a-z0-9]+)[^>]*(class|id)=["'][^"']*(cifra|cipher|letra|lyrics|music|content|cnt)[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi))
    .map(match => stripHtmlToText(match[4]))
  targetedBlocks.forEach(text => addCandidate(text, 'targeted', 6000))

  const articleBlocks = Array.from(html.matchAll(/<(article|main)[^>]*>([\s\S]*?)<\/\1>/gi)).map(match => stripHtmlToText(match[2]))
  articleBlocks.forEach(text => addCandidate(text, 'article', 1000))

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch?.[1]) addCandidate(stripHtmlToText(bodyMatch[1]), 'body', -6000)

  const ranked = candidates.sort((a, b) => b.score - a.score)
  if (!ranked.length) return ''

  let best = ranked[0].text
  const endMarkers = [
    /\n\s*Composição[\s\S]*$/i,
    /\n\s*Composicao[\s\S]*$/i,
    /\n\s*Colaboração[\s\S]*$/i,
    /\n\s*Colaboracao[\s\S]*$/i,
    /\n\s*Mais acessadas[\s\S]*$/i,
    /\n\s*Veja também[\s\S]*$/i,
    /\n\s*Veja tambem[\s\S]*$/i,
    /\n\s*Comentários[\s\S]*$/i,
    /\n\s*Comentarios[\s\S]*$/i,
    /\n\s*Outros vídeos[\s\S]*$/i,
    /\n\s*Outros videos[\s\S]*$/i,
    /\n\s*Repetir\s+Modo\s+teatro[\s\S]*$/i
  ]
  endMarkers.forEach(marker => { best = best.replace(marker, '') })

  return cleanupChordContent(best.slice(0, 12000))
}

const fetchHtml = async (url: string) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.7'
      }
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

const findFirstMusicLink = (html: string, baseUrl: string) => {
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

      if (host === 'cifraclub.com.br') {
        if (parts.length < 2) return false
        const blocked = ['blog', 'busca', 'videos', 'academy', 'aprenda', 'forum', 'noticias']
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
  const html = await fetchHtml(url)
  const content = extractContentFromHtml(html)
  if (content && scoreCandidate(content) > 0) return content
  return ''
}

const trySearchPage = async (searchUrl: string) => {
  const html = await fetchHtml(searchUrl)
  const foundLink = findFirstMusicLink(html, searchUrl)
  if (!foundLink) return ''
  return await tryUrl(foundLink)
}

const buildCandidates = (artist: string, song: string, query: string) => {
  const artistSlug = slugify(artist)
  const songSlug = slugify(song)
  const querySlug = slugify(query)

  const direct = [
    artistSlug && songSlug ? `https://www.cifraclub.com.br/${artistSlug}/${songSlug}/` : '',
    artistSlug && songSlug ? `https://www.cifraclub.com.br/${artistSlug}/${songSlug}/simplificada.html` : '',
    songSlug ? `https://musicasparamissa.com.br/musica/${songSlug}/` : '',
    querySlug ? `https://musicasparamissa.com.br/musica/${querySlug}/` : ''
  ].filter(Boolean)

  const searches = [
    `https://www.cifraclub.com.br/?q=${encodeURIComponent(query)}`,
    `https://www.cifraclub.com.br/busca/?q=${encodeURIComponent(query)}`,
    `https://musicasparamissa.com.br/?s=${encodeURIComponent(query)}`
  ]

  return {
    direct: Array.from(new Set(direct)),
    searches: Array.from(new Set(searches))
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ImportRequest
    const artist = String(body.artist || '').trim()
    const song = String(body.song || '').trim()
    const query = String(body.query || `${artist} ${song}`).trim()

    if (!query && !song) {
      return NextResponse.json({ ok: false, error: 'Informe o nome da música.' }, { status: 400 })
    }

    const candidates = buildCandidates(artist, song || query, query || `${artist} ${song}`.trim())
    const errors: string[] = []

    for (const url of candidates.direct) {
      try {
        const content = await tryUrl(url)
        if (content) return NextResponse.json({ ok: true, source: url, content })
      } catch (error: any) {
        errors.push(`${url}: ${error?.message || 'falhou'}`)
      }
    }

    for (const url of candidates.searches) {
      try {
        const content = await trySearchPage(url)
        if (content) return NextResponse.json({ ok: true, source: url, content })
      } catch (error: any) {
        errors.push(`${url}: ${error?.message || 'falhou'}`)
      }
    }

    return NextResponse.json({ ok: false, error: 'Cifra não encontrada automaticamente.', errors }, { status: 404 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Erro interno.' }, { status: 500 })
  }
}
