"use client";

import {
  useState,
  type FormEvent,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  FilePlus2,
  Loader2,
  Plus,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AIGeneration = {
  caption: string;
  hashtags: string[];
  visualConcept: string;
};

export default function CreateContentDialog() {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState(false);

  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("");
  const [contentType, setContentType] = useState("");

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");

  const [aiBrief, setAiBrief] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiGeneration, setAiGeneration] =
    useState<AIGeneration | null>(null);

  function handleCreate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    // Existing CreatorOps demo behaviour.
    setCreated(true);
  }

  function resetForm() {
    setTitle("");
    setPlatform("");
    setContentType("");
    setCaption("");
    setHashtags("");

    setAiBrief("");
    setAiError("");
    setAiGeneration(null);
    setAiLoading(false);
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);

    if (!value) {
      setCreated(false);
      resetForm();
    }
  }

  function closeDialog() {
    setOpen(false);
    setCreated(false);
    resetForm();
  }

  async function handleGenerateWithAI() {
    setAiError("");

    const brief = aiBrief.trim();

    if (brief.length < 5) {
      setAiError(
        "Enter a short content brief before generating."
      );
      return;
    }

    try {
      setAiLoading(true);
      setAiGeneration(null);

      const response = await fetch(
        "/api/ai/generate",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            brief,
            campaignName:
              "Autumn Launch 2026",
            platform:
              platform ||
              "Social Media",
            existingHashtags:
              hashtags,
            brandVoice:
              "Professional, engaging, modern and natural",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to generate content."
        );
      }

      if (!data.generation) {
        throw new Error(
          "AI generation result was missing."
        );
      }

      setAiGeneration({
        caption:
          data.generation.caption || "",
        hashtags:
          data.generation.hashtags || [],
        visualConcept:
          data.generation.visualConcept || "",
      });
    } catch (error) {
      console.error(
        "AI content generation error:",
        error
      );

      setAiError(
        error instanceof Error
          ? error.message
          : "Unable to generate AI content."
      );
    } finally {
      setAiLoading(false);
    }
  }

  function handleUseAIContent() {
    if (!aiGeneration) {
      return;
    }

    setCaption(
      aiGeneration.caption
    );

    setHashtags(
      aiGeneration.hashtags.join(" ")
    );
  }

  return (
    <>
      <Button
        className="gap-2"
        onClick={() => {
          setCreated(false);
          setOpen(true);
        }}
      >
        <Plus size={17} />
        Create Content
      </Button>

      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
          {!created ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  Create Content
                </DialogTitle>

                <DialogDescription>
                  Add a new content piece to
                  the Autumn Launch 2026
                  campaign.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={handleCreate}
                className="space-y-5 pt-3"
              >
                {/* CONTENT TITLE */}
                <div className="space-y-2">
                  <Label htmlFor="content-title">
                    Content Title
                  </Label>

                  <Input
                    id="content-title"
                    placeholder="e.g. Cinnamon Latte Launch Reel"
                    value={title}
                    onChange={(event) =>
                      setTitle(
                        event.target.value
                      )
                    }
                    required
                  />
                </div>

                {/* PLATFORM + TYPE */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Platform
                    </Label>

                    <Select
                      value={platform}
                      onValueChange={(value) =>
                        setPlatform(
                          value ?? ""
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="instagram">
                          Instagram
                        </SelectItem>

                        <SelectItem value="linkedin">
                          LinkedIn
                        </SelectItem>

                        <SelectItem value="tiktok">
                          TikTok
                        </SelectItem>

                        <SelectItem value="facebook">
                          Facebook
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Content Type
                    </Label>

                    <Select
                      value={contentType}
                      onValueChange={(value) =>
                        setContentType(
                          value ?? ""
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="reel">
                          Reel
                        </SelectItem>

                        <SelectItem value="carousel">
                          Carousel
                        </SelectItem>

                        <SelectItem value="story">
                          Story
                        </SelectItem>

                        <SelectItem value="post">
                          Static Post
                        </SelectItem>

                        <SelectItem value="video">
                          Video
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* AI ASSISTANT */}
                <div className="rounded-xl border bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                      <Sparkles
                        size={18}
                        className="text-violet-600"
                      />
                    </div>

                    <div>
                      <p className="font-semibold">
                        CreatorOps AI
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Generate a draft
                        caption, hashtags and
                        visual concept using
                        Gemini.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label htmlFor="ai-brief">
                      Content Brief
                    </Label>

                    <Textarea
                      id="ai-brief"
                      value={aiBrief}
                      onChange={(event) =>
                        setAiBrief(
                          event.target.value
                        )
                      }
                      placeholder="Example: Promote our new Vitamin C serum for an Instagram Reel. Focus on a fresh morning skincare routine and a premium, optimistic tone."
                      className="min-h-24 bg-white"
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      AI creates a draft only.
                      Human review is still
                      required.
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 gap-2"
                      onClick={
                        handleGenerateWithAI
                      }
                      disabled={aiLoading}
                    >
                      {aiLoading ? (
                        <>
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles
                            size={16}
                          />
                          Generate with AI
                        </>
                      )}
                    </Button>
                  </div>

                  {aiError ? (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-sm text-red-700">
                        {aiError}
                      </p>
                    </div>
                  ) : null}

                  {aiGeneration ? (
                    <div className="mt-4 space-y-4 rounded-xl border bg-white p-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          AI Caption
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {
                            aiGeneration.caption
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Suggested Hashtags
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {aiGeneration.hashtags.map(
                            (
                              hashtag,
                              index
                            ) => (
                              <span
                                key={`${hashtag}-${index}`}
                                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                              >
                                {hashtag}
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Visual Concept
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {
                            aiGeneration.visualConcept
                          }
                        </p>
                      </div>

                      <div className="flex justify-end border-t pt-4">
                        <Button
                          type="button"
                          className="gap-2"
                          onClick={
                            handleUseAIContent
                          }
                        >
                          <Sparkles
                            size={16}
                          />
                          Use This Content
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* CAPTION */}
                <div className="space-y-2">
                  <Label htmlFor="caption">
                    Caption
                  </Label>

                  <Textarea
                    id="caption"
                    placeholder="Write the content caption..."
                    className="min-h-32"
                    value={caption}
                    onChange={(event) =>
                      setCaption(
                        event.target.value
                      )
                    }
                  />
                </div>

                {/* HASHTAGS */}
                <div className="space-y-2">
                  <Label htmlFor="hashtags">
                    Hashtags
                  </Label>

                  <Input
                    id="hashtags"
                    placeholder="#UrbanBrew #AutumnLaunch #Coffee"
                    value={hashtags}
                    onChange={(event) =>
                      setHashtags(
                        event.target.value
                      )
                    }
                  />
                </div>

                {/* CREATOR + DATE */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Assign Creator
                    </Label>

                    <Select defaultValue="sarah">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="sarah">
                          Sarah Chen
                        </SelectItem>

                        <SelectItem value="james">
                          James Morgan
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="publish-date">
                      Publish Date
                    </Label>

                    <div className="relative">
                      <CalendarDays
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <Input
                        id="publish-date"
                        type="date"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* REVIEWER */}
                <div className="space-y-2">
                  <Label>
                    Reviewer
                  </Label>

                  <Select defaultValue="james">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="james">
                        James Morgan
                      </SelectItem>

                      <SelectItem value="alex">
                        Alex Morgan
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* MEDIA */}
                <div className="space-y-2">
                  <Label htmlFor="media">
                    Media Asset
                  </Label>

                  <div className="rounded-xl border border-dashed bg-slate-50 p-8 text-center">
                    <FilePlus2
                      size={30}
                      className="mx-auto text-slate-400"
                    />

                    <p className="mt-3 text-sm font-medium">
                      Upload creative asset
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      PNG, JPG, MP4 or PDF
                    </p>

                    <Input
                      id="media"
                      type="file"
                      accept=".png,.jpg,.jpeg,.mp4,.pdf"
                      className="mx-auto mt-4 max-w-xs"
                    />

                    <p className="mt-3 text-[11px] text-slate-400">
                      Upload is simulated in the
                      current demo build.
                    </p>
                  </div>
                </div>

                {/* STATUS INFO */}
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-sm font-semibold">
                    Initial Status
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    New content will be created
                    as a Draft and can then be
                    submitted for internal
                    review.
                  </p>
                </div>

                {/* BUTTONS */}
                <div className="flex justify-end gap-3 border-t pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeDialog}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    className="gap-2"
                  >
                    <Plus size={16} />
                    Save Draft
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2
                  size={32}
                  className="text-green-600"
                />
              </div>

              <h2 className="mt-5 text-2xl font-bold">
                Content Draft Created
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                The content piece has been
                added to Autumn Launch 2026
                as a draft and is ready for
                the creation workflow.
              </p>

              <div className="mt-6 rounded-xl bg-slate-50 px-6 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Status
                </p>

                <p className="mt-1 font-semibold">
                  Draft
                </p>
              </div>

              <Button
                className="mt-6"
                onClick={closeDialog}
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}