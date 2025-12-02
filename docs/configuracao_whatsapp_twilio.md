# Guia de Configuração: Autenticação WhatsApp (Supabase + Twilio)

Para que o fluxo de login via WhatsApp funcione, é necessário configurar a integração entre o Supabase e o Twilio. O Supabase gerencia a geração e validação dos códigos (OTP), enquanto o Twilio realiza o envio das mensagens.

## 1. Configuração no Twilio

1.  **Crie/Acesse sua conta Twilio**: [twilio.com](https://www.twilio.com/).
2.  **Obtenha as Credenciais**:
    *   No Console do Twilio, copie o **Account SID** e o **Auth Token**.
3.  **Configure o WhatsApp**:
    *   **Sandbox (Desenvolvimento)**:
        *   Vá em **Messaging > Try it out > Send a WhatsApp message**.
        *   Ative o Sandbox e siga as instruções para conectar seu número de teste (enviando um código para o número do Twilio).
        *   *Nota:* Em modo Sandbox, você só pode enviar mensagens para números que "entraram" no sandbox.
    *   **Produção**:
        *   Você precisará de um **WhatsApp Sender** aprovado (Business Profile).
        *   Vá em **Messaging > Senders > WhatsApp Senders**.

## 2. Configuração no Supabase

1.  Acesse o Dashboard do seu projeto no [Supabase](https://supabase.com/).
2.  Navegue até **Authentication** (ícone de usuários) > **Providers**.
3.  Selecione **Phone**.
4.  Ative a opção **Enable Phone Provider**.
5.  Em **SMS Provider**, selecione **Twilio**.
6.  Preencha os campos:
    *   **Twilio Account SID**: Cole o SID do Twilio.
    *   **Twilio Auth Token**: Cole o Token do Twilio.
    *   **Twilio Message Service SID**: (Opcional, deixe em branco se usar apenas um número).
7.  **Campo "Twilio From Number" (CRÍTICO)**:
    *   Aqui está o segredo para o WhatsApp. Você deve inserir o número do remetente do Twilio com o prefixo `whatsapp:`.
    *   Exemplo (Sandbox): `whatsapp:+14155238886`
    *   Exemplo (Produção): `whatsapp:+5511999999999`
8.  Clique em **Save**.

## 3. Personalização da Mensagem (Opcional)

1.  No Supabase, vá em **Authentication > Providers > Phone > SMS Message**.
2.  Edite a mensagem padrão.
    *   Padrão: `Your code is {{ .Code }}`.
    *   **Atenção (WhatsApp)**: O WhatsApp é rigoroso com templates.
        *   Se estiver usando **Twilio Sandbox**, mensagens livres funcionam.
        *   Se estiver usando **Produção**, você *provavelmente* precisará registrar um template no Twilio que corresponda exatamente ao texto enviado pelo Supabase.
        *   *Dica:* Mantenha a mensagem simples: `Seu codigo de verificacao Nubo e: {{ .Code }}`.

## 4. Testando

1.  No projeto local (`npm run dev`), abra o Modal de Login.
2.  Insira seu número (ex: `11999999999`).
3.  O sistema formatará para `+5511999999999`.
4.  Clique em "Receber código".
5.  Se configurado corretamente, você receberá a mensagem no WhatsApp.
