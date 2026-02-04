// src/pages/admin/users/utils/allowedDomains.js

// ⚠️ TEMPORAL: gmail permitido solo mientras no hay dominio oficial
export const ALLOWED_EMAIL_DOMAINS = [
  "mbqinc.com",
  "gmail.com",
];

// helper reutilizable
export const isEmailAllowed = (email = "") => {
  const domain = email.split("@")[1]?.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
};
