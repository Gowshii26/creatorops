"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  BarChart3,
  Download,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

type CampaignOption = {
  id: string;
  name: string;
  client_name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
};

type ReportHistory = {
  id: string;
  campaign_id: string;
  report_name: string | null;
  report_type: string | null;
  created_at: string;
  campaign_name: string;
  client_name: string;
  generated_by_name: string;
};

type ReportContent = {
  id: string;
  title: string;
  platform: string;
  content_type: string;
  status: string;
  publish_at: string | null;
  current_version: number;
  reach: number;
  engagements: number;
  clicks: number;
  engagementRate: number;
};

type ReportData = {
  campaign: {
    id: string;
    name: string;
    clientName: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
  };

  filters: {
    from: string | null;
    to: string | null;
  };

  summary: {
    contentCount: number;
    published: number;
    scheduled: number;
    reach: number;
    engagements: number;
    clicks: number;
    engagementRate: number;
  };

  content: ReportContent[];
};

function number(
  value: number
) {
  return new Intl.NumberFormat(
    "en"
  ).format(value);
}

function formatValue(
  value: string
) {
  return value
    .split("_")
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

function formatDate(
  value:
    | string
    | null
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function safeFileName(
  value: string
) {
  return value
    .replace(
      /[^a-zA-Z0-9-_ ]/g,
      ""
    )
    .trim()
    .replace(
      /\s+/g,
      "-"
    )
    .toLowerCase();
}

export default function ReportCenter() {
  const [
    campaigns,
    setCampaigns,
  ] =
    useState<
      CampaignOption[]
    >([]);

  const [
    history,
    setHistory,
  ] =
    useState<
      ReportHistory[]
    >([]);

  const [
    campaignId,
    setCampaignId,
  ] =
    useState("");

  const [
    from,
    setFrom,
  ] =
    useState("");

  const [
    to,
    setTo,
  ] =
    useState("");

  const [
    report,
    setReport,
  ] =
    useState<
      ReportData | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    generating,
    setGenerating,
  ] =
    useState(false);

  const [
    exporting,
    setExporting,
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

  const loadSetup =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const response =
            await fetch(
              "/api/reports",
              {
                cache:
                  "no-store",
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                "Unable to load reports."
            );
          }

          setCampaigns(
            data.campaigns ??
              []
          );

          setHistory(
            data.history ??
              []
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load reports."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadSetup();
  }, [loadSetup]);

  async function generateReport() {
    if (!campaignId) {
      setError(
        "Select a campaign."
      );

      return;
    }

    setGenerating(true);
    setError("");
    setSuccess("");

    try {
      const params =
        new URLSearchParams();

      params.set(
        "campaignId",
        campaignId
      );

      if (from) {
        params.set(
          "from",
          from
        );
      }

      if (to) {
        params.set(
          "to",
          to
        );
      }

      const response =
        await fetch(
          `/api/reports?${params.toString()}`,
          {
            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to generate report."
        );
      }

      setReport(data);

      setSuccess(
        "Report generated from live CreatorOps data."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate report."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function exportPdf() {
    if (!report) {
      return;
    }

    setExporting(true);
    setError("");
    setSuccess("");

    try {
      const doc =
        new jsPDF();

      const generatedAt =
        new Date();

      const reportName =
        `${report.campaign.clientName} - ${report.campaign.name} Performance Report`;

      /*
       * HEADER
       */
      doc.setFontSize(21);
      doc.text(
        "CreatorOps",
        14,
        18
      );

      doc.setFontSize(15);
      doc.text(
        "Campaign Performance Report",
        14,
        29
      );

      doc.setFontSize(10);

      doc.text(
        `Client: ${report.campaign.clientName}`,
        14,
        39
      );

      doc.text(
        `Campaign: ${report.campaign.name}`,
        14,
        45
      );

      doc.text(
        `Campaign status: ${formatValue(
          report.campaign.status
        )}`,
        14,
        51
      );

      doc.text(
        `Campaign dates: ${formatDate(
          report.campaign.startDate
        )} - ${formatDate(
          report.campaign.endDate
        )}`,
        14,
        57
      );

      doc.text(
        `Metric period: ${
          report.filters.from
            ? formatDate(
                report.filters.from
              )
            : "All available data"
        } ${
          report.filters.to
            ? `to ${formatDate(
                report.filters.to
              )}`
            : ""
        }`,
        14,
        63
      );

      doc.text(
        `Generated: ${generatedAt.toLocaleString()}`,
        14,
        69
      );

      /*
       * KPI TABLE
       */
      autoTable(
        doc,
        {
          startY: 78,

          head: [
            [
              "Metric",
              "Value",
            ],
          ],

          body: [
            [
              "Content Items",
              String(
                report.summary
                  .contentCount
              ),
            ],
            [
              "Published",
              String(
                report.summary
                  .published
              ),
            ],
            [
              "Scheduled",
              String(
                report.summary
                  .scheduled
              ),
            ],
            [
              "Reach",
              number(
                report.summary
                  .reach
              ),
            ],
            [
              "Engagements",
              number(
                report.summary
                  .engagements
              ),
            ],
            [
              "Engagement Rate",
              `${report.summary.engagementRate.toFixed(
                1
              )}%`,
            ],
            [
              "Clicks",
              number(
                report.summary
                  .clicks
              ),
            ],
          ],

          theme:
            "grid",

          styles: {
            fontSize: 9,
          },

          headStyles: {
            fillColor: [
              20,
              20,
              20,
            ],
          },
        }
      );

      /*
       * CONTENT PERFORMANCE
       */
      const finalY =
        (
          doc as jsPDF & {
            lastAutoTable?: {
              finalY: number;
            };
          }
        ).lastAutoTable
          ?.finalY ??
        150;

      doc.setFontSize(13);

      doc.text(
        "Content Performance",
        14,
        finalY + 12
      );

      autoTable(
        doc,
        {
          startY:
            finalY + 17,

          head: [
            [
              "Content",
              "Platform",
              "Status",
              "Reach",
              "Eng.",
              "Rate",
              "Clicks",
            ],
          ],

          body:
            report.content.map(
              (item) => [
                item.title,

                formatValue(
                  item.platform
                ),

                formatValue(
                  item.status
                ),

                number(
                  item.reach
                ),

                number(
                  item.engagements
                ),

                `${item.engagementRate.toFixed(
                  1
                )}%`,

                number(
                  item.clicks
                ),
              ]
            ),

          theme:
            "grid",

          styles: {
            fontSize: 8,
            cellPadding: 2,
          },

          headStyles: {
            fillColor: [
              20,
              20,
              20,
            ],
          },
        }
      );

      /*
       * FOOTER
       */
      const pageCount =
        doc.getNumberOfPages();

      for (
        let page = 1;
        page <= pageCount;
        page++
      ) {
        doc.setPage(page);

        doc.setFontSize(8);

        doc.text(
          `CreatorOps | Campaign Performance Report | Page ${page} of ${pageCount}`,
          14,
          290
        );
      }

      /*
       * Save report-history metadata
       * before downloading.
       */
      const historyResponse =
        await fetch(
          "/api/reports",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                campaignId:
                  report.campaign.id,

                reportName,

                from:
                  report.filters.from,

                to:
                  report.filters.to,
              }),
          }
        );

      const historyData =
        await historyResponse.json();

      if (
        !historyResponse.ok
      ) {
        throw new Error(
          historyData.error ||
            "Unable to save report history."
        );
      }

      doc.save(
        `${safeFileName(
          report.campaign.name
        )}-performance-report.pdf`
      );

      setSuccess(
        "PDF generated successfully and recorded in report history."
      );

      await loadSetup();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to export report."
      );
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2
          size={18}
          className="animate-spin"
        />

        Loading reports...
      </div>
    );
  }

  return (
    <div>
      {/* REPORT BUILDER */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              Campaign Report Builder
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Generate a client-ready
              PDF using live campaign,
              content and analytics data.
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={
              loadSetup
            }
          >
            <RefreshCw
              size={14}
              className="mr-2"
            />

            Refresh
          </Button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Campaign
            </label>

            <select
              value={
                campaignId
              }
              onChange={(event) => {
                setCampaignId(
                  event.target.value
                );

                setReport(
                  null
                );
              }}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
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
                    —{" "}
                    {
                      campaign.name
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              From
            </label>

            <Input
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(
                  event.target.value
                );

                setReport(
                  null
                );
              }}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              To
            </label>

            <Input
              type="date"
              value={to}
              onChange={(event) => {
                setTo(
                  event.target.value
                );

                setReport(
                  null
                );
              }}
            />
          </div>
        </div>

        <div className="mt-5">
          <Button
            type="button"
            onClick={
              generateReport
            }
            disabled={
              generating ||
              !campaignId
            }
          >
            {generating ? (
              <Loader2
                size={15}
                className="mr-2 animate-spin"
              />
            ) : (
              <BarChart3
                size={15}
                className="mr-2"
              />
            )}

            {generating
              ? "Generating..."
              : "Generate Report"}
          </Button>
        </div>
      </section>

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

      {/* GENERATED REPORT */}

      {report && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Reach
              </p>

              <p className="mt-2 text-3xl font-bold">
                {number(
                  report.summary
                    .reach
                )}
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Engagements
              </p>

              <p className="mt-2 text-3xl font-bold">
                {number(
                  report.summary
                    .engagements
                )}
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Engagement Rate
              </p>

              <p className="mt-2 text-3xl font-bold">
                {report.summary
                  .engagementRate
                  .toFixed(1)}
                %
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Clicks
              </p>

              <p className="mt-2 text-3xl font-bold">
                {number(
                  report.summary
                    .clicks
                )}
              </p>
            </div>
          </div>

          <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {
                    report.campaign
                      .clientName
                  }
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {
                    report.campaign
                      .name
                  }
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {
                    report.summary
                      .contentCount
                  }{" "}
                  content items •{" "}
                  {
                    report.summary
                      .published
                  }{" "}
                  published •{" "}
                  {
                    report.summary
                      .scheduled
                  }{" "}
                  scheduled
                </p>
              </div>

              <Button
                type="button"
                onClick={
                  exportPdf
                }
                disabled={
                  exporting
                }
              >
                {exporting ? (
                  <Loader2
                    size={15}
                    className="mr-2 animate-spin"
                  />
                ) : (
                  <Download
                    size={15}
                    className="mr-2"
                  />
                )}

                {exporting
                  ? "Creating PDF..."
                  : "Download PDF"}
              </Button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wider text-slate-400">
                    <th className="pb-3">
                      Content
                    </th>

                    <th className="pb-3">
                      Platform
                    </th>

                    <th className="pb-3">
                      Status
                    </th>

                    <th className="pb-3 text-right">
                      Reach
                    </th>

                    <th className="pb-3 text-right">
                      Engagements
                    </th>

                    <th className="pb-3 text-right">
                      Rate
                    </th>

                    <th className="pb-3 text-right">
                      Clicks
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {report.content.map(
                    (item) => (
                      <tr
                        key={
                          item.id
                        }
                        className="border-b last:border-0"
                      >
                        <td className="py-4 font-medium">
                          {
                            item.title
                          }
                        </td>

                        <td className="py-4">
                          {formatValue(
                            item.platform
                          )}
                        </td>

                        <td className="py-4">
                          {formatValue(
                            item.status
                          )}
                        </td>

                        <td className="py-4 text-right">
                          {number(
                            item.reach
                          )}
                        </td>

                        <td className="py-4 text-right">
                          {number(
                            item.engagements
                          )}
                        </td>

                        <td className="py-4 text-right">
                          {item.engagementRate.toFixed(
                            1
                          )}
                          %
                        </td>

                        <td className="py-4 text-right">
                          {number(
                            item.clicks
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* REPORT HISTORY */}

      <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">
            Report History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Recently generated
            CreatorOps reports.
          </p>
        </div>

        {history.length ===
        0 ? (
          <div className="mt-6 rounded-xl bg-slate-50 p-10 text-center">
            <FileText
              size={22}
              className="mx-auto text-slate-400"
            />

            <p className="mt-3 text-sm text-slate-500">
              No reports generated yet.
            </p>
          </div>
        ) : (
          <div className="mt-5 divide-y">
            {history.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {item.report_name ||
                        "Campaign Performance Report"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {
                        item.client_name
                      }{" "}
                      —{" "}
                      {
                        item.campaign_name
                      }
                    </p>
                  </div>

                  <div className="text-xs text-slate-400 sm:text-right">
                    <p>
                      {
                        item.generated_by_name
                      }
                    </p>

                    <p className="mt-1">
                      {formatDate(
                        item.created_at
                      )}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}