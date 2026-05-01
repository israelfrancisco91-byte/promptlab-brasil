"use client"

import { useState, useCallback, useEffect } from "react"

// --- BIBLIOTECA COMPLETA DE ESTILOS ---
const LIBRARY = [
  {
    key: "style",
    title: "Estilo visual",
    options: [
      { id: "realismo", label: "Realismo", en: "photorealistic, 8k, highly detailed" },
      { id: "cyberpunk", label: "Cyberpunk", en: "cyberpunk aesthetic, neon lights" },
      { id: "pixar", label: "Pixar 3D", en: "3D animated style, disney pixar inspired" },
      { id: "anime", label: "Anime", en: "anime style, studio ghibli aesthetic" },
      { id: "minimalista", label: "Minimalista", en: "minimalist, clean lines" }
    ]
  },
  {
    key: "lighting",
    title: "Iluminação",
    options: [
      { id: "golden", label: "Golden Hour", en: "golden hour, warm sunlight" },
      { id: "neon", label: "Neon", en: "vibrant neon glow" },
      { id: "dramatic", label: "Luz Dramática", en: "dramatic lighting, cinematic shadows" },
      { id: "soft", label: "Suave", en: "soft studio lighting" }
    ]
  },
  {
    key: "lens",
    title: "Lente/Câmera",
    options: [
      { id: "85mm", label: "85mm (Retrato)", en: "85mm lens, bokeh background" },
      { id: "wide", label: "Grande Angular", en: "wide angle lens, expansive view" },
      { id: "macro", label: "Macro", en: "macro lens, extreme close-up detail" }
    ]
  }
]

export default function PromptLabPage() {
  const [activeTab, setActiveTab] = useState<"image" | "music">("image")
  
  // States Imagem
  const [idea, setIdea] = useState("")
  const [platform, setPlatform] = useState("midjourney")
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [selections, setSelections] = useState<Record<string, string[]>>({ style: [], lighting: [], lens: [] })
  
  // States Música
  const [musicTheme, setMusicTheme] = useState("")
  const [musicStyle, setMusicStyle] = useState("Worship")
  const [musicVibe, setMusicVibe] = useState("Inspiradora")
  const [repertoire, setRepertoire] = useState("")
  const [generatedMusic, setGeneratedMusic] = useState<{lyrics: string, chords: string} | null>(null)

  const toggleSelection = (category: string, id: string) => {
    setSelections(prev => {
      const current = prev[category] || []
      return { ...prev, [category]: current.includes(id) ? current.filter(i => i !== id) : [...current, id] }
    })
  }

  const buildFinalPrompt = () => {
    const selectedEn = Object.entries(selections).flatMap(([cat, ids]) => 
      LIBRARY.find(c => c.key === cat)?.options.filter(o => ids.includes(o.id)).map(o => o.en) || []
    )
    const base = idea || "A creative concept"
    const suffix = platform === "midjourney" ? ` --ar ${aspectRatio} --v 6.0` : `, aspect ratio ${aspectRatio}`
    return `${base}, ${selectedEn.join(", ")}, high quality, cinematic${suffix}`
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans p-4">
      <style jsx global>{`
        .panel { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; }
        .option-btn { padding: 8px 12px; border-radius: 6px; border: 1px solid #374151; font-size: 0.85rem; cursor: pointer; transition: 0.2s; }
        .option-btn.active { background: #3b82f6; border-color: #60a5fa; }
        label { color: #94a3b8; font-size: 0.8rem; font-weight: bold; margin-bottom: 5px; display: block; }
        select, textarea, input { background: #0f172a; border: 1px solid #1f2937; color: white; padding: 10px; border-radius: 8px; width: 100%; }
      `}</style>

      <header className="max-w-5xl mx-auto text-center py-10">
        <h1 className="text-4xl font-black mb-6">PromptLab BR</h1>
        <div className="flex justify-center gap-4">
          <button onClick={() => setActiveTab("image")} className={`px-6 py-2 rounded-full font-bold ${activeTab === 'image' ? 'bg-blue-600' : 'bg-gray-800'}`}>🖼️ Imagens</button>
          <button onClick={() => setActiveTab("music")} className={`px-6 py-2 rounded-full font-bold ${activeTab === 'music' ? 'bg-purple-600' : 'bg-gray-800'}`}>🎸 MusicLab</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {activeTab === "image" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="panel">
              <label>Ideia Central</label>
              <textarea rows={3} value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Descreva sua imagem..." />
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div><label>Plataforma</label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                    <option value="midjourney">Midjourney</option>
                    <option value="leonardo">Leonardo.ai</option>
                  </select>
                </div>
                <div><label>Formato</label>
                  <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                    <option value="16:9">16:9</option><option value="9:16">9:16</option><option value="1:1">1:1</option>
                  </select>
                </div>
              </div>

              {LIBRARY.map(cat => (
                <div key={cat.key} className="mt-6">
                  <label>{cat.title}</label>
                  <div className="flex flex-wrap gap-2">
                    {cat.options.map(opt => (
                      <button key={opt.id} onClick={() => toggleSelection(cat.key, opt.id)} className={`option-btn ${selections[cat.key].includes(opt.id) ? 'active' : ''}`}>{opt.label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="panel h-fit sticky top-4">
              <label>Prompt Final</label>
              <div className="bg-black/50 p-4 rounded-lg border border-white/10 break-words text-blue-300 font-mono text-sm">{buildFinalPrompt()}</div>
              <button onClick={() => navigator.clipboard.writeText(buildFinalPrompt())} className="w-full bg-blue-600 mt-4 py-3 rounded-lg font-bold">Copiar Prompt</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="panel">
              <h2 className="text-xl font-bold mb-4">Compositor AI</h2>
              <label>Tema da Música</label>
              <input value={musicTheme} onChange={(e) => setMusicTheme(e.target.value)} placeholder="Ex: Amor incondicional" className="mb-4" />
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label>Estilo</label>
                  <select value={musicStyle} onChange={(e) => setMusicStyle(e.target.value)}>
                    <option value="Worship">Worship</option><option value="Sertanejo">Sertanejo</option><option value="Rock">Rock</option><option value="Pop">Pop</option>
                  </select>
                </div>
                <div><label>Vibe</label>
                  <select value={musicVibe} onChange={(e) => setMusicVibe(e.target.value)}>
                    <option value="Inspiradora">Inspiradora</option><option value="Animada">Animada</option><option value="Melancólica">Melancólica</option>
                  </select>
                </div>
              </div>

              <h2 className="text-xl font-bold mt-8 mb-4">Repertório Digital (PDF)</h2>
              <label>Cole aqui as letras e cifras (uma após a outra)</label>
              <textarea rows={8} value={repertoire} onChange={(e) => setRepertoire(e.target.value)} placeholder="Música 1... Música 2..." />
              <button className="w-full bg-green-600 mt-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2">📄 Gerar PDF para Tablet</button>
            </div>
            
            <div className="panel">
              <label>Prévia da Composição</label>
              <div className="bg-black/50 p-6 rounded-lg border border-white/10 min-h-[300px]">
                {musicTheme ? (
                  <div>
                    <h3 className="text-purple-400 font-bold mb-2">Sugestão AI:</h3>
                    <p className="text-gray-300 italic whitespace-pre-wrap">
                      [Introdução: {musicStyle}]\nEstilo {musicVibe}...\nLetra sobre {musicTheme} vindo aqui...
                    </p>
                  </div>
                ) : <p className="text-gray-500 italic">Preencha o tema para compor...</p>}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
