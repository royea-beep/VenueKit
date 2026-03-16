#!/usr/bin/env node
/**
 * create-payplus-links.js
 * Creates 3 Payplus payment links for VenueKit packages.
 *
 * Usage:
 *   PAYPLUS_API_KEY=xxx PAYPLUS_SECRET_KEY=yyy node create-payplus-links.js
 *
 * Or set env vars in .env file and use:
 *   node -r dotenv/config create-payplus-links.js
 */

const API_URL = process.env.PAYPLUS_DEV_MODE === 'true'
  ? 'https://restapidev.payplus.co.il'
  : 'https://restapi.payplus.co.il';

const API_KEY = process.env.PAYPLUS_API_KEY;
const SECRET_KEY = process.env.PAYPLUS_SECRET_KEY;

if (!API_KEY || !SECRET_KEY) {
  console.error('Error: PAYPLUS_API_KEY and PAYPLUS_SECRET_KEY must be set');
  console.error('Usage: PAYPLUS_API_KEY=xxx PAYPLUS_SECRET_KEY=yyy node create-payplus-links.js');
  process.exit(1);
}

const PACKAGES = [
  { name: 'VenueKit Starter', nameHe: 'VenueKit סטארטר', price: 2500, description: 'חבילת בסיס: טורנירים + שחקנים + פאנל ניהול' },
  { name: 'VenueKit Pro',     nameHe: 'VenueKit פרו',     price: 3900, description: 'חבילת פרו: בסיס + ליגה + גלריות + טיימר + פרופילים' },
  { name: 'VenueKit Full',    nameHe: 'VenueKit מלא',     price: 5900, description: 'חבילה מלאה: כל 16 הפיצ׳רים + מיתוג מותאם' },
];

async function createPaymentLink(pkg) {
  const body = {
    payment_page_uid: '',
    charge_method: 1, // one-time charge
    currency_code: 'ILS',
    language_code: 'he',
    sendEmailApproval: true,
    more_info: `venuekit_${pkg.name.toLowerCase().replace(/\s+/g, '_')}`,
    refURL_success: 'https://venuekit.co.il?payment=success',
    refURL_failure: 'https://venuekit.co.il?payment=failed',
    items: [
      {
        name: pkg.nameHe,
        quantity: 1,
        price: pkg.price,
        currency_code: 'ILS',
        vat_type: 0,
      },
    ],
  };

  const res = await fetch(`${API_URL}/api/v1.0/PaymentPages/generateLink`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': JSON.stringify({ api_key: API_KEY, secret_key: SECRET_KEY }),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok || data.results?.status === 'error') {
    return { name: pkg.name, error: data.results?.description || data.message || `HTTP ${res.status}` };
  }

  return { name: pkg.name, price: pkg.price, url: data.data?.payment_page_link };
}

async function main() {
  console.log(`\nPayplus API: ${API_URL}`);
  console.log('Creating VenueKit payment links...\n');

  const results = [];
  for (const pkg of PACKAGES) {
    const result = await createPaymentLink(pkg);
    results.push(result);
    if (result.error) {
      console.log(`[FAIL] ${result.name}: ${result.error}`);
    } else {
      console.log(`[OK]   ${result.name} (ILS ${result.price})`);
      console.log(`       ${result.url}\n`);
    }
  }

  console.log('\n── Copy-paste into landing/script.js PAYPLUS_LINKS ──\n');
  console.log('const PAYPLUS_LINKS = {');
  for (let i = 0; i < PACKAGES.length; i++) {
    const key = PACKAGES[i].name.replace('VenueKit ', '');
    const r = results[i];
    if (r.url) {
      console.log(`  ${key}: '${r.url}',`);
    } else {
      console.log(`  ${key}: '', // FAILED: ${r.error}`);
    }
  }
  console.log('};');
}

main().catch(console.error);
