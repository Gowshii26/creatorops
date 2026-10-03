"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Building2,
  Check,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClientRow = {
  id: string;
  name: string;
  industry: string | null;
  contact_name: string | null;
  contact_email: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ClientForm = {
  name: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  description: string;
};

const emptyForm: ClientForm = {
  name: "",
  industry: "",
  contactName: "",
  contactEmail: "",
  description: "",
};

export default function ClientManagement() {
  const [clients, setClients] =
    useState<ClientRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [form, setForm] =
    useState<ClientForm>(
      emptyForm
    );

  const [
    editingClient,
    setEditingClient,
  ] =
    useState<ClientRow | null>(
      null
    );

  const [
    showForm,
    setShowForm,
  ] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadClients =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const response =
            await fetch(
              "/api/clients",
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
                "Unable to load clients."
            );
          }

          setClients(
            data.clients ?? []
          );
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Unable to load clients.";

          setError(message);
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filteredClients =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return clients;
      }

      return clients.filter(
        (client) => {
          const name =
            client.name
              .toLowerCase();

          const industry =
            (
              client.industry ??
              ""
            ).toLowerCase();

          const contactName =
            (
              client.contact_name ??
              ""
            ).toLowerCase();

          const contactEmail =
            (
              client.contact_email ??
              ""
            ).toLowerCase();

          return (
            name.includes(term) ||
            industry.includes(term) ||
            contactName.includes(term) ||
            contactEmail.includes(term)
          );
        }
      );
    }, [
      clients,
      search,
    ]);

  function updateField(
    field: keyof ClientForm,
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
    setEditingClient(null);
    setForm(emptyForm);

    setError("");
    setSuccess("");

    setShowForm(true);
  }

  function openEdit(
    client: ClientRow
  ) {
    setEditingClient(
      client
    );

    setForm({
      name:
        client.name,

      industry:
        client.industry ??
        "",

      contactName:
        client.contact_name ??
        "",

      contactEmail:
        client.contact_email ??
        "",

      description:
        client.description ??
        "",
    });

    setError("");
    setSuccess("");

    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingClient(null);
    setForm(emptyForm);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing =
        editingClient !== null;

      const endpoint =
        isEditing
          ? `/api/clients/${editingClient.id}`
          : "/api/clients";

      const response =
        await fetch(
          endpoint,
          {
            method:
              isEditing
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

                industry:
                  form.industry,

                contactName:
                  form.contactName,

                contactEmail:
                  form.contactEmail,

                description:
                  form.description,

                isActive:
                  true,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save client."
        );
      }

      const clientName =
        form.name;

      closeForm();

      setSuccess(
        isEditing
          ? `${clientName} was updated successfully.`
          : `${clientName} was created successfully.`
      );

      await loadClients();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to save client.";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function archiveClient(
    client: ClientRow
  ) {
    const confirmed =
      window.confirm(
        `Archive ${client.name}? The client will remain in the database for historical records.`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `/api/clients/${client.id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to archive client."
        );
      }

      setSuccess(
        `${client.name} was archived successfully.`
      );

      await loadClients();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to archive client.";

      setError(message);
    }
  }

  return (
    <div>
      {/* TOP ACTIONS */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
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
            placeholder="Search clients..."
            className="pl-10"
          />
        </div>

        <Button
          type="button"
          onClick={openCreate}
        >
          <Plus
            size={16}
            className="mr-2"
          />

          New Client
        </Button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <Check size={17} />

          {success}
        </div>
      )}

      {/* CREATE / EDIT FORM */}

      {showForm && (
        <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {editingClient
                  ? "Edit Client"
                  : "Create Client"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {editingClient
                  ? "Update this client record."
                  : "Add a new client company to your CreatorOps workspace."}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={closeForm}
            >
              <X size={18} />
            </Button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 grid gap-5 md:grid-cols-2"
          >
            {/* CLIENT NAME */}

            <div className="space-y-2">
              <Label htmlFor="client-name">
                Client Name
              </Label>

              <Input
                id="client-name"
                value={form.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value
                  )
                }
                placeholder="Urban Brew"
                required
              />
            </div>

            {/* INDUSTRY */}

            <div className="space-y-2">
              <Label htmlFor="industry">
                Industry
              </Label>

              <Input
                id="industry"
                value={
                  form.industry
                }
                onChange={(event) =>
                  updateField(
                    "industry",
                    event.target.value
                  )
                }
                placeholder="Food & Beverage"
              />
            </div>

            {/* CONTACT NAME */}

            <div className="space-y-2">
              <Label htmlFor="contact-name">
                Contact Name
              </Label>

              <Input
                id="contact-name"
                value={
                  form.contactName
                }
                onChange={(event) =>
                  updateField(
                    "contactName",
                    event.target.value
                  )
                }
                placeholder="Olivia Carter"
              />
            </div>

            {/* CONTACT EMAIL */}

            <div className="space-y-2">
              <Label htmlFor="contact-email">
                Contact Email
              </Label>

              <Input
                id="contact-email"
                type="email"
                value={
                  form.contactEmail
                }
                onChange={(event) =>
                  updateField(
                    "contactEmail",
                    event.target.value
                  )
                }
                placeholder="olivia@example.com"
              />
            </div>

            {/* DESCRIPTION */}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">
                Description
              </Label>

              <textarea
                id="description"
                value={
                  form.description
                }
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                placeholder="Client notes, brand details or relationship context..."
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>

            {/* BUTTONS */}

            <div className="flex gap-3 md:col-span-2">
              <Button
                type="submit"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2
                      size={16}
                      className="mr-2 animate-spin"
                    />

                    Saving...
                  </>
                ) : editingClient ? (
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

                    Create Client
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* CLIENT LIST */}

      <section className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border bg-white p-16 text-sm text-slate-500">
            <Loader2
              size={18}
              className="animate-spin"
            />

            Loading clients...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="rounded-2xl border bg-white p-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <Building2
                size={20}
              />
            </div>

            <h3 className="mt-4 font-semibold">
              No clients found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "Try a different search."
                : "Create your first CreatorOps client."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredClients.map(
              (client) => (
                <article
                  key={client.id}
                  className={`rounded-2xl border bg-white p-6 shadow-sm ${
                    client.is_active
                      ? ""
                      : "opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                      <Building2
                        size={19}
                      />
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        client.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {client.is_active
                        ? "Active"
                        : "Archived"}
                    </span>
                  </div>

                  <h2 className="mt-5 text-lg font-semibold">
                    {client.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {client.industry ??
                      "Industry not specified"}
                  </p>

                  <div className="mt-5 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <UserRound
                        size={15}
                      />

                      <span>
                        {client.contact_name ??
                          "No contact assigned"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail
                        size={15}
                      />

                      <span className="truncate">
                        {client.contact_email ??
                          "No email"}
                      </span>
                    </div>
                  </div>

                  {client.description && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                      {client.description}
                    </p>
                  )}

                  <div className="mt-6 flex gap-2 border-t pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        openEdit(
                          client
                        )
                      }
                    >
                      <Pencil
                        size={14}
                        className="mr-2"
                      />

                      Edit
                    </Button>

                    {client.is_active && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          archiveClient(
                            client
                          )
                        }
                      >
                        Archive
                      </Button>
                    )}
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