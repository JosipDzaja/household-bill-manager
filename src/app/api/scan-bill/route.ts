import { createClient } from "@/lib/supabase/server";
import type { ScannedBillData } from "@/lib/types";
import OpenAI from "openai";
import { NextResponse } from "next/server";

const PROMPT = `You are a bill data extractor. Extract structured data from this Croatian household utility bill image.
Key Croatian terms: "Iznos"/"Ukupno" = amount, "Rok plaćanja"/"Datum dospijeća" = due date,
"Datum" = date, "Valuta" = currency, "Račun za"/"Usluga" = service/title.

Return ONLY a JSON object (use null for fields you cannot find or are uncertain about):
{
  "title": string | null,
  "amount": number | null,
  "currency": string | null,
  "due_date": string | null,
  "start_date": string | null,
  "end_date": string | null,
  "description": string | null
}

"title" should be the biller name and service, e.g. "HEP - Struja".
"amount" is the total amount due as a plain number, e.g. 45.20.
"currency" is typically "EUR" (or "HRK" on older Croatian bills).
"due_date" is the full payment due date in YYYY-MM-DD format.
"start_date" and "end_date" are the billing period in YYYY-MM-DD format.
"description" is a brief summary of what the bill covers, e.g. account number, meter readings, or service details.`;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function coerce(raw: unknown): ScannedBillData {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const amount = Number(obj.amount);
  const dueDate =
    typeof obj.due_date === "string" && DATE_RE.test(obj.due_date) ? obj.due_date : null;
  const startDate =
    typeof obj.start_date === "string" && DATE_RE.test(obj.start_date) ? obj.start_date : null;
  const endDate =
    typeof obj.end_date === "string" && DATE_RE.test(obj.end_date) ? obj.end_date : null;

  return {
    title: typeof obj.title === "string" && obj.title.trim() ? obj.title.trim() : null,
    amount: Number.isFinite(amount) && amount > 0 ? amount : null,
    currency: typeof obj.currency === "string" && obj.currency.trim() ? obj.currency.trim() : null,
    due_date: dueDate,
    start_date: startDate,
    end_date: endDate,
    description: typeof obj.description === "string" && obj.description.trim() ? obj.description.trim() : null,
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI not configured" }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 10 MB" }, { status: 400 });
  }

  try {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const openai = new OpenAI();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 500,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            {
              type: "image_url",
              image_url: { url: `data:${file.type};base64,${base64}` },
            },
          ],
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = coerce(JSON.parse(content));
    return NextResponse.json(parsed);
  } catch (e) {
    const detail = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: "Scan failed", detail }, { status: 500 });
  }
}
