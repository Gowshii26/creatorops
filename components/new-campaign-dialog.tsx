"use client";

import { useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Megaphone,
  Plus,
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

export default function NewCampaignDialog() {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState(false);

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Demo mode only.
    // In the next review this will be replaced
    // with a real database insert.
    setCreated(true);
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);

    if (!value) {
      setCreated(false);
    }
  }

  function closeDialog() {
    setOpen(false);
    setCreated(false);
  }

  return (
    <>
      {/* TRIGGER BUTTON */}
      <Button
        className="gap-2"
        onClick={() => {
          setCreated(false);
          setOpen(true);
        }}
      >
        <Megaphone size={16} />
        New Campaign
      </Button>

      {/* DIALOG */}
      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
      >
        <DialogContent className="sm:max-w-[600px]">
          {!created ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  Create New Campaign
                </DialogTitle>

                <DialogDescription>
                  Set up a new client campaign and assign the initial campaign
                  details.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={handleCreate}
                className="space-y-5 pt-3"
              >
                {/* CAMPAIGN NAME */}
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">
                    Campaign Name
                  </Label>

                  <Input
                    id="campaign-name"
                    placeholder="e.g. Winter Coffee Launch"
                    required
                  />
                </div>

                {/* CLIENT + STATUS */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Client
                    </Label>

                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="urban-brew">
                          Urban Brew
                        </SelectItem>

                        <SelectItem value="novafit">
                          NovaFit
                        </SelectItem>

                        <SelectItem value="northstar">
                          Northstar
                        </SelectItem>

                        <SelectItem value="brightside">
                          BrightSide
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Status
                    </Label>

                    <Select defaultValue="planning">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="planning">
                          Planning
                        </SelectItem>

                        <SelectItem value="active">
                          Active
                        </SelectItem>

                        <SelectItem value="draft">
                          Draft
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* DATES */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">
                      Start Date
                    </Label>

                    <Input
                      id="start-date"
                      type="date"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-date">
                      End Date
                    </Label>

                    <Input
                      id="end-date"
                      type="date"
                      required
                    />
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div className="space-y-2">
                  <Label htmlFor="campaign-description">
                    Description
                  </Label>

                  <Textarea
                    id="campaign-description"
                    placeholder="Describe the campaign objectives and scope..."
                    className="min-h-28"
                  />
                </div>

                {/* MANAGER */}
                <div className="space-y-2">
                  <Label>
                    Campaign Manager
                  </Label>

                  <Select defaultValue="alex">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="alex">
                        Alex Morgan
                      </SelectItem>

                      <SelectItem value="james">
                        James Morgan
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ACTIONS */}
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
                    Create Campaign
                  </Button>
                </div>
              </form>
            </>
          ) : (
            /* SUCCESS VIEW */
            <div className="flex flex-col items-center py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2
                  size={32}
                  className="text-green-600"
                />
              </div>

              <h2 className="mt-5 text-2xl font-bold">
                Campaign Created
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Your new campaign has been created successfully and is ready
                for content planning.
              </p>

              <div className="mt-6 rounded-xl bg-slate-50 px-6 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Demo Mode
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Persistent database storage will be added in the next
                  development phase.
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