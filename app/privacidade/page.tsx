import Link from "next/link"

export const metadata = {
  title: "Política de Privacidade — PromptLab BR",
  description: "Política de Privacidade do PromptLab Brasil. Saiba como tratamos seus dados, cookies e anúncios."
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Orbs */}
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="orb orb3" />

      {/* Header */}
      <header className="relative z-10 max-w-[1240px] mx-auto px-5 pt-10 pb-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[#8fa2be] hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Voltar ao PromptLab
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-[800px] mx-auto px-5 pb-16">
        <div className="panel p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Política de Privacidade
          </h1>
          <p className="text-[#8fa2be] mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>

          <div className="space-y-8 text-[#c5d4e8] leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Introdução</h2>
              <p>
                O PromptLab Brasil (&quot;nós&quot;, &quot;nosso&quot; ou &quot;site&quot;) respeita a sua privacidade e está comprometido em proteger os dados pessoais que você compartilha conosco. Esta Política de Privacidade explica como coletamos, usamos e protegemos suas informações quando você utiliza nosso site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Informações que Coletamos</h2>
              <p className="mb-3">Podemos coletar os seguintes tipos de informações:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong className="text-white">Dados de uso:</strong> informações sobre como você interage com o site, incluindo páginas visitadas, tempo de permanência e ações realizadas.</li>
                <li><strong className="text-white">Dados técnicos:</strong> endereço IP, tipo de navegador, sistema operacional, resolução de tela e outras informações técnicas.</li>
                <li><strong className="text-white">Cookies e tecnologias similares:</strong> utilizamos cookies para melhorar sua experiência e para fins de análise e publicidade.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Uso de Cookies</h2>
              <p className="mb-3">
                O PromptLab Brasil utiliza cookies e tecnologias similares para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Garantir o funcionamento adequado do site</li>
                <li>Lembrar suas preferências e configurações</li>
                <li>Analisar o tráfego e uso do site</li>
                <li>Exibir anúncios personalizados</li>
              </ul>
              <p className="mt-3">
                Você pode gerenciar suas preferências de cookies através das configurações do seu navegador. Note que desabilitar certos cookies pode afetar a funcionalidade do site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Google AdSense e Publicidade</h2>
              <p className="mb-3">
                O PromptLab Brasil pode exibir anúncios fornecidos pelo Google AdSense e outros parceiros de publicidade. Esses serviços podem utilizar cookies e tecnologias similares para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Exibir anúncios relevantes baseados em seus interesses</li>
                <li>Limitar o número de vezes que você vê um anúncio</li>
                <li>Medir a eficácia das campanhas publicitárias</li>
              </ul>
              <p className="mt-3">
                O Google pode usar dados coletados para personalizar anúncios em outros sites. Para mais informações sobre como o Google usa seus dados, visite a{" "}
                <a 
                  href="https://policies.google.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#7c5cff] hover:underline"
                >
                  Política de Privacidade do Google
                </a>
                . Você pode optar por não receber anúncios personalizados visitando as{" "}
                <a 
                  href="https://www.google.com/settings/ads" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#7c5cff] hover:underline"
                >
                  Configurações de Anúncios do Google
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Como Usamos Suas Informações</h2>
              <p className="mb-3">Utilizamos as informações coletadas para:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Fornecer e manter nossos serviços</li>
                <li>Melhorar a experiência do usuário</li>
                <li>Analisar tendências de uso e desempenho do site</li>
                <li>Exibir publicidade relevante</li>
                <li>Cumprir obrigações legais</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Compartilhamento de Dados</h2>
              <p>
                Não vendemos suas informações pessoais. Podemos compartilhar dados com terceiros apenas nas seguintes situações:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
                <li>Com provedores de serviços que nos auxiliam na operação do site</li>
                <li>Com parceiros de publicidade (como Google AdSense)</li>
                <li>Quando exigido por lei ou ordem judicial</li>
                <li>Para proteger nossos direitos legais</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Segurança dos Dados</h2>
              <p>
                Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição. No entanto, nenhum método de transmissão pela Internet é 100% seguro.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Seus Direitos</h2>
              <p className="mb-3">
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos ou desatualizados</li>
                <li>Solicitar a exclusão de seus dados</li>
                <li>Revogar o consentimento para o uso de seus dados</li>
                <li>Obter informações sobre o compartilhamento de seus dados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Alterações nesta Política</h2>
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente. Recomendamos que você revise esta página regularmente para se manter informado sobre quaisquer alterações. A data da última atualização será sempre indicada no topo desta página.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Contato</h2>
              <p>
                Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos seus dados, entre em contato conosco através do site.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
