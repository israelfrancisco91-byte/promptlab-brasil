"use client"

import { useState, useCallback, useRef } from "react"

const LIBRARY = [
  {
    key: "style",
    title: "Estilo visual",
    description: "Direção estética principal da imagem.",
    limit: 3,
    options: [
      { id: "realismo", label: "Realismo", en: "photorealistic, realistic textures, lifelike details" },
      { id: "cyberpunk", label: "Cyberpunk", en: "cyberpunk aesthetic, futuristic dystopian atmosphere, neon-soaked scene" },
      { id: "pixar", label: "Pixar", en: "3D animated style, pixar-inspired, charming character design" },
      { id: "vangogh", label: "Van Gogh", en: "van gogh-inspired brushwork, expressive strokes, painterly texture" },
      { id: "editorial", label: "Editorial de moda", en: "fashion editorial, luxury magazine aesthetic, premium styling" },
      { id: "surreal", label: "Surrealismo", en: "surreal visual storytelling, dreamlike atmosphere, imaginative composition" },
      { id: "anime", label: "Anime", en: "anime-inspired, cel-shaded aesthetics, cinematic illustration" },
      { id: "minimalista", label: "Minimalista", en: "minimalist visual language, clean negative space, elegant simplicity" },
      { id: "fantasia", label: "Fantasia épica", en: "epic fantasy atmosphere, majestic storytelling, mythical aesthetic" }
    ]
  },
  {
    key: "lighting",
    title: "Iluminação",
    description: "Escolha a assinatura de luz da cena.",
    limit: 3,
    options: [
      { id: "golden", label: "Golden Hour", en: "golden hour lighting, warm sunlight, soft cinematic glow" },
      { id: "neon", label: "Neon", en: "vibrant neon lighting, colorful reflections, high contrast glow" },
      { id: "dramatic", label: "Luz dramática", en: "dramatic lighting, deep shadows, moody contrast" },
      { id: "softstudio", label: "Estúdio suave", en: "soft studio lighting, diffused highlights, polished skin tones" },
      { id: "rim", label: "Rim light", en: "rim light, edge highlights, subject separation" },
      { id: "volumetric", label: "Luz volumétrica", en: "volumetric light beams, atmospheric haze, cinematic depth" },
      { id: "moonlight", label: "Luar", en: "moonlit atmosphere, cool blue highlights, nocturnal mood" }
    ]
  },
  {
    key: "lens",
    title: "Lente e câmera",
    description: "Termos técnicos fotográficos para dar mais autoridade ao prompt.",
    limit: 3,
    options: [
      { id: "35mm", label: "35mm", en: "35mm lens, cinematic perspective, natural environmental framing" },
      { id: "50mm", label: "50mm", en: "50mm lens, balanced perspective, realistic depth" },
      { id: "85mm", label: "85mm Retrato", en: "85mm portrait lens, flattering compression, creamy background blur" },
      { id: "anamorphic", label: "Anamórfica", en: "anamorphic lens, cinematic oval bokeh, filmic lens character" },
      { id: "macro", label: "Macro", en: "macro lens, extreme detail, close-up focus" },
      { id: "wide", label: "Grande angular", en: "wide-angle lens, immersive perspective, dynamic scale" },
      { id: "bokeh", label: "Bokeh", en: "shallow depth of field, creamy bokeh, soft background separation" }
    ]
  },
  {
    key: "composition",
    title: "Composição",
    description: "Como o assunto aparece dentro do quadro.",
    limit: 3,
    options: [
      { id: "closeup", label: "Close-up", en: "close-up framing, intimate details, strong subject focus" },
      { id: "portrait", label: "Retrato central", en: "centered portrait composition, symmetrical framing" },
      { id: "lowangle", label: "Low angle", en: "low angle shot, heroic perspective, dramatic scale" },
      { id: "ruleofthirds", label: "Regra dos terços", en: "rule of thirds composition, balanced visual flow" },
      { id: "cinematic", label: "Cinematográfica", en: "cinematic composition, dynamic framing, visual storytelling" },
      { id: "wideframe", label: "Plano aberto", en: "wide shot, environmental storytelling, expansive scene" },
      { id: "motion", label: "Sensação de movimento", en: "subtle motion energy, dynamic posture, cinematic action" }
    ]
  },
  {
    key: "color",
    title: "Cor e atmosfera",
    description: "Paleta e clima da imagem.",
    limit: 3,
    options: [
      { id: "tealorange", label: "Teal & Orange", en: "teal and orange color grading, blockbuster cinematic palette" },
      { id: "pastel", label: "Pastel", en: "soft pastel palette, airy tones, delicate color harmony" },
      { id: "vibrant", label: "Vibrante", en: "vibrant colors, rich saturation, visually striking palette" },
      { id: "dark", label: "Sombria", en: "dark moody tones, atmospheric shadows, dramatic ambiance" },
      { id: "luxury", label: "Luxo", en: "luxury color palette, premium tones, refined finish" },
      { id: "vintage", label: "Vintage", en: "vintage tones, nostalgic color treatment, subtle film fade" }
    ]
  },
  {
    key: "quality",
    title: "Acabamento",
    description: "Camada final de refinamento e qualidade visual.",
    limit: 3,
    options: [
      { id: "ultradetail", label: "Ultra detalhado", en: "ultra detailed, intricate textures, polished details" },
      { id: "8k", label: "8K look", en: "8k look, high fidelity rendering, crisp detail" },
      { id: "filmic", label: "Filmic", en: "filmic finish, subtle grain, premium cinematic polish" },
      { id: "hdr", label: "HDR", en: "HDR look, broad tonal range, enhanced highlight control" },
      { id: "sharp", label: "Nítido", en: "sharp focus, clean edges, strong visual clarity" },
      { id: "depth", label: "Profundidade", en: "deep spatial separation, layered depth, dimensional image quality" }
    ]
  },
  {
    key: "motion",
    title: "Movimento (Vídeo)",
    description: "Termos de movimento para IAs de vídeo como Veo, Luma e Kling.",
    limit: 3,
    options: [
      { id: "cinematicpan", label: "Cinematic pan", en: "cinematic pan, smooth horizontal camera movement" },
      { id: "slowmotion", label: "Slow motion", en: "slow motion, dramatic tempo, fluid movement" },
      { id: "droneshot", label: "Drone shot", en: "aerial drone shot, sweeping overhead view" },
      { id: "tracking", label: "Tracking shot", en: "tracking shot, following subject movement" },
      { id: "zoomin", label: "Zoom in", en: "smooth zoom in, focus intensification" },
      { id: "zoomout", label: "Zoom out", en: "zoom out reveal, expanding scene" },
      { id: "timelapse", label: "Timelapse", en: "timelapse effect, accelerated time passage" },
      { id: "handheld", label: "Handheld", en: "handheld camera, organic movement, documentary feel" },
      { id: "steadicam", label: "Steadicam", en: "steadicam smooth glide, floating camera movement" },
      { id: "dolly", label: "Dolly", en: "dolly movement, cinematic depth travel" }
    ]
  }
]

const EXAMPLE_IDEAS = [
  "um astronauta caminhando numa floresta neon",
  "uma rainha medieval em um castelo com luz dramática",
  "um gato herói sobre um prédio futurista",
  "um samurai cyberpunk na chuva",
  "uma bruxa em uma biblioteca mágica",
  "um retrato de uma mulher elegante em estúdio",
  "um dragão dourado voando sobre montanhas",
  "um robô amigável em uma cidade futurista"
]

const DEFAULT_NEGATIVE =
  "low quality, blurry, distorted anatomy, extra fingers, bad hands, cropped, text, watermark, oversaturated, noisy background"

type Selections = Record<string, string[]>

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/["""']/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function startsWithVowelSound(text: string): boolean {
  return /^[aeiou]/i.test(text.trim())
}

function translateIdea(text: string): string {
  if (!text) return ""

  let normalized = normalizeText(text)

  const phraseMap: [string, string][] = [
    ["um gato heroi", "a heroic cat"],
    ["uma gata heroina", "a heroic cat"],
    ["um astronauta", "an astronaut"],
    ["uma astronauta", "an astronaut"],
    ["uma rainha medieval", "a medieval queen"],
    ["um samurai cyberpunk", "a cyberpunk samurai"],
    ["uma bruxa", "a witch"],
    ["um robo amigavel", "a friendly robot"],
    ["cidade futurista", "futuristic city"],
    ["predio futurista", "futuristic skyscraper"],
    ["biblioteca magica", "magical library"],
    ["castelo medieval", "medieval castle"],
    ["dragao dourado", "golden dragon"],
    ["na chuva", "in the rain"],
    ["na floresta", "in the forest"],
    ["numa floresta", "in a forest"],
    ["sobre um predio", "on top of a building"],
    ["sobre um predio futurista", "on top of a futuristic building"]
  ]

  phraseMap
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([pt, en]) => {
      normalized = normalized.replace(new RegExp(`\\b${escapeRegExp(pt)}\\b`, "g"), en)
    })

  const wordMap: Record<string, string> = {
    um: "a",
    uma: "a",
    o: "the",
    a: "the",
    os: "the",
    as: "the",
    de: "of",
    do: "of the",
    da: "of the",
    dos: "of the",
    das: "of the",
    e: "and",
    com: "with",
    em: "in",
    no: "in the",
    na: "in the",
    para: "for",
    sobre: "on top of",
    gato: "cat",
    gata: "cat",
    heroi: "hero",
    heroina: "heroine",
    astronauta: "astronaut",
    mulher: "woman",
    homem: "man",
    crianca: "child",
    rainha: "queen",
    rei: "king",
    samurai: "samurai",
    bruxa: "witch",
    magica: "magical",
    magico: "magical",
    biblioteca: "library",
    castelo: "castle",
    medieval: "medieval",
    dragao: "dragon",
    dourado: "golden",
    robo: "robot",
    amigavel: "friendly",
    cidade: "city",
    futurista: "futuristic",
    predio: "building",
    floresta: "forest",
    neon: "neon",
    chuva: "rain",
    retrato: "portrait",
    elegante: "elegant",
    estudio: "studio",
    voando: "flying",
    montanhas: "mountains",
    lua: "moon",
    sol: "sun",
    guerreiro: "warrior",
    guerreira: "warrior",
    princesa: "princess",
    cavaleiro: "knight",
    rua: "street",
    carro: "car",
    cachorro: "dog",
    coruja: "owl",
    tigre: "tiger",
    lobo: "wolf"
  }

  const tokens = normalized.split(/(\s+|[,.!?;:()])/g).map((token) => {
    return wordMap[token] || token
  })

  let translated = tokens.join("").replace(/\s+/g, " ").trim()

  translated = translated
    .replace(/\ba astronaut\b/g, "an astronaut")
    .replace(/\ba elegant\b/g, "an elegant")
    .replace(/\ba epic\b/g, "an epic")
    .replace(/\ba owl\b/g, "an owl")
    .replace(/\ba astronauta\b/g, "an astronaut")

  if (!/^(a|an|the)\b/i.test(translated) && translated.length > 0) {
    translated = startsWithVowelSound(translated) ? `an ${translated}` : `a ${translated}`
  }

  return translated
}

export default function PromptLabPage() {
  const [idea, setIdea] = useState("")
  const [platform, setPlatform] = useState("midjourney")
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [stylize, setStylize] = useState(250)
  const [chaos, setChaos] = useState(10)
  const [negative, setNegative] = useState(DEFAULT_NEGATIVE)
  const [selections, setSelections] = useState<Selections>(() => {
    const initial: Selections = {}
    LIBRARY.forEach(cat => initial[cat.key] = [])
    return initial
  })
  const [toastMessage, setToastMessage] = useState("")
  const [showToast, setShowToast] = useState(false)
  const [highlightPrompt, setHighlightPrompt] = useState(false)
  const toastTimeout = useRef<NodeJS.Timeout | null>(null)
  const resultSectionRef = useRef<HTMLElement>(null)
  const promptBoxRef = useRef<HTMLPreElement>(null)

  const showToastMessage = useCallback((message: string) => {
    setToastMessage(message)
    setShowToast(true)
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    toastTimeout.current = setTimeout(() => setShowToast(false), 2200)
  }, [])

  const toggleSelection = useCallback((categoryKey: string, optionId: string) => {
    setSelections(prev => {
      const category = LIBRARY.find(c => c.key === categoryKey)
      if (!category) return prev

      const selected = [...(prev[categoryKey] || [])]
      const index = selected.indexOf(optionId)

      if (index >= 0) {
        selected.splice(index, 1)
      } else {
        selected.push(optionId)
        if (selected.length > category.limit) {
          selected.shift()
        }
      }

      return { ...prev, [categoryKey]: selected }
    })
  }, [])

  const getSelectedOptions = useCallback((categoryKey: string) => {
    const category = LIBRARY.find(c => c.key === categoryKey)
    if (!category) return []
    return category.options.filter(option =>
      selections[categoryKey]?.includes(option.id)
    )
  }, [selections])

  const buildSummaryTags = useCallback(() => {
    const tags: string[] = []
    LIBRARY.forEach(category => {
      const selected = getSelectedOptions(category.key)
      selected.forEach(item => tags.push(item.label))
    })
    return tags
  }, [getSelectedOptions])

  const buildPrompt = useCallback((translatedIdea: string) => {
    const style = getSelectedOptions("style").map(o => o.en)
    const lighting = getSelectedOptions("lighting").map(o => o.en)
    const lens = getSelectedOptions("lens").map(o => o.en)
    const composition = getSelectedOptions("composition").map(o => o.en)
    const color = getSelectedOptions("color").map(o => o.en)
    const quality = getSelectedOptions("quality").map(o => o.en)
    const motion = getSelectedOptions("motion").map(o => o.en)

    const isVideo = VIDEO_PLATFORMS.includes(platform)
    const coreIdea = translatedIdea || (isVideo ? "a visually striking video concept" : "a visually striking concept")

    const fragments = [
      coreIdea,
      ...style,
      ...lighting,
      ...composition,
      ...lens.map(item => `shot with ${item}`),
      ...color,
      ...quality,
      ...(isVideo ? motion : []),
      "professional prompt engineering",
      "high visual coherence",
      "refined details"
    ].filter(Boolean)

    const joined = fragments.join(", ")

    switch (platform) {
      case "midjourney":
        return `${joined} --ar ${aspectRatio} --stylize ${stylize} --chaos ${chaos} --v 6.1`
      case "leonardo":
        return `${joined}, highly polished render, prompt adherence, strong scene readability, premium visual output, aspect ratio ${aspectRatio}`
      case "sdxl":
        return `${joined}, optimized for SDXL, realistic material rendering, high detail fidelity, cinematic image design, aspect ratio ${aspectRatio}`
      case "chatgpt":
        return `Create an image of ${joined}. Keep the anatomy coherent, the composition clean, and the final visual polished. Use aspect ratio ${aspectRatio}.`
      case "gemini":
        return `Generate an image: ${joined}. Ensure visual coherence, accurate anatomy, and polished details. Aspect ratio: ${aspectRatio}.`
      case "claude":
        return `Create a detailed image of ${joined}. Focus on visual accuracy, coherent composition, and refined aesthetics. Aspect ratio: ${aspectRatio}.`
      case "firefly":
        return `${joined}, Adobe Firefly optimized, commercially safe, high-quality rendering, aspect ratio ${aspectRatio}`
      case "veo":
        return `Generate a video: ${joined}, ${motion.length > 0 ? '' : 'cinematic camera movement, smooth transitions,'} high-quality video generation, consistent motion, aspect ratio ${aspectRatio}`
      case "luma":
        return `${joined}, ${motion.length > 0 ? '' : 'cinematic pan, smooth motion,'} Luma Dream Machine optimized, consistent lighting throughout, fluid movement, aspect ratio ${aspectRatio}`
      case "kling":
        return `${joined}, ${motion.length > 0 ? '' : 'dynamic camera work, cinematic motion,'} Kling AI optimized, realistic movement, temporal consistency, aspect ratio ${aspectRatio}`
      default:
        return joined
    }
  }, [getSelectedOptions, platform, aspectRatio, stylize, chaos])

  const VIDEO_PLATFORMS = ["veo", "luma", "kling"]

  const isVideoPlatform = VIDEO_PLATFORMS.includes(platform)

  const formatPlatformLabel = (p: string) => {
    const labels: Record<string, string> = {
      midjourney: "Midjourney",
      leonardo: "Leonardo.ai",
      sdxl: "SDXL",
      chatgpt: "ChatGPT Image",
      gemini: "Gemini",
      claude: "Claude",
      firefly: "Adobe Firefly",
      veo: "Veo",
      luma: "Luma Dream Machine",
      kling: "Kling AI"
    }
    return labels[p] || p
  }

  const applyRandomExample = () => {
    const randomIdea = EXAMPLE_IDEAS[Math.floor(Math.random() * EXAMPLE_IDEAS.length)]
    setIdea(randomIdea)

    const newSelections: Selections = {}
    LIBRARY.forEach(category => {
      const count = Math.floor(Math.random() * Math.min(2, category.limit)) + 1
      const shuffled = [...category.options].sort(() => Math.random() - 0.5)
      newSelections[category.key] = shuffled.slice(0, count).map(item => item.id)
    })
    setSelections(newSelections)
  }

  const clearAll = () => {
    setIdea("")
    setPlatform("midjourney")
    setAspectRatio("16:9")
    setStylize(250)
    setChaos(10)
    setNegative(DEFAULT_NEGATIVE)
    
    const clearedSelections: Selections = {}
    LIBRARY.forEach(cat => clearedSelections[cat.key] = [])
    setSelections(clearedSelections)
  }

  const copyToClipboard = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToastMessage(message)
    } catch {
      showToastMessage("Não foi possível copiar")
    }
  }

  const handleGeneratePrompt = useCallback(() => {
    if (resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      })
    }

    setTimeout(() => {
      setHighlightPrompt(true)
      setTimeout(() => setHighlightPrompt(false), 1500)
    }, 500)
  }, [])

  const translatedIdea = translateIdea(idea.trim())
  const finalPrompt = buildPrompt(translatedIdea)
  const summaryTags = buildSummaryTags()

  return (
    <>
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      <header className="relative z-[1] max-w-[1240px] mx-auto px-5 pt-12 pb-5 text-center">
        <div className="hero-badge">Prompt Builder para o público brasileiro</div>
        <h1 className="m-0 text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.02] tracking-[-0.04em] text-balance">
          PromptLab BR
        </h1>
        <p className="max-w-[820px] mx-auto mt-[18px] text-[#9fb0c9] text-[1.06rem] leading-relaxed">
          Digite sua ideia em português, selecione estilos fotográficos e receba
          um prompt técnico pronto para Midjourney, Leonardo, SDXL e outras IAs generativas.
        </p>

        <div className="flex justify-center gap-2.5 flex-wrap mt-6">
          <span className="hero-tags"><span>PT → EN técnico</span></span>
          <span className="hero-tags"><span>Estilo fotográfico</span></span>
          <span className="hero-tags"><span>Luz + lente + composição</span></span>
          <span className="hero-tags"><span>Pronto para copiar</span></span>
        </div>
      </header>

      <main className="relative z-[1] max-w-[1240px] mx-auto mt-[18px] mb-10 px-5 grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr] gap-[22px]">
        <section className="panel p-6">
          <div className="flex justify-between items-start gap-3 mb-[22px] flex-col sm:flex-row">
            <div>
              <p className="eyebrow">Construtor visual</p>
              <h2 className="mt-1.5 mb-0 text-[1.4rem] tracking-[-0.03em]">Monte sua &quot;receita&quot; de prompt</h2>
            </div>

          </div>

          <div className="field mb-[18px]">
            <label htmlFor="ideaInput">Ideia central</label>
            <textarea
              id="ideaInput"
              rows={4}
              placeholder="Ex: um gato herói em cima de um prédio futurista"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
            />
            <small>
              Dica: escreva em português simples. O sistema converte a ideia para um inglês técnico básico e combina com os estilos visuais escolhidos.
            </small>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field mb-[18px]">
              <label htmlFor="platformSelect">Plataforma alvo</label>
              <select
                id="platformSelect"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <optgroup label="Imagem">
                  <option value="midjourney">Midjourney</option>
                  <option value="leonardo">Leonardo.ai</option>
                  <option value="sdxl">SDXL / Stable Diffusion</option>
                  <option value="chatgpt">ChatGPT Image</option>
                  <option value="gemini">Gemini</option>
                  <option value="claude">Claude</option>
                  <option value="firefly">Adobe Firefly</option>
                </optgroup>
                <optgroup label="Vídeo">
                  <option value="veo">Veo (Google)</option>
                  <option value="luma">Luma Dream Machine</option>
                  <option value="kling">Kling AI</option>
                </optgroup>
              </select>
            </div>

            <div className="field mb-[18px]">
              <label htmlFor="aspectRatio">Aspect ratio</label>
              <select
                id="aspectRatio"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
              >
                <option value="1:1">1:1</option>
                <option value="4:5">4:5</option>
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="3:2">3:2</option>
                <option value="2:3">2:3</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field mb-2.5">
              <label htmlFor="stylizeRange">Stylize <span>{stylize}</span></label>
              <input
                type="range"
                id="stylizeRange"
                min={0}
                max={1000}
                step={10}
                value={stylize}
                onChange={(e) => setStylize(Number(e.target.value))}
              />
            </div>

            <div className="field mb-2.5">
              <label htmlFor="chaosRange">Chaos <span>{chaos}</span></label>
              <input
                type="range"
                id="chaosRange"
                min={0}
                max={100}
                step={1}
                value={chaos}
                onChange={(e) => setChaos(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="field mb-[18px]">
            <label htmlFor="negativeInput">Negative prompt</label>
            <textarea
              id="negativeInput"
              rows={3}
              value={negative}
              onChange={(e) => setNegative(e.target.value)}
            />
          </div>

          <div className="mt-7 mb-4">
            <h3 className="m-0 mb-1.5 text-[1.05rem]">Biblioteca de estilos</h3>
            <p className="m-0 text-[#9fb0c9] leading-relaxed">Selecione os botões que vão compor o prompt final.</p>
          </div>

          {LIBRARY.map(category => {
            // Só mostra categoria de movimento para plataformas de vídeo
            if (category.key === "motion" && !isVideoPlatform) return null
            
            return (
              <section key={category.key} className="category-card">
                <div className="flex items-start justify-between gap-3 mb-3.5 flex-col sm:flex-row">
                  <div>
                    <h4 className="m-0 mb-1.5 text-base">{category.title}</h4>
                    <p className="m-0 text-[#9fb0c9] leading-relaxed text-[0.93rem]">{category.description}</p>
                  </div>
                  <span className="limit-badge">até {category.limit}</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {category.options.map(option => (
                    <button
                      key={option.id}
                      type="button"
                      className={`option-btn ${selections[category.key]?.includes(option.id) ? 'active' : ''}`}
                      onClick={() => toggleSelection(category.key, option.id)}
                      aria-pressed={selections[category.key]?.includes(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>
            )
          })}

          <div className="examples-box">
            <div>
              <h3 className="m-0 mb-1.5 text-[1.05rem]">Exemplos rápidos</h3>
              <p className="m-0 text-[#9fb0c9] leading-relaxed">Clique para preencher a ideia central.</p>
            </div>

            <div className="flex flex-wrap gap-2.5 mt-3.5">
              <button className="example-chip" onClick={() => setIdea("um astronauta caminhando numa floresta neon")}>
                Astronauta em floresta neon
              </button>
              <button className="example-chip" onClick={() => setIdea("uma rainha medieval em um castelo com luz dramática")}>
                Rainha medieval
              </button>
              <button className="example-chip" onClick={() => setIdea("um gato herói sobre um prédio futurista")}>
                Gato herói futurista
              </button>
              <button className="example-chip" onClick={() => setIdea("um samurai cyberpunk na chuva")}>
                Samurai cyberpunk
              </button>
              <button className="example-chip" onClick={() => setIdea("uma bruxa em uma biblioteca mágica")}>
                Bruxa em biblioteca mágica
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-[22px]">
            <button className="btn btn-primary" onClick={handleGeneratePrompt}>Gerar prompt</button>
            <button className="btn btn-secondary" onClick={applyRandomExample}>Exemplo aleatório</button>
            <button className="btn btn-ghost" onClick={clearAll}>Limpar tudo</button>
          </div>
        </section>

        <aside ref={resultSectionRef} className="panel p-6 lg:sticky lg:top-5 h-fit">
          <div className="flex justify-between items-start gap-3 mb-[22px] flex-col sm:flex-row">
            <div>
              <p className="eyebrow">Resultado</p>
              <h2 className="mt-1.5 mb-0 text-[1.4rem] tracking-[-0.03em]">Prompt pronto para copiar</h2>
            </div>
            <div className={`status-pill ${isVideoPlatform ? 'status-video' : 'status-accent'}`}>
              {isVideoPlatform && <span className="mr-1">🎬</span>}
              {formatPlatformLabel(platform)}
            </div>
          </div>

          <div className="result-card">
            <span className="result-label">Resumo da receita</span>
            <div className="flex flex-wrap gap-2.5">
              {summaryTags.length > 0 ? (
                summaryTags.map((tag, i) => (
                  <span key={i} className="summary-tag">{tag}</span>
                ))
              ) : (
                <span className="empty-state-chip">Nenhum estilo selecionado ainda</span>
              )}
            </div>
          </div>

          <div className="result-card">
            <span className="result-label">Ideia otimizada</span>
            <p className="m-0 text-[#f6f8fd] leading-relaxed">
              {translatedIdea || "Your translated concept will appear here."}
            </p>
          </div>

          <div className="result-card">
            <div className="flex items-center justify-between gap-3 mb-2 flex-col sm:flex-row">
              <span className="result-label mb-0">Prompt final</span>
              <button className="copy-btn" onClick={() => copyToClipboard(finalPrompt, "Prompt copiado")}>
                Copiar prompt
              </button>
            </div>
            <pre ref={promptBoxRef} className={`prompt-box ${highlightPrompt ? 'highlight-pulse' : ''}`}>{finalPrompt}</pre>
          </div>

          <div className="result-card">
            <div className="flex items-center justify-between gap-3 mb-2 flex-col sm:flex-row">
              <span className="result-label mb-0">Negative prompt</span>
              <button className="copy-btn" onClick={() => copyToClipboard(negative, "Negative prompt copiado")}>
                Copiar negative
              </button>
            </div>
            <pre className="prompt-box">{negative}</pre>
          </div>


        </aside>
      </main>

      <footer className="relative z-10 max-w-[1240px] mx-auto px-5 py-8 text-center border-t border-white/10">
        <a href="/privacidade" className="text-[#8fa2be] hover:text-white transition-colors text-sm">
          Política de Privacidade
        </a>
      </footer>

      <div className={`toast ${showToast ? 'show' : ''}`}>{toastMessage}</div>
    </>
  )
}
