export const UZBEKISTAN_PHONE_PREFIX = "+998";
export const UZBEKISTAN_PHONE_DIGITS = 9;

export function normalizeUzbekistanPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const localDigits = digits.startsWith("998")
    ? digits.slice(3, 3 + UZBEKISTAN_PHONE_DIGITS)
    : digits.slice(0, UZBEKISTAN_PHONE_DIGITS);

  return `${UZBEKISTAN_PHONE_PREFIX}${localDigits}`;
}

export function formatUzbekistanPhone(value: string) {
  const normalized = normalizeUzbekistanPhone(value);
  const localDigits = normalized.slice(UZBEKISTAN_PHONE_PREFIX.length);
  const parts = [
    localDigits.slice(0, 2),
    localDigits.slice(2, 5),
    localDigits.slice(5, 7),
    localDigits.slice(7, 9),
  ].filter(Boolean);

  return [UZBEKISTAN_PHONE_PREFIX, ...parts].join(" ");
}

export function hasCompleteUzbekistanPhone(value: string) {
  const normalized = normalizeUzbekistanPhone(value);
  return (
    normalized.slice(UZBEKISTAN_PHONE_PREFIX.length).length ===
    UZBEKISTAN_PHONE_DIGITS
  );
}
