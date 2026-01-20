import { test, expect } from '@playwright/test';

test.describe('Feature: Login', () => {
  test('Scenario: Login com sucesso (Mock)', async ({ page }) => {
    // MOCK SUPABASE AUTH NETWORK REQUESTS
    // 1. Mock SignIn (Request OTP)
    await page.route('**/auth/v1/otp**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}) // Success response
      });
    });

    // 2. Mock Verify (Confirm OTP)
    await page.route('**/auth/v1/verify**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
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

    // Given que estou na página inicial
    await page.goto('/');

    // When eu clico no botão de login
    // Note: There are two login buttons (Desktop and Mobile), picking the first visible or specific one
    const loginButton = page.getByRole('button', { name: 'Login' }).first();
    await loginButton.click();

    // And eu preencho o telefone (Simulando login via WhatsApp)
    const phoneInput = page.getByPlaceholder('(DD) 99999-9999');
    await expect(phoneInput).toBeVisible();
    await phoneInput.fill('11999999999');

    // And aceito os termos
    const termsCheckbox = page.getByRole('checkbox');
    await termsCheckbox.check();
    // Force check if custom checkbox isn't clicking well, but .check() usually works on input
    
    // And clico em "Receber código no WhatsApp"
    const sendCodeButton = page.getByRole('button', { name: 'Receber código no WhatsApp' });
    await expect(sendCodeButton).toBeEnabled();
    await sendCodeButton.click();

    // Then eu devo ver o campo de OTP
    const otpInput = page.getByPlaceholder('000000');
    await expect(otpInput).toBeVisible({ timeout: 5000 });
    
    // When eu preencho o OTP
    await otpInput.fill('123456');

    // And clico em Confirmar
    const confirmButton = page.getByRole('button', { name: 'Confirmar' });
    await confirmButton.click();

    // Then o modal deve fechar e o usuário deve estar logado
    // We check for "Sair" button in header or "Bem-vindo" depending on UI
    // The previous test checked for 'Bem-vindo!', let's verify if that exists or if we should check for "Sair"
    await expect(page.getByRole('button', { name: 'Sair' }).first()).toBeVisible({ timeout: 10000 });
  });
});
