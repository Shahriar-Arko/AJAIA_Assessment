import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ajaia Docs",
    template: "%s | Ajaia Docs",
  },
  description: "Collaborative rich-text and Markdown document workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#060913] text-slate-100">{children}</body>
    </html>
  );
}