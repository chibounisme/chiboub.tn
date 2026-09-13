import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { preview } from 'vite';
import { launch } from 'chrome-launcher';
import lighthouse, { desktopConfig, type Result } from 'lighthouse';

const sitemap = await readFile(resolve('dist/sitemap.xml'), 'utf8');
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  ([, url]) => new URL(url!).pathname,
);
if (!paths.length) throw new Error('Build the site before running Lighthouse.');

const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
const budgets = {
  'total-blocking-time': 50,
  'cumulative-layout-shift': 0.01,
  'total-byte-weight': 102400,
};
const median = (values: number[]) => values.sort((a, b) => a - b)[1]!;
const summaries = [];
const reportRoot = resolve('lighthouse-reports');
// Each audit replaces its generated reports so deleted pages cannot leave stale results.
await rm(reportRoot, { recursive: true, force: true });
await mkdir(reportRoot, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 0 } });
try {
  const address = server.httpServer.address();
  if (!address || typeof address === 'string') {
    throw new Error('Preview unavailable.');
  }
  const chrome = await launch({ chromeFlags: ['--headless'] });
  try {
    for (const device of ['mobile', 'desktop']) {
      for (const [index, path] of paths.entries()) {
        const reports = join(reportRoot, device, String(index));
        await mkdir(reports, { recursive: true });
        const runs: Result[] = [];
        for (let run = 1; run <= 3; run++) {
          console.log(`${device} ${path}: run ${run}/3`);
          const result = await lighthouse(
            `http://127.0.0.1:${address.port}${path}`,
            {
              port: chrome.port,
              onlyCategories: categories,
              output: 'html',
              logLevel: 'error',
            },
            device === 'desktop' ? desktopConfig : undefined,
          );
          if (!result || result.lhr.runtimeError) {
            throw new Error(
              result?.lhr.runtimeError?.message ??
                'Lighthouse returned no result.',
            );
          }
          await writeFile(join(reports, `${run}.html`), String(result.report));
          await writeFile(
            join(reports, `${run}.json`),
            JSON.stringify(result.lhr),
          );
          runs.push(result.lhr);
        }
        const scores = Object.fromEntries(
          categories.map((category) => [
            category,
            median(runs.map((run) => run.categories[category]?.score ?? 0)) *
              100,
          ]),
        );
        const metrics = Object.fromEntries(
          Object.keys(budgets).map((audit) => [
            audit,
            median(
              runs.map((run) => run.audits[audit]?.numericValue ?? Infinity),
            ),
          ]),
        );
        const passed =
          Object.values(scores).every((score) => score === 100) &&
          Object.entries(budgets).every(
            ([audit, limit]) => metrics[audit]! <= limit,
          );
        summaries.push({ device, path, scores, metrics, passed, reports });
        console.log(JSON.stringify(summaries.at(-1), null, 2));
        if (!passed) process.exitCode = 1;
      }
    }
  } finally {
    chrome.kill();
  }
} finally {
  await server.close();
  await writeFile(
    join(reportRoot, 'summary.json'),
    JSON.stringify(summaries, null, 2),
  );
}
