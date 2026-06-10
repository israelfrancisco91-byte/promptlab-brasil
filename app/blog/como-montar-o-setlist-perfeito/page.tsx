import Link from 'next/link';

export const metadata = {
  title: 'Como montar o setlist perfeito - PromptLab Brasil',
  description: 'Descubra os segredos para criar um repertório que engaja o público do início ao fim.',
};

export default function BlogPost1() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-8 leading-relaxed">
      <article className="max-w-3xl mx-auto bg-[#0f172a] border border-slate-800 p-8 md:p-12 rounded-2xl shadow-2xl mt-8">
        
        <header className="mb-10">
          <Link href="/blog" className="text-blue-400 hover:text-blue-300 text-sm font-bold mb-6 inline-block">&larr; Voltar para o Blog</Link>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">Como montar o setlist perfeito para a sua banda</h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>Publicado pela equipe PromptLab</span>
            <span>•</span>
            <span>Leitura de 4 min</span>
          </div>
        </header>

        <div className="space-y-6 text-base text-slate-300">
          <p>Montar um setlist não é apenas empilhar as músicas que a banda gosta de tocar. É desenhar uma jornada emocional para o seu público. Seja em um show em um pub lotado ou na condução de um ministério de louvor, a ordem das músicas define o sucesso da apresentação.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. A Regra do Impacto Inicial</h2>
          <p>As duas primeiras músicas são o seu cartão de visita. Elas devem capturar a atenção imediata. Escolha faixas enérgicas, que a banda toque com os olhos fechados, com total segurança. Evite músicas com introduções longas demais; vá direto ao ponto.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. O Gráfico em "U" da Energia</h2>
          <p>Nenhuma banda consegue manter 100% de energia o tempo todo, e o público também precisa respirar. Estruture seu repertório formando um "U" ou um "W": comece forte, reduza o ritmo no meio do show para canções mais reflexivas ou acústicas, e termine com as músicas mais conhecidas e vibrantes no final.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Transições Inteligentes e Transposição</h2>
          <p>O maior inimigo de um show fluido é o "silêncio constrangedor" entre as músicas. Planeje ligar uma música na outra. Para isso, os tons musicais precisam conversar. Se uma música termina em Sol Maior (G), começar a próxima em Dó (C) ou no próprio Sol cria uma ponte perfeita. É aqui que ferramentas de transposição automática de cifras, como o <strong>PromptLab Brasil</strong>, salvam a vida do produtor musical, permitindo alterar o tom de todo o PDF com um clique.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Adapte-se ao Tempo e ao Público</h2>
          <p>Tenha sempre "músicas curingas" anotadas no final da folha. Se o show precisar ser encurtado, você já sabe o que cortar sem destruir a narrativa. Se pedirem "mais uma", você tem um bis ensaiado e formatado no ponto.</p>

          <div className="bg-[#1e293b] p-6 rounded-xl border border-blue-500/30 mt-8">
            <h3 className="text-white font-bold mb-2">Pronto para criar seu próximo setlist?</h3>
            <p className="text-sm mb-4">Pare de lutar contra editores de texto complicados. Use o construtor do PromptLab para colar suas cifras, ajustar os tons e gerar um PDF perfeito para toda a banda ler no palco.</p>
            <Link href="/" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm">
              Criar Setlist Grátis Agora
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
