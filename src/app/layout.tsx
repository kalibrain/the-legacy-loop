import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { LegacyLoopProvider } from "@/components/providers/legacy-loop-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Legacy Loop",
  description: "AI-powered institutional knowledge transfer prototype",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LegacyLoopProvider>{children}</LegacyLoopProvider>
      </body>
    </html>
  );
}
