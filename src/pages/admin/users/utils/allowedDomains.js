// src/pages/admin/users/utils/allowedDomains.js

export const ALLOWED_EMAIL_DOMAINS = [
  "mbqinc.com",
  "gmail.com",
];

export const isEmailAllowed = (email = "") => {
  const domain = email.split("@")[1]?.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
};
