import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "API pulse check",
  description: "Observe your API",
};

export default function RootLayout({children} : {children: React.ReactNode}) {
  return (
    <html lang="en">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>API pulse check</title>
    </head>
    <body>
      <body>{children}</body>
    </body>
    </html>
  )
}
