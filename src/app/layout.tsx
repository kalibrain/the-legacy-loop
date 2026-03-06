import type { Metadata } from "next";
import { Sora, Source_Sans_3 } from "next/font/google";
import "@/app/globals.css";
import { LegacyLoopProvider } from "@/components/providers/legacy-loop-provider";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["600", "700", "800"],
});

const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans-3",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Legacy Loop",
  description: "AI-powered institutional knowledge retention prototype",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${sourceSans3.variable} font-sans`}>
        <LegacyLoopProvider>{children}</LegacyLoopProvider>
      </body>
    </html>
  );
}
