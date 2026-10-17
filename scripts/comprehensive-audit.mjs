#!/usr/bin/env node

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const PREVIEW_HOST = 'pv-d06ec682935a-ce84ce33-2ef3-4989-8a1b-998a24e3b2e2.style.dev';

async function runAudit() {
  console.log('Starting comprehensive UI audit...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  // Set extra HTTP headers to send the correct Host header
  await page.setExtraHTTPHeaders({
    'Host': PREVIEW_HOST
  });
  
  const issues = [];
  
  try {
    // Go to homepage
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    console.log('Loaded homepage');
    
    // Audit 1: Header alignment on desktop
    console.log('\\n=== Auditing Header Alignment ===');
    const headerIssues = await auditHeaderAlignment(page);
    issues.push(...headerIssues);
    
    // Audit 2: Disruptions page alignment
    console.log('\\n=== Auditing Disruptions Page ===');
    const disruptionIssues = await auditDisruptionsPage(page);
    issues.push(...disruptionIssues);
    
    // Audit 3: Journey detail page
    console.log('\\n=== Auditing Journey Detail Page ===');
    const journeyIssues = await auditJourneyDetailPage(page);
    issues.push(...journeyIssues);
    
    // Audit 4: Check various button consistencies
    console.log('\\n=== Auditing Button Consistency ===');
    const buttonIssues = await auditButtonConsistency(page);
    issues.push(...buttonIssues);
    
    // Audit 5: Check spacing and alignment throughout
    console.log('\\n=== Auditing Spacing and Alignment ===');
    const spacingIssues = await auditSpacingAndAlignment(page);
    issues.push(...spacingIssues);
    
  } finally {
    await context.close();
    await browser.close();
  }
  
  // Write report
  const report = {
    timestamp: new Date().toISOString(),
    totalIssues: issues.length,
    issues: issues
  };
  
  writeFileSync('/tmp/comprehensive-audit-report.json', JSON.stringify(report, null, 2));
  
  console.log(`\\n=== Audit Complete ===\\nFound ${issues.length} issues:`);
  issues.forEach((issue, index) => {
    console.log(`\\n${index + 1}. ${issue.category}: ${issue.description}`);
    console.log(`   Location: ${issue.location}`);
    console.log(`   Severity: ${issue.severity}`);
    if (issue.details) {
      console.log(`   Details: ${JSON.stringify(issue.details)}`);
    }
  });
  
  console.log(`\\nFull report written to: /tmp/comprehensive-audit-report.json`);
  
  return issues.length;
}

async function auditHeaderAlignment(page) {
  const issues = [];
  
  try {
    // Get header elements
    const backButton = await page.$('.app-header__back');
    const brandMark = await page.$('.app-header__brand');
    const alertsEntry = await page.$('.app-header__alerts');
    
    if (backButton && brandMark && alertsEntry) {
      const backBox = await backButton.boundingBox();
      const brandBox = await brandMark.boundingBox();
      const alertsBox = await alertsEntry.boundingBox();
      
      if (backBox && brandBox && alertsBox) {
        // Check if tops are aligned (within 1px tolerance)
        const tolerance = 1;
        const topDiffBackBrand = Math.abs(backBox.y - brandBox.y);
        const topDiffBrandAlerts = Math.abs(brandBox.y - alertsBox.y);
        const topDiffBackAlerts = Math.abs(backBox.y - alertsBox.y);
        
        if (topDiffBackBrand > tolerance) {
          issues.push({
            category: 'Header Alignment',
            description: `Back button and brand mark top edges misaligned by ${topDiffBackBrand.toFixed(1)}px`,
            location: 'Desktop header',
            severity: 'medium',
            details: {
              backButtonTop: backBox.y,
              brandMarkTop: brandBox.y,
              difference: topDiffBackBrand
            }
          });
        }
        
        if (topDiffBrandAlerts > tolerance) {
          issues.push({
            category: 'Header Alignment',
            description: `Brand mark and alerts entry top edges misaligned by ${topDiffBrandAlerts.toFixed(1)}px`,
            location: 'Desktop header',
            severity: 'medium',
            details: {
              brandMarkTop: brandBox.y,
              alertsEntryTop: alertsBox.y,
              difference: topDiffBrandAlerts
            }
          });
        }
        
        if (topDiffBackAlerts > tolerance) {
          issues.push({
            category: 'Header Alignment',
            description: `Back button and alerts entry top edges misaligned by ${topDiffBackAlerts.toFixed(1)}px`,
            location: 'Desktop header',
            severity: 'medium',
            details: {
              backButtonTop: backBox.y,
              alertsEntryTop: alertsBox.y,
              difference: topDiffBackAlerts
            }
          });
        }
        
        // Also check if they share the same baseline (bottom alignment)
        const bottomDiffBackBrand = Math.abs((backBox.y + backBox.height) - (brandBox.y + brandBox.height));
        const bottomDiffBrandAlerts = Math.abs((brandBox.y + brandBox.height) - (alertsBox.y + alertsBox.height));
        
        if (bottomDiffBackBrand > tolerance) {
          issues.push({
            category: 'Header Alignment',
            description: `Back button and brand mark bottom edges misaligned by ${bottomDiffBackBrand.toFixed(1)}px`,
            location: 'Desktop header',
            severity: 'low',
            details: {
              backButtonBottom: backBox.y + backBox.height,
              brandMarkBottom: brandBox.y + brandBox.height,
              difference: bottomDiffBackBrand
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error auditing header alignment:', error);
  }
  
  return issues;
}

async function auditDisruptionsPage(page) {
  const issues = [];
  
  try {
    // Go to disruptions page
    await page.goto(`http://localhost:3000/disruptions`, { waitUntil: 'networkidle' });
    
    // Check if there are any disruptions
    const disruptionCards = await page.$$('[data-disruption-id]');
    if (disruptionCards.length > 0) {
      // Click first disruption to go to detail page
      await disruptionCards[0].click();
      await page.waitForURL(/\/disruptions\/[a-z0-9-]+/, { waitUntil: 'networkidle' });
      
      // Check the "Plan around this alert" section alignment
      const planAroundSection = await page.$('h2:has-text("Plan around this alert")');
      if (planAroundSection) {
        const planAroundBox = await planAroundSection.boundingBox();
        
        // Check the buttons inside this section
        const buttons = await page.$$('.row-wrap > .btn, .row-wrap > .chip');
        if (buttons.length >= 2) {
          const buttonBoxes = [];
          for (const button of buttons) {
            const box = await button.boundingBox();
            if (box) buttonBoxes.push(box);
          }
          
          // Check if buttons in the same row have consistent heights and alignment
          if (buttonBoxes.length >= 2) {
            const firstButton = buttonBoxes[0];
            const secondButton = buttonBoxes[1];
            
            // Check if they're in the same row (similar y position)
            const rowTolerance = 5; // Allow 5px difference for being in same row
            if (Math.abs(firstButton.y - secondButton.y) < rowTolerance) {
              // They're in the same row, check height consistency
              const heightDiff = Math.abs(firstButton.height - secondButton.height);
              if (heightDiff > 2) {
                issues.push({
                  category: 'Button Consistency',
                  description: `Buttons in "Plan around this alert" section have inconsistent heights (diff: ${heightDiff.toFixed(1)}px)`,
                  location: 'Disruption detail page',
                  severity: 'medium',
                  details: {
                    firstButtonHeight: firstButton.height,
                    secondButtonHeight: secondButton.height,
                    difference: heightDiff
                  }
                });
              }
              
              // Check vertical alignment (tops should be similar)
              const topDiff = Math.abs(firstButton.y - secondButton.y);
              if (topDiff > 2) {
                issues.push({
                  category: 'Button Alignment',
                  description: `Buttons in "Plan around this alert" section have misaligned tops (diff: ${topDiff.toFixed(1)}px)`,
                  location: 'Disruption detail page',
                  severity: 'medium',
                  details: {
                    firstButtonTop: firstButton.y,
                    secondButtonTop: secondButton.y,
                    difference: topDiff
                  }
                });
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error auditing disruptions page:', error);
  }
  
  return issues;
}

async function auditJourneyDetailPage(page) {
  const issues = [];
  
  try {
    // We need to plan a journey first to have a journey detail page
    // For now, let's check if we can navigate to a known journey detail
    // or we'll skip this for now and focus on other areas
    console.log('Skipping journey detail audit for now (would require journey planning)');
  } catch (error) {
    console.error('Error auditing journey detail page:', error);
  }
  
  return issues;
}

async function auditButtonConsistency(page) {
  const issues = [];
  
  try {
    // Check various pages for button consistency
    const pages = [
      { path: '/', name: 'Homepage' },
      { path: '/disruptions', name: 'Disruptions page' },
      { path: '/stops', name: 'Stops page' }
    ];
    
    for (const { path, name } of pages) {
      try {
        await page.goto(`http://localhost:3000${path}`, { waitUntil: 'networkidle' });
        
        // Find all primary buttons
        const primaryButtons = await page.$$('.btn--primary');
        const buttonInfos = [];
        
        for (const button of primaryButtons) {
          const box = await button.boundingBox();
          const computedStyle = await page.evaluate((el) => {
            const style = window.getComputedStyle(el);
            return {
              paddingTop: parseFloat(style.paddingTop),
              paddingBottom: parseFloat(style.paddingBottom),
              paddingLeft: parseFloat(style.paddingLeft),
              paddingRight: parseFloat(style.paddingRight),
              fontSize: parseFloat(style.fontSize),
              height: parseFloat(style.height),
              minHeight: parseFloat(style.minHeight)
            };
          }, button);
          
          if (box && computedStyle) {
            buttonInfos.push({
              element: button,
              box: box,
              style: computedStyle,
              text: await button.textContent()
            });
          }
        }
        
        // Check consistency among primary buttons on this page
        if (buttonInfos.length > 1) {
          const first = buttonInfos[0];
          for (let i = 1; i < buttonInfos.length; i++) {
            const button = buttonInfos[i];
            
            // Check padding consistency
            const paddingDiff = Math.abs(first.style.paddingTop - button.style.paddingTop);
            if (paddingDiff > 0.5) {
              issues.push({
                category: 'Button Padding Inconsistency',
                description: `Primary buttons have inconsistent top padding on ${name} (diff: ${paddingDiff.toFixed(1)}px)`,
                location: name,
                severity: 'low',
                details: {
                  firstButton: {
                    text: first.text.trim(),
                    padding: first.style.paddingTop
                  },
                  currentButton: {
                    text: button.text.trim(),
                    padding: button.style.paddingTop
                  },
                  difference: paddingDiff
                }
              });
            }
            
            // Check font size consistency
            const fontSizeDiff = Math.abs(first.style.fontSize - button.style.fontSize);
            if (fontSizeDiff > 0.5) {
              issues.push({
                category: 'Button Font Size Inconsistency',
                description: `Primary buttons have inconsistent font size on ${name} (diff: ${fontSizeDiff.toFixed(1)}px)`,
                location: name,
                severity: 'low',
                details: {
                  firstButton: {
                    text: first.text.trim(),
                    fontSize: first.style.fontSize
                  },
                  currentButton: {
                    text: button.text.trim(),
                    fontSize: button.style.fontSize
                  },
                  difference: fontSizeDiff
                }
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Could not audit ${name}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error auditing button consistency:', error);
  }
  
  return issues;
}

async function auditSpacingAndAlignment(page) {
  const issues = [];
  
  try {
    // Check homepage for common spacing issues
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    
    // Check planner card alignment
    const plannerCard = await page.$('.planner-card');
    if (plannerCard) {
      const plannerBox = await plannerCard.boundingBox();
      
      // Check if planner card has consistent internal spacing
      const plannerRowInputs = await plannerCard.$$('.planner-row__input');
      const plannerRowBtns = await plannerCard.$$('.planner-row__btn');
      
      if (plannerRowInputs.length > 0 && plannerRowBtns.length > 0) {
        const inputBox = await plannerRowInputs[0].boundingBox();
        const btnBox = await plannerRowBtns[0].boundingBox();
        
        if (inputBox && btnBox) {
          // Check if they have the same height (they should)
          const heightDiff = Math.abs(inputBox.height - btnBox.height);
          if (heightDiff > 2) {
            issues.push({
              category: 'Planner Row Height Inconsistency',
              description: `Planner row input and button have inconsistent heights (diff: ${heightDiff.toFixed(1)}px)`,
              location: 'Homepage planner card',
              severity: 'medium',
              details: {
                inputHeight: inputBox.height,
                buttonHeight: btnBox.height,
                difference: heightDiff
              }
            });
          }
          
          // Check vertical alignment
          const verticalDiff = Math.abs(inputBox.y - btnBox.y);
          if (verticalDiff > 2) {
            issues.push({
              category: 'Planner Row Vertical Alignment',
              description: `Planner row input and button are vertically misaligned (diff: ${verticalDiff.toFixed(1)}px)`,
              location: 'Homepage planner card',
              severity: 'medium',
              details: {
                inputTop: inputBox.y,
                buttonTop: btnBox.y,
                difference: verticalDiff
              }
            });
          }
        }
      }
    }
    
    // Check for inconsistent gaps in lists/grids
    const listRows = await page.$$('.list-row');
    if (listRows.length > 1) {
      const firstRowBox = await listRows[0].boundingBox();
      const secondRowBox = await listRows[1].boundingBox();
      
      if (firstRowBox && secondRowBox) {
        const gapBetweenRows = secondRowBox.y - (firstRowBox.y + firstRowBox.height);
        // Expected gap should be consistent with CSS gap variables
        // Let's just check if it's reasonable (positive and not too large)
        if (gapBetweenRows < 0) {
          issues.push({
            category: 'Negative Row Gap',
            description: `List rows overlap or have negative gap (gap: ${gapBetweenRows.toFixed(1)}px)`,
            location: 'Homepage',
            severity: 'high',
            details: {
              gap: gapBetweenRows,
              firstRowBottom: firstRowBox.y + firstRowBox.height,
              secondRowTop: secondBox.y
            }
          });
        } else if (gapBetweenRows > 50) { // Arbitrary large gap
          issues.push({
            category: 'Excessive Row Gap',
            description: `List rows have excessive gap between them (gap: ${gapBetweenRows.toFixed(1)}px)`,
            location: 'Homepage',
            severity: 'medium',
            details: {
              gap: gapBetweenRows
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error auditing spacing and alignment:', error);
  }
  
  return issues;
}

// Run the audit
runAudit().then(count => {
  process.exit(count > 0 ? 1 : 0);
}).catch(error => {
  console.error('Audit failed:', error);
  process.exit(1);
});