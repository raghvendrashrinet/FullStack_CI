# Full Stack open CI/CD

This repository is used for the CI/CD module of the Full Stack Open course

## Commands

Start by running `npm install` inside the project folder

`npm start` to run the webpack dev server
`npm test` to run tests
`npm run eslint` to run eslint
`npm run build` to make a production build
`npm run start-prod` to run your production build


## Configuration
Update package.json to prevent Jest from picking up E2E tests:

JSON
"jest": {
  "testEnvironment": "jsdom",
  "setupFiles": ["<rootDir>/jest.setup.js"],
  "testPathIgnorePatterns": ["e2e-tests"]
}

Set up Playwright configuration (playwright.config.js) to spin up the development server before running tests:

```JavaScript
module.exports = {
  webServer: {
    command: 'npm run start',
    port: 5000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:5000',
  },
};
```
Create e2e-tests/pokedex.spec.js:

```JavaScript
const { test, describe, expect } = require('@playwright/test');

describe('Pokedex', () => {
  test('front page can be opened', async ({ page }) => {
    await page.goto('');
    await expect(page.getByText('ivysaur')).toBeVisible();
    await expect(page.getByText('Pokémon and Pokémon character names are trademarks of Nintendo.')).toBeVisible();
  });

  test('can navigate to a specific pokemon page', async ({ page }) => {
    await page.goto('');
    await page.click('text=ivysaur');
    await expect(page.getByText('chlorophyll')).toBeVisible();
  });
});
```
Add Playwright steps to your GitHub Actions workflow:

```YAML
   - name: Install Playwright Browsers
     run: npx playwright install --with-deps
   - name: Run E2E tests
     run: npm run test:e2e
```