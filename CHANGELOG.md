# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-11-27

### Adicionado
- **Estrutura do Projeto**: Configuração inicial com Next.js 14 (App Router), TypeScript e Tailwind CSS.
- **Página Inicial (Home)**:
    - Componente de Cabeçalho (`Header`).
    - Seção Hero com a mascote "Cloudinha" (`HeroCloudinha`).
    - Catálogo de Oportunidades (`OpportunityCatalog`).
- **Interface de Chat**:
    - Layout em tela dividida (Chat à esquerda, Painel de Conteúdo à direita).
    - Componente básico de chat (`ChatCloudinha`).
    - Carrossel de Oportunidades (`OpportunityCarousel`).
    - Estrutura de contexto e modal de autenticação (`AuthContext`, `AuthModal`).
- **Integração com Banco de Dados**:
    - Configuração do cliente Supabase.
    - Página de teste de integração (`/opportunities-test`) para validar busca de dados.
- **Configuração**:
    - Tema personalizado no Tailwind CSS.
    - Correção e padronização do `.gitignore`.
