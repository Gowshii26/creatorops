"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Archive,
  CalendarDays,
  Check,
  FileText,
  Hash,
  ImageIcon,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import ContentWorkflowActions from "@/components/content-workflow-actions";

type AppRole =
  | "admin"
  | "manager"
  | "creator"
  | "client";

type ContentStatus =
  | "draft"
  | "internal_review"
  | "changes_requested"
  | "client_review"
  | "approved"
  | "scheduled"
  | "published"
  | "archived";

type Platform =
  | "instagram"
  | "linkedin"
  | "tiktok"
  | "facebook"
  | "youtube"
  | "x"
  | "other";

type ContentType =
  | "post"
  | "reel"
  | "story"
  | "carousel"
  | "video"
  | "article"
  | "other";

type ContentRow = {
  id: string;
  campaign_id: string;
  title: string;
  description: string | null;
  caption: string | null;
  hashtags: string[];
  platform: Platform;
  content_type: ContentType;
  status: ContentStatus;
  creator_id: string | null;
  publish_at: string | null;
  current_version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;

  campaign_name: string;
  client_name: string;
  creator_name: string | null;
};

type CampaignOption = {
  id: string;
  name: string;
  client_id: string;
  client_name: string;
  status: string;
};

type CreatorOption = {
  id: string;
  fullName: string;
};

type AIGeneration = {
  caption: string;
  hashtags: string[];
  visualConcept: string;
};

type ContentForm = {
  campaignId: string;
  title: string;
  description: string;
  caption: string;
  hashtags: string;
  platform: Platform;
  contentType: ContentType;
  creatorId: string;
  publishAt: string;
};

const emptyForm: ContentForm = {
  campaignId: "",
  title: "",
  description: "",
  caption: "",
  hashtags: "",
  platform: "instagram",
  contentType: "post",
  creatorId: "",
  publishAt: "",
};

function formatStatus(
  status: ContentStatus
) {
  if (status === "draft") {
    return "Draft";
  }

  if (status === "internal_review") {
    return "Internal Review";
  }

  if (status === "changes_requested") {
    return "Changes Requested";
  }

  if (status === "client_review") {
    return "Client Review";
  }

  if (status === "approved") {
    return "Approved";
  }

  if (status === "scheduled") {
    return "Scheduled";
  }

  if (status === "published") {
    return "Published";
  }

  return "Archived";
}

function statusClass(
  status: ContentStatus
) {
  if (status === "draft") {
    return "bg-slate-100 text-slate-700";
  }

  if (status === "internal_review") {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "changes_requested") {
    return "bg-red-100 text-red-700";
  }

  if (status === "client_review") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "approved") {
    return "bg-green-100 text-green-700";
  }

  if (status === "scheduled") {
    return "bg-purple-100 text-purple-700";
  }

  if (status === "published") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-slate-100 text-slate-500";
}

function formatPlatform(
  platform: Platform
) {
  if (platform === "x") {
    return "X";
  }

  return (
    platform.charAt(0).toUpperCase() +
    platform.slice(1)
  );
}

function formatType(
  contentType: ContentType
) {
  return (
    contentType.charAt(0).toUpperCase() +
    contentType.slice(1)
  );
}

function formatDateTime(
  value: string | null
) {
  if (!value) {
    return "Not scheduled";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

export default function ContentManagement({
  currentRole,
}: {
  currentRole: AppRole;
}) {
  const [
    contentItems,
    setContentItems,
  ] =
    useState<ContentRow[]>([]);

  const [
    campaigns,
    setCampaigns,
  ] =
    useState<CampaignOption[]>([]);

  const [
    creators,
    setCreators,
  ] =
    useState<CreatorOption[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("all");

  const [
    platformFilter,
    setPlatformFilter,
  ] =
    useState("all");

  const [
    campaignFilter,
    setCampaignFilter,
  ] =
    useState("all");

  const [
    form,
    setForm,
  ] =
    useState<ContentForm>(
      emptyForm
    );

  const [
    editingContent,
    setEditingContent,
  ] =
    useState<ContentRow | null>(
      null
    );

  const [
    showForm,
    setShowForm,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    aiBrief,
    setAiBrief,
  ] =
    useState("");

  const [
    aiLoading,
    setAiLoading,
  ] =
    useState(false);

  const [
    aiImageLoading,
    setAiImageLoading,
  ] =
    useState(false);

  const [
    aiError,
    setAiError,
  ] =
    useState("");

  const [
    aiGeneration,
    setAiGeneration,
  ] =
    useState<AIGeneration | null>(null);

  const [
    aiImageDataUrl,
    setAiImageDataUrl,
  ] =
    useState("");

  const [
    aiImageAspectRatio,
    setAiImageAspectRatio,
  ] =
    useState("");

  const canCreate =
    currentRole !== "client";

  const loadContent =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const response =
            await fetch(
              "/api/content",
              {
                method: "GET",
                cache: "no-store",
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                "Unable to load content."
            );
          }

          setContentItems(
            data.content ?? []
          );

          setCampaigns(
            data.campaigns ?? []
          );

          setCreators(
            data.creators ?? []
          );
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Unable to load content.";

          setError(message);
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const visibleContent =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return contentItems.filter(
        (item) => {
          const matchesSearch =
            !term ||
            item.title
              .toLowerCase()
              .includes(term) ||
            item.campaign_name
              .toLowerCase()
              .includes(term) ||
            item.client_name
              .toLowerCase()
              .includes(term) ||
            (
              item.caption ??
              ""
            )
              .toLowerCase()
              .includes(term);

          const matchesStatus =
            statusFilter ===
              "all" ||
            item.status ===
              statusFilter;

          const matchesPlatform =
            platformFilter ===
              "all" ||
            item.platform ===
              platformFilter;

          const matchesCampaign =
            campaignFilter ===
              "all" ||
            item.campaign_id ===
              campaignFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesPlatform &&
            matchesCampaign
          );
        }
      );
    }, [
      contentItems,
      search,
      statusFilter,
      platformFilter,
      campaignFilter,
    ]);

  function updateField(
    field:
      keyof ContentForm,
    value: string
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function resetAI() {
    setAiBrief("");
    setAiLoading(false);
    setAiImageLoading(false);
    setAiError("");
    setAiGeneration(null);
    setAiImageDataUrl("");
    setAiImageAspectRatio("");
  }

  async function handleGenerateWithAI() {
    const brief = aiBrief.trim();

    if (brief.length < 5) {
      setAiError(
        "Enter a short content brief before generating."
      );
      return;
    }

    setAiLoading(true);
    setAiError("");

    try {
      const selectedCampaign =
        campaigns.find(
          (campaign) =>
            campaign.id ===
            form.campaignId
        );

      const response =
        await fetch(
          "/api/ai/generate",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              brief,
              campaignName:
                selectedCampaign?.name ||
                "Not selected",
              platform:
                form.platform,
              existingHashtags:
                form.hashtags,
              brandVoice:
                "Professional, engaging, modern and natural",
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to generate AI content."
        );
      }

      if (!data.generation) {
        throw new Error(
          "AI generation result was missing."
        );
      }

      setAiGeneration({
        caption:
          data.generation.caption ||
          "",
        hashtags:
          data.generation.hashtags ||
          [],
        visualConcept:
          data.generation.visualConcept ||
          "",
      });
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : "Unable to generate AI content."
      );
    } finally {
      setAiLoading(false);
    }
  }

  async function handleGenerateImage() {
    const brief = aiBrief.trim();

    if (brief.length < 5) {
      setAiError(
        "Enter a short content brief before generating an image."
      );
      return;
    }

    setAiImageLoading(true);
    setAiError("");
    setAiImageDataUrl("");
    setAiImageAspectRatio("");

    try {
      const selectedCampaign =
        campaigns.find(
          (campaign) =>
            campaign.id ===
            form.campaignId
        );

      const response =
        await fetch(
          "/api/ai/generate-image",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              brief,
              campaignName:
                selectedCampaign?.name ||
                "Not selected",
              platform:
                form.platform,
              contentType:
                form.contentType,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.details ||
            data.error ||
            "Unable to generate AI image."
        );
      }

      if (!data.image?.dataUrl) {
        throw new Error(
          "AI image result was missing."
        );
      }

      setAiImageDataUrl(
        data.image.dataUrl
      );

      setAiImageAspectRatio(
        data.image.aspectRatio ||
          ""
      );
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : "Unable to generate AI image."
      );
    } finally {
      setAiImageLoading(false);
    }
  }

  function useAIText() {
    if (!aiGeneration) {
      return;
    }

    updateField(
      "caption",
      aiGeneration.caption
    );

    updateField(
      "hashtags",
      aiGeneration.hashtags.join(" "
      )
    );
  }

  function openCreate() {
    resetAI();

    setEditingContent(
      null
    );

    setForm({
      ...emptyForm,

      campaignId:
        campaigns.length === 1
          ? campaigns[0].id
          : "",

      creatorId:
        currentRole ===
          "creator" &&
        creators.length === 1
          ? creators[0].id
          : "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEdit(
    item: ContentRow
  ) {
    resetAI();

    setEditingContent(
      item
    );

    let publishAt = "";

    if (
      item.publish_at
    ) {
      const date =
        new Date(
          item.publish_at
        );

      if (
        !Number.isNaN(
          date.getTime()
        )
      ) {
        const localDate =
          new Date(
            date.getTime() -
              date.getTimezoneOffset() *
                60000
          );

        publishAt =
          localDate
            .toISOString()
            .slice(0, 16);
      }
    }

    setForm({
      campaignId:
        item.campaign_id,

      title:
        item.title,

      description:
        item.description ??
        "",

      caption:
        item.caption ??
        "",

      hashtags:
        (
          item.hashtags ??
          []
        )
          .map(
            (tag) =>
              `#${tag}`
          )
          .join(" "),

      platform:
        item.platform,

      contentType:
        item.content_type,

      creatorId:
        item.creator_id ??
        "",

      publishAt,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    resetAI();
    setShowForm(false);
    setEditingContent(null);
    setForm(emptyForm);
  }

  function parseHashtags(
    value: string
  ) {
    return value
      .split(/[\s,]+/)
      .map(
        (tag) =>
          tag
            .trim()
            .replace(
              /^#/,
              ""
            )
      )
      .filter(Boolean);
  }

  async function generatedImageToJpegFile(
    dataUrl: string,
    fileName: string
  ) {
    const image =
      new Image();

    image.decoding =
      "async";

    const loaded =
      new Promise<void>(
        (
          resolve,
          reject
        ) => {
          image.onload =
            () =>
              resolve();

          image.onerror =
            () =>
              reject(
                new Error(
                  "Unable to prepare the generated image for upload."
                )
              );
        }
      );

    image.src =
      dataUrl;

    await loaded;

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      image.naturalWidth ||
      image.width;

    canvas.height =
      image.naturalHeight ||
      image.height;

    const context =
      canvas.getContext(
        "2d"
      );

    if (!context) {
      throw new Error(
        "Unable to prepare the generated image for upload."
      );
    }

    context.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const blob =
      await new Promise<Blob>(
        (
          resolve,
          reject
        ) => {
          canvas.toBlob(
            (result) => {
              if (
                !result
              ) {
                reject(
                  new Error(
                    "Unable to convert the generated image to JPEG."
                  )
                );

                return;
              }

              resolve(
                result
              );
            },
            "image/jpeg",
            0.92
          );
        }
      );

    return new File(
      [
        blob,
      ],
      fileName,
      {
        type:
          "image/jpeg",
      }
    );
  }

  async function uploadGeneratedImage(
    contentId: string,
    contentTitle: string
  ) {
    if (
      !aiImageDataUrl
    ) {
      return;
    }

    const safeTitle =
      contentTitle
        .trim()
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        ) ||
      "creatorops-ai";

    const file =
      await generatedImageToJpegFile(
        aiImageDataUrl,
        `${safeTitle}-ai-generated.jpg`
      );

    const formData =
      new FormData();

    formData.append(
      "contentId",
      contentId
    );

    formData.append(
      "file",
      file
    );

    const response =
      await fetch(
        "/api/media",
        {
          method:
            "POST",
          body:
            formData,
        }
      );

    const data =
      await response.json();

    if (
      !response.ok
    ) {
      throw new Error(
        data.error ||
          "Content was created, but the generated image could not be saved to Media."
      );
    }
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const editing =
        editingContent !==
        null;

      const endpoint =
        editing
          ? `/api/content/${editingContent.id}`
          : "/api/content";

      const body = {
        campaignId:
          form.campaignId,

        title:
          form.title,

        description:
          form.description,

        caption:
          form.caption,

        hashtags:
          parseHashtags(
            form.hashtags
          ),

        platform:
          form.platform,

        contentType:
          form.contentType,

        creatorId:
          form.creatorId ||
          null,

        publishAt:
          form.publishAt
            ? new Date(
                form.publishAt
              ).toISOString()
            : null,
      };

      const response =
        await fetch(
          endpoint,
          {
            method:
              editing
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                body
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save content."
        );
      }

      const contentTitle =
        form.title;

      if (
        !editing &&
        aiImageDataUrl
      ) {
        const createdContentId =
          data.content?.id ||
          data.item?.id ||
          data.createdContent?.id ||
          data.id ||
          "";

        if (
          !createdContentId
        ) {
          throw new Error(
            "Content was created, but CreatorOps could not identify the new content item to attach the generated image."
          );
        }

        await uploadGeneratedImage(
          createdContentId,
          contentTitle
        );
      }

      closeForm();

      setSuccess(
        editing
          ? `${contentTitle} was updated successfully.`
          : aiImageDataUrl
            ? `${contentTitle} was created and the AI-generated image was saved to Media.`
            : `${contentTitle} was created successfully.`
      );

      await loadContent();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to save content.";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function archiveContent(
    item: ContentRow
  ) {
    const confirmed =
      window.confirm(
        `Archive ${item.title}?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `/api/content/${item.id}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to archive content."
        );
      }

      setSuccess(
        `${item.title} was archived.`
      );

      await loadContent();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to archive content.";

      setError(message);
    }
  }

  return (
    <div>
      {/* FILTER BAR */}

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:flex-wrap">
          <div className="relative w-full md:max-w-sm">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search content..."
              className="pl-10"
            />
          </div>

          <select
            value={
              statusFilter
            }
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          >
            <option value="all">
              All statuses
            </option>

            <option value="draft">
              Draft
            </option>

            <option value="internal_review">
              Internal Review
            </option>

            <option value="changes_requested">
              Changes Requested
            </option>

            <option value="client_review">
              Client Review
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="scheduled">
              Scheduled
            </option>

            <option value="published">
              Published
            </option>
          </select>

          <select
            value={
              platformFilter
            }
            onChange={(event) =>
              setPlatformFilter(
                event.target.value
              )
            }
            className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          >
            <option value="all">
              All platforms
            </option>

            <option value="instagram">
              Instagram
            </option>

            <option value="linkedin">
              LinkedIn
            </option>

            <option value="tiktok">
              TikTok
            </option>

            <option value="facebook">
              Facebook
            </option>

            <option value="youtube">
              YouTube
            </option>

            <option value="x">
              X
            </option>

            <option value="other">
              Other
            </option>
          </select>

          <select
            value={
              campaignFilter
            }
            onChange={(event) =>
              setCampaignFilter(
                event.target.value
              )
            }
            className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          >
            <option value="all">
              All campaigns
            </option>

            {campaigns.map(
              (campaign) => (
                <option
                  key={
                    campaign.id
                  }
                  value={
                    campaign.id
                  }
                >
                  {
                    campaign.name
                  }
                </option>
              )
            )}
          </select>
        </div>

        {canCreate && (
          <Button
            type="button"
            onClick={
              openCreate
            }
          >
            <Plus
              size={16}
              className="mr-2"
            />

            New Content
          </Button>
        )}
      </div>

      {/* FEEDBACK */}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <Check
            size={17}
          />

          {success}
        </div>
      )}

      {/* CREATE / EDIT FORM */}

      {showForm &&
        canCreate && (
          <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingContent
                    ? "Edit Content"
                    : "Create Content"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Plan the creative,
                  caption, owner and
                  publishing details.
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={
                  closeForm
                }
              >
                <X size={18} />
              </Button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-6 grid gap-5 md:grid-cols-2"
            >
              {/* TITLE */}

              <div className="space-y-2">
                <Label htmlFor="content-title">
                  Content Title
                </Label>

                <Input
                  id="content-title"
                  value={
                    form.title
                  }
                  onChange={(event) =>
                    updateField(
                      "title",
                      event.target.value
                    )
                  }
                  placeholder="Pumpkin Cold Brew Reel"
                  required
                />
              </div>

              {/* CAMPAIGN */}

              <div className="space-y-2">
                <Label htmlFor="content-campaign">
                  Campaign
                </Label>

                <select
                  id="content-campaign"
                  value={
                    form.campaignId
                  }
                  onChange={(event) =>
                    updateField(
                      "campaignId",
                      event.target.value
                    )
                  }
                  disabled={
                    editingContent !==
                    null
                  }
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm disabled:opacity-60"
                >
                  <option value="">
                    Select campaign
                  </option>

                  {campaigns.map(
                    (campaign) => (
                      <option
                        key={
                          campaign.id
                        }
                        value={
                          campaign.id
                        }
                      >
                        {
                          campaign.client_name
                        }{" "}
                        â€”{" "}
                        {
                          campaign.name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* PLATFORM */}

              <div className="space-y-2">
                <Label htmlFor="platform">
                  Platform
                </Label>

                <select
                  id="platform"
                  value={
                    form.platform
                  }
                  onChange={(event) => {
                    const value =
                      event.target
                        .value;

                    if (
                      value ===
                        "instagram" ||
                      value ===
                        "linkedin" ||
                      value ===
                        "tiktok" ||
                      value ===
                        "facebook" ||
                      value ===
                        "youtube" ||
                      value ===
                        "x" ||
                      value ===
                        "other"
                    ) {
                      setForm(
                        (current) => ({
                          ...current,
                          platform:
                            value,
                        })
                      );
                    }
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="instagram">
                    Instagram
                  </option>

                  <option value="linkedin">
                    LinkedIn
                  </option>

                  <option value="tiktok">
                    TikTok
                  </option>

                  <option value="facebook">
                    Facebook
                  </option>

                  <option value="youtube">
                    YouTube
                  </option>

                  <option value="x">
                    X
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>

              {/* CONTENT TYPE */}

              <div className="space-y-2">
                <Label htmlFor="content-type">
                  Content Type
                </Label>

                <select
                  id="content-type"
                  value={
                    form.contentType
                  }
                  onChange={(event) => {
                    const value =
                      event.target
                        .value;

                    if (
                      value ===
                        "post" ||
                      value ===
                        "reel" ||
                      value ===
                        "story" ||
                      value ===
                        "carousel" ||
                      value ===
                        "video" ||
                      value ===
                        "article" ||
                      value ===
                        "other"
                    ) {
                      setForm(
                        (current) => ({
                          ...current,
                          contentType:
                            value,
                        })
                      );
                    }
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="post">
                    Post
                  </option>

                  <option value="reel">
                    Reel
                  </option>

                  <option value="story">
                    Story
                  </option>

                  <option value="carousel">
                    Carousel
                  </option>

                  <option value="video">
                    Video
                  </option>

                  <option value="article">
                    Article
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>

              {/* CREATOR */}

              <div className="space-y-2">
                <Label htmlFor="creator">
                  Creator
                </Label>

                <select
                  id="creator"
                  value={
                    form.creatorId
                  }
                  onChange={(event) =>
                    updateField(
                      "creatorId",
                      event.target.value
                    )
                  }
                  disabled={
                    currentRole ===
                    "creator"
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm disabled:opacity-60"
                >
                  <option value="">
                    Unassigned
                  </option>

                  {creators.map(
                    (creator) => (
                      <option
                        key={
                          creator.id
                        }
                        value={
                          creator.id
                        }
                      >
                        {
                          creator.fullName
                        }
                      </option>
                    )
                  )}
                </select>

                {creators.length ===
                  0 &&
                  currentRole !==
                    "creator" && (
                    <p className="text-xs text-amber-600">
                      No Creator users
                      exist yet. You
                      can create one
                      from Administration.
                    </p>
                  )}
              </div>

              {/* PUBLISH DATE */}

              <div className="space-y-2">
                <Label htmlFor="publish-at">
                  Planned Publish Date
                </Label>

                <Input
                  id="publish-at"
                  type="datetime-local"
                  value={
                    form.publishAt
                  }
                  onChange={(event) =>
                    updateField(
                      "publishAt",
                      event.target.value
                    )
                  }
                />
              </div>

              {/* CREATOROPS AI */}

              {!editingContent && (
                <div className="space-y-4 rounded-2xl border bg-slate-50 p-5 md:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                      <Sparkles
                        size={19}
                        className="text-violet-700"
                      />
                    </div>

                    <div>
                      <h3 className="font-semibold">
                        CreatorOps AI
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Describe the content you want. Generate copy or an actual AI image related to the brief.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-brief">
                      AI Creative Brief
                    </Label>

                    <textarea
                      id="ai-brief"
                      rows={4}
                      value={aiBrief}
                      onChange={(event) =>
                        setAiBrief(
                          event.target.value
                        )
                      }
                      placeholder="Example: Create a premium Instagram Reel creative for a Vitamin C serum. Bright morning skincare setting, warm natural light and fresh citrus-inspired elements."
                      className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={
                        handleGenerateWithAI
                      }
                      disabled={
                        aiLoading ||
                        aiImageLoading
                      }
                    >
                      {aiLoading ? (
                        <>
                          <Loader2
                            size={16}
                            className="mr-2 animate-spin"
                          />
                          Generating copy...
                        </>
                      ) : (
                        <>
                          <Sparkles
                            size={16}
                            className="mr-2"
                          />
                          Generate Caption
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      onClick={
                        handleGenerateImage
                      }
                      disabled={
                        aiImageLoading ||
                        aiLoading
                      }
                    >
                      {aiImageLoading ? (
                        <>
                          <Loader2
                            size={16}
                            className="mr-2 animate-spin"
                          />
                          Generating image...
                        </>
                      ) : (
                        <>
                          <ImageIcon
                            size={16}
                            className="mr-2"
                          />
                          Generate Image
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-slate-500">
                    AI output remains a draft and still follows the normal human approval workflow.
                  </p>

                  {aiError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {aiError}
                    </div>
                  )}

                  {aiGeneration && (
                    <div className="space-y-4 rounded-xl border bg-white p-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Generated Caption
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {aiGeneration.caption}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Hashtags
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {aiGeneration.hashtags.join(
                            " "
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Visual Concept
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {aiGeneration.visualConcept}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={useAIText}
                      >
                        Use Caption & Hashtags
                      </Button>
                    </div>
                  )}

                  {aiImageDataUrl && (
                    <div className="rounded-xl border bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">
                            AI Generated Creative
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {aiImageAspectRatio
                              ? `${aiImageAspectRatio} format`
                              : "Generated image"}
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={
                            handleGenerateImage
                          }
                          disabled={
                            aiImageLoading
                          }
                        >
                          Regenerate
                        </Button>
                      </div>

                      <div className="mt-4 overflow-hidden rounded-xl border bg-slate-100">
                        <img
                          src={aiImageDataUrl}
                          alt="AI-generated CreatorOps marketing creative"
                          className="mx-auto max-h-[560px] w-auto max-w-full object-contain"
                        />
                      </div>

                      <p className="mt-3 text-xs text-slate-500">
                        When you create this content item, CreatorOps will convert this draft to JPEG and save it automatically in the Media Library for the approval and publishing workflow.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* CAPTION */}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="caption">
                  Caption
                </Label>

                <textarea
                  id="caption"
                  rows={5}
                  value={
                    form.caption
                  }
                  onChange={(event) =>
                    updateField(
                      "caption",
                      event.target.value
                    )
                  }
                  placeholder="Meet your new autumn obsession..."
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>

              {/* HASHTAGS */}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="hashtags">
                  Hashtags
                </Label>

                <Input
                  id="hashtags"
                  value={
                    form.hashtags
                  }
                  onChange={(event) =>
                    updateField(
                      "hashtags",
                      event.target.value
                    )
                  }
                  placeholder="#UrbanBrew #PumpkinColdBrew #Autumn"
                />

                <p className="text-xs text-slate-400">
                  Separate hashtags
                  using spaces or
                  commas.
                </p>
              </div>

              {/* DESCRIPTION */}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="content-description">
                  Internal Description
                </Label>

                <textarea
                  id="content-description"
                  rows={3}
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Short-form autumn launch creative featuring the new Pumpkin Cold Brew."
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>

              {/* BUTTONS */}

              <div className="flex gap-3 md:col-span-2">
                <Button
                  type="submit"
                  disabled={
                    saving
                  }
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={16}
                        className="mr-2 animate-spin"
                      />

                      Saving...
                    </>
                  ) : editingContent ? (
                    <>
                      <Pencil
                        size={16}
                        className="mr-2"
                      />

                      Save Changes
                    </>
                  ) : (
                    <>
                      <Plus
                        size={16}
                        className="mr-2"
                      />

                      Create Content
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    saving
                  }
                  onClick={
                    closeForm
                  }
                >
                  Cancel
                </Button>
              </div>
            </form>
          </section>
        )}

      {/* CONTENT CARDS */}

      <section className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border bg-white p-16 text-sm text-slate-500">
            <Loader2
              size={18}
              className="animate-spin"
            />

            Loading content...
          </div>
        ) : visibleContent.length ===
          0 ? (
          <div className="rounded-2xl border bg-white p-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <FileText
                size={20}
              />
            </div>

            <h3 className="mt-4 font-semibold">
              No content found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {contentItems.length >
              0
                ? "Try changing the search or filters."
                : canCreate
                  ? "Create the first content item for your campaign."
                  : "No content is currently available for review."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleContent.map(
              (item) => (
                <article
                  key={
                    item.id
                  }
                  className="rounded-2xl border bg-white p-6 shadow-sm"
                >
                  {/* CARD TOP */}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                      <FileText
                        size={19}
                      />
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                        item.status
                      )}`}
                    >
                      {formatStatus(
                        item.status
                      )}
                    </span>
                  </div>

                  {/* CLIENT / CAMPAIGN */}

                  <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {
                      item.client_name
                    }
                  </p>

                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <Megaphone
                      size={13}
                    />

                    {
                      item.campaign_name
                    }
                  </p>

                  {/* TITLE */}

                  <h2 className="mt-3 text-lg font-semibold">
                    {item.title}
                  </h2>

                  {/* TYPE */}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                      {formatPlatform(
                        item.platform
                      )}
                    </span>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                      {formatType(
                        item.content_type
                      )}
                    </span>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                      Version{" "}
                      {
                        item.current_version
                      }
                    </span>
                  </div>

                  {/* CAPTION */}

                  {item.caption && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                      {item.caption}
                    </p>
                  )}

                  {/* HASHTAGS */}

                  {item.hashtags &&
                    item.hashtags
                      .length >
                      0 && (
                      <div className="mt-3 flex items-start gap-2 text-xs text-slate-500">
                        <Hash
                          size={13}
                          className="mt-0.5 shrink-0"
                        />

                        <span className="line-clamp-2">
                          {item.hashtags
                            .map(
                              (tag) =>
                                `#${tag}`
                            )
                            .join(
                              " "
                            )}
                        </span>
                      </div>
                    )}

                  {/* DETAILS */}

                  <div className="mt-5 space-y-3 border-t pt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <UserRound
                        size={15}
                      />

                      <span>
                        {item.creator_name ??
                          "Unassigned"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CalendarDays
                        size={15}
                      />

                      <span>
                        {formatDateTime(
                          item.publish_at
                        )}
                      </span>
                    </div>
                  </div>

                  {/* EDIT / ARCHIVE */}

                  {currentRole !==
                    "client" && (
                    <div className="mt-5 flex gap-2 border-t pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openEdit(
                            item
                          )
                        }
                        disabled={
                          item.status ===
                            "approved" ||
                          item.status ===
                            "scheduled" ||
                          item.status ===
                            "published"
                        }
                      >
                        <Pencil
                          size={14}
                          className="mr-2"
                        />

                        Edit
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          archiveContent(
                            item
                          )
                        }
                      >
                        <Archive
                          size={14}
                          className="mr-2"
                        />

                        Archive
                      </Button>
                    </div>
                  )}

                  {/* WORKFLOW ACTIONS */}

                  <ContentWorkflowActions
                    contentId={
                      item.id
                    }
                    status={
                      item.status
                    }
                    currentRole={
                      currentRole
                    }
                    platform={
                      item.platform
                    }
                    contentType={
                      item.content_type
                    }
                    onComplete={
                      loadContent
                    }
                  />
                </article>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}