import crypto from "node:crypto";

export function generateNumericCode(len = 6) {
  // 6 dígitos aleatórios (000000–999999, com padding)
  const n = crypto.randomInt(0, 10 ** len);
  return n.toString().padStart(len, "0");
}
