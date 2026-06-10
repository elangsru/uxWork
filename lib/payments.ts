export interface PaymentField {
  label: string;
  value: string;
}

export interface PaymentRecord {
  type: string;
  fields: PaymentField[];
}

const SHEET_ID = "1gHIVpCGZWkxucVTy3N74m9AQxyDO8hm-MRAc9aJB_0s";
export const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

// Minimal CSV-parser: håndterer dobbeltfnuttede felt, komma inni felt,
// og escapede fnutter ("").
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // ignorer CR
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Transponerer regnearket: kolonner = betalingstyper, rader = datafelt.
// Første rad er headerrad (første celle tom, resten er betalingstyper).
// Første celle i hver påfølgende rad er feltnavnet.
export function transpose(rows: string[][]): PaymentRecord[] {
  if (rows.length === 0) return [];

  const header = rows[0];
  const paymentTypes = header.slice(1).map((t) => t.trim());

  const records: PaymentRecord[] = paymentTypes.map((type, colIndex) => {
    const fields: PaymentField[] = [];
    for (let r = 1; r < rows.length; r++) {
      const label = (rows[r][0] ?? "").trim();
      const value = (rows[r][colIndex + 1] ?? "").trim();
      if (label && value) {
        fields.push({ label, value });
      }
    }
    return { type, fields };
  });

  // Skjul betalingstyper uten utfylte felt (f.eks. tom "Bus Payment"-kolonne).
  return records.filter((r) => r.type && r.fields.length > 0);
}

export async function fetchPayments(): Promise<PaymentRecord[]> {
  const res = await fetch(SHEET_CSV_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Klarte ikke hente regneark: ${res.status}`);
  }
  const text = await res.text();
  return transpose(parseCsv(text));
}
