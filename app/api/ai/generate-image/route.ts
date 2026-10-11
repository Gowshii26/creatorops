import {
  NextResponse,
} from "next/server";

import {
  GoogleGenAI,
  Type,
} from "@google/genai";

import {
  getWorkspaceContext,
} from "@/lib/auth/workspace";

export const runtime = "nodejs";

type GenerateImageRequest = {
  brief?: string;
  campaignName?: string;
  platform?: string;
  contentType?: string;
};

type AspectRatio =
  | "1:1"
  | "4:5"
  | "9:16"
  | "16:9";

type CreativeSpec = {
  headline?: string;
  subheadline?: string;
  badge?: string;
  palette?: string;
};

const allowedRoles =
  new Set([
    "admin",
    "manager",
    "creator",
  ]);

const MODEL =
  "gemini-3.1-flash-lite";

const palettes = {
  violet: [
    "#17112f",
    "#6d28d9",
    "#c4b5fd",
  ],
  ocean: [
    "#082f49",
    "#0369a1",
    "#67e8f9",
  ],
  sunset: [
    "#7c2d12",
    "#ea580c",
    "#fde68a",
  ],
  forest: [
    "#052e16",
    "#15803d",
    "#86efac",
  ],
  rose: [
    "#4c0519",
    "#be123c",
    "#fda4af",
  ],
  midnight: [
    "#020617",
    "#1e293b",
    "#38bdf8",
  ],
  sand: [
    "#78350f",
    "#d97706",
    "#fef3c7",
  ],
} as const;

type PaletteName =
  keyof typeof palettes;

function chooseAspectRatio(
  platform: string,
  contentType: string
): AspectRatio {
  const type =
    contentType
      .toLowerCase();

  if (
    type === "reel" ||
    type === "story" ||
    type === "video"
  ) {
    return "9:16";
  }

  if (
    platform
      .toLowerCase() ===
    "instagram"
  ) {
    return "4:5";
  }

  if (
    platform
      .toLowerCase() ===
    "youtube"
  ) {
    return "16:9";
  }

  return "1:1";
}

function dimensions(
  ratio: AspectRatio
) {
  if (ratio === "9:16") {
    return [1080, 1920];
  }

  if (ratio === "16:9") {
    return [1920, 1080];
  }

  if (ratio === "4:5") {
    return [1080, 1350];
  }

  return [1080, 1080];
}

function escapeXml(
  value: string
) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function clean(
  value: unknown,
  fallback: string,
  limit: number
) {
  if (
    typeof value !==
    "string"
  ) {
    return fallback;
  }

  const output =
    value
      .replace(/\s+/g, " ")
      .trim();

  return (
    output ||
    fallback
  ).slice(
    0,
    limit
  );
}

function pickPalette(
  value: unknown
): PaletteName {
  if (
    typeof value ===
      "string" &&
    value in palettes
  ) {
    return value as
      PaletteName;
  }

  return "violet";
}

function wrap(
  text: string,
  maxChars: number,
  maxLines: number
) {
  const words =
    text.split(/\s+/);

  const lines:
    string[] = [];

  let line = "";

  for (
    const word of words
  ) {
    const next =
      line
        ? `${line} ${word}`
        : word;

    if (
      next.length <=
        maxChars ||
      !line
    ) {
      line = next;
      continue;
    }

    lines.push(line);
    line = word;

    if (
      lines.length >=
      maxLines - 1
    ) {
      break;
    }
  }

  if (
    line &&
    lines.length <
      maxLines
  ) {
    lines.push(line);
  }

  return lines;
}

function makeSvg(
  spec: CreativeSpec,
  ratio: AspectRatio,
  campaignName: string
) {
  const [
    width,
    height,
  ] =
    dimensions(ratio);

  const paletteName =
    pickPalette(
      spec.palette
    );

  const [
    bgA,
    bgB,
    accent,
  ] =
    palettes[
      paletteName
    ];

  const headline =
    clean(
      spec.headline,
      campaignName ||
        "Create Something Remarkable",
      80
    );

  const subheadline =
    clean(
      spec.subheadline,
      "AI-assisted creative concept generated from your campaign brief.",
      130
    );

  const badge =
    clean(
      spec.badge,
      "CREATOROPS AI",
      30
    ).toUpperCase();

  const headlineLines =
    wrap(
      headline,
      ratio === "9:16"
        ? 17
        : 22,
      3
    );

  const bodyLines =
    wrap(
      subheadline,
      ratio === "9:16"
        ? 30
        : 44,
      3
    );

  const margin =
    Math.round(
      width * 0.075
    );

  const headlineSize =
    ratio === "9:16"
      ? 94
      : 84;

  const bodySize =
    ratio === "9:16"
      ? 34
      : 30;

  const headlineY =
    height * 0.5;

  const headlineSvg =
    headlineLines
      .map(
        (
          line,
          index
        ) =>
          `<tspan x="${margin}" dy="${index === 0 ? 0 : headlineSize * 1.08}">${escapeXml(line)}</tspan>`
      )
      .join("");

  const bodyY =
    headlineY +
    headlineLines.length *
      headlineSize *
      1.08 +
    45;

  const bodySvg =
    bodyLines
      .map(
        (
          line,
          index
        ) =>
          `<tspan x="${margin}" dy="${index === 0 ? 0 : bodySize * 1.45}">${escapeXml(line)}</tspan>`
      )
      .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bgA}"/>
      <stop offset="100%" stop-color="${bgB}"/>
    </linearGradient>
    <radialGradient id="glow">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bg)"/>

  <circle cx="${width * 0.82}" cy="${height * 0.18}" r="${Math.min(width, height) * 0.3}" fill="url(#glow)"/>
  <circle cx="${width * 0.82}" cy="${height * 0.18}" r="${Math.min(width, height) * 0.14}" fill="${accent}" opacity="0.8"/>
  <circle cx="${width * 0.82}" cy="${height * 0.18}" r="${Math.min(width, height) * 0.2}" fill="none" stroke="${accent}" stroke-width="8" opacity="0.28"/>

  <path d="M 0 ${height * 0.31} C ${width * 0.28} ${height * 0.15}, ${width * 0.62} ${height * 0.46}, ${width} ${height * 0.25}" fill="none" stroke="${accent}" stroke-width="8" opacity="0.17"/>

  <rect x="${margin}" y="${margin}" width="${Math.min(width * 0.42, 450)}" height="72" rx="28" fill="#ffffff" opacity="0.12"/>

  <text x="${margin + 28}" y="${margin + 47}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" letter-spacing="2">
    ${escapeXml(badge)}
  </text>

  <text x="${margin}" y="${headlineY}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="${headlineSize}" font-weight="800" letter-spacing="-2">
    ${headlineSvg}
  </text>

  <text x="${margin}" y="${bodyY}" fill="#ffffff" opacity="0.78" font-family="Arial, Helvetica, sans-serif" font-size="${bodySize}" font-weight="400">
    ${bodySvg}
  </text>

  <line x1="${margin}" y1="${height - margin * 1.55}" x2="${width - margin}" y2="${height - margin * 1.55}" stroke="${accent}" stroke-width="2" opacity="0.4"/>

  <text x="${margin}" y="${height - margin}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="600">
    ${escapeXml(campaignName || "CreatorOps")}
  </text>

  <text x="${width - margin}" y="${height - margin}" text-anchor="end" fill="#ffffff" opacity="0.62" font-family="Arial, Helvetica, sans-serif" font-size="18">
    AI DRAFT • HUMAN REVIEW REQUIRED
  </text>
</svg>`;
}

export async function POST(
  request: Request
) {
  try {
    const workspaceResult =
      await getWorkspaceContext();

    if (
      !workspaceResult.data
    ) {
      return NextResponse.json(
        {
          error:
            workspaceResult.error ||
            "Workspace access denied.",
        },
        {
          status:
            workspaceResult.status ||
            401,
        }
      );
    }

    if (
      !allowedRoles.has(
        workspaceResult
          .data.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "AI creative generation is available only to Administrators, Managers and Creators.",
        },
        {
          status: 403,
        }
      );
    }

    const apiKey =
      process.env
        .GEMINI_API_KEY
        ?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini AI is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      (await request.json()) as
        GenerateImageRequest;

    const brief =
      body.brief?.trim() ||
      "";

    const campaignName =
      body.campaignName
        ?.trim() ||
      "CreatorOps Campaign";

    const platform =
      body.platform
        ?.trim() ||
      "social media";

    const contentType =
      body.contentType
        ?.trim() ||
      "post";

    if (
      brief.length < 5
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide a content brief of at least 5 characters.",
        },
        {
          status: 400,
        }
      );
    }

    const aspectRatio =
      chooseAspectRatio(
        platform,
        contentType
      );

    const ai =
      new GoogleGenAI({
        apiKey,
      });

    const response =
      await ai.models
        .generateContent({
          model: MODEL,
          contents: `
Create a social-media visual concept for CreatorOps.

Campaign: ${campaignName}
Platform: ${platform}
Content type: ${contentType}
Brief: ${brief}

Return:
- headline: short and campaign-relevant
- subheadline: one short supporting sentence
- badge: 1 to 4 words
- palette: exactly one of violet, ocean, sunset, forest, rose, midnight, sand

Do not invent prices, medical claims, certifications, statistics or guarantees.
`,
          config: {
            responseMimeType:
              "application/json",
            responseSchema: {
              type:
                Type.OBJECT,
              properties: {
                headline: {
                  type:
                    Type.STRING,
                },
                subheadline: {
                  type:
                    Type.STRING,
                },
                badge: {
                  type:
                    Type.STRING,
                },
                palette: {
                  type:
                    Type.STRING,
                },
              },
              required: [
                "headline",
                "subheadline",
                "badge",
                "palette",
              ],
            },
          },
        });

    if (
      !response.text
    ) {
      throw new Error(
        "Gemini did not return a creative design."
      );
    }

    const spec =
      JSON.parse(
        response.text
      ) as
        CreativeSpec;

    const svg =
      makeSvg(
        spec,
        aspectRatio,
        campaignName
      );

    const dataUrl =
      `data:image/svg+xml;base64,${Buffer.from(
        svg,
        "utf8"
      ).toString(
        "base64"
      )}`;

    return NextResponse.json({
      image: {
        dataUrl,
        mimeType:
          "image/svg+xml",
        aspectRatio,
      },
      metadata: {
        aiGenerated:
          true,
        generationMode:
          "gemini-designed-svg",
        model: MODEL,
        generatedAt:
          new Date()
            .toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "AI creative generation error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unknown AI creative generation error.";

    return NextResponse.json(
      {
        error:
          "Unable to generate AI creative.",
        details:
          process.env
            .NODE_ENV ===
          "development"
            ? message
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}
