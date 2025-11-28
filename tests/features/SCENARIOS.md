# Cenários de Teste - Nubo Hub

Este documento detalha os cenários de teste para os fluxos críticos do sistema, garantindo a qualidade das funcionalidades principais.

## Fluxos Críticos

### 1. Autenticação (Authentication)

**Cenário 1.1: Login com Sucesso**
- **Dado** que estou na página inicial
- **Quando** eu clico no botão de login
- **E** eu preencho as credenciais corretamente
- **Então** eu devo ver meu avatar no cabeçalho
- **E** o modal de login deve fechar

### 2. Cadastro de Estudante (Registration)

**Cenário 2.1: Cadastro com Sucesso**
- **Dado** que estou na página de cadastro
- **Quando** preencho todos os campos obrigatórios corretamente (Nome, Email, Senha)
- **E** clico em "Criar Conta"
- **Então** devo ser redirecionado para a página inicial (ou onboarding)
- **E** devo receber um e-mail de boas-vindas/confirmação.

**Cenário 2.2: Tentativa de Cadastro com E-mail Já Existente**
- **Dado** que já existe um usuário com o e-mail "teste@nubo.com"
- **Quando** tento me cadastrar novamente com "teste@nubo.com"
- **Então** devo ver uma mensagem de erro informando que o e-mail já está em uso.

### 3. Busca de Vagas (Discovery)

**Cenário 3.1: Listagem Geral**
- **Dado** que estou logado na plataforma
- **Quando** acesso a página "Oportunidades"
- **Então** devo ver uma lista paginada de vagas ativas
- **E** cada card deve mostrar Título, Instituição e Localização.

**Cenário 3.2: Filtro por Categoria**
- **Dado** que estou na listagem de oportunidades
- **Quando** seleciono o filtro "Tecnologia"
- **Então** a lista deve atualizar mostrando apenas vagas da categoria "Tecnologia".

### 4. Chat com Cloudinha (Engagement)

**Cenário 4.1: Início de Conversa**
- **Dado** que abro o widget de chat da Cloudinha
- **Quando** envio a mensagem "Olá, preciso de ajuda"
- **Então** a Cloudinha deve responder com uma saudação amigável e contextualizada.

**Cenário 4.2: Recomendação via Chat**
- **Dado** que estou conversando com a Cloudinha
- **Quando** pergunto "Tem algum curso de Python?"
- **Então** a Cloudinha deve buscar na base de oportunidades
- **E** responder com links/cards de cursos de Python disponíveis.

### 5. Match de Oportunidades (Recommendation)

**Cenário 5.1: Visualização de Match**
- **Dado** que meu perfil tem interesse em "Design"
- **Quando** acesso a seção "Recomendados para Você"
- **Então** devo ver vagas relacionadas a Design priorizadas na lista.

**Cenário 5.2: Match Vazio (Cold Start)**
- **Dado** que acabei de criar a conta e não defini interesses
- **Quando** acesso a seção de recomendações
- **Então** devo ver uma mensagem convidando a completar o perfil
- **Ou** ver uma lista de oportunidades "Em Alta" (fallback).
