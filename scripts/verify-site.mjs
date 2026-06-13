import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const BASE = 'https://jx1n.github.io/JapaneseLearning';
const SHOTS = 'scripts/verification-shots';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, // iPhone 14 size
  deviceScaleFactor: 2,
});

const page = await context.newPage();
const results = [];

async function step(label, fn) {
  try {
    const r = await fn();
    results.push({ label, status: '✅', details: r || '' });
  } catch (e) {
    results.push({ label, status: '❌', details: e.message });
  }
}

try {
  // ========== 1. Dashboard ==========
  await step('1. Dashboard loads', async () => {
    await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500); // Wait for Dexie seed
    const text = await page.textContent('body');
    if (!text.includes('今日の目標')) throw new Error('Dashboard title not found');
    await page.screenshot({ path: `${SHOTS}/1-dashboard.png`, fullPage: true });
    const dueCount = await page.textContent('body');
    return `Found: ${dueCount.includes('🔥') ? 'hero card' : 'unknown'}`;
  });

  // ========== 2. Bottom nav ==========
  await step('2. Bottom navigation visible', async () => {
    const nav = await page.textContent('nav');
    if (!nav.includes('首页') || !nav.includes('单词') || !nav.includes('语法') || !nav.includes('听力') || !nav.includes('更多')) {
      throw new Error('Bottom nav items missing');
    }
    return 'All 5 tabs present';
  });

  // ========== 3. Kana page ==========
  await step('3a. Navigate to Kana page via URL', async () => {
    await page.goto(`${BASE}/#/kana`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const text = await page.textContent('body');
    if (!text.includes('五十音图') || !text.includes('测验')) throw new Error('Kana page not loaded');
    await page.screenshot({ path: `${SHOTS}/2-kana-chart.png`, fullPage: true });
  });

  // Try More menu interaction
  await step('3b. More menu opens and closes', async () => {
    await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    // Click the More tab button in bottom nav
    const moreBtn = page.locator('nav button').last();
    await moreBtn.click();
    await page.waitForTimeout(800);
    const panel = page.locator('.fixed.bottom-16');
    const visible = await panel.isVisible();
    if (!visible) throw new Error('More menu panel not visible after click');
    // Close by clicking backdrop
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/30');
    await backdrop.first().click();
    await page.waitForTimeout(300);
    const stillVisible = await panel.isVisible();
    if (stillVisible) throw new Error('More menu did not close');
    return 'More menu opens and closes correctly';
  });

  // Switch to quiz
  await step('4. Kana quiz tab', async () => {
    await page.goto(`${BASE}/#/kana`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.click('button:has-text("测验")');
    await page.waitForTimeout(300);
    const text = await page.textContent('body');
    if (!text.includes('点击看答案')) throw new Error('Quiz not loaded');
    await page.screenshot({ path: `${SHOTS}/3-kana-quiz.png`, fullPage: true });
  });

  // ========== 4. Vocabulary review ==========
  await step('5. Vocabulary review page', async () => {
    await page.goto(`${BASE}/#/vocabulary`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const text = await page.textContent('body');
    // Either shows a review card or "all done" message
    if (!text.includes('タップ') && !text.includes('全部搞定')) {
      throw new Error('Review page unexpected state');
    }
    await page.screenshot({ path: `${SHOTS}/4-vocab-review.png`, fullPage: true });
  });

  // ========== 5. Word manager ==========
  await step('6. Word manager page', async () => {
    await page.goto(`${BASE}/#/vocabulary/manage`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const text = await page.textContent('body');
    if (!text.includes('单词库')) throw new Error('Word manager not loaded');
    await page.screenshot({ path: `${SHOTS}/5-word-manager.png`, fullPage: true });
  });

  // ========== 6. Grammar ==========
  await step('7. Grammar list page', async () => {
    await page.goto(`${BASE}/#/grammar`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const text = await page.textContent('body');
    if (!text.includes('语法学习') || !text.includes('N5')) throw new Error('Grammar list not loaded');
    // Count grammar points
    const buttons = await page.$$('button:has-text("学完"), button:has-text("N5")');
    await page.screenshot({ path: `${SHOTS}/6-grammar-list.png`, fullPage: true });
    return `${buttons.length} grammar points visible`;
  });

  // Navigate to first grammar detail
  await step('8. Grammar detail page', async () => {
    // Click the first grammar entry button
    const firstEntry = await page.$('.space-y-3 button');
    if (firstEntry) {
      await firstEntry.click();
      await page.waitForTimeout(1000);
      const text = await page.textContent('body');
      if (!text.includes('句型') && !text.includes('说明')) throw new Error('Grammar detail not loaded');
      await page.screenshot({ path: `${SHOTS}/7-grammar-detail.png`, fullPage: true });
    } else {
      throw new Error('No grammar entries found');
    }
  });

  // ========== 7. Listening ==========
  await step('9. Listening page', async () => {
    await page.goto(`${BASE}/#/listening`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const text = await page.textContent('body');
    if (!text.includes('听力练习')) throw new Error('Listening page not loaded');
    await page.screenshot({ path: `${SHOTS}/8-listening.png`, fullPage: true });
  });

  // Click into a track
  await step('10. Listening track detail', async () => {
    const firstTrack = await page.$('button:has-text("Morning")');
    if (firstTrack) {
      await firstTrack.click();
      await page.waitForTimeout(500);
      const text = await page.textContent('body');
      if (!text.includes('原文')) throw new Error('Track detail not loaded');
      // Toggle translation
      await page.click('button:has-text("显示翻译")');
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${SHOTS}/9-listening-detail.png`, fullPage: true });
    }
  });

  // ========== 8. Settings ==========
  await step('11. Settings page', async () => {
    await page.goto(`${BASE}/#/settings`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const text = await page.textContent('body');
    if (!text.includes('多设备同步') || !text.includes('数据管理')) throw new Error('Settings page not loaded');
    await page.screenshot({ path: `${SHOTS}/10-settings.png`, fullPage: true });
  });

  // ========== 9. Back to dashboard ==========
  await step('12. Return to dashboard via bottom nav', async () => {
    await page.click('button:has-text("首页")');
    await page.waitForTimeout(500);
    const text = await page.textContent('body');
    if (!text.includes('今日の目標')) throw new Error('Failed to return to dashboard');
    return 'Navigation loop works';
  });

} finally {
  await browser.close();
}

// Print results
console.log('\n=== Verification Results ===\n');
let pass = 0, fail = 0;
for (const r of results) {
  console.log(`${r.status} ${r.label}`);
  if (r.details) console.log(`   ${r.details}`);
  if (r.status === '✅') pass++;
  else fail++;
}
console.log(`\n${pass} passed, ${fail} failed`);
console.log(`Screenshots saved to: ${SHOTS}/`);
