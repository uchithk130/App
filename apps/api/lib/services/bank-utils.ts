/**
 * Mask a bank account number for safe display.
 * "1234567890" ? "XXXXXX7890"
 */
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  const visible = accountNumber.slice(-4);
  return "X".repeat(accountNumber.length - 4) + visible;
}

/**
 * Simple reversible obfuscation for bank account numbers.
 * In production, replace with AES-256-GCM encryption using a KMS key.
 */
export function encryptAccountNumber(accountNumber: string): string {
  return Buffer.from(accountNumber, "utf8").toString("base64");
}

export function decryptAccountNumber(encrypted: string): string {
  return Buffer.from(encrypted, "base64").toString("utf8");
}
