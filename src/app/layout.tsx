import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import TutorChat from "@/app/components/TutorChat";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EnglishPath | O Teu Guia de Viagem para a Fluência em Inglês",
  description: "Aprende inglês de forma prática e estruturada. EnglishPath é o teu guia de viagem experiente, motivador e focado no inglês real baseado na metodologia Cambridge e QECR.",
  keywords: ["inglês", "aprender inglês", "cambridge", "qecr", "cefr", "curso de inglês", "fluência", "placement test", "speaking", "listening"],
  authors: [{ name: "EnglishPath Team" }],
  openGraph: {
    title: "EnglishPath | O Teu Guia de Viagem para a Fluência",
    description: "Aprende inglês real e estruturado com a metodologia Cambridge / QECR. O teu caminho rumo ao sucesso profissional.",
    type: "website",
    locale: "pt_PT",
    siteName: "EnglishPath",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-PT"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-on-background selection:bg-primary-container selection:text-white">
        <AuthProvider>
          {children}
          <TutorChat />
        </AuthProvider>
      </body>
    </html>
  );
}

