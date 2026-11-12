import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "fern — instant storefronts",
  description: "Pick a template or describe it, upload products, get a live store.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {/* Inter (body/UI) + Fraunces (display serif) + Plus Jakarta Sans (labels/headings) + Material Symbols.
            Stylesheet links carry precedence so React hoists them into <head> — keeps hydration clean. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Space+Grotesk:wght@500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
          precedence="default"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
          precedence="default"
        />
        {children}
      </body>
    </html>
  );
}
