"use client";

import {
  btnPrimaryClassName,
  btnSecondaryClassName,
  inputClassName,
  SectionTitle,
} from "@/components/ui";
import type { MemberOption, ScannedBillData, TagOption } from "@/lib/types";
import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

const selectClassName = `${inputClassName} cursor-pointer`;

type Phase = "idle" | "loading" | "form" | "error";

type Props = {
  createBillAction: (formData: FormData) => Promise<void>;
  members: MemberOption[];
  householdTags: TagOption[];
  defaultPayerMemberId: string;
};

export function BillScannerForm({
  createBillAction,
  members,
  householdTags,
  defaultPayerMemberId,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [dueDate, setDueDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  function resetToIdle() {
    setPhase("idle");
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function applyScanned(data: ScannedBillData) {
    setTitle(data.title ?? "");
    setAmount(data.amount != null ? String(data.amount) : "");
    setCurrency(data.currency ?? "EUR");
    setDueDate(data.due_date ?? "");
    setStartDate(data.start_date ?? "");
    setEndDate(data.end_date ?? "");
    setDescription(data.description ?? "");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Image must be under 10 MB.");
      setPhase("error");
      return;
    }

    setPhase("loading");

    try {
      const fd = new FormData();
      fd.append("image", file);

      const res = await fetch("/api/scan-bill", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error ?? "Scan failed. Please try again.");
        setPhase("error");
        return;
      }

      applyScanned(json as ScannedBillData);
      setPhase("form");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setPhase("error");
    }
  }

  if (phase === "idle") {
    return (
      <div className="space-y-3">
        <SectionTitle
          title="Scan a bill"
          subtitle="Take a photo or upload an image to auto-fill the form."
        />
        <label className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border-strong p-8 text-center transition-colors hover:bg-surface">
          <UploadCloud className="h-8 w-8 text-muted" />
          <span className="text-sm text-muted">
            Tap to take a photo or upload a bill image
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture={"environment" as never}
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="space-y-3">
        <SectionTitle title="Scan a bill" />
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface/50 p-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-sm text-muted">Scanning bill…</span>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="space-y-3">
        <SectionTitle title="Scan a bill" />
        <p className="rounded-lg bg-red-50 p-2 text-sm text-red-800 ring-1 ring-red-200/80">
          {errorMsg}
        </p>
        <button type="button" onClick={resetToIdle} className={btnSecondaryClassName}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SectionTitle
        title="Scan a bill"
        subtitle="Review and edit the extracted values before saving."
      />
      <form action={createBillAction} className="space-y-3">
        <label className="block text-sm">
          Title
          <input
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClassName}
          />
        </label>
        <label className="block text-sm">
          Description
          <textarea
            name="description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClassName}
          />
        </label>
        <label className="block text-sm">
          Amount
          <input
            name="amount"
            required
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClassName}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm">
            Due date
            <input
              name="due_date"
              required
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClassName}
            />
          </label>
          <label className="block text-sm">
            Currency
            <input
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputClassName}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm">
            Start date
            <input
              name="start_date"
              required
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClassName}
            />
          </label>
          <label className="block text-sm">
            End date
            <input
              name="end_date"
              required
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClassName}
            />
          </label>
        </div>

        <label className="block text-sm">
          Tags
          {householdTags.length > 0 ? (
            <select
              name="tag_ids"
              multiple
              size={Math.min(8, householdTags.length)}
              className={selectClassName}
            >
              {householdTags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-1 text-xs text-muted">No saved tags yet — add some below.</p>
          )}
          <span className="mt-1 block text-xs text-muted">
            Hold Cmd (Mac) or Ctrl (Windows) to select multiple.
          </span>
        </label>
        <label className="block text-sm">
          New tags
          <input
            name="new_tags"
            placeholder="e.g. utilities, rent"
            className={inputClassName}
          />
          <span className="mt-1 block text-xs text-muted">
            Comma-separated; stored case-insensitively.
          </span>
        </label>

        <label className="block text-sm">
          Payer
          <select
            name="payer_member_id"
            defaultValue={defaultPayerMemberId}
            className={selectClassName}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name ?? "Household member"}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          <button type="submit" className={btnPrimaryClassName}>
            Create bill
          </button>
          <button type="button" onClick={resetToIdle} className={btnSecondaryClassName}>
            Scan again
          </button>
        </div>
      </form>
    </div>
  );
}
