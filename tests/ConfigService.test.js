const path = require('path');
const fs = require('fs');
const originalEnv = { ...process.env };

describe('ConfigService', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv }; // reset
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('loads defaults and parses ALLOWED_ORIGINS list', () => {
    process.env.PORT = '5555';
    process.env.ALLOWED_ORIGINS = 'https://a.com, https://b.com';
    process.env.THINGSPEAK_CHANNEL_ID = '12345';
    process.env.THINGSPEAK_READ_API_KEY = 'READKEY';
    jest.resetModules();
    const ConfigService = require('../src/services/ConfigService');
    const cfg = ConfigService.getConfig();
    expect(cfg.server.port).toBe(5555);
    expect(cfg.cors.allowedOrigins).toEqual(['https://a.com','https://b.com']);
  });

  test('throws when required ThingSpeak keys missing in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.THINGSPEAK_CHANNEL_ID = '12345'; // provide channel id only
    delete process.env.THINGSPEAK_READ_API_KEY;
    jest.resetModules();
    // Purge any cached instances of ConfigService
    Object.keys(require.cache).forEach(k => {
      if (k.endsWith('ConfigService.js')) delete require.cache[k];
    });
    expect(() => require('../src/services/ConfigService')).toThrow(/ThingSpeak read API key is required/);
  });
});
