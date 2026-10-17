#!/usr/bin/env node

/**
 * Simple header alignment audit
 * Checks that the header elements (back button, brand mark, alerts entry) share the same top edge
 * by analyzing the CSS directly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the base.css file
const baseCssPath = path.join(__dirname, '..', 'src', 'styles', 'base.css');
let baseCss;

try {
  baseCss = fs.readFileSync(baseCssPath, 'utf8');
} catch (err) {
  console.error(`Failed to read ${baseCssPath}:`, err.message);
  process.exit(1);
}

console.log('🔍 Analyzing header alignment in base.css...\n');

const issues = [];

// Check .app-header__back
const backMatch = baseCss.match(/\\.app-header__back\s*\{([^}]*)\}/);
if (!backMatch) {
  issues.push('❌ Could not find .app-header__back rule');
} else {
  const backRules = backMatch[1];
  const hasAlignSelfStart = backRules.includes('align-self: start');
  const hasMarginTop = backRules.includes('margin-top: var(--s-4)');

  if (!hasAlignSelfStart) {
    issues.push('❌ .app-header__back missing align-self: start');
  }
  if (!hasMarginTop) {
    issues.push('❌ .app-header__back missing margin-top: var(--s-4)');
  }
}

// Check .app-header__brand
const brandMatch = baseCss.match(/\\.app-header__brand\s*\{([^}]*)\}/);
if (!brandMatch) {
  issues.push('❌ Could not find .app-header__brand rule');
} else {
  const brandRules = brandMatch[1];
  const hasAlignSelfStart = brandRules.includes('align-self: start');
  const hasMarginTop = brandRules.includes('margin-top: var(--s-4)');

  if (!hasAlignSelfStart) {
    issues.push('❌ .app-header__brand missing align-self: start');
  }
  if (!hasMarginTop) {
    issues.push('❌ .app-header__brand missing margin-top: var(--s-4)');
  }
}

// Check .app-header .app-header__alerts
const alertsMatch = baseCss.match(/\\.app-header\s*\\.app-header__alerts\s*\{([^}]*)\}/);
if (!alertsMatch) {
  issues.push('❌ Could not find .app-header .app-header__alerts rule');
} else {
  const alertsRules = alertsMatch[1];
  const hasAlignSelfStart = alertsRules.includes('align-self: start');
  const hasMarginTop = alertsRules.includes('margin-top: var(--s-4)');

  if (!hasAlignSelfStart) {
    issues.push('❌ .app-header .app-header__alerts missing align-self: start');
  }
  if (!hasMarginTop) {
    issues.push('❌ .app-header .app-header__alerts missing margin-top: var(--s-4)');
  }
}

// Check the comment about sharing one top edge
const commentMatch = baseCss.match(/\/\*\s*The three things in this row are the mark, a page's way back and the alerts entry\. They share\s*\*\*one top edge\*\* and nothing else:/);
if (!commentMatch) {
  issues.push('⚠️  Comment about sharing one top edge not found');
} else {
  console.log('✅ Found comment confirming header elements should share one top edge');
}

if (issues.length === 0) {
  console.log('✅ All header alignment checks passed!');
  console.log('✅ The back button, brand mark, and alerts entry should all share the same top edge');
  process.exit(0);
} else {
  console.log('❌ Found issues:');
  issues.forEach(issue => console.log(`  ${issue}`));
  process.exit(1);
}