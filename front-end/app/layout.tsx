import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { headers } from 'next/headers';

import Notification from "@/components/features/shared/notification";

import "./globals.css";
import Providers from "@/providers";


const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Home",
  description: "A simple Trello",
};

export default async function RootLayout(
  {  children }: Readonly<{ children: React.ReactNode; }>
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const nonce = (await headers()).get('x-nonce')
  
  return (
    <html lang="pt-br">
      <body className={`${inter.className}`}>
        <Providers>{children}</Providers>
        <Notification />
      </body>
    </html>
  );
}
