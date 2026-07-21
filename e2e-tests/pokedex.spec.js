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