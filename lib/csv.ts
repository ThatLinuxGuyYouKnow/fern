export const CSV_HEADERS = ["name", "price", "image_url", "description", "stock"] as const;

export const CSV_TEMPLATE = `name,price,image_url,description,stock
Shea Butter 250g,12.50,https://example.com/shea.jpg,Raw unrefined shea butter,40
Ankara Tote,28.00,https://example.com/tote.jpg,Handmade tote bag,25
Adire Scarf,15.75,,Hand-dyed cotton scarf,30
`;

export type CsvRow = {
  name: string;
  price_cents: number;
  image_url: string | null;
  description: string;
  stock: number;
};

/** Strip BOM, trim, lowercase — so "Name", " name " and "\ufeffname" all match. */
export function normalizeHeader(h: string): string {
  return (h ?? "").replace(/^\uFEFF/, "").trim().toLowerCase();
}

/** Map any-cased/whitespace-padded parsed record onto canonical keys. */
function canonicalRecord(r: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(r)) out[normalizeHeader(k)] = typeof v === "string" ? v.replace(/^\uFEFF/, "") : v;
  return out;
}

/** Validate one parsed CSV record. Returns row or error string. */
export function validateCsvRecord(raw: Record<string, string>, line: number): { row?: CsvRow; error?: string } {
  const r = canonicalRecord(raw);
  const name = (r.name ?? "").trim();
  if (!name) return { error: `line ${line}: name is required` };
  const priceRaw = (r.price ?? "").trim();
  const price = priceRaw === "" ? 0 : Number(priceRaw);
  if (!Number.isFinite(price) || price < 0)
    return { error: `line ${line} (${name}): price must be a non-negative number` };
  const stockRaw = (r.stock ?? "").trim();
  const stock = stockRaw === "" ? 0 : Number(stockRaw);
  if (!Number.isInteger(stock) || stock < 0)
    return { error: `line ${line} (${name}): stock must be a non-negative integer` };
  const image_url = (r.image_url ?? "").trim() || null;
  if (image_url && !/^(https?:\/\/|\/)/.test(image_url))
    return { error: `line ${line} (${name}): image_url must start with http(s):// or /` };
  return {
    row: {
      name,
      price_cents: Math.round(price * 100),
      image_url,
      description: (r.description ?? "").trim(),
      stock,
    },
  };
}
