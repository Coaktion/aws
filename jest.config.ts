/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest';

const config: Config = {
  preset: "ts-jest",
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  testEnvironment: "node",
  transform: {
    "^.+\\.ts?$": "ts-jest"
  },
  testMatch: [
    "**/?(*.)+(spec|test).[tj]s?(x)"
  ],
};

export default config;
