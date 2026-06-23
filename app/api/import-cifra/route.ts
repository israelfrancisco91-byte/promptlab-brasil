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
    .replace(/\n[ \t]+/g, '\n')

  const noisePatterns = [
    /^cifra club/i,
    /^entre para o cifra club/i,
    /^blog do cifra club/i,
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
    /^ver mais/i,
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
    /^salmo responsorial/i
  ]

  const lines = decoded
    .split('\n')
    .map(line => line.trimEnd())
    .filter(line => {
      const compact = line.trim()
      if (!compact) return true
      return !noisePatterns.some(pattern => pattern.test(compact))
    })

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
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
  const candidates: string[] = []
  const jsonContent = extractJsonContent(html)
  if (jsonContent) candidates.push(jsonContent)

  const preBlocks = Array.from(html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/gi)).map(match => stripHtmlToText(match[1]))
  candidates.push(...preBlocks)

  const targetedBlocks = Array.from(html.matchAll(/<([a-z0-9]+)[^>]*(class|id)=["'][^"']*(cifra|cipher|letra|lyrics|music|content)[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi))
    .map(match => stripHtmlToText(match[4]))
  candidates.push(...targetedBlocks)

  const articleBlocks = Array.from(html.matchAll(/<(article|main)[^>]*>([\s\S]*?)<\/\1>/gi)).map(match => stripHtmlToText(match[2]))
  candidates.push(...articleBlocks)

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch?.[1]) candidates.push(stripHtmlToText(bodyMatch[1]))

  const ranked = candidates
    .map(text => ({ text: cleanupContent(text), score: scoreCandidate(text) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)

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
    /\n\s*Comentarios[\s\S]*$/i
  ]
  endMarkers.forEach(marker => { best = best.replace(marker, '') })

  return cleanupContent(best.slice(0, 12000))
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
