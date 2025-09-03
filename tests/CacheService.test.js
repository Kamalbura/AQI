describe('CacheService', () => {
  let CacheService;
  beforeEach(() => {
    jest.resetModules();
    // Provide required ThingSpeak env to satisfy config validation
    process.env.THINGSPEAK_CHANNEL_ID = '12345';
    process.env.THINGSPEAK_READ_API_KEY = 'READKEY';
  CacheService = require('../src/services/CacheService');
  CacheService.flushAll();
  });

  test('sets and gets a value', () => {
    CacheService.set('foo','bar',5);
    expect(CacheService.get('foo')).toBe('bar');
  });

  test('expires after ttl', done => {
    CacheService.set('temp','value',1); // 1 second
    setTimeout(() => {
      expect(CacheService.get('temp')).toBeUndefined();
      done();
    }, 1100);
  });
});
