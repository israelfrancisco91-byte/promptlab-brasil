import Link from 'next/link';

export const metadata = {
  title: 'Blog - PromptLab Brasil',
  description: 'Dicas, tutoriais e melhores práticas para músicos, bandas e ministérios de louvor.',
};

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-8">
      <div className="max-w-4xl mx-auto mt-10">
        
        <header className="mb-12 text-center border-b border-slate-800 pb-8">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Blog do Músico
          </h1>
          <p className="text-slate-400 text-lg">Conteúdo de valor para elevar o nível da sua banda e ministério de louvor.</p>
        </header>

        <main className="grid gap-8 md:grid-cols-2">
          {/* Card Artigo 1 */}
          <Link href="/blog/como-montar-o-setlist-perfeito" className="group">
            <article className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-xl hover:border-blue-500 transition-all h-full flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 block">Dicas Práticas</span>
                <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">Como montar o setlist perfeito para a sua banda</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">Descubra os segredos para criar um repertório que engaja o público do início ao fim, mantendo a energia e a fluidez do show.</p>
              </div>
              <span className="text-sm font-bold text-slate-500 group-hover:text-white transition-colors">Ler artigo completo &rarr;</span>
            </article>
          </Link>

          {/* Card Artigo 2 */}
          <Link href="/blog/organizar-cifras-ministerio-louvor" className="group">
            <article className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-xl hover:border-purple-500 transition-all h-full flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 block">Organização</span>
                <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">5 Dicas para organizar as cifras do seu Ministério</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">Chega de pastas bagunçadas e papéis voando no altar. Aprenda a digitalizar e organizar o repertório da sua equipe de forma profissional.</p>
              </div>
              <span className="text-sm font-bold text-slate-500 group-hover:text-white transition-colors">Ler artigo completo &rarr;</span>
            </article>
          </Link>
        </main>

        <div className="mt-16 pt-8 border-t border-slate-800 text-center">
          <Link href="/" className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-lg transition-colors uppercase tracking-wider text-sm">
            &larr; Voltar para o PromptLab
          </Link>
        </div>

      </div>
    </div>
  );
}
