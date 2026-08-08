export function dateInZone(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function formValue(form: HTMLFormElement, name: string) {
  const value = new FormData(form).get(name);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function tagsValue(form: HTMLFormElement, name: string) {
  const raw = formValue(form, name);
  if (!raw) return [];
  return raw.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20);
}
