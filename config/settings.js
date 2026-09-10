/* ==========================================================================
   BABKE KEBAB & PLATES — PUBLIC CLIENT CONFIGURATION

   This file is served to every visitor's browser. It must contain PUBLIC
   values only.

   ADMIN_USERNAME, ADMIN_PASSWORD and SESSION_KEY used to live here and were
   publicly downloadable. They are gone for good — authentication is entirely
   server-side (POST /api/admin/login + the httpOnly `admin_token` cookie).
   Do NOT re-add credentials of any kind to this file.

   Do not delete this file or the BABKE_CONFIG global either:
     - admin/admin.js  -> checkAuth() early-returns if BABKE_CONFIG is undefined
     - scripts/cart.js -> falls back to the WRONG WhatsApp number without
                          BABKE_CONFIG.PHONE_NUMBER
   ========================================================================== */

const BABKE_CONFIG = {
  PHONE_NUMBER: "21620985204" // Restaurant WhatsApp number (public)
};
