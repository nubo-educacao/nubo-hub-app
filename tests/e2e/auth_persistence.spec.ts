import { test, expect } from '@playwright/test';

test.describe('Feature: Auth Persistence', () => {

  test.beforeEach(async ({ page }) => {
    // Mock Supabase Auth OTP routes
    await page.route('**/auth/v1/otp**', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({}) });
    });
    
    await page.route('**/auth/v1/verify**', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          access_token: 'fake-jwt-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'fake-refresh-token',
          user: {
            id: 'fake-user-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'test@example.com',
            phone: '5511999999999',
            app_metadata: { provider: 'phone' },
            user_metadata: {},
            created_at: new Date().toISOString(),
          }
        })
      });
    });
  });

  test('Scenario: Login persisted in Local Storage', async ({ page }) => {
    // Given que estou na página inicial
    await page.goto('/');

    // When eu abro o modal de login
    await page.getByRole('button', { name: 'Login' }).first().click();

    // And eu preencho os dados
    await page.getByPlaceholder('(DD) 99999-9999').fill('11999999999');
    
    // And aceito os termos
    await page.getByRole('checkbox').first().check(); 
    
    // And clico em continuar
    await page.getByRole('button', { name: 'Receber código no Whatsapp' }).click();

    // Fill OTP
    await page.getByPlaceholder('000000').fill('123456');
    await page.getByRole('button', { name: 'Confirmar' }).click();

    // Then (Wait for success)
    await expect(page.getByTitle('Meu Perfil')).toBeVisible({ timeout: 10000 });

    // Verify Storage (Default is LocalStorage)
    const hasLocalToken = await page.evaluate(() => {
      return Object.keys(window.localStorage).some(k => k.includes('auth-token') && !k.includes('mb-'));
    });
    
    expect(hasLocalToken).toBeTruthy();
  });
});
