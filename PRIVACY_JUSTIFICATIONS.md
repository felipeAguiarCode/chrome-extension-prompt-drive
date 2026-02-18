# Justificativas para Chrome Web Store - Práticas de Privacidade

Use este documento ao preencher a guia **"Práticas de privacidade"** na página de edição do item na Chrome Web Store. Copie e cole as justificativas nos campos correspondentes.

---

## 1. Permissão de Host (host_permissions)

**Hosts declarados no manifest:**
- `https://www.sample.com/*`
- `https://etzlgzpyshwdijyucsog.supabase.co/*`

**Justificativa (inglês - idioma padrão da loja):**

```
Supabase (etzlgzpyshwdijyucsog.supabase.co): Required to authenticate users (login, signup, logout), and to sync folders and prompts with the cloud backend. All API calls use the user's access token for authorization. No data is sent to third parties.

Sample.com (www.sample.com): Used to open the sales/landing page in a new tab when users choose to upgrade to Premium or when they attempt to use premium features (import/export) without a subscription. The extension only opens this URL; it does not read or modify content from this host.
```

**Justificativa (português):**

```
Supabase: Necessária para autenticar usuários (login, cadastro, logout) e sincronizar pastas e prompts com o backend em nuvem. Todas as chamadas usam o token de acesso do usuário. Nenhum dado é enviado a terceiros.

Sample.com: Usada para abrir a página de vendas em nova aba quando o usuário deseja fazer upgrade para Premium ou tenta usar recursos premium (importar/exportar) sem assinatura. A extensão apenas abre essa URL; não lê nem modifica conteúdo desse host.
```

---

## 2. Código Remoto (Remote Code)

**Justificativa (inglês):**

```
The extension loads the Inter font family from Google Fonts (fonts.googleapis.com, fonts.gstatic.com) for typography only. This is a CSS stylesheet and font files—no executable JavaScript is loaded from remote URLs. All application logic runs from bundled local scripts. No eval(), no dynamic script loading, and no obfuscated code.
```

**Justificativa (português):**

```
A extensão carrega a fonte Inter do Google Fonts apenas para tipografia. São arquivos de CSS e fontes—nenhum JavaScript executável é carregado de URLs remotas. Toda a lógica da aplicação roda em scripts locais empacotados. Não há eval(), carregamento dinâmico de scripts nem código ofuscado.
```

---

## 3. Storage

**Justificativa (inglês):**

```
Storage is used exclusively to persist the user's authentication token (JWT from Supabase) in chrome.storage.local. This allows the user to remain logged in across browser sessions. No prompts, folders, or personal content are stored locally—all user data is fetched from the Supabase backend when the extension opens. The token is removed on logout.
```

**Justificativa (português):**

```
O storage é usado apenas para persistir o token de autenticação (JWT do Supabase) em chrome.storage.local, permitindo que o usuário permaneça logado entre sessões. Nenhum prompt, pasta ou conteúdo pessoal é armazenado localmente—todos os dados são buscados do backend Supabase ao abrir a extensão. O token é removido no logout.
```

---

## 4. Tabs

**Justificativa (inglês):**

```
The tabs permission is used only to open a new browser tab via chrome.tabs.create() when the user chooses to upgrade to Premium or attempts to use premium features (import/export folders) without a subscription. The extension redirects the user to the sales/landing page. The extension does not read, modify, or inject content into any tabs.
```

**Justificativa (português):**

```
A permissão tabs é usada apenas para abrir uma nova aba via chrome.tabs.create() quando o usuário escolhe fazer upgrade para Premium ou tenta usar recursos premium (importar/exportar pastas) sem assinatura. A extensão redireciona o usuário para a página de vendas. A extensão não lê, modifica nem injeta conteúdo em abas.
```

---

## 5. Uso de Dados e Políticas do Programa

**Declaração de conformidade (inglês):**

```
The extension collects and uses data in compliance with the Developer Program Policies:

- Authentication: Email and password are sent only to Supabase for login/signup. The access token is stored locally for session persistence.
- User content: Folders and prompts are stored in the user's Supabase project and are not shared with third parties.
- No tracking: No analytics, advertising, or tracking scripts are used.
- No selling of data: User data is never sold or shared for commercial purposes.
- Transparency: Users create accounts voluntarily and can delete their data by removing their Supabase account.
```

---

## Observação antes de publicar

O host `https://www.sample.com/*` parece ser um placeholder. Antes de publicar, atualize para o domínio real da sua página de vendas em:

- `manifest.json` (host_permissions)
- `app/scripts/constants.js` (SALES_LANDING_PAGE_URL)

Exemplo: `https://www.promptdrive.com/*` ou o domínio do seu checkout.
