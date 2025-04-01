export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  verbose: true,
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'services/**/*.js',
    'models/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
  ],
}
