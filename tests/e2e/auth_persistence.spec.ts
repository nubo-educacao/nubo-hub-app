import { test, expect } from '@playwright/test';

test.describe('Feature: Auth Persistence', () => {
  test('Scenario: Login sem "Manter conectado" (Session Storage)', async ({ page }) => {
    // Given que estou na página inicial
    await page.goto('/');

    // When eu abro o modal de login
    await page.getByRole('button', { name: 'Login' }).click();

    // And eu preencho os dados
    await page.getByPlaceholder('(DD) 99999-9999').fill('11999999999');
    
    // And aceito os termos (SEM marcar "Manter conectado")
    await page.getByRole('checkbox').nth(0).check(); 
    // nth(0) é termos, nth(1) seria rememberMe se a ordem for respeitada. 
    // Melhor usar seletores mais específicos se possível, mas AuthModal tem labels claros.
    // O checkbox de termos tem label "Li e concordo..." e o de manter tem "Manter conectado..."
    
    // Checkbox de termos é o primeiro.
    
    // And clico em continuar
    await page.getByRole('button', { name: 'Receber código no Whatsapp' }).click();

    // Then (assumindo modo DEMO ou que o teste mocka o backend)
    // No login.spec.ts original, ele assume sucesso. Vamos verificar o armazenamento.
    
    // Aguarda login (seja direto ou após OTP)
    // Se for produção, precisa de OTP. Se for ambiente de teste, talvez precise mockar. 
    // O login.spec.ts sugere que funciona. Vamos assumir que o ambiente de teste permite login.
    
    // Aguarda indicação de sucesso
    // await expect(page.getByText('Bem-vindo!')).toBeVisible({ timeout: 10000 }); 
    // O texto "Bem-vindo" pode não aparecer se o usuário não tiver nome ou for layout diferente.
    // Melhor esperar o botão de "Sair" ou o ícone de perfil.
    await expect(page.getByTitle('Meu Perfil')).toBeVisible({ timeout: 10000 });

    // Verify Storage
    const localStorageData = await page.evaluate(() => JSON.stringify(window.localStorage));
    const sessionStorageData = await page.evaluate(() => JSON.stringify(window.sessionStorage));

    // Supabase key usually starts with sb-
    // Our CustomStorage adapter uses specific logic. 
    // If session only: token in sessionStorage, NOT in localStorage (except maybe the preference key?)
    // Actually our logic says: if NOT persistent, removeItem from localStorage.
    
    // We can check if 'sb-[project-ref]-auth-token' is in sessionStorage
    // Since we don't know the project ref, we look for any key containing 'auth-token' or just check if sessionStorage is not empty.
    
    // But wait, the supabase client uses `sb-<ref>-auth-token`.
    
    const hasSessionToken = await page.evaluate(() => {
      return Object.keys(window.sessionStorage).some(k => k.includes('auth-token'));
    });
    
    const hasLocalToken = await page.evaluate(() => {
      return Object.keys(window.localStorage).some(k => k.includes('auth-token'));
    });

    expect(hasSessionToken).toBeTruthy();
    expect(hasLocalToken).toBeFalsy();
  });

  test('Scenario: Login com "Manter conectado" (Local Storage)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Login' }).click();

    await page.getByPlaceholder('(DD) 99999-9999').fill('11999999999');
    
    // Aceita termos
    await page.getByRole('checkbox').first().check();
    
    // Marca "Manter conectado"
    await page.getByLabel('Manter conectado por 30 dias').check();

    await page.getByRole('button', { name: 'Receber código no Whatsapp' }).click();

    await expect(page.getByTitle('Meu Perfil')).toBeVisible({ timeout: 10000 });

    const hasSessionToken = await page.evaluate(() => {
      return Object.keys(window.sessionStorage).some(k => k.includes('auth-token'));
    });
    
    const hasLocalToken = await page.evaluate(() => {
      return Object.keys(window.localStorage).some(k => k.includes('auth-token'));
    });

    expect(hasLocalToken).toBeTruthy();
    expect(hasSessionToken).toBeFalsy();
  });
});
