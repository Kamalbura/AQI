#!/usr/bin/env node
/**
 * ThingSpeak Diagnostics Script
 * Quickly validates environment variables and performs a direct API request
 * bypassing application caching/processing to isolate upstream issues.
 *
 * PowerShell usage example:
 *   $env:THINGSPEAK_CHANNEL_ID='2863798'; $env:THINGSPEAK_READ_API_KEY='RIXY...'; npm run diagnose:thingspeak
 * Or with CLI flags (won't persist env):
 *   npm run diagnose:thingspeak -- --channel=2863798 --readKey=RIXY...
 */

const axios = require('axios');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.replace(/^--/, '').split('=');
      args[k] = v === undefined ? true : v;
    }
  }
  return args;
}

(async () => {
  const args = parseArgs(process.argv);

  // Support both new AQM_ prefixed and legacy env vars + CLI overrides
  const channelId = args.channel || process.env.AQM_THINGSPEAK_CHANNEL_ID || process.env.THINGSPEAK_CHANNEL_ID;
  const readKey = args.readKey || process.env.AQM_THINGSPEAK_READ_API_KEY || process.env.THINGSPEAK_READ_API_KEY;

  if (!channelId) {
    console.error('[DIAG] Missing channel ID. Provide via env THINGSPEAK_CHANNEL_ID or --channel=ID');
    process.exit(1);
  }

  console.log('[DIAG] ===============================');
  console.log('[DIAG] ThingSpeak Diagnostics');
  console.log('[DIAG] Channel ID:', channelId);
  console.log('[DIAG] Read key present:', !!readKey);

  const baseUrl = 'https://api.thingspeak.com';
  const url = `${baseUrl}/channels/${channelId}/feeds.json`;
  const params = { results: 2 };
  if (readKey) params.api_key = readKey;

  try {
    const start = Date.now();
    const resp = await axios.get(url, { params, timeout: 10000 });
    const ms = Date.now() - start;
    console.log('[DIAG] HTTP Status:', resp.status, `(${ms} ms)`);
    if (resp.data && resp.data.channel) {
      console.log('[DIAG] Channel name:', resp.data.channel.name || '(no name)');
      console.log('[DIAG] Privacy:', resp.data.channel.private ? 'Private' : 'Public');
      console.log('[DIAG] Returned feeds:', resp.data.feeds.length);
      if (resp.data.feeds.length > 0) {
        const last = resp.data.feeds[resp.data.feeds.length - 1];
        console.log('[DIAG] Last entry ID:', last.entry_id, 'Timestamp:', last.created_at);
      }
    } else {
      console.log('[DIAG] Unexpected response body keys:', Object.keys(resp.data || {}));
    }
    console.log('[DIAG] Success');
  } catch (err) {
    if (err.response) {
      console.error('[DIAG] Upstream Error Status:', err.response.status);
      if (typeof err.response.data === 'object') {
        console.error('[DIAG] Upstream Body:', JSON.stringify(err.response.data));
      } else {
        console.error('[DIAG] Upstream Body:', err.response.data);
      }
      if (err.response.status === 400) {
        console.error('[DIAG] Hint: 400 often means invalid channel ID, mismatched key, or disallowed parameter combo.');
      } else if (err.response.status === 401 || err.response.status === 403) {
        console.error('[DIAG] Hint: Permission issue. Ensure read key belongs to the channel (or channel is public).');
      } else if (err.response.status === 404) {
        console.error('[DIAG] Hint: Channel not found. Double-check the numeric ID.');
      }
    } else {
      console.error('[DIAG] Network/Error:', err.message);
    }
    process.exit(2);
  }
})();
