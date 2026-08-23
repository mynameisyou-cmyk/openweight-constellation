import "./globals.css";

export const metadata = {
  title: {
    default: "Openweight Constellation",
    template: "%s · Openweight Constellation",
  },
  description:
    "Four speculative civic worlds for plural open-weight intelligence, joined by a reflective virtue instrument and a read-only protocol.",
  authors: [{ name: "Yu & Ai", url: "https://ai-love.cc" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0b12",
  colorScheme: "dark",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

