import { test, expect } from '@playwright/test';

test.describe('Feature: Login', () => {
  test('Scenario: Login com sucesso (Mock)', async ({ page }) => {
    // Given que estou na página inicial
    await page.goto('/');

    // When eu clico no botão de login
    const loginButton = page.getByRole('button', { name: 'Login' });
    await loginButton.click();

    // And eu preencho o telefone (Simulando login via WhatsApp/Demo)
    const phoneInput = page.getByPlaceholder('(11) 99999-9999');
    await expect(phoneInput).toBeVisible();
    await phoneInput.fill('11999999999');

    // And aceito os termos
    const termsCheckbox = page.getByRole('checkbox');
    await termsCheckbox.check();

    // And clico em "Receber código no WhatsApp"
    const submitButton = page.getByRole('button', { name: 'Receber código no WhatsApp' });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Then eu devo ver "Bem-vindo!" no cabeçalho
    // Nota: Em modo DEMO, o login é direto. Em prod, haveria passo de OTP.
    await expect(page.getByText('Bem-vindo!')).toBeVisible({ timeout: 10000 });

    // And o modal de login deve fechar
    await expect(submitButton).not.toBeVisible();
  });
});
