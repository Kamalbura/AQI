// Simple smoke test to verify backend endpoints
// Usage: npm run smoke

const http = require('http');

const endpoints = [
  'http://localhost:3000/health',
  'http://localhost:3000/health/detailed',
  'http://localhost:3000/api/health',
  'http://localhost:3000/api',
  'http://localhost:3000/api/data/latest',
  'http://localhost:3000/api/data/historical?days=2'
];

function check(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        resolve({ url, status: res.statusCode, ok: res.statusCode < 400, body: body.slice(0, 120) });
      });
    });
    req.on('error', (err) => resolve({ url, error: err.message, ok: false }));
    req.setTimeout(4000, () => {
      req.destroy(new Error('timeout'));
    });
  });
}

(async () => {
  const results = await Promise.all(endpoints.map(check));
  const ok = results.every(r => r.ok);
  console.log('\nSMOKE TEST RESULTS');
  results.forEach(r => {
    if (r.ok) {
      console.log(`✔ ${r.url} -> ${r.status}`);
    } else {
      console.log(`✖ ${r.url} -> ${r.error || r.status}`);
    }
  });
  if (!ok) {
    process.exitCode = 1;
  }
})();
