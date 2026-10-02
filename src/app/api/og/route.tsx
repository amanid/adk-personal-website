import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || "KONAN Amani Dieudonné";
  const subtitle = searchParams.get("subtitle") || "Global Statistician, Data, ML & AI Professional";
  const type = searchParams.get("type") || "page";

  const typeColors: Record<string, string> = {
    page: "#ea5536",
    blog: "#3d82ee",
    publication: "#9a7be8",
    project: "#c9b98a",
  };

  const accentColor = typeColors[type] || "#ea5536";

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
          background: "#111110",
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
            color: "#edeae3",
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
            color: "#c4bfb4",
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
                color: "#9a968c",
              }}
            >
              konanamanidieudonne.org
            </div>
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#9a968c",
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
