export default function Termos() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-8">
      <div className="max-w-3xl mx-auto bg-[#0f172a] border border-slate-800 p-8 rounded-xl shadow-2xl mt-10">
        <h1 className="text-3xl font-black text-white mb-6 uppercase">Termos de Uso</h1>
        <div className="space-y-4 text-sm leading-relaxed">
          <p>Bem-vindo ao <strong>PromptLab Brasil</strong>. Ao acessar e utilizar nossa plataforma, você concorda expressamente com os seguintes Termos de Uso.</p>
          <h2 className="text-white font-bold mt-4 text-lg">1. Natureza do Serviço</h2>
          <p>O PromptLab Brasil é uma ferramenta utilitária e gratuita projetada exclusivamente para auxiliar músicos na formatação, transposição algorítmica e geração de PDFs para cifras musicais e setlists.</p>
          <h2 className="text-white font-bold mt-4 text-lg">2. Responsabilidade sobre o Conteúdo</h2>
          <p>A nossa plataforma <strong>não hospeda, não distribui e não possui</strong> direitos autorais sobre nenhuma letra de música ou cifra. O sistema funciona estritamente como um processador de texto no lado do cliente (no seu dispositivo). O usuário é o único e exclusivo responsável por qualquer conteúdo que decida inserir.</p>
          <h2 className="text-white font-bold mt-4 text-lg">3. Isenção de Garantias</h2>
          <p>O serviço é fornecido "no estado em que se encontra". Não garantimos que a plataforma estará 100% livre de erros ou interrupções. Não nos responsabilizamos por eventuais perdas de dados armazenados localmente (Local Storage) ou problemas técnicos durante apresentações.</p>
          <h2 className="text-white font-bold mt-4 text-lg">4. Modificações dos Termos</h2>
          <p>O PromptLab Brasil reserva-se o direito de revisar estes termos de serviço a qualquer momento, sem aviso prévio.</p>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-800">
          <a href="/" className="text-blue-400 hover:text-blue-300 font-bold">&larr; Voltar para a ferramenta</a>
        </div>
      </div>
    </div>
  )
}
