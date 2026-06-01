export default function Privacidade() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-8">
      <div className="max-w-3xl mx-auto bg-[#0f172a] border border-slate-800 p-8 rounded-xl shadow-2xl mt-10">
        <h1 className="text-3xl font-black text-white mb-6 uppercase">Política de Privacidade</h1>
        <div className="space-y-4 text-sm leading-relaxed">
          <p>A sua privacidade é fundamental para nós no <strong>PromptLab Brasil</strong>. Esta política descreve como as suas informações são tratadas ao utilizar a nossa plataforma.</p>
          <h2 className="text-white font-bold mt-4 text-lg">1. Armazenamento Local (Local Storage)</h2>
          <p>O PromptLab Brasil foi projetado com foco na sua privacidade e segurança. Os repertórios, letras de músicas e configurações que você insere <strong>não são enviados ou salvos em nossos servidores</strong>. Utilizamos a tecnologia de <em>Local Storage</em> do seu navegador para garantir que você não perca seus dados ao fechar a aba acidentalmente, bem como para a sua Biblioteca pessoal de repertórios. Você tem controle total e pode apagar esses dados a qualquer momento limpando o cache do seu próprio navegador.</p>
          <h2 className="text-white font-bold mt-4 text-lg">2. Cookies e Google AdSense</h2>
          <p>Para manter a ferramenta gratuita para todos os músicos, exibimos anúncios de parceiros fornecidos pelo Google AdSense. O Google utiliza cookies para veicular anúncios com base em suas visitas a este e a outros sites na Internet.</p>
          <h2 className="text-white font-bold mt-4 text-lg">3. Coleta de Dados Analíticos</h2>
          <p>Utilizamos ferramentas padrão da indústria para análise de tráfego a fim de entender, de forma totalmente anônima, o volume de acesso ao site. Nenhuma informação pessoal é coletada neste processo.</p>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-800">
          <a href="/" className="text-blue-400 hover:text-blue-300 font-bold">&larr; Voltar para a ferramenta</a>
        </div>
      </div>
    </div>
  )
}
