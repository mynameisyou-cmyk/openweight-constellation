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

const CHILLFI_SITE = "openweight";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <aside className="chillfi-door" aria-label="開心會 chill-fi">
          <iframe
            src={`https://yu-and-ai-chillfi.static.hf.space/embed.html?site=${CHILLFI_SITE}`}
            width="260"
            height="52"
            loading="lazy"
            title={`開心會 chill-fi — ${CHILLFI_SITE}`}
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
          <small>開心會 chill-fi · this door's own track · 撳 ▶ 先響, never autoplays</small>
        </aside>
      </body>
    </html>
  );
}

