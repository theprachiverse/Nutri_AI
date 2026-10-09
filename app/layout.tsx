import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NutriAI — Evidence-Based Nutrition Intelligence',
  description:
    'Clinical syntheses, molecular kinetics, and primary sources translated into everyday clarity. Your evidence-based nutrition intelligence companion.',
  keywords: 'nutrition, AI, health, supplements, diet, wellness, evidence-based',
  openGraph: {
    title: 'NutriAI — Evidence-Based Nutrition Intelligence',
    description: 'Evidence-based answers about food, nutrition, and supplements. Powered by clinical research.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Literata + DM Sans */}
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Literata:ital,opsz,wght@0,7..72,200..900;1,7..72,200..900&display=swap"
          rel="stylesheet"
        />
        {/* Material Symbols */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body 
        className="font-body-md text-body-md text-on-surface min-h-screen antialiased selection:bg-primary-fixed selection:text-on-primary-fixed h-full"
        style={{
          backgroundColor: '#f8fafc',
          backgroundImage: "url('/nutrition_chat_bg.jpg')",
          backgroundRepeat: 'repeat',
          backgroundSize: '480px 450px',
          backgroundAttachment: 'fixed',
        }}
      >
        {children}
      </body>
    </html>
  );
}
