import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Kirana Cash Flow AI — Remote Underwriting for NBFC",
  description:
    "AI-powered cash flow estimation for Indian kirana stores. Upload shop photos and GPS location to get instant revenue ranges, confidence scores, and risk flags — no physical visit needed.",
  keywords: "kirana, NBFC, cash flow, underwriting, AI, India, loan, fintech",
  openGraph: {
    title: "Kirana Cash Flow AI",
    description: "Remote cash flow underwriting for Indian kirana stores using AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="bg-dark-800 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
