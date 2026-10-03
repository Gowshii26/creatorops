"use client";

import { useState, type FormEvent } from "react";

import {
  CalendarDays,
  CheckCircle2,
  FilePlus2,
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

export default function CreateContentDialog() {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState(false);

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Demo only.
    // Real persistence will be added later.
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
      {/* CREATE CONTENT BUTTON */}
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

      {/* DIALOG */}
      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[650px]">
          {!created ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  Create Content
                </DialogTitle>

                <DialogDescription>
                  Add a new content piece to the Autumn Launch 2026 campaign.
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
                    required
                  />
                </div>

                {/* PLATFORM + TYPE */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Platform
                    </Label>

                    <Select>
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

                    <Select>
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

                {/* CAPTION */}
                <div className="space-y-2">
                  <Label htmlFor="caption">
                    Caption
                  </Label>

                  <Textarea
                    id="caption"
                    placeholder="Write the content caption..."
                    className="min-h-32"
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
                      Upload is simulated in the current demo build.
                    </p>
                  </div>
                </div>

                {/* STATUS INFO */}
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-sm font-semibold">
                    Initial Status
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    New content will be created as a Draft and can then be
                    submitted for internal review.
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
            /* SUCCESS VIEW */
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
                The content piece has been added to Autumn Launch 2026 as a
                draft and is ready for the creation workflow.
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