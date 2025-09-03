/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {},
  moduleFileExtensions: ['js','json'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/services/ConfigService.js',
    'src/services/CacheService.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text','lcov'],
};
