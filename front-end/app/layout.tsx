import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from 'next/headers';

import Warning from "@/components/features/shared/warning";

import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Home",
  description: "A simple Sprint Tacker",
};

export default async function RootLayout(
  {  children }: Readonly<{ children: React.ReactNode; }>
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const nonce = (await headers()).get('x-nonce')
  
  return (
    <html lang="pt-br">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <Warning />
      </body>
    </html>
  );
}
