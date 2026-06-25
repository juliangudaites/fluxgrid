const ACCESS_CODE_KEY = 'fluxgrid_access_code';

export function getStoredAccessCode(): string | null {
  try {
    return localStorage.getItem(ACCESS_CODE_KEY);
  } catch {
    return null;
  }
}

export function setStoredAccessCode(code: string): void {
  localStorage.setItem(ACCESS_CODE_KEY, code.trim().toUpperCase());
}

export function clearStoredAccessCode(): void {
  localStorage.removeItem(ACCESS_CODE_KEY);
}