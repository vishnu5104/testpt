"use client";
import { Inter } from 'next/font/google'
import './globals.css'
import {AbstraxionProvider} from "@burnt-labs/abstraxion";

import "@burnt-labs/abstraxion/dist/index.css";
import "@burnt-labs/ui/dist/index.css";
import { TREASURY } from '@/utils/constants';
// import { CONTRACTS_ARRAY } from '@/utils/constants';

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AbstraxionProvider config={{ ...TREASURY }} >
        {/* <AbstraxionProvider config={{ contracts: CONTRACTS_ARRAY }} > */}
          {children}
        </AbstraxionProvider>
      </body>
    </html>
  )
}
