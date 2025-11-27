Feature: Login
  Como um estudante
  Eu quero me autenticar no sistema
  Para acessar o chat e ver oportunidades personalizadas

  Scenario: Login com sucesso
    Given que estou na página inicial
    When eu clico no botão de login
    And eu preencho as credenciais corretamente
    Then eu devo ver meu avatar no cabeçalho
    And o modal de login deve fechar
