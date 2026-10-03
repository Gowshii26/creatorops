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
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AppRole =
  | "admin"
  | "manager"
  | "creator"
  | "client";

type CampaignStatus =
  | "planning"
  | "active"
  | "paused"
  | "completed"
  | "archived";

type CampaignRow = {
  id: string;
  organization_id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  manager_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  client_name: string;
  manager_name: string | null;
};

type ClientOption = {
  id: string;
  name: string;
  is_active: boolean;
};

type ManagerOption = {
  id: string;
  fullName: string;
  role: string;
};

type CampaignForm = {
  name: string;
  description: string;
  clientId: string;
  managerId: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
};

const emptyForm: CampaignForm = {
  name: "",
  description: "",
  clientId: "",
  managerId: "",
  status: "planning",
  startDate: "",
  endDate: "",
};

function formatStatus(
  status: CampaignStatus
) {
  if (status === "planning") {
    return "Planning";
  }

  if (status === "active") {
    return "Active";
  }

  if (status === "paused") {
    return "Paused";
  }

  if (status === "completed") {
    return "Completed";
  }

  return "Archived";
}

function statusClass(
  status: CampaignStatus
) {
  if (status === "active") {
    return "bg-green-100 text-green-700";
  }

  if (status === "planning") {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "paused") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "completed") {
    return "bg-purple-100 text-purple-700";
  }

  return "bg-slate-100 text-slate-500";
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "Not set";
  }

  const date =
    new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat(
    "en",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

export default function CampaignManagement({
  currentRole,
}: {
  currentRole: AppRole;
}) {
  const [
    campaigns,
    setCampaigns,
  ] =
    useState<CampaignRow[]>([]);

  const [
    clients,
    setClients,
  ] =
    useState<ClientOption[]>([]);

  const [
    managers,
    setManagers,
  ] =
    useState<ManagerOption[]>([]);

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
    clientFilter,
    setClientFilter,
  ] =
    useState("all");

  const [
    form,
    setForm,
  ] =
    useState<CampaignForm>(
      emptyForm
    );

  const [
    editingCampaign,
    setEditingCampaign,
  ] =
    useState<CampaignRow | null>(
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

  const canManage =
    currentRole === "admin" ||
    currentRole === "manager";

  const loadCampaigns =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const response =
            await fetch(
              "/api/campaigns",
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
                "Unable to load campaigns."
            );
          }

          setCampaigns(
            data.campaigns ??
              []
          );

          setClients(
            data.clients ??
              []
          );

          setManagers(
            data.managers ??
              []
          );
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Unable to load campaigns.";

          setError(message);
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const visibleCampaigns =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return campaigns.filter(
        (campaign) => {
          const matchesSearch =
            !term ||
            campaign.name
              .toLowerCase()
              .includes(term) ||
            campaign.client_name
              .toLowerCase()
              .includes(term) ||
            (
              campaign.description ??
              ""
            )
              .toLowerCase()
              .includes(term);

          const matchesStatus =
            statusFilter ===
              "all" ||
            campaign.status ===
              statusFilter;

          const matchesClient =
            clientFilter ===
              "all" ||
            campaign.client_id ===
              clientFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesClient
          );
        }
      );
    }, [
      campaigns,
      search,
      statusFilter,
      clientFilter,
    ]);

  function updateField(
    field:
      keyof CampaignForm,
    value: string
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function openCreate() {
    setEditingCampaign(
      null
    );

    setForm({
      ...emptyForm,

      clientId:
        clients.length === 1
          ? clients[0].id
          : "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEdit(
    campaign: CampaignRow
  ) {
    setEditingCampaign(
      campaign
    );

    setForm({
      name:
        campaign.name,

      description:
        campaign.description ??
        "",

      clientId:
        campaign.client_id,

      managerId:
        campaign.manager_id ??
        "",

      status:
        campaign.status,

      startDate:
        campaign.start_date ??
        "",

      endDate:
        campaign.end_date ??
        "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingCampaign(null);
    setForm(emptyForm);
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
        editingCampaign !==
        null;

      const endpoint =
        editing
          ? `/api/campaigns/${editingCampaign.id}`
          : "/api/campaigns";

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
              JSON.stringify({
                name:
                  form.name,

                description:
                  form.description,

                clientId:
                  form.clientId,

                managerId:
                  form.managerId ||
                  null,

                status:
                  form.status,

                startDate:
                  form.startDate ||
                  null,

                endDate:
                  form.endDate ||
                  null,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save campaign."
        );
      }

      const campaignName =
        form.name;

      closeForm();

      setSuccess(
        editing
          ? `${campaignName} was updated successfully.`
          : `${campaignName} was created successfully.`
      );

      await loadCampaigns();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to save campaign.";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function archiveCampaign(
    campaign: CampaignRow
  ) {
    const confirmed =
      window.confirm(
        `Archive ${campaign.name}?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `/api/campaigns/${campaign.id}`,
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
            "Unable to archive campaign."
        );
      }

      setSuccess(
        `${campaign.name} was archived.`
      );

      await loadCampaigns();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to archive campaign.";

      setError(message);
    }
  }

  return (
    <div>
      {/* FILTERS */}

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row">
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
              placeholder="Search campaigns..."
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

            <option value="planning">
              Planning
            </option>

            <option value="active">
              Active
            </option>

            <option value="paused">
              Paused
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="archived">
              Archived
            </option>
          </select>

          <select
            value={
              clientFilter
            }
            onChange={(event) =>
              setClientFilter(
                event.target.value
              )
            }
            className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          >
            <option value="all">
              All clients
            </option>

            {clients.map(
              (client) => (
                <option
                  key={
                    client.id
                  }
                  value={
                    client.id
                  }
                >
                  {
                    client.name
                  }
                </option>
              )
            )}
          </select>
        </div>

        {canManage && (
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

            New Campaign
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

      {/* CREATE / EDIT */}

      {showForm &&
        canManage && (
          <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingCampaign
                    ? "Edit Campaign"
                    : "Create Campaign"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Connect the
                  campaign to a
                  client, Manager,
                  dates and lifecycle
                  status.
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
                <X
                  size={18}
                />
              </Button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-6 grid gap-5 md:grid-cols-2"
            >
              <div className="space-y-2">
                <Label htmlFor="campaign-name">
                  Campaign Name
                </Label>

                <Input
                  id="campaign-name"
                  value={
                    form.name
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "name",
                      event.target
                        .value
                    )
                  }
                  placeholder="Autumn Launch 2026"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign-client">
                  Client
                </Label>

                <select
                  id="campaign-client"
                  value={
                    form.clientId
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "clientId",
                      event.target
                        .value
                    )
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                  required
                >
                  <option value="">
                    Select client
                  </option>

                  {clients
                    .filter(
                      (
                        client
                      ) =>
                        client.is_active
                    )
                    .map(
                      (
                        client
                      ) => (
                        <option
                          key={
                            client.id
                          }
                          value={
                            client.id
                          }
                        >
                          {
                            client.name
                          }
                        </option>
                      )
                    )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign-manager">
                  Manager
                </Label>

                <select
                  id="campaign-manager"
                  value={
                    form.managerId
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "managerId",
                      event.target
                        .value
                    )
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="">
                    No manager assigned
                  </option>

                  {managers.map(
                    (
                      manager
                    ) => (
                      <option
                        key={
                          manager.id
                        }
                        value={
                          manager.id
                        }
                      >
                        {
                          manager.fullName
                        }{" "}
                        (
                        {
                          manager.role
                        }
                        )
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign-status">
                  Status
                </Label>

                <select
                  id="campaign-status"
                  value={
                    form.status
                  }
                  onChange={(
                    event
                  ) => {
                    const value =
                      event.target
                        .value;

                    if (
                      value ===
                        "planning" ||
                      value ===
                        "active" ||
                      value ===
                        "paused" ||
                      value ===
                        "completed" ||
                      value ===
                        "archived"
                    ) {
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          status:
                            value,
                        })
                      );
                    }
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="planning">
                    Planning
                  </option>

                  <option value="active">
                    Active
                  </option>

                  <option value="paused">
                    Paused
                  </option>

                  <option value="completed">
                    Completed
                  </option>

                  <option value="archived">
                    Archived
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date">
                  Start Date
                </Label>

                <Input
                  id="start-date"
                  type="date"
                  value={
                    form.startDate
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "startDate",
                      event.target
                        .value
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">
                  End Date
                </Label>

                <Input
                  id="end-date"
                  type="date"
                  value={
                    form.endDate
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "endDate",
                      event.target
                        .value
                    )
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="campaign-description">
                  Description
                </Label>

                <textarea
                  id="campaign-description"
                  rows={4}
                  value={
                    form.description
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "description",
                      event.target
                        .value
                    )
                  }
                  placeholder="Campaign objectives, channels and notes..."
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>

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
                        size={
                          16
                        }
                        className="mr-2 animate-spin"
                      />

                      Saving...
                    </>
                  ) : editingCampaign ? (
                    <>
                      <Pencil
                        size={
                          16
                        }
                        className="mr-2"
                      />

                      Save Changes
                    </>
                  ) : (
                    <>
                      <Plus
                        size={
                          16
                        }
                        className="mr-2"
                      />

                      Create Campaign
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

      {/* CAMPAIGNS */}

      <section className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border bg-white p-16 text-sm text-slate-500">
            <Loader2
              size={18}
              className="animate-spin"
            />

            Loading campaigns...
          </div>
        ) : visibleCampaigns.length ===
          0 ? (
          <div className="rounded-2xl border bg-white p-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <Megaphone
                size={20}
              />
            </div>

            <h3 className="mt-4 font-semibold">
              No campaigns found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {campaigns.length >
              0
                ? "Try changing your search or filters."
                : canManage
                  ? "Create your first CreatorOps campaign."
                  : "No campaigns are available to you yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleCampaigns.map(
              (
                campaign
              ) => (
                <article
                  key={
                    campaign.id
                  }
                  className="rounded-2xl border bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                      <Megaphone
                        size={
                          19
                        }
                      />
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                        campaign.status
                      )}`}
                    >
                      {formatStatus(
                        campaign.status
                      )}
                    </span>
                  </div>

                  <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {
                      campaign.client_name
                    }
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    {
                      campaign.name
                    }
                  </h2>

                  {campaign.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                      {
                        campaign.description
                      }
                    </p>
                  )}

                  <div className="mt-5 space-y-3 border-t pt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CalendarDays
                        size={
                          15
                        }
                      />

                      <span>
                        {formatDate(
                          campaign.start_date
                        )}
                        {" – "}
                        {formatDate(
                          campaign.end_date
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <UserRound
                        size={
                          15
                        }
                      />

                      <span>
                        {campaign.manager_name ??
                          "No manager assigned"}
                      </span>
                    </div>
                  </div>

                  {canManage && (
                    <div className="mt-5 flex gap-2 border-t pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openEdit(
                            campaign
                          )
                        }
                      >
                        <Pencil
                          size={
                            14
                          }
                          className="mr-2"
                        />

                        Edit
                      </Button>

                      {campaign.status !==
                        "archived" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            archiveCampaign(
                              campaign
                            )
                          }
                        >
                          <Archive
                            size={
                              14
                            }
                            className="mr-2"
                          />

                          Archive
                        </Button>
                      )}
                    </div>
                  )}
                </article>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}