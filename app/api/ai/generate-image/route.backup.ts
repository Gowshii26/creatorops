import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

import { getWorkspaceContext } from "@/lib/auth/workspace";

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

const allowedRoles = new Set([
  "admin",
  "manager",
  "creator",
]);

function chooseAspectRatio(
  platform: string,
  contentType: string
): AspectRatio {
  const normalizedPlatform =
    platform.toLowerCase();

  const normalizedType =
    contentType.toLowerCase();

  if (
    normalizedType === "reel" ||
    normalizedType === "story" ||
    normalizedType === "video"
  ) {
    return "9:16";
  }

  if (
    normalizedPlatform === "instagram"
  ) {
    return "4:5";
  }

  if (
    normalizedPlatform === "youtube"
  ) {
    return "16:9";
  }

  return "1:1";
}

export async function POST(
  request: Request
) {
  try {
    /*
     * -----------------------------------------
     * 1. Authenticate CreatorOps user
     * -----------------------------------------
     */

    const workspaceResult =
      await getWorkspaceContext();

    if (!workspaceResult.data) {
      return NextResponse.json(
        {
          error:
            workspaceResult.error ||
            "Workspace access denied.",
        },
        {
          status:
            workspaceResult.status || 401,
        }
      );
    }

    const workspace =
      workspaceResult.data;

    /*
     * -----------------------------------------
     * 2. Authorize role
     * -----------------------------------------
     */

    if (
      !allowedRoles.has(
        workspace.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "AI image generation is available only to Administrators, Managers and Creators.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -----------------------------------------
     * 3. Check API configuration
     * -----------------------------------------
     */

    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error(
        "GEMINI_API_KEY is missing."
      );

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

    /*
     * -----------------------------------------
     * 4. Read request
     * -----------------------------------------
     */

    const body =
      (await request.json()) as
        GenerateImageRequest;

    const brief =
      body.brief?.trim() || "";

    const campaignName =
      body.campaignName?.trim() || "";

    const platform =
      body.platform?.trim() ||
      "social media";

    const contentType =
      body.contentType?.trim() ||
      "post";

    if (brief.length < 5) {
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

    /*
     * -----------------------------------------
     * 5. Pick correct media dimensions
     * -----------------------------------------
     */

    const aspectRatio =
      chooseAspectRatio(
        platform,
        contentType
      );

    /*
     * -----------------------------------------
     * 6. Build image prompt
     * -----------------------------------------
     */

    const prompt = `
Create a professional marketing creative for CreatorOps.

This image is a DRAFT creative that will later go through
human review and approval.

CAMPAIGN:
${campaignName || "Not specified"}

PLATFORM:
${platform}

CONTENT TYPE:
${contentType}

CREATIVE BRIEF:
${brief}

Creative requirements:

- Create an attractive, professional social-media visual.
- The visual must clearly relate to the supplied brief.
- Use modern commercial photography or advertising composition.
- Make the subject visually strong and suitable for social media.
- Use realistic lighting and professional composition.
- Keep the visual clean and premium.
- Do not include watermarks.
- Do not invent certifications, prices, medical claims,
  statistics or guarantees.
- Avoid unnecessary text inside the generated image.
- Do not generate fake brand logos.
- Leave enough clean visual space so marketing copy could
  later be added by a designer if required.
- Match the composition to the ${aspectRatio} format.
`;

    /*
     * -----------------------------------------
     * 7. Call Gemini image model
     * -----------------------------------------
     */

    const ai =
      new GoogleGenAI({
        apiKey,
      });

    const interaction =
      await ai.interactions.create({
        model:
          "gemini-nano-banana-2.1",

        input: prompt,

        response_format: {
          type: "image",
          mime_type:
            "image/jpeg",
          aspect_ratio:
            aspectRatio,
          image_size: "1K",
        },
      });

    /*
     * -----------------------------------------
     * 8. Extract generated image
     * -----------------------------------------
     */

    const generatedImage =
      interaction.output_image;

    if (
      !generatedImage ||
      !generatedImage.data
    ) {
      throw new Error(
        "Gemini did not return an image."
      );
    }

    /*
     * -----------------------------------------
     * 9. Return preview
     * -----------------------------------------
     */

    const dataUrl =
      `data:image/jpeg;base64,${generatedImage.data}`;

    return NextResponse.json({
      image: {
        dataUrl,
        mimeType:
          "image/jpeg",
        aspectRatio,
      },

      metadata: {
        aiGenerated: true,
        model:
          "gemini-nano-banana-2.1",
        generatedAt:
          new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "AI image generation error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unknown image generation error.";

    return NextResponse.json(
      {
        error:
          "Unable to generate AI image.",
        details:
          process.env.NODE_ENV ===
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