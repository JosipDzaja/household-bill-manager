"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireUser() {
  const {
    data: { user },
  } = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  return { supabase, user };
}

async function requireMembership() {
  const { supabase, user } = await requireUser();

  const { data: membership } = await supabase
    .from("household_members")
    .select("id, household_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  return { supabase, user, membership };
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(formData: FormData, key: string) {
  const value = Number(getString(formData, key));
  return Number.isFinite(value) ? value : 0;
}

export async function createHousehold(formData: FormData) {
  const { supabase, user } = await requireUser();
  const householdName = getString(formData, "household_name");

  if (!householdName) {
    redirect("/onboarding?error=Household name is required");
  }

  const { data: household, error: householdError } = await supabase
    .from("households")
    .insert({ name: householdName, created_by: user.id })
    .select("id")
    .single();

  if (householdError || !household) {
    redirect("/onboarding?error=Could not create household");
  }

  const { error: memberError } = await supabase.from("household_members").insert({
    household_id: household.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    redirect("/onboarding?error=Could not join household");
  }

  revalidatePath("/app");
  redirect("/app");
}

export async function createInviteLink() {
  const { supabase, membership } = await requireMembership();

  if (membership.role !== "owner") {
    redirect("/app?error=Only owners can create invites");
  }

  const token = crypto.randomUUID();

  const { error } = await supabase.from("invites").insert({
    household_id: membership.household_id,
    token,
    created_by: membership.id,
  });

  if (error) {
    redirect("/app?error=Could not create invite link");
  }

  redirect(`/app?invite=${token}`);
}

export async function acceptInvite(token: string) {
  const { supabase } = await requireUser();

  const { error } = await supabase.rpc("accept_invite", { p_token: token });

  if (error) {
    const msg = error.message ?? "";
    if (/invalid_invite/i.test(msg)) {
      redirect("/app?error=Invite is invalid, expired, or already used");
    }
    redirect(`/app?error=${encodeURIComponent(msg || "Could not join household")}`);
  }

  revalidatePath("/app");
  redirect("/app?message=Invite accepted");
}

const MAX_TAGS_PER_BILL = 24;

function parseBillTagsInput(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const t = part.trim().toLowerCase().slice(0, 48);
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= MAX_TAGS_PER_BILL) break;
  }
  return out;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uniqueCandidateTagIds(formData: FormData): string[] {
  const raw = formData.getAll("tag_ids");
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") continue;
    const id = entry.trim();
    if (!id || !UUID_RE.test(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

async function ensureTagIds(
  supabase: SupabaseClient,
  householdId: string,
  tagNames: string[],
): Promise<string[]> {
  // Look up all existing tags in one query
  const { data: existing } = await supabase
    .from("tags")
    .select("id, name")
    .eq("household_id", householdId)
    .in("name", tagNames);

  const existingMap = new Map((existing ?? []).map((t) => [t.name, t.id]));
  const toInsert = tagNames.filter((n) => !existingMap.has(n));

  if (toInsert.length === 0) {
    return tagNames.map((n) => existingMap.get(n)!);
  }

  const { data: inserted, error } = await supabase
    .from("tags")
    .insert(toInsert.map((name) => ({ household_id: householdId, name })))
    .select("id, name");

  if (error) {
    // On unique-constraint race, re-fetch the conflicting rows
    if (error.code === "23505") {
      const { data: retry } = await supabase
        .from("tags")
        .select("id, name")
        .eq("household_id", householdId)
        .in("name", toInsert);
      for (const row of retry ?? []) existingMap.set(row.name, row.id);
    } else {
      throw new Error(error.message ?? "Could not save tags");
    }
  }

  for (const row of inserted ?? []) existingMap.set(row.name, row.id);

  return tagNames.map((n) => existingMap.get(n)!).filter(Boolean);
}

export async function createBill(formData: FormData) {
  const { supabase, membership } = await requireMembership();

  const title = getString(formData, "title");
  const amount = getNumber(formData, "amount");
  const dueDate = getString(formData, "due_date");
  const startDate = getString(formData, "start_date");
  const endDate = getString(formData, "end_date");
  const currency = getString(formData, "currency") || "EUR";
  const payerMemberId = getString(formData, "payer_member_id") || membership.id;
  const newTagsRaw = getString(formData, "new_tags");
  const description = getString(formData, "description") || null;

  if (!title || amount <= 0 || !dueDate || isNaN(Date.parse(dueDate))) {
    redirect("/app/bills?error=Invalid bill values");
  }

  if (!startDate || !endDate || isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
    redirect("/app/bills?error=Invalid date range");
  }

  if (endDate < startDate) {
    redirect("/app/bills?error=End date must be on or after start date");
  }

  const { data: payerOk } = await supabase
    .from("household_members")
    .select("id")
    .eq("household_id", membership.household_id)
    .eq("id", payerMemberId)
    .maybeSingle();

  if (!payerOk) {
    redirect("/app/bills?error=Invalid payer");
  }

  const { data: duplicate } = await supabase
    .from("bills")
    .select("id")
    .eq("household_id", membership.household_id)
    .ilike("title", title)
    .eq("due_date", dueDate)
    .eq("amount", amount)
    .eq("start_date", startDate)
    .eq("end_date", endDate)
    .eq("is_active", true)
    .maybeSingle();

  if (duplicate) {
    redirect(
      `/app/bills?error=${encodeURIComponent("A bill with this title, amount, period and due date already exists")}`,
    );
  }

  const candidateIds = uniqueCandidateTagIds(formData);
  let verifiedIds: string[] = [];
  if (candidateIds.length > 0) {
    const { data: rows, error: tagLookupError } = await supabase
      .from("tags")
      .select("id")
      .eq("household_id", membership.household_id)
      .in("id", candidateIds);

    if (tagLookupError) {
      redirect(`/app/bills?error=${encodeURIComponent(tagLookupError.message)}`);
    }
    verifiedIds = (rows ?? []).map((r) => r.id);
  }

  const newTagNames = parseBillTagsInput(newTagsRaw);
  let mergedIds: string[] = [];
  try {
    const newIds =
      newTagNames.length > 0
        ? await ensureTagIds(supabase, membership.household_id, newTagNames)
        : [];
    mergedIds = [...new Set([...verifiedIds, ...newIds])];
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not save tags";
    redirect(`/app/bills?error=${encodeURIComponent(msg)}`);
  }

  if (mergedIds.length > MAX_TAGS_PER_BILL) {
    redirect(
      `/app/bills?error=${encodeURIComponent(`At most ${MAX_TAGS_PER_BILL} tags per bill`)}`,
    );
  }

  const { data: bill, error } = await supabase
    .from("bills")
    .insert({
      household_id: membership.household_id,
      title,
      amount,
      due_date: dueDate,
      start_date: startDate,
      end_date: endDate,
      currency,
      payer_member_id: payerMemberId,
      description,
    })
    .select("id")
    .single();

  if (error || !bill) {
    redirect(`/app/bills?error=${encodeURIComponent(error?.message ?? "Could not create bill")}`);
  }

  if (mergedIds.length > 0) {
    const rows = mergedIds.map((tag_id) => ({ bill_id: bill.id, tag_id }));
    const { error: linkError } = await supabase.from("bill_tags").insert(rows);
    if (linkError) {
      redirect(`/app/bills?error=${encodeURIComponent(linkError.message)}`);
    }
  }

  revalidatePath("/app");
  revalidatePath("/app/bills");
  redirect("/app/bills?message=Bill created");
}

export async function archiveBill(formData: FormData) {
  const { supabase } = await requireMembership();
  const billId = getString(formData, "bill_id");

  await supabase.from("bills").update({ is_active: false }).eq("id", billId);
  revalidatePath("/app");
  revalidatePath("/app/bills");
  redirect("/app/bills?message=Bill archived");
}

export async function markPaid(formData: FormData) {
  const { supabase, membership } = await requireMembership();
  const billId = getString(formData, "bill_id");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const { data: existing } = await supabase
    .from("bill_payments")
    .select("id")
    .eq("bill_id", billId)
    .gte("paid_at", monthStart)
    .lte("paid_at", monthEnd)
    .maybeSingle();

  if (!existing) {
    await supabase.from("bill_payments").insert({
      bill_id: billId,
      paid_by: membership.id,
      paid_at: now.toISOString(),
      amount_paid: null,
    });
  }

  revalidatePath("/app");
  revalidatePath("/app/bills");
  redirect("/app");
}

export async function markUnpaid(formData: FormData) {
  const { supabase } = await requireMembership();
  const billId = getString(formData, "bill_id");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  await supabase
    .from("bill_payments")
    .delete()
    .eq("bill_id", billId)
    .gte("paid_at", monthStart)
    .lte("paid_at", monthEnd);

  revalidatePath("/app");
  revalidatePath("/app/bills");
  redirect("/app");
}
