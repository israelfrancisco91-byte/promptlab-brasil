import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// ATENÇÃO: Atualizei o SEO aqui! Agora o Google sabe que o site é sobre música,
// o que ajuda absurdamente na aprovação do AdSense e nas buscas orgânicas.
export const metadata: Metadata = {
  title: 'PromptLab BR — Ferramentas Profissionais para Músicos',
  description: 'Gerador de repertório em PDF, cifras, teleprompter inteligente e calculadora de capotraste 100% gratuito.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        {/* ================= CÓDIGOS DO ADSENSE ================= */}
        
        {/* CÓDIGO 2 - Adicionado aqui para verificação de propriedade */}
        <meta name="google-adsense-account" content="ca-pub-9481459303295358" />

        {/* CÓDIGO 1 - Já estava aqui e está perfeito no padrão Next.js */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9481459303295358"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
