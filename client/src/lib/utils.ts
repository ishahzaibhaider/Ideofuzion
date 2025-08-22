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
