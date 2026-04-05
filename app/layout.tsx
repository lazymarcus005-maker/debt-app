import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finance Manager",
  description: "Personal finance management app",
  viewport: "width=device-width, initial-scale=1"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
