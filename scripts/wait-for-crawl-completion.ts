#!/usr/bin/env tsx

/**
 * Wait for the background crawl to complete and show final results
 */

import * as fs from 'fs';

const OUTPUT_FILE = '/tmp/claude/-Users-jkw/tasks/b0c28d7.output';

async function waitForCompletion() {
  console.log('Waiting for crawl to complete...\n');

  let previousSize = 0;
  let unchangedCount = 0;
  const maxUnchangedChecks = 10;  // If file size doesn't change for 10 checks (50s), assume done

  while (unchangedCount < maxUnchangedChecks) {
    await new Promise(resolve => setTimeout(resolve, 5000));  // Check every 5 seconds

    try {
      const stats = fs.statSync(OUTPUT_FILE);
      const currentSize = stats.size;

      if (currentSize === previousSize) {
        unchangedCount++;
        console.log(`Checking... (${unchangedCount}/${maxUnchangedChecks} - no new output)`);
      } else {
        unchangedCount = 0;
        console.log(`Crawl still running... (file size: ${currentSize} bytes)`);
      }

      previousSize = currentSize;

      // Check if we see "FINAL REPORT" in the file
      const content = fs.readFileSync(OUTPUT_FILE, 'utf-8');
      if (content.includes('FINAL REPORT')) {
        console.log('\n✅ Crawl completed!\n');
        console.log(content);
        return;
      }

    } catch (error: any) {
      console.error('Error reading file:', error.message);
      break;
    }
  }

  console.log('\n⏱️  Timeout or completion detected. Showing current output:\n');
  const content = fs.readFileSync(OUTPUT_FILE, 'utf-8');
  console.log(content);
}

waitForCompletion();
