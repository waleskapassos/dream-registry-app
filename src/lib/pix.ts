function emv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function sanitize(value: string, max: number): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .slice(0, max)
    .toUpperCase();
}

/** Gera o payload "Pix copia e cola" (BR Code estático). */
export function buildPixPayload(options: {
  key: string;
  name: string;
  city?: string;
  amountCents?: number;
  txid?: string;
}): string {
  const merchant = emv("00", "BR.GOV.BCB.PIX") + emv("01", options.key.trim());
  const amount =
    options.amountCents && options.amountCents > 0
      ? emv("54", (options.amountCents / 100).toFixed(2))
      : "";

  const payload =
    emv("00", "01") +
    emv("26", merchant) +
    emv("52", "0000") +
    emv("53", "986") +
    amount +
    emv("58", "BR") +
    emv("59", sanitize(options.name || "RECEBEDOR", 25) || "RECEBEDOR") +
    emv("60", sanitize(options.city || "SAO PAULO", 15) || "CIDADE") +
    emv("62", emv("05", sanitize(options.txid || "***", 25) || "***")) +
    "6304";

  return payload + crc16(payload);
}
