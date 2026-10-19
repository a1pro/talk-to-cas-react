import * as XLSX from "xlsx";

const TARGET_HEADERS = [
  "venue_code",
  "provider",
  "link_url",
  "offer_type",
  "ride_trip_type",
  "voucher_amount",
  "minimum_order",
  "location_postcode",
  "start_time",
  "end_time",
  "valid_from",
  "valid_until",
  "is_active",
  "source_label",
  "notes",
] as const;

const HEADER_ALIASES: Record<string, string[]> = {
  venue_code: ["venue_code", "venue code", "venue reference", "venue ref", "reference", "reference code", "ref", "cas venue code", "6 digit code", "6 character code"],
  provider: ["provider", "platform", "channel", "voucher provider"],
  link_url: ["link_url", "link url", "url", "voucher url", "voucher link", "html link", "html voucher link", "coupon link", "deep link", "sample voucher link"],
  offer_type: ["offer_type", "offer type", "offer", "voucher type", "offer category"],
  ride_trip_type: ["ride_trip_type", "ride trip type", "trip type", "trips", "ride only", "ride setting", "journey type"],
  voucher_amount: ["voucher_amount", "voucher amount", "voucher amount £", "amount", "discount", "credit", "coupon amount"],
  minimum_order: ["minimum_order", "minimum order", "min order", "minimum spend", "minimum basket"],
  location_postcode: ["location_postcode", "location postcode", "postcode", "post code", "business postcode", "venue postcode", "geo postcode", "geo-location restriction"],
  start_time: ["start_time", "start time", "from time", "launch time"],
  end_time: ["end_time", "end time", "until time", "close time"],
  valid_from: ["valid_from", "valid from", "start date", "date from", "from date", "starts", "available from"],
  valid_until: ["valid_until", "valid until", "end date", "expiry", "expires", "date until", "until date", "available until"],
  is_active: ["is_active", "is active", "active", "status", "available", "enabled"],
  source_label: ["source_label", "source label", "file label", "upload label", "batch label"],
  notes: ["notes", "note", "comment", "comments", "description"],
};

export interface PreparedProviderVoucherUpload {
  file: File;
  rowCount: number;
  originalName: string;
  detectedHeaders: string[];
  convertedFromSpreadsheet: boolean;
}

export async function prepareProviderVoucherUpload(file: File): Promise<PreparedProviderVoucherUpload> {
  const lowered = file.name.toLowerCase();

  if (lowered.endsWith(".xlsx") || lowered.endsWith(".xls")) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });

    const normalizedRows = rows
      .map((row) => normalizeImportRow(row, file.name))
      .filter((row) => hasContent(row));

    const csv = toCsv(normalizedRows);
    const outputName = file.name.replace(/\.(xlsx|xls)$/i, ".csv");

    return {
      file: new File([csv], outputName, { type: "text/csv" }),
      rowCount: normalizedRows.length,
      originalName: file.name,
      detectedHeaders: Object.keys(rows[0] || {}),
      convertedFromSpreadsheet: true,
    };
  }

  return {
    file,
    rowCount: 0,
    originalName: file.name,
    detectedHeaders: [],
    convertedFromSpreadsheet: false,
  };
}

export function downloadProviderVoucherTemplate() {
  const sampleRows = [
    {
      venue_code: "ABC123",
      provider: "uber",
      link_url: "https://r.uber.com/example-ride-link",
      offer_type: "ride",
      ride_trip_type: "to_and_from",
      voucher_amount: "5.00",
      minimum_order: "",
      location_postcode: "B5 4TR",
      start_time: "00:00",
      end_time: "23:59",
      valid_from: "2026-03-01",
      valid_until: "2026-03-31",
      is_active: "available",
      source_label: "voucher-test-codes",
      notes: "2 Trips (to-and-from)",
    },
    {
      venue_code: "DEF456",
      provider: "ubereats",
      link_url: "https://r.uber.com/example-food-link",
      offer_type: "food",
      ride_trip_type: "",
      voucher_amount: "5.00",
      minimum_order: "25.00",
      location_postcode: "M4 2BS",
      start_time: "11:00",
      end_time: "23:00",
      valid_from: "2026-03-01",
      valid_until: "2026-03-31",
      is_active: "available",
      source_label: "voucher-test-codes",
      notes: "£5 off £25 minimum order",
    },
  ];

  const blob = new Blob([toCsv(sampleRows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "provider-voucher-import-template.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function normalizeImportRow(row: Record<string, unknown>, originalName: string) {
  const mapped: Record<string, string> = {};

  Object.entries(row).forEach(([header, value]) => {
    const canonical = canonicalHeader(header);
    if (!canonical) return;
    mapped[canonical] = normalizeValue(value);
  });

  if (!mapped.source_label) {
    mapped.source_label = originalName;
  }

  if (!mapped.provider) {
    mapped.provider = inferProvider(mapped);
  }

  if (!mapped.offer_type) {
    mapped.offer_type = inferOfferType(mapped);
  }

  if (mapped.ride_trip_type) {
    mapped.ride_trip_type = normalizeRideTripType(mapped.ride_trip_type);
  }

  if (mapped.is_active) {
    mapped.is_active = normalizeActive(mapped.is_active);
  }

  return TARGET_HEADERS.reduce<Record<string, string>>((accumulator, header) => {
    accumulator[header] = mapped[header] ?? "";
    return accumulator;
  }, {});
}

function canonicalHeader(input: string): string | null {
  const normalized = normalizeHeader(input);

  for (const [target, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some((alias) => normalizeHeader(alias) === normalized)) {
      return target;
    }
  }

  return TARGET_HEADERS.includes(normalized as (typeof TARGET_HEADERS)[number]) ? normalized : null;
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, "_");
}

function normalizeValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function inferProvider(row: Record<string, string>) {
  const link = (row.link_url || "").toLowerCase();
  const offerType = (row.offer_type || "").toLowerCase();

  if (link.includes("ubereats") || offerType.includes("food") || row.minimum_order) {
    return "ubereats";
  }

  return "uber";
}

function inferOfferType(row: Record<string, string>) {
  if ((row.provider || "").toLowerCase() === "ubereats" || row.minimum_order) {
    return "food";
  }

  return "ride";
}

function normalizeRideTripType(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("2") || normalized.includes("two") || normalized.includes("to-and-from") || normalized.includes("return")) {
    return "to_and_from";
  }

  if (normalized.includes("1") || normalized.includes("one") || normalized.includes("to venue") || normalized.includes("to-venue")) {
    return "to_venue";
  }

  return value;
}

function normalizeActive(value: string) {
  const normalized = value.toLowerCase();
  if (["active", "available", "yes", "true", "1", "enabled", "live"].includes(normalized)) {
    return "true";
  }

  if (["inactive", "unavailable", "no", "false", "0", "disabled", "expired"].includes(normalized)) {
    return "false";
  }

  return value;
}

function hasContent(row: Record<string, string>) {
  return Object.values(row).some((value) => value.trim() !== "");
}

function toCsv(rows: Array<Record<string, string>>) {
  const headerLine = TARGET_HEADERS.join(",");
  const rowLines = rows.map((row) => TARGET_HEADERS.map((header) => escapeCsv(row[header] || "")).join(","));
  return [headerLine, ...rowLines].join("\n");
}

function escapeCsv(value: string) {
  const normalized = value.replace(/\r?\n|\r/g, " ").trim();
  if (!/[",\n]/.test(normalized)) return normalized;
  return `"${normalized.replace(/"/g, '""')}"`;
}
