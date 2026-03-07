#!/usr/bin/env node
/* =====================================================
   generate.js — VenueKit site generator
   Usage: node generate.js --config configs/my-venue.json --output dist/my-venue
   Reads config, processes templates, outputs a ready-to-deploy site
===================================================== */

const fs = require('fs');
const path = require('path');

// ── Parse CLI args ──
const args = process.argv.slice(2);
let configPath = '', outputDir = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--config' && args[i + 1]) configPath = args[++i];
  if (args[i] === '--output' && args[i + 1]) outputDir = args[++i];
}

if (!configPath || !outputDir) {
  console.error('Usage: node generate.js --config <config.json> --output <dir>');
  process.exit(1);
}

// ── Load config ──
const configFile = path.resolve(configPath);
if (!fs.existsSync(configFile)) {
  console.error(`Config file not found: ${configFile}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
const v = config.venue || {};
const b = config.branding || {};
const s = config.supabase || {};
const f = config.features || {};
const t = config.tournament_defaults || {};
const a = config.auth || {};
const d = config.deploy || {};

console.log(`\n♠ VenueKit Generator`);
console.log(`────────────────────────────────`);
console.log(`  Venue:  ${v.name} (${v.name_en})`);
console.log(`  Output: ${outputDir}\n`);

// ── Placeholder map ──
const placeholders = {
  '{{VENUE_NAME}}': v.name || '',
  '{{VENUE_NAME_EN}}': v.name_en || '',
  '{{VENUE_TAGLINE}}': v.tagline || '',
  '{{VENUE_LOCATION}}': v.location || '',
  '{{CONTACT_PHONE}}': v.contact_phone || '',
  '{{CONTACT_EMAIL}}': v.contact_email || '',
  '{{VENUE_ADDRESS}}': v.address || '',
  '{{PRIMARY_COLOR}}': b.primary_color || '#E8223A',
  '{{SECONDARY_COLOR}}': b.secondary_color || '#E8B829',
  '{{BG_DARK}}': b.bg_dark || '#0D0F14',
  '{{BG_CARD}}': b.bg_card || '#151820',
  '{{FONT_HEBREW}}': b.font_hebrew || 'Heebo',
  '{{FONT_MONO}}': b.font_mono || 'JetBrains Mono',
  '{{LOGO_PATH}}': b.logo_path || 'images/logo.png',
  '{{SUPABASE_URL}}': s.url || '',
  '{{SUPABASE_KEY}}': s.anon_key || '',
  '{{BUCKET_WINNERS}}': s.bucket_winners || 'winner-photos',
  '{{BUCKET_GALLERY}}': s.bucket_gallery || 'gallery',
  '{{CURRENCY}}': t.currency || '₪',
  '{{CURRENCY_CODE}}': t.currency_code || 'ILS',
  '{{ENTRY_FEE}}': String(t.entry_fee || 350),
  '{{STARTING_STACK}}': String(t.starting_stack || 75000),
  '{{MAX_PLAYERS}}': String(t.max_players || 60),
  '{{MAX_REENTRIES}}': String(t.max_reentries || 3),
  '{{WEEKLY_DAY}}': t.weekly_day || 'Tuesday',
  '{{WEEKLY_TIME}}': t.weekly_time || '19:00',
  '{{SITE_URL}}': d.site_url || '',
  '{{YEAR}}': String(new Date().getFullYear()),
};

// ── Template processing ──

function replacePlaceholders(content) {
  let result = content;
  for (const [key, val] of Object.entries(placeholders)) {
    result = result.split(key).join(val);
  }
  return result;
}

function processConditionals(content, features) {
  // Process {{#if FEATURE_NAME}}...{{/if}} blocks
  return content.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, featureName, block) => {
    const enabled = features[featureName] || features[featureName.toLowerCase()];
    return enabled ? block : '';
  });
}

function processTemplate(content) {
  let result = processConditionals(content, f);
  result = replacePlaceholders(result);
  return result;
}

// ── File copying ──

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.html', '.css', '.js', '.json', '.sql', '.htaccess', ''].includes(ext) || entry.name.startsWith('.')) {
        // Process text files
        const content = fs.readFileSync(srcPath, 'utf8');
        fs.writeFileSync(destPath, processTemplate(content));
      } else {
        // Copy binary files as-is
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// ── Generate ──

const templatesDir = path.join(__dirname, 'templates');
const outDir = path.resolve(outputDir);

fs.mkdirSync(outDir, { recursive: true });
copyDir(templatesDir, outDir);

// Create images directory
fs.mkdirSync(path.join(outDir, 'images'), { recursive: true });

// Count output files
let fileCount = 0;
function countFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) countFiles(path.join(dir, entry.name));
    else fileCount++;
  }
}
countFiles(outDir);

console.log(`✓ Generated ${fileCount} files`);
console.log(`  Output: ${outDir}`);

// List enabled features
const enabled = Object.entries(f).filter(([, v]) => v).map(([k]) => k);
const disabled = Object.entries(f).filter(([, v]) => !v).map(([k]) => k);
console.log(`  Features: ${enabled.length} enabled, ${disabled.length} disabled`);
if (disabled.length > 0) console.log(`  Disabled: ${disabled.join(', ')}`);
console.log(`\n  Next steps:`);
console.log(`  1. Add your logo to ${outDir}/images/logo.png`);
console.log(`  2. Set up Supabase project and run schema.sql`);
console.log(`  3. Deploy to your hosting\n`);
