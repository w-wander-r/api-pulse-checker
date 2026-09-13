import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "API Pulse Check",
  description: "A Postman-like API testing tool for the web",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
