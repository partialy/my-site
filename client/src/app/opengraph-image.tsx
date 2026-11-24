import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getSiteProfile } from "@/services/siteService";

export const alt = "个人主页与作品集";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type OgFontOption = NonNullable<
  NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]
>[number];

let cachedFontsPromise: Promise<OgFontOption[]> | null = null;

function loadLocalOgFonts(): Promise<OgFontOption[]> {
  if (!cachedFontsPromise) {
    const fontsDir = path.join(process.cwd(), "fonts");
    cachedFontsPromise = Promise.all([
      readFile(path.join(fontsDir, "plus-jakarta-sans-latin-400-normal.woff")),
      readFile(path.join(fontsDir, "plus-jakarta-sans-latin-600-normal.woff")),
      readFile(path.join(fontsDir, "plus-jakarta-sans-latin-700-normal.woff")),
      readFile(path.join(fontsDir, "NotoSansSC-Regular.otf")),
      readFile(path.join(fontsDir, "NotoSansSC-Bold.otf")),
    ]).then(([pjs400, pjs600, pjs700, noto400, noto700]) => [
      { name: "Plus Jakarta Sans", data: pjs400, weight: 400, style: "normal" },
      { name: "Plus Jakarta Sans", data: pjs600, weight: 600, style: "normal" },
      { name: "Plus Jakarta Sans", data: pjs700, weight: 700, style: "normal" },
      { name: "Noto Sans SC", data: noto400, weight: 400, style: "normal" },
      { name: "Noto Sans SC", data: noto700, weight: 700, style: "normal" },
    ]);
  }
  return cachedFontsPromise;
}

export default async function Image() {
  const [site, fonts] = await Promise.all([
    getSiteProfile(),
    loadLocalOgFonts(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 84px",
          background:
            "linear-gradient(135deg, #08090c 0%, #131722 55%, #08090c 100%)",
          color: "#f4f5f7",
          fontFamily: '"Plus Jakarta Sans", "Noto Sans SC", sans-serif',
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: 28,
            color: "#e5a93c",
            fontWeight: 600,
          }}
        >
          <span>{site.brandName}</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              fontSize: 58,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            {site.title}
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#9499a6",
              lineHeight: 1.4,
            }}
          >
            {site.description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#7c8291",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            paddingTop: "24px",
          }}
        >
          <span>{site.domainLabel}</span>
          <span>{site.authorName}</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
    }
  );
}
