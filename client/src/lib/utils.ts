import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates if an email is a company email (not a personal email domain)
 * @param email - The email address to validate
 * @returns true if it's a company email, false otherwise
 */
export function isValidCompanyEmail(email: string): boolean {
  const personalDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'live.com',
    'msn.com',
    'aol.com',
    'icloud.com',
    'mail.com',
    'protonmail.com',
    'tutanota.com',
    'yandex.com',
    'zoho.com',
    'fastmail.com',
    'gmx.com',
    '163.com',
    'qq.com',
    '126.com',
    'sina.com',
    'sohu.com'
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  return !personalDomains.includes(domain);
}

/**
 * Gets the domain from an email address
 * @param email - The email address
 * @returns The domain part of the email
 */
export function getEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || '';
}

/**
 * Formats an ISO date string to a user-friendly date format
 * @param isoString - The ISO date string to format
 * @returns Formatted date string (e.g., "Aug 26, 2025")
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return 'N/A';
  
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'N/A';
  }
}

/**
 * Formats an ISO date string to a user-friendly time format
 * @param isoString - The ISO date string to format
 * @returns Formatted time string (e.g., "11:00 AM")
 */
export function formatTime(isoString: string | null | undefined): string {
  if (!isoString) return 'N/A';
  
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return 'N/A';
  }
}

/**
 * Formats an ISO date string to a user-friendly date and time format
 * @param isoString - The ISO date string to format
 * @returns Formatted date and time string (e.g., "Aug 26, 2025 | 11:00 AM")
 */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return 'N/A';
  
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'N/A';
    
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return `${dateStr} | ${timeStr}`;
  } catch {
    return 'N/A';
  }
}
