import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || "KONAN Amani Dieudonné";
  const subtitle = searchParams.get("subtitle") || "Full-Stack Senior Statistician, Data, ML & AI Professional";
  const type = searchParams.get("type") || "page";

  const typeColors: Record<string, string> = {
    page: "#c9a84c",
    blog: "#22d3ee",
    publication: "#a78bfa",
    project: "#34d399",
  };

  const accentColor = typeColors[type] || "#c9a84c";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          background: "linear-gradient(135deg, #0c0c14 0%, #0f1629 50%, #1a2540 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: accentColor,
          }}
        />

        {/* Type badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              padding: "4px 16px",
              borderRadius: "20px",
              background: `${accentColor}22`,
              color: accentColor,
              fontSize: "16px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            {type === "blog" ? "Blog Post" : type === "publication" ? "Publication" : type === "project" ? "Project" : ""}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 60 ? "36px" : "48px",
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.2,
            marginBottom: "16px",
            maxWidth: "900px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "20px",
            color: "#9ca3af",
            maxWidth: "800px",
            lineHeight: 1.4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {subtitle}
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "80px",
            right: "80px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: accentColor,
              }}
            >
              ADK
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              konanamanidieudonne.org
            </div>
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            KONAN Amani Dieudonné
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
