"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"

const IMAGE_LIBRARY = [
  {
    key: "style",
    title: "Estilo visual",
    options: [
      { id: "realismo", label: "Realismo", en: "photorealistic, 8k" },
      { id: "cyberpunk", label: "Cyberpunk", en: "cyberpunk aesthetic" },
      { id: "pixar", label: "Pixar 3D", en: "3D animated pixar style" },
      { id: "anime", label: "Anime", en: "anime style" }
    ]
  }
]

export default function PromptLabPage() {
  const [activeTab, setActiveTab] = useState<"image" | "music">("image")
  
  // --- STATES IMAGEM ---
  const [idea, setIdea] = useState("")
  const [selections, setSelections] = useState<Record<string, string[]>>({ style: [] })

  // --- STATES MUSICLAB ---
  const [musicTheme, setMusicTheme] = useState("")
  const [musicStyle, setMusicStyle] = useState("Worship")
  const [musicVibe, setMusicVibe] = useState("Inspiradora")
  const [compositionResult, setCompositionResult] = useState("")
  const [repertoire, setRepertoire] = useState("")

  // --- FUNÇÕES DE UTILIDADE ---
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copiado com sucesso!")
  }

  const shareWhatsApp = (text: string) => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  // --- GERADOR DE PDF (COMPOSIÇÃO OU REPERTÓRIO) ---
  const generatePDF = (content: string, isRepertoire: boolean) => {
    const doc = new jsPDF()
    const watermark = "PromptLab Brasil"
    
    // Se for repertório, separa por músicas (considerando que o usuário pula linha)
    const songs = isRepertoire ? content.split(/\n\n+/) : [content]

    songs.forEach((song, index) => {
      if (index > 0) doc.addPage()
      
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(watermark, 10, 285) // Marca d'água no rodapé

      doc.setFontSize(14)
      doc.setTextColor(0)
      doc.setFont("helvetica", "bold")
      doc.text(isRepertoire ? `Música ${index + 1}` : "Sua Composição AI", 10, 20)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      
      // Lógica de duas colunas
      const lines = doc.splitTextToSize(song, 90) // Metade da página
      if (lines.length > 40) {
        doc.text(lines.slice(0, 40), 10, 35)
        doc.text(lines.slice(40), 110, 35)
      } else {
        doc.text(lines, 10, 35)
      }
    })

    doc.save(isRepertoire ? "meu-repertorio.pdf" : "minha-composicao.pdf")
  }

  const handleCompose = () => {
    const result = `[Tema: ${musicTheme}]\n[Estilo: ${musicStyle} | Vibe: ${musicVibe}]\n\n(Verso 1)\nNo silêncio do meu peito, o ${musicTheme} floresceu\nComo um raio de esperança que o destino me deu...\n\n(Refrão)\nOh, esse ${musicTheme} que me faz cantar\nNo ritmo do ${musicStyle}, sigo a te buscar!`
    setCompositionResult(result)
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans p-4 selection:bg-blue-500/30">
      <style jsx global>{`
        .panel { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }
        label { color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; display: block; }
        input, select, textarea { background: #020617; border: 1px solid #334155; color: white; padding: 12px; border-radius: 8px; width: 100%; transition: all 0.2s; }
        input:focus, select:focus, textarea:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
        .btn { padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; border: none; }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-whatsapp { background: #22c55e; color: white; }
        .btn-pdf { background: #ef4444; color: white; }
        .btn-copy { background: #64748b; color: white; }
      `}</style>

      <header className="max-w-5xl mx-auto text-center py-12">
        <h1 className="text-5xl font-black tracking-tighter mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">PromptLab BR</h1>
        <div className="flex justify-center gap-3">
          <button onClick={() => setActiveTab("image")} className={`px-8 py-3 rounded-full font-bold transition ${activeTab === 'image' ? 'bg-blue-600 shadow-lg shadow-blue-900/20' : 'bg-slate-800'}`}>🖼️ Imagens</button>
          <button onClick={() => setActiveTab("music")} className={`px-8 py-3 rounded-full font-bold transition ${activeTab === 'music' ? 'bg-purple-600 shadow-lg shadow-purple-900/20' : 'bg-slate-800'}`}>🎸 MusicLab</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        {activeTab === "image" ? (
           <div className="text-center p-10 panel">Em desenvolvimento... (Aguardando Biblioteca completa)</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* --- COLUNA DA ESQUERDA: FERRAMENTAS --- */}
            <div className="space-y-8">
              {/* COMPOSITOR AI */}
              <section className="panel border-l-4 border-purple-500">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2">✨ Compositor AI</h2>
                <div className="space-y-4">
                  <div>
                    <label>Tema da música</label>
                    <input value={musicTheme} onChange={(e) => setMusicTheme(e.target.value)} placeholder="Ex: Amor de verão, Saudade da infância..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label>Estilo</label>
                      <select value={musicStyle} onChange={(e) => setMusicStyle(e.target.value)}>
                        <option>Worship</option><option>Sertanejo</option><option>Samba</option>
                        <option>Pagode</option><option>MPB</option><option>Rock</option>
                        <option>Pop</option><option>Trap</option><option>Funk</option>
                        <option>Forró</option><option>Reggae</option><option>Jazz</option>
                      </select>
                    </div>
                    <div>
                      <label>Vibe</label>
                      <select value={musicVibe} onChange={(e) => setMusicVibe(e.target.value)}>
                        <option>Inspiradora</option><option>Animada</option><option>Melancólica</option>
                        <option>Relaxante</option><option>Épica</option><option>Romântica</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={handleCompose} className="btn btn-primary w-full mt-2">🚀 Gerar Composição</button>
                </div>
              </section>

              {/* REPERTÓRIO DIGITAL */}
              <section className="panel border-l-4 border-green-500">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2">📚 Repertório Digital</h2>
                <label>Cole aqui as letras e cifras (Uma abaixo da outra)</label>
                <textarea 
                  rows={10} 
                  value={repertoire} 
                  onChange={(e) => setRepertoire(e.target.value)} 
                  placeholder="Música 1... &#10;&#10;Música 2..." 
                  className="text-sm font-mono"
                />
                <button onClick={() => generatePDF(repertoire, true)} className="btn btn-whatsapp w-full mt-4">📄 Gerar PDF do Repertório (Tablet)</button>
              </section>
            </div>

            {/* --- COLUNA DA DIREITA: RESULTADO --- */}
            <div className="space-y-6">
              <section className="panel h-full flex flex-col">
                <label>Prévia da Composição</label>
                <div className="flex-1 bg-black/40 rounded-xl p-6 border border-slate-800 font-serif text-lg leading-relaxed text-slate-300 min-h-[400px] whitespace-pre-wrap">
                  {compositionResult || "As letras e acordes aparecerão aqui..."}
                </div>
                
                {compositionResult && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                    <button onClick={() => copyToClipboard(compositionResult)} className="btn btn-copy text-xs">📋 Copiar</button>
                    <button onClick={() => shareWhatsApp(compositionResult)} className="btn btn-whatsapp text-xs">📱 WhatsApp</button>
                    <button onClick={() => generatePDF(compositionResult, false)} className="btn btn-pdf text-xs">📕 Gerar PDF</button>
                  </div>
                )}
                <div className="mt-4 text-center">
                   <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">PromptLab Brasil - Marca D'água Ativa</span>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
