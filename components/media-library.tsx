"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  File,
  FileText,
  ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
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

function formatBytes(
  bytes: number | null
) {
  if (
    bytes === null ||
    bytes === 0
  ) {
    return "0 B";
  }

  if (
    bytes < 1024
  ) {
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
    useState<
      MediaAsset[]
    >([]);

  const [
    content,
    setContent,
  ] =
    useState<
      ContentOption[]
    >([]);

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

  const canUpload =
    currentRole !==
    "client";

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
            await Promise.all([
              mediaResponse.json(),
              contentResponse.json(),
            ]);

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
            mediaData.media ??
              []
          );

          setContent(
            (
              contentData.content ??
              []
            ).map(
              (
                item: {
                  id: string;
                  title: string;
                  campaign_name: string;
                  client_name: string;
                  status: string;
                }
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

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        await response.json();

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
        input.value =
          "";
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
        await response.json();

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
            {
              media.length
            }
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

      {/* UPLOAD */}

      {canUpload && (
        <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold">
              Upload Media
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Upload an image,
              video or PDF and
              attach it to a
              content version.
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
            Maximum file size:
            4 MB. Supported:
            images, videos and PDF.
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
          onClick={
            loadData
          }
        >
          <RefreshCw
            size={14}
            className="mr-2"
          />

          Refresh
        </Button>
      </div>

      {/* ASSETS */}

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
              Uploaded campaign
              assets will appear
              here.
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
                  {/* PREVIEW */}

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
                            deleteMedia(
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