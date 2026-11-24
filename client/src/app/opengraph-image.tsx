import { ImageResponse } from "next/og";
import { getSiteProfile } from "@/services/siteService";

export const alt = "个人主页与作品集";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const site = await getSiteProfile();

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
    }
  );
}
