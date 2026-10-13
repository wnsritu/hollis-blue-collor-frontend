# End-to-End & Integration Testing Suite

Automated test framework for Hollis Blue Collar Platform built using **Playwright** (for browser UI and REST API testing) and **Node.js** against a dedicated isolated test database.

## Test Database Setup

The test suite runs against the dedicated test database `hollis_blue_collor_test`, ensuring zero mutations or side-effects on the UAT/production database.

1. Verify backend environment points to `hollis_blue_collor_test` in `../hollis-blue-collor-backend/.env`.
2. Run database initialization and seeders:
   ```bash
   cd ../hollis-blue-collor-backend
   npm run setup
   ```
3. Start backend on port 5000:
   ```bash
   npm start
   ```

## Test Commands

All test commands are executed from the frontend directory:

```bash
# Run quick smoke test suite (< 2 minutes)
npm run test:smoke

# Run backend API test suite (Phase 2)
npm run test:api

# Run browser UI tests (Phase 3)
npm run test:ui

# Run cross-role end-to-end journey flows (Phase 4)
npm run test:flows

# Run full end-to-end test suite
npm run test:e2e
```

## Architecture

- `playwright.config.ts`: Multi-project configuration (api, ui-desktop, ui-mobile, flows, security).
- `e2e/global-setup.ts`: One-time bootstrap creating/verifying QA accounts for Customer, Provider, Admin, and Support; captures tokens in `e2e/.auth/*.json`.
- `e2e/fixtures/`: Playwright fixtures for authenticated role pages, authenticated API contexts (`customerApi`, `providerApi`, `adminApi`, `supportApi`, `guestApi`), and database helpers (`getOtp`, `setUserVerified`).
- `e2e/api/`: Comprehensive API test coverage built from Postman collection.
- `e2e/ui/`: Role-specific UI route verification, workflows, empty states, and error handling.
- `e2e/flows/`: Cross-role business journeys (Booking lifecycle, custom project bids, disputes, subscriptions).
- `e2e/security/`: Security boundary, injection, XSS, token tampering, and IDOR validation.
