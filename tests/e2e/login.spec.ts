import { test, expect } from '@playwright/test';

test.describe('Feature: Login', () => {
  test('Scenario: Login com sucesso (Mock)', async ({ page }) => {
    // Given que estou na página inicial
    await page.goto('/');

    // When eu clico no botão de login
    const loginButton = page.getByRole('button', { name: 'Login' });
    await loginButton.click();

    // And eu clico em "Continuar com Email" (Simulando login)
    const emailLoginButton = page.getByRole('button', { name: 'Continuar com Email' });
    await expect(emailLoginButton).toBeVisible();
    await emailLoginButton.click();

    // Then eu devo ver "Bem-vindo!" no cabeçalho
    await expect(page.getByText('Bem-vindo!')).toBeVisible();

    // And o modal de login deve fechar
    await expect(emailLoginButton).not.toBeVisible();
  });
});
