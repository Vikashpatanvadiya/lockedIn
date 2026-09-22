import type { Metadata } from "next";
import { Caveat, Fraunces, Inter, Newsreader } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["SOFT", "WONK", "opsz"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], style: ["normal", "italic"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LockedIn — your year, written by you",
  description:
    "A digital journal for the one year that matters most: from this birthday to the next. Write a letter to yourself, set your chapter, and fill one page a day.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${newsreader.variable} ${caveat.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
