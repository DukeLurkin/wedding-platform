import type { Metadata } from "next";
import { cormorant, inter } from "./ui/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kelly & Luke",
  description: "Wedding celebration — April 11, 2027 at the Water Works in Philadelphia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}