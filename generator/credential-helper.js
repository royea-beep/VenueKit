#!/usr/bin/env node
/**
 * VenueKit Credential Helper
 *
 * Generates 1-2Clicks credential request URLs for new venue setups.
 * Usage: node credential-helper.js <venue-name> [--lang he|en] [--base-url <url>]
 *
 * The generated URL points venue owners to a 1-2Clicks page where they
 * can securely submit their Supabase and Google OAuth credentials
 * with step-by-step guidance.
 */

const KEYDROP_DEFAULT_URL = 'https://1-2clicks.vercel.app';

// Template slugs matching what's registered in 1-2Clicks (KeyDrop)
const TEMPLATES = {
  supabase: 'supabase-venuekit',
  googleOAuth: 'google-oauth-web',
};

// Pre-filled field definitions matching the 1-2Clicks templates
const CREDENTIAL_SETS = {
  supabase: {
    templateSlug: TEMPLATES.supabase,
    title: (venue) => `Supabase Credentials - ${venue}`,
    fields: [
      { label: 'Project URL', fieldType: 'URL', required: true },
      { label: 'Anon Key', fieldType: 'SECRET', required: true },
      { label: 'Service Role Key', fieldType: 'SECRET', required: true },
    ],
  },
  googleOAuth: {
    templateSlug: TEMPLATES.googleOAuth,
    title: (venue) => `Google OAuth - ${venue}`,
    fields: [
      { label: 'Client ID', fieldType: 'TEXT', required: true },
      { label: 'Client Secret', fieldType: 'SECRET', required: true },
    ],
  },
};

function buildCredentialUrl(venueName, options = {}) {
  const baseUrl = options.baseUrl || KEYDROP_DEFAULT_URL;
  const lang = options.lang || 'he';

  // Build a pre-filled request URL using query parameters.
  // 1-2Clicks dashboard supports ?prefill= with base64-encoded JSON
  // to auto-populate the "New Request" form.
  const prefillData = {
    clientName: venueName,
    projectName: `VenueKit - ${venueName}`,
    language: lang,
    templateSlug: TEMPLATES.supabase,
    note: lang === 'he'
      ? `בקשת הרשאות עבור אתר ${venueName} שנבנה עם VenueKit. אנא מלאו את פרטי Supabase.`
      : `Credential request for ${venueName} venue website built with VenueKit. Please fill in your Supabase details.`,
  };

  const encoded = Buffer.from(JSON.stringify(prefillData)).toString('base64url');
  return `${baseUrl}/dashboard?prefill=${encoded}`;
}

function printUsage() {
  console.log(`
VenueKit Credential Helper
===========================
Generates a 1-2Clicks URL for collecting venue credentials.

Usage:
  node credential-helper.js <venue-name> [options]

Options:
  --lang <he|en>       Language for the credential form (default: he)
  --base-url <url>     1-2Clicks instance URL (default: ${KEYDROP_DEFAULT_URL})

Examples:
  node credential-helper.js "Heroes Hadera"
  node credential-helper.js "Club 52" --lang en
  node credential-helper.js "Royal Flush" --base-url http://localhost:3000

Output:
  Prints the URL to share with the venue owner so they can submit
  their Supabase project credentials through a guided form.
`);
}

// --- CLI entry point ---
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const venueName = args[0];
  const options = {};

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--lang' && args[i + 1]) {
      options.lang = args[++i];
    } else if (args[i] === '--base-url' && args[i + 1]) {
      options.baseUrl = args[++i];
    }
  }

  const url = buildCredentialUrl(venueName, options);

  console.log(`
=== VenueKit Credential Request ===
Venue:    ${venueName}
Language: ${options.lang || 'he'}

Required credentials:
  1. Supabase Project  (template: ${TEMPLATES.supabase})
     - Project URL
     - Anon Key
     - Service Role Key

  2. Google OAuth       (template: ${TEMPLATES.googleOAuth})
     - Client ID
     - Client Secret

Send this link to the venue owner:
${url}

The venue owner will see a guided form with step-by-step
instructions for finding each credential in their dashboards.
`);
}

// Export for programmatic use
module.exports = { buildCredentialUrl, TEMPLATES, CREDENTIAL_SETS };

main();
