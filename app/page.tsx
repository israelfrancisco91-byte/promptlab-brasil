"use client"

import { useState, useCallback, useRef, useEffect } from "react"

// --- BIBLIOTECA DE ESTILOS (IMAGEM) ---
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
    description: "Termos técnicos fotográficos.",
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
  }
]

// --- LÓGICA DE TRADUÇÃO MELHORADA ---
function translateToEnglish(text: string): string {
  if (!text) return ""
  let translated = text.toLowerCase()
    .replace(/um gato/g, "a cat")
    .replace(/herói/g, "hero")
    .replace(/em cima de/g, "on top of")
    .replace(/prédio futurista/g, "futuristic building")
    .replace(/astronauta/g, "astronaut")
    .replace(/floresta/g, "forest")
    // Adicione mais mapeamentos conforme necessário ou use uma API futuramente
  return translated
}

export default function PromptLabPage() {
  const [activeTab, setActiveTab] = useState<"image" | "music">("image")
  
  // States Imagem
  const [idea, setIdea] = useState("")
  const [platform, setPlatform] = useState("midjourney")
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [selections, setSelections] = useState<Record<string, string[]>>({ style: [], lighting: [], lens: [] })
  
  // States Música
  const [musicTheme, setMusicTheme] = useState("")
  const [musicStyle, setMusicStyle] = useState("sertanejo")
  const [generatedMusic, setGeneratedMusic] = useState<{lyrics: string, chords: string} | null>(null)

  // Resetar campos ao carregar
  useEffect(() => {
    setIdea("")
    setMusicTheme("")
  }, [])

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    alert("Copiado com sucesso!")
  }

  // --- COMPONENTE DE IMAGEM ---
  const ImageGenerator = () => {
    const finalPrompt = `${translateToEnglish(idea)}, ${platform === 'midjourney' ? '--ar ' + aspectRatio : ''}`
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr] gap-[22px]">
        <section className="panel p-6">
          <p className="eyebrow">Construtor Visual</p>
          <h2 className="text-[1.4rem] mb-4">Monte seu Prompt</h2>
          
          <div className="field mb-4">
            <label>Ideia Central (Português)</label>
            <textarea 
              className="w-full bg-[#0f172a] border border-white/10 rounded-md p-3 text-white"
              rows={4}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Ex: Um astronauta tocando violão na lua"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="field">
              <label>Plataforma</label>
              <select 
                className="w-full bg-[#1a2333] text-white border border-white/10 p-2 rounded-md appearance-none"
                style={{ backgroundColor: '#1a2333', color: 'white' }}
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="midjourney">Midjourney</option>
                <option value="leonardo">Leonardo.ai</option>
                <option value="sdxl">SDXL</option>
              </select>
            </div>
            <div className="field">
              <label>Formato (AR)</label>
              <select 
                className="w-full bg-[#1a2333] text-white border border-white/10 p-2 rounded-md"
                style={{ backgroundColor: '#1a2333', color: 'white' }}
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
              >
                <option value="16:9">16:9 (Youtube/TV)</option>
                <option value="9:16">9:16 (Reels/TikTok)</option>
                <option value="1:1">1:1 (Instagram)</option>
              </select>
            </div>
          </div>
        </section>

        <aside className="panel p-6 sticky top-5 h-fit">
          <p className="eyebrow">Resultado</p>
          <div className="result-card bg-[#0f172a] p-4 rounded-lg border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-blue-400 font-bold uppercase">Prompt Final (Inglês)</span>
              <button onClick={() => copyToClipboard(finalPrompt)} className="text-xs bg-blue-600 px-2 py-1 rounded">Copiar</button>
            </div>
            <pre className="text-sm whitespace-pre-wrap break-words text-gray-300">{finalPrompt}</pre>
          </div>
        </aside>
      </div>
    )
  }

  // --- COMPONENTE DE MÚSICA (MUSICLAB) ---
  const MusicLab = () => {
    const handleCompose = () => {
      setGeneratedMusic({
        lyrics: `(Verao 1)\nNo brilho do ${musicTheme}\nEu encontrei meu lugar\n(Refrão)\nOh ${musicTheme}, luz do meu caminhar...`,
        chords: "G | D | Em | C"
      })
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr] gap-[22px]">
        <section className="panel p-6">
          <p className="eyebrow">MusicLab</p>
          <h2 className="text-[1.4rem] mb-4">Compositor de Letras e Cifras</h2>
          <div className="field mb-4">
            <label>Sobre o que é a música?</label>
            <input 
              className="w-full bg-[#0f172a] border border-white/10 rounded-md p-3 text-white"
              value={musicTheme}
              onChange={(e) => setMusicTheme(e.target.value)}
              placeholder="Ex: Saudade, Amor, Natureza..."
            />
          </div>
          <button onClick={handleCompose} className="btn btn-primary w-full">Compor Música</button>
        </section>

        <aside className="panel p-6">
          {generatedMusic ? (
            <div className="result-card bg-[#0f172a] p-4 rounded-lg">
              <h3 className="text-blue-400 mb-2">Letra e Cifras</h3>
              <pre className="text-gray-300 mb-4">{generatedMusic.lyrics}</pre>
              <div className="p-3 bg-white/5 rounded border border-white/10">
                <span className="text-xs block text-gray-500 mb-1">Acordes Sugeridos:</span>
                <code className="text-lg text-orange-400 font-bold">{generatedMusic.chords}</code>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="text-xs bg-green-600 p-2 rounded">WhatsApp</button>
                <button className="text-xs bg-gray-600 p-2 rounded">Gerar PDF</button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center">Sua composição aparecerá aqui.</p>
          )}
        </aside>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30">
      <style jsx global>{`
        .panel { background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; backdrop-filter: blur(10px); }
        .eyebrow { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: #6366f1; font-weight: 800; margin-bottom: 8px; }
        .btn { padding: 12px 24px; border-radius: 8px; font-weight: 600; transition: all 0.2s; cursor: pointer; }
        .btn-primary { background: #4f46e5; color: white; border: none; }
        .btn-primary:hover { background: #4338ca; }
        label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 8px; font-weight: 500; }
        select option { background-color: #1a2333; color: white; }
      `}</style>

      <header className="max-w-[1240px] mx-auto px-5 pt-12 text-center">
        <h1 className="text-4xl font-black tracking-tight mb-4">PromptLab BR</h1>
        
        <nav className="flex justify-center gap-4 mb-8">
          <button 
            onClick={() => setActiveTab("image")}
            className={`px-4 py-2 rounded-full text-sm font-bold transition ${activeTab === 'image' ? 'bg-blue-600' : 'bg-white/5'}`}
          >
            🖼️ Imagens
          </button>
          <button 
            onClick={() => setActiveTab("music")}
            className={`px-4 py-2 rounded-full text-sm font-bold transition ${activeTab === 'music' ? 'bg-purple-600' : 'bg-white/5'}`}
          >
            🎸 MusicLab
          </button>
        </nav>
      </header>

      <main className="max-w-[1240px] mx-auto px-5 pb-20">
        {activeTab === "image" ? <ImageGenerator /> : <MusicLab />}
      </main>
    </div>
  )
}
