# Exercise 9: End-to-End Testing with Playwright

## Goal

In this exercise, you will set up End-to-End (E2E) tests for the Pokedex app using Playwright.

Think of Playwright as a "robot user" that opens the browser, visits your app, clicks around, and checks whether the app behaves like a real human user would expect.



Playwright is an open-source testing framework created by Microsoft designed for end-to-end (E2E) web automation and testing.   

Its  a tool that controls a web browser programmatically—simulating everything a real human user does, like opening a page, typing text, clicking buttons, and checking if items appear correctly on the screen
## What you will test

You will verify that:

- the home page loads correctly
- the text "ivysaur" appears on the page
- the Nintendo footer message is visible
- clicking a Pokémon opens its details page
- the details page shows content such as "chlorophyll"

## Steps

### 1. Tell Jest to ignore E2E tests

Your current setup uses Jest for unit tests. You need to prevent Jest from trying to run Playwright E2E tests.

Add this inside your Jest config in package.json:

```json
"testPathIgnorePatterns": ["e2e-tests"]
```

Example:

```json
{
  "jest": {
    "testEnvironment": "jsdom",
    "setupFiles": ["<rootDir>/jest.setup.js"],
    "testPathIgnorePatterns": ["e2e-tests"]
  }
}
```
### 2. Set Up Playwright & Development Server


#### What to do , Testing Locally

1. Install Playwright:

```bash
npm install -D @playwright/test
```

2. Install the browser dependencies:

```bash
npx playwright install
```

3. Create a folder for your E2E tests:

```bash
mkdir e2e-tests
```
4. Development Server Setup (webServer)
Playwright tests need a live, running website to inspect and click around on. Without playwright.config.js, you would have to manually start your server in one terminal window (npm start) before running your tests in another.

By configuring the webServer block in playwright.config.js, Playwright automatically starts your app on port 5000 before running the tests and shuts it down when finished:

`playwright.config.js`

```javascript
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
### 3. Write the E2E Tests
💡 What We Can Test in the Application

1. Homepage Loading: Ensure the app loads, lists Pokémon (like ivysaur), and displays footer copyright text.

2. Navigation: Verify that clicking on a Pokémon takes you to its detail page and shows specific stats/abilities (like chlorophyll).

3. Back Navigation: Check that clicking a "Back to list" or home button returns you to the main list.

4. Search / Filtering (if available): Ensure typing in the search box filters the list correctly.


#### 📜 Playwright Test Script (e2e-tests/pokedex.spec.js)
Create a file named pokedex.spec.js inside your e2e-tests folder and paste the following code:
```javascipt
const { test, describe, expect } = require('@playwright/test');

describe('Pokedex App', () => {
  
  // Test 1: Front Page Loading
  test('front page can be opened and shows pokemon list', async ({ page }) => {
    await page.goto('');
    
    // Check if Ivysaur is listed on the front page
    await expect(page.getByText('ivysaur')).toBeVisible();
    
    // Check if footer trademark text is displayed
    await expect(
      page.getByText('Pokémon and Pokémon character names are trademarks of Nintendo.')
    ).toBeVisible();
  });

  // Test 2: Navigation to Detail Page
  test('can navigate from front page to pokemon detail page', async ({ page }) => {
    await page.goto('');
    
    // Click on ivysaur link
    await page.click('text=ivysaur');
    
    // Verify that the ability 'chlorophyll' is present on the detail page
    await expect(page.getByText('chlorophyll')).toBeVisible();
  });

});
```

---
#### Phase 1: Test Locally on Your Machine
* Step 1: Add a test script to package.json
```json
  "scripts": {
  "start": "node index.js",
  "test": "jest",
  "test:e2e": "playwright test",  ### this
  "eslint": "eslint ."
}
```
* Step 2: Run the E2E tests
```bash
npm run test:e2e
```

##### Now that playwright test is running, here is what happens and what you should do next:

* 1. Wait for the Tests to Finish Running ⏳
Playwright will:
- Spin up your local web server automatically (via your playwright.config.js settings).
- Launch a browser in headless mode (in the background).
- Execute the tests in e2e-tests/pokedex.spec.js.

* 2. Check the Output in Terminal 🖥️
If both tests pass (Green):
You'll see something like:

Plaintext
2 passed (4.2s)
This means your Playwright setup, development server, and E2E test scripts are working locally!

If any test fails (Red):
Playwright will show you which line failed. You can run the HTML report viewer to inspect what went wrong:

```Bash
npx playwright show-report
```


What will happen automatically:

Playwright will launch your development web server in the background using the settings in playwright.config.js.

It will open a browser silently (headless mode), navigate to http://localhost:5000, and execute both tests in e2e-tests/pokedex.spec.js.

If everything passes, you will see a green success message in your terminal!

Useful Local Tips 💡
Watch the browser in action (UI mode):
If you want to see the browser window pop up and watch Playwright click through the app:

```Bash
npx playwright test --ui
```
View the test report:
If a test fails or you want to see detailed step-by-step logs:

```Bash
npx playwright show-report
```
---
### Phase 2: Add Playwright to GitHub Actions (pipeline.yml)
Once your tests pass locally, update .github/workflows/pipeline.yml so GitHub automatically runs these tests on every push.

Add the Playwright browser installation step and the npm run test:e2e command to your steps list:
```yaml
name: Deployment pipeline

on:
  push:
    branches:
      - main

jobs:
  simple_deployment_pipeline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '24'
      - name: Install dependencies
        run: npm install
      - name: Check style
        run: npm run eslint
      - name: Build
        run: npm run build
      - name: Test
        run: npm test
      
      # --- PLAYWRIGHT STEPS ---
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test:e2e
```
Commit and push your changes to GitHub, then open the Actions tab on your repository to watch the workflow turn green!