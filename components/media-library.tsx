"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Camera,
  ExternalLink,
  File,
  FileText,
  ImageIcon,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Unlink,
  Upload,
  Video,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

type AppRole =
  | "admin"
  | "manager"
  | "creator"
  | "client";

type MediaAsset = {
  id: string;
  content_id: string;
  version_id: string | null;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
  signed_url: string | null;
  content_title: string;
  content_version: number;
  campaign_name: string;
  client_name: string;
  uploader_name: string;
};

type ContentOption = {
  id: string;
  title: string;
  campaign_name: string;
  client_name: string;
  status: string;
};

type ContentApiItem = {
  id: string;
  title: string;
  campaign_name: string;
  client_name: string;
  status: string;
};

type MediaApiResponse = {
  media?: MediaAsset[];
  error?: string;
};

type ContentApiResponse = {
  content?: ContentApiItem[];
  error?: string;
};

type ApiMessageResponse = {
  error?: string;
};

type InstagramAccount = {
  id: string | null;
  username: string | null;
  name: string | null;
  accountType: string | null;
  mediaCount: number | null;
};

type InstagramMediaItem = {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  thumbnail_url?: string;
  timestamp?: string;
};

type InstagramAccountResponse = {
  connected?: boolean;
  account?: InstagramAccount;
  error?: string;
  code?: number;
};

type InstagramMediaResponse = {
  connected?: boolean;
  count?: number;
  media?: InstagramMediaItem[];
  error?: string;
  code?: number;
};

type SocialMediaLink = {
  id: string;
  organization_id: string;
  content_id: string;
  platform: string;
  external_media_id: string;
  permalink: string | null;
  media_type: string | null;
  caption: string | null;
  published_at: string | null;
  linked_by: string | null;
  created_at: string;
  updated_at: string;
};

type InstagramLinksResponse = {
  links?: SocialMediaLink[];
  error?: string;
};

type InstagramLinkMutationResponse = {
  success?: boolean;
  link?: SocialMediaLink;
  error?: string;
};

function formatBytes(
  bytes: number | null
) {
  if (
    bytes === null ||
    bytes === 0
  ) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function formatDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
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

function typeLabel(
  mimeType: string | null
) {
  if (
    mimeType?.startsWith(
      "image/"
    )
  ) {
    return "Image";
  }

  if (
    mimeType?.startsWith(
      "video/"
    )
  ) {
    return "Video";
  }

  if (
    mimeType ===
    "application/pdf"
  ) {
    return "PDF";
  }

  return "File";
}

function instagramTypeLabel(
  mediaType?: string
) {
  if (!mediaType) {
    return "Media";
  }

  if (
    mediaType ===
    "CAROUSEL_ALBUM"
  ) {
    return "Carousel";
  }

  return mediaType
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

function statusLabel(
  value: string
) {
  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

function AssetIcon({
  mimeType,
}: {
  mimeType: string | null;
}) {
  if (
    mimeType?.startsWith(
      "image/"
    )
  ) {
    return (
      <ImageIcon
        size={22}
      />
    );
  }

  if (
    mimeType?.startsWith(
      "video/"
    )
  ) {
    return (
      <Video
        size={22}
      />
    );
  }

  if (
    mimeType ===
    "application/pdf"
  ) {
    return (
      <FileText
        size={22}
      />
    );
  }

  return (
    <File
      size={22}
    />
  );
}

export default function MediaLibrary({
  currentRole,
}: {
  currentRole: AppRole;
}) {
  const [
    media,
    setMedia,
  ] =
    useState<MediaAsset[]>([]);

  const [
    content,
    setContent,
  ] =
    useState<ContentOption[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    uploading,
    setUploading,
  ] =
    useState(false);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState("all");

  const [
    selectedContent,
    setSelectedContent,
  ] =
    useState("");

  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<File | null>(
      null
    );

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

  /*
   * -----------------------------------------
   * Instagram state
   * -----------------------------------------
   */

  const [
    instagramAccount,
    setInstagramAccount,
  ] =
    useState<InstagramAccount | null>(
      null
    );

  const [
    instagramMedia,
    setInstagramMedia,
  ] =
    useState<
      InstagramMediaItem[]
    >([]);

  const [
    instagramLinks,
    setInstagramLinks,
  ] =
    useState<
      SocialMediaLink[]
    >([]);

  const [
    instagramLoading,
    setInstagramLoading,
  ] =
    useState(false);

  const [
    instagramError,
    setInstagramError,
  ] =
    useState("");

  const [
    instagramSuccess,
    setInstagramSuccess,
  ] =
    useState("");

  const [
    selectedInstagramContent,
    setSelectedInstagramContent,
  ] =
    useState<
      Record<string, string>
    >({});

  const [
    instagramActionId,
    setInstagramActionId,
  ] =
    useState<string | null>(
      null
    );

  const canUpload =
    currentRole !== "client";

  const canUseInstagram =
    currentRole !== "client";

  /*
   * -----------------------------------------
   * CreatorOps media
   * -----------------------------------------
   */

  const loadData =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const [
            mediaResponse,
            contentResponse,
          ] =
            await Promise.all([
              fetch(
                "/api/media",
                {
                  cache:
                    "no-store",
                }
              ),

              fetch(
                "/api/content",
                {
                  cache:
                    "no-store",
                }
              ),
            ]);

          const [
            mediaData,
            contentData,
          ] =
            (await Promise.all([
              mediaResponse.json(),
              contentResponse.json(),
            ])) as [
              MediaApiResponse,
              ContentApiResponse,
            ];

          if (
            !mediaResponse.ok
          ) {
            throw new Error(
              mediaData.error ||
                "Unable to load media."
            );
          }

          if (
            !contentResponse.ok
          ) {
            throw new Error(
              contentData.error ||
                "Unable to load content."
            );
          }

          setMedia(
            mediaData.media ?? []
          );

          setContent(
            (
              contentData.content ??
              []
            ).map(
              (
                item
              ) => ({
                id:
                  item.id,

                title:
                  item.title,

                campaign_name:
                  item.campaign_name,

                client_name:
                  item.client_name,

                status:
                  item.status,
              })
            )
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load media library."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  /*
   * -----------------------------------------
   * Instagram integration
   * -----------------------------------------
   */

  const loadInstagram =
    useCallback(
      async () => {
        if (
          !canUseInstagram
        ) {
          return;
        }

        setInstagramLoading(
          true
        );

        setInstagramError("");

        try {
          const [
            accountResponse,
            mediaResponse,
            linksResponse,
          ] =
            await Promise.all([
              fetch(
                "/api/integrations/instagram/test",
                {
                  cache:
                    "no-store",
                }
              ),

              fetch(
                "/api/integrations/instagram/media",
                {
                  cache:
                    "no-store",
                }
              ),

              fetch(
                "/api/integrations/instagram/links",
                {
                  cache:
                    "no-store",
                }
              ),
            ]);

          const [
            accountData,
            mediaData,
            linksData,
          ] =
            (await Promise.all([
              accountResponse.json(),
              mediaResponse.json(),
              linksResponse.json(),
            ])) as [
              InstagramAccountResponse,
              InstagramMediaResponse,
              InstagramLinksResponse,
            ];

          if (
            !accountResponse.ok
          ) {
            throw new Error(
              accountData.error ||
                "Unable to verify Instagram account."
            );
          }

          if (
            !mediaResponse.ok
          ) {
            throw new Error(
              mediaData.error ||
                "Unable to retrieve Instagram media."
            );
          }

          if (
            !linksResponse.ok
          ) {
            throw new Error(
              linksData.error ||
                "Unable to retrieve Instagram content links."
            );
          }

          if (
            !accountData.connected ||
            !accountData.account
          ) {
            throw new Error(
              "Instagram account is not connected."
            );
          }

          setInstagramAccount(
            accountData.account
          );

          setInstagramMedia(
            mediaData.media ?? []
          );

          setInstagramLinks(
            linksData.links ?? []
          );
        } catch (err) {
          setInstagramError(
            err instanceof Error
              ? err.message
              : "Unable to load Instagram."
          );
        } finally {
          setInstagramLoading(
            false
          );
        }
      },
      [canUseInstagram]
    );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (
      canUseInstagram
    ) {
      void loadInstagram();
    }
  }, [
    canUseInstagram,
    loadInstagram,
  ]);

  /*
   * -----------------------------------------
   * Lookup maps
   * -----------------------------------------
   */

  const instagramLinkMap =
    useMemo(
      () =>
        new Map(
          instagramLinks.map(
            (link) => [
              link.external_media_id,
              link,
            ]
          )
        ),
      [instagramLinks]
    );

  const contentMap =
    useMemo(
      () =>
        new Map(
          content.map(
            (item) => [
              item.id,
              item,
            ]
          )
        ),
      [content]
    );

  /*
   * -----------------------------------------
   * Filtering
   * -----------------------------------------
   */

  const uploadableContent =
    useMemo(
      () =>
        content.filter(
          (item) =>
            item.status !==
              "approved" &&
            item.status !==
              "scheduled" &&
            item.status !==
              "published" &&
            item.status !==
              "archived"
        ),
      [content]
    );

  const visibleMedia =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return media.filter(
        (asset) => {
          const matchesSearch =
            !term ||
            asset.file_name
              .toLowerCase()
              .includes(term) ||
            asset.content_title
              .toLowerCase()
              .includes(term) ||
            asset.campaign_name
              .toLowerCase()
              .includes(term) ||
            asset.client_name
              .toLowerCase()
              .includes(term);

          const kind =
            typeLabel(
              asset.mime_type
            ).toLowerCase();

          const matchesType =
            typeFilter ===
              "all" ||
            typeFilter ===
              kind;

          return (
            matchesSearch &&
            matchesType
          );
        }
      );
    }, [
      media,
      search,
      typeFilter,
    ]);

  /*
   * -----------------------------------------
   * Instagram link action
   * -----------------------------------------
   */

  async function linkInstagramMedia(
    item: InstagramMediaItem
  ) {
    const contentId =
      selectedInstagramContent[
        item.id
      ];

    if (!contentId) {
      setInstagramError(
        "Select a CreatorOps content item first."
      );

      return;
    }

    setInstagramActionId(
      item.id
    );

    setInstagramError("");
    setInstagramSuccess("");

    try {
      const response =
        await fetch(
          "/api/integrations/instagram/links",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                contentId,

                externalMediaId:
                  item.id,

                permalink:
                  item.permalink ??
                  null,

                mediaType:
                  item.media_type ??
                  null,

                caption:
                  item.caption ??
                  null,

                publishedAt:
                  item.timestamp ??
                  null,
              }),
          }
        );

      const data =
        (await response.json()) as
          InstagramLinkMutationResponse;

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to link Instagram media."
        );
      }

      setInstagramSuccess(
        "Instagram post linked to CreatorOps content."
      );

      setSelectedInstagramContent(
        (previous) => {
          const next = {
            ...previous,
          };

          delete next[
            item.id
          ];

          return next;
        }
      );

      await loadInstagram();
    } catch (err) {
      setInstagramError(
        err instanceof Error
          ? err.message
          : "Unable to link Instagram media."
      );
    } finally {
      setInstagramActionId(
        null
      );
    }
  }

  /*
   * -----------------------------------------
   * Instagram unlink action
   * -----------------------------------------
   */

  async function unlinkInstagramMedia(
    item: InstagramMediaItem
  ) {
    const confirmed =
      window.confirm(
        "Remove this Instagram post from its CreatorOps content item?"
      );

    if (!confirmed) {
      return;
    }

    setInstagramActionId(
      item.id
    );

    setInstagramError("");
    setInstagramSuccess("");

    try {
      const response =
        await fetch(
          "/api/integrations/instagram/links",
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                externalMediaId:
                  item.id,
              }),
          }
        );

      const data =
        (await response.json()) as
          InstagramLinkMutationResponse;

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to unlink Instagram media."
        );
      }

      setInstagramSuccess(
        "Instagram post unlinked from CreatorOps content."
      );

      await loadInstagram();
    } catch (err) {
      setInstagramError(
        err instanceof Error
          ? err.message
          : "Unable to unlink Instagram media."
      );
    } finally {
      setInstagramActionId(
        null
      );
    }
  }

  /*
   * -----------------------------------------
   * Upload
   * -----------------------------------------
   */

  async function uploadMedia(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !selectedContent
    ) {
      setError(
        "Select a content item."
      );

      return;
    }

    if (!selectedFile) {
      setError(
        "Select a file to upload."
      );

      return;
    }

    setUploading(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "contentId",
        selectedContent
      );

      formData.append(
        "file",
        selectedFile
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
        (await response.json()) as
          ApiMessageResponse;

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to upload media."
        );
      }

      setSuccess(
        `${selectedFile.name} uploaded successfully.`
      );

      setSelectedFile(
        null
      );

      setSelectedContent(
        ""
      );

      const input =
        document.getElementById(
          "media-file"
        ) as
          | HTMLInputElement
          | null;

      if (input) {
        input.value = "";
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload media."
      );
    } finally {
      setUploading(false);
    }
  }

  /*
   * -----------------------------------------
   * Delete CreatorOps media
   * -----------------------------------------
   */

  async function deleteMedia(
    asset: MediaAsset
  ) {
    const confirmed =
      window.confirm(
        `Delete ${asset.file_name}?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `/api/media/${asset.id}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        (await response.json()) as
          ApiMessageResponse;

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to delete media."
        );
      }

      setSuccess(
        `${asset.file_name} deleted.`
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete media."
      );
    }
  }

  return (
    <div>
      {/* SUMMARY */}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Assets
          </p>

          <p className="mt-2 text-3xl font-bold">
            {media.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Images
          </p>

          <p className="mt-2 text-3xl font-bold">
            {
              media.filter(
                (item) =>
                  item.mime_type?.startsWith(
                    "image/"
                  )
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Videos / Documents
          </p>

          <p className="mt-2 text-3xl font-bold">
            {
              media.filter(
                (item) =>
                  !item.mime_type?.startsWith(
                    "image/"
                  )
              ).length
            }
          </p>
        </div>
      </div>

      {/* INSTAGRAM */}

      {canUseInstagram && (
        <section className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                <Camera
                  size={20}
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">
                    Instagram Integration
                  </h2>

                  {instagramAccount && (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                      Connected
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Real Instagram media connected
                  to the CreatorOps content
                  workflow.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                instagramLoading
              }
              onClick={() =>
                void loadInstagram()
              }
            >
              {instagramLoading ? (
                <Loader2
                  size={14}
                  className="mr-2 animate-spin"
                />
              ) : (
                <RefreshCw
                  size={14}
                  className="mr-2"
                />
              )}

              {instagramLoading
                ? "Refreshing..."
                : "Refresh Instagram"}
            </Button>
          </div>

          {instagramError && (
            <div className="mx-6 mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {instagramError}
            </div>
          )}

          {instagramSuccess && (
            <div className="mx-6 mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {instagramSuccess}
            </div>
          )}

          {instagramLoading &&
          !instagramAccount ? (
            <div className="flex min-h-40 items-center justify-center gap-2 p-6 text-sm text-slate-500">
              <Loader2
                size={18}
                className="animate-spin"
              />

              Checking Instagram
              connection...
            </div>
          ) : instagramAccount ? (
            <div className="p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Account
                  </p>

                  <p className="mt-2 font-semibold">
                    @
                    {
                      instagramAccount.username ??
                      "Unknown"
                    }
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Account Type
                  </p>

                  <p className="mt-2 font-semibold">
                    {
                      instagramAccount.accountType ??
                      "Professional"
                    }
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Instagram Media
                  </p>

                  <p className="mt-2 font-semibold">
                    {
                      instagramAccount.mediaCount ??
                      instagramMedia.length
                    }
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t pt-6">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="font-semibold">
                      Real Instagram Media
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Link a live Instagram
                      post or Reel to the
                      corresponding CreatorOps
                      content item.
                    </p>
                  </div>

                  <p className="text-xs text-slate-400">
                    {
                      instagramMedia.length
                    }{" "}
                    loaded
                  </p>
                </div>

                {instagramMedia.length ===
                0 ? (
                  <div className="mt-5 rounded-xl border border-dashed p-10 text-center">
                    <Camera
                      size={28}
                      className="mx-auto text-slate-400"
                    />

                    <h4 className="mt-4 font-semibold">
                      No Instagram media yet
                    </h4>

                    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                      Publish a post or Reel on
                      the connected account,
                      then click Refresh
                      Instagram.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {instagramMedia.map(
                      (item) => {
                        const previewUrl =
                          item.thumbnail_url ||
                          item.media_url ||
                          null;

                        const isVideo =
                          item.media_type ===
                          "VIDEO";

                        const existingLink =
                          instagramLinkMap.get(
                            item.id
                          );

                        const linkedContent =
                          existingLink
                            ? contentMap.get(
                                existingLink.content_id
                              )
                            : undefined;

                        const isWorking =
                          instagramActionId ===
                          item.id;

                        return (
                          <article
                            key={
                              item.id
                            }
                            className="overflow-hidden rounded-2xl border bg-white"
                          >
                            <div className="relative flex h-64 items-center justify-center bg-slate-100">
                              {previewUrl &&
                              (!isVideo ||
                                item.thumbnail_url) ? (
                                <img
                                  src={
                                    previewUrl
                                  }
                                  alt={
                                    item.caption ||
                                    "Instagram media"
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : previewUrl &&
                                isVideo ? (
                                <video
                                  src={
                                    previewUrl
                                  }
                                  controls
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <Camera
                                  size={30}
                                  className="text-slate-400"
                                />
                              )}

                              <span className="absolute left-3 top-3 rounded-full bg-black/75 px-2.5 py-1 text-xs font-medium text-white">
                                {instagramTypeLabel(
                                  item.media_type
                                )}
                              </span>

                              {existingLink && (
                                <span className="absolute right-3 top-3 rounded-full bg-green-600 px-2.5 py-1 text-xs font-medium text-white">
                                  Linked
                                </span>
                              )}
                            </div>

                            <div className="p-4">
                              <p className="max-h-20 overflow-hidden break-words text-sm text-slate-700">
                                {item.caption ||
                                  "No caption"}
                              </p>

                              {item.timestamp && (
                                <p className="mt-3 text-xs text-slate-400">
                                  {formatDate(
                                    item.timestamp
                                  )}
                                </p>
                              )}

                              {existingLink ? (
                                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                                      <Link2
                                        size={16}
                                      />
                                    </div>

                                    <div className="min-w-0">
                                      <p className="text-xs font-medium uppercase tracking-wide text-green-700">
                                        Linked to CreatorOps
                                      </p>

                                      <p className="mt-1 font-semibold text-slate-900">
                                        {linkedContent
                                          ?.title ||
                                          "CreatorOps content"}
                                      </p>

                                      {linkedContent && (
                                        <>
                                          <p className="mt-1 text-xs text-slate-600">
                                            {
                                              linkedContent.client_name
                                            }{" "}
                                            —{" "}
                                            {
                                              linkedContent.campaign_name
                                            }
                                          </p>

                                          <span className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-600">
                                            {statusLabel(
                                              linkedContent.status
                                            )}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="mt-4 w-full"
                                    disabled={
                                      isWorking
                                    }
                                    onClick={() =>
                                      void unlinkInstagramMedia(
                                        item
                                      )
                                    }
                                  >
                                    {isWorking ? (
                                      <Loader2
                                        size={14}
                                        className="mr-2 animate-spin"
                                      />
                                    ) : (
                                      <Unlink
                                        size={14}
                                        className="mr-2"
                                      />
                                    )}

                                    {isWorking
                                      ? "Unlinking..."
                                      : "Unlink from Content"}
                                  </Button>
                                </div>
                              ) : (
                                <div className="mt-4 rounded-xl border bg-slate-50 p-4">
                                  <div className="flex items-center gap-2">
                                    <Link2
                                      size={15}
                                      className="text-slate-500"
                                    />

                                    <p className="text-sm font-semibold">
                                      Link to Content
                                    </p>
                                  </div>

                                  <p className="mt-1 text-xs text-slate-500">
                                    Associate this live
                                    Instagram post with
                                    its CreatorOps content
                                    record.
                                  </p>

                                  <select
                                    value={
                                      selectedInstagramContent[
                                        item.id
                                      ] || ""
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      setSelectedInstagramContent(
                                        (
                                          previous
                                        ) => ({
                                          ...previous,

                                          [item.id]:
                                            event
                                              .target
                                              .value,
                                        })
                                      )
                                    }
                                    className="mt-3 h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                                  >
                                    <option value="">
                                      Select CreatorOps
                                      content
                                    </option>

                                    {content.map(
                                      (
                                        option
                                      ) => (
                                        <option
                                          key={
                                            option.id
                                          }
                                          value={
                                            option.id
                                          }
                                        >
                                          {
                                            option.client_name
                                          }{" "}
                                          —{" "}
                                          {
                                            option.campaign_name
                                          }{" "}
                                          —{" "}
                                          {
                                            option.title
                                          }
                                        </option>
                                      )
                                    )}
                                  </select>

                                  <Button
                                    type="button"
                                    size="sm"
                                    className="mt-3 w-full"
                                    disabled={
                                      isWorking ||
                                      !selectedInstagramContent[
                                        item.id
                                      ]
                                    }
                                    onClick={() =>
                                      void linkInstagramMedia(
                                        item
                                      )
                                    }
                                  >
                                    {isWorking ? (
                                      <Loader2
                                        size={14}
                                        className="mr-2 animate-spin"
                                      />
                                    ) : (
                                      <Link2
                                        size={14}
                                        className="mr-2"
                                      />
                                    )}

                                    {isWorking
                                      ? "Linking..."
                                      : "Link to Content"}
                                  </Button>
                                </div>
                              )}

                              {item.permalink && (
                                <a
                                  href={
                                    item.permalink
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-4 inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm font-medium transition hover:bg-slate-50"
                                >
                                  <Camera
                                    size={14}
                                    className="mr-2"
                                  />

                                  Open on Instagram

                                  <ExternalLink
                                    size={13}
                                    className="ml-2"
                                  />
                                </a>
                              )}
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            !instagramError && (
              <div className="p-6 text-sm text-slate-500">
                Instagram has not been
                connected.
              </div>
            )
          )}
        </section>
      )}

      {/* UPLOAD */}

      {canUpload && (
        <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold">
              Upload Media
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Upload an image, video or PDF
              and attach it to a content
              version.
            </p>
          </div>

          <form
            onSubmit={
              uploadMedia
            }
            className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_auto]"
          >
            <select
              value={
                selectedContent
              }
              onChange={(event) =>
                setSelectedContent(
                  event.target.value
                )
              }
              className="h-10 rounded-md border border-input bg-white px-3 text-sm"
              required
            >
              <option value="">
                Select content
              </option>

              {uploadableContent.map(
                (item) => (
                  <option
                    key={
                      item.id
                    }
                    value={
                      item.id
                    }
                  >
                    {
                      item.client_name
                    }{" "}
                    —{" "}
                    {
                      item.title
                    }
                  </option>
                )
              )}
            </select>

            <Input
              id="media-file"
              type="file"
              accept="image/*,video/*,application/pdf"
              onChange={(event) =>
                setSelectedFile(
                  event.target
                    .files?.[0] ??
                    null
                )
              }
              required
            />

            <Button
              type="submit"
              disabled={
                uploading
              }
            >
              {uploading ? (
                <Loader2
                  size={15}
                  className="mr-2 animate-spin"
                />
              ) : (
                <Upload
                  size={15}
                  className="mr-2"
                />
              )}

              {uploading
                ? "Uploading..."
                : "Upload"}
            </Button>
          </form>

          <p className="mt-3 text-xs text-slate-400">
            Maximum file size: 4 MB.
            Supported: images, videos and PDF.
          </p>
        </section>
      )}

      {/* FEEDBACK */}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* FILTERS */}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative w-full max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <Input
              value={
                search
              }
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search media..."
              className="pl-9"
            />
          </div>

          <select
            value={
              typeFilter
            }
            onChange={(event) =>
              setTypeFilter(
                event.target.value
              )
            }
            className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          >
            <option value="all">
              All types
            </option>

            <option value="image">
              Images
            </option>

            <option value="video">
              Videos
            </option>

            <option value="pdf">
              PDF
            </option>
          </select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={
            loading
          }
          onClick={() =>
            void loadData()
          }
        >
          {loading ? (
            <Loader2
              size={14}
              className="mr-2 animate-spin"
            />
          ) : (
            <RefreshCw
              size={14}
              className="mr-2"
            />
          )}

          Refresh
        </Button>
      </div>

      {/* CREATOROPS ASSETS */}

      <section className="mt-6">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center gap-2 rounded-2xl border bg-white text-sm text-slate-500">
            <Loader2
              size={18}
              className="animate-spin"
            />

            Loading media...
          </div>
        ) : visibleMedia.length ===
          0 ? (
          <div className="rounded-2xl border bg-white p-16 text-center">
            <ImageIcon
              size={28}
              className="mx-auto text-slate-400"
            />

            <h3 className="mt-4 font-semibold">
              No media found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Uploaded campaign assets will
              appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleMedia.map(
              (asset) => (
                <article
                  key={
                    asset.id
                  }
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                >
                  <div className="flex h-52 items-center justify-center bg-slate-100">
                    {asset.mime_type?.startsWith(
                      "image/"
                    ) &&
                    asset.signed_url ? (
                      <img
                        src={
                          asset.signed_url
                        }
                        alt={
                          asset.file_name
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : asset.mime_type?.startsWith(
                        "video/"
                      ) &&
                      asset.signed_url ? (
                      <video
                        src={
                          asset.signed_url
                        }
                        controls
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="text-slate-400">
                        <AssetIcon
                          mimeType={
                            asset.mime_type
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                        <AssetIcon
                          mimeType={
                            asset.mime_type
                          }
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {
                            asset.file_name
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {typeLabel(
                            asset.mime_type
                          )}{" "}
                          •{" "}
                          {formatBytes(
                            asset.file_size
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 p-3">
                      <p className="text-sm font-medium">
                        {
                          asset.content_title
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {
                          asset.client_name
                        }{" "}
                        —{" "}
                        {
                          asset.campaign_name
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Version{" "}
                        {
                          asset.content_version
                        }
                      </p>
                    </div>

                    <div className="mt-4 text-xs text-slate-400">
                      Uploaded by{" "}
                      {
                        asset.uploader_name
                      }
                      <br />

                      {formatDate(
                        asset.created_at
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {asset.signed_url && (
                        <a
                          href={
                            asset.signed_url
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm font-medium transition hover:bg-slate-50"
                        >
                          Open Asset
                        </a>
                      )}

                      {currentRole !==
                        "client" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void deleteMedia(
                              asset
                            )
                          }
                        >
                          <Trash2
                            size={14}
                            className="mr-2"
                          />

                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}