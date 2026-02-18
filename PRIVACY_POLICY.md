# Política de Privacidade — Prompt DRIVE

**Última atualização:** 10 de fevereiro de 2026

A extensão **Prompt DRIVE** ("nós", "nosso" ou "aplicação") respeita sua privacidade. Esta política descreve quais dados coletamos, como os utilizamos e quais são seus direitos.

---

## 1. Dados que Coletamos

### 1.1 Informações de identificação pessoal

- **Nome** — coletado no momento do cadastro
- **Endereço de e-mail** — coletado no cadastro e utilizado para login

### 1.2 Informações de autenticação

- **Senha** — utilizada exclusivamente para autenticação. A senha é criptografada e armazenada pelo provedor de autenticação (Supabase). Nunca armazenamos sua senha em texto puro.

### 1.3 Conteúdo criado por você

- **Pastas** — nomes das pastas que você cria para organizar seus prompts
- **Prompts** — textos dos prompts que você cria e armazena na aplicação

### 1.4 Dados técnicos (armazenamento local)

- **Token de acesso (JWT)** — armazenado localmente no navegador (`chrome.storage.local`) para manter sua sessão ativa entre usos. O token é removido quando você faz logout.

---

## 2. Como Utilizamos os Dados

| Dado | Finalidade |
|------|------------|
| Nome e e-mail | Identificação da conta e comunicação relacionada ao serviço |
| Senha | Autenticação segura no login |
| Pastas e prompts | Sincronização e armazenamento na nuvem para acesso em qualquer sessão |
| Token JWT | Manter você logado sem precisar digitar a senha a cada uso |

---

## 3. Onde os Dados São Armazenados

- **Supabase** — seus dados de conta (perfil), pastas e prompts são armazenados em servidores na nuvem do Supabase. As conexões utilizam HTTPS e criptografia.
- **Navegador (Chrome)** — apenas o token de autenticação é armazenado localmente para persistência da sessão.
- **Stripe** — quando você assina o plano Premium, o processamento de pagamento é feito pelo Stripe. Enviamos apenas seu identificador de usuário (`user_id`) para vincular a assinatura à sua conta. Dados de cartão de crédito são tratados diretamente pelo Stripe e não passam pela nossa aplicação.

---

## 4. Compartilhamento de Dados

- **Não vendemos** seus dados a terceiros.
- **Não compartilhamos** seus dados para fins de publicidade ou marketing.
- **Não utilizamos** analytics, rastreamento ou scripts de terceiros para monitorar seu uso.

Os únicos serviços externos utilizados são:

- **Supabase** — hospedagem do backend e autenticação
- **Stripe** — processamento de pagamentos (apenas quando você assina o Premium)
- **Google Fonts** — carregamento da fonte Inter para tipografia (apenas arquivos de fonte, sem coleta de dados)

---

## 5. Permissões da Extensão

A extensão solicita as seguintes permissões e utiliza-as apenas para as finalidades descritas:

| Permissão | Uso |
|-----------|-----|
| **sidePanel** | Exibir a interface principal da aplicação no painel lateral do Chrome |
| **storage** | Armazenar o token de autenticação localmente para manter a sessão |
| **tabs** | Abrir nova aba para a página de checkout quando você opta por assinar o Premium |
| **host (Supabase)** | Enviar e receber dados de autenticação, pastas e prompts |

A extensão **não** lê, modifica nem injeta conteúdo em páginas que você visita.

---

## 6. Seus Direitos

- **Acessar seus dados** — seus prompts e pastas estão disponíveis na própria aplicação.
- **Excluir sua conta** — você pode solicitar a exclusão da conta e dos dados associados. Entre em contato conosco para isso.
- **Encerrar a sessão** — ao clicar em "Sair", o token local é removido e sua sessão é encerrada.

---

## 7. Segurança

- Utilizamos HTTPS em todas as comunicações.
- Senhas são tratadas com criptografia pelo Supabase.
- O token de autenticação é armazenado de forma segura no navegador.

---

## 8. Alterações nesta Política

Podemos atualizar esta política periodicamente. A data da última atualização será indicada no topo do documento. O uso continuado da extensão após alterações constitui aceitação das novas condições.

---

## 9. Contato

Para dúvidas sobre privacidade ou para exercer seus direitos, entre em contato:

- **Site:** [https://www.promptdrive.com](https://www.promptdrive.com)
- **E-mail:** 
  felipe.silva.aguiar047@gmail.com

---

*Prompt DRIVE — Organize seus prompts de forma simples e segura.*
