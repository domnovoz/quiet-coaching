// These checks catch common formats, not every possible sensitive value.
// The calling assistant must still omit all restricted data before sending it.
export function hasRestrictedData(text) {
  if (/-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/i.test(text)) return true;
  if (/\b(?:sk|pk|rk)-(?:proj-)?[A-Za-z0-9_-]{20,}\b/.test(text)) return true;
  if (/\b(?:password|passcode|api[_ -]?key|access[_ -]?token|secret|otp)\s*[:=]\s*\S+/i.test(text)) return true;
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) return true;
  // Only flag plausible 13-19 digit payment numbers that pass the Luhn check.
  for (const match of text.matchAll(/(?:\d[ -]?){13,19}/g)) {
    const digits = match[0].replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19 || /^(\d)\1+$/.test(digits)) continue;
    let sum = 0;
    for (let i = digits.length - 1, alternate = false; i >= 0; i--, alternate = !alternate) {
      let n = Number(digits[i]);
      if (alternate && (n *= 2) > 9) n -= 9;
      sum += n;
    }
    if (sum % 10 === 0) return true;
  }
  return false;
}
