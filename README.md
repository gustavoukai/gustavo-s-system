# Como colocar seu sistema no ar (100% grátis)

Siga esta ordem, exatamente como está escrito. Não pule etapas.

Você vai usar 3 sites, todos gratuitos:
- **Supabase** → guarda os usuários e os dados
- **GitHub** → guarda o código do sistema
- **Vercel** → coloca o sistema no ar, na internet

---

## PARTE 1 — Criar o banco de dados (Supabase)

1. Acesse **https://supabase.com** e crie uma conta gratuita (pode ser com o Google).
2. Clique em **"New project"**.
3. Dê um nome (qualquer um) e crie uma senha para o banco de dados — **anote essa senha em algum lugar seguro**.
4. Escolha a região mais próxima de você (ex: São Paulo) e clique em **"Create new project"**. Espere 1-2 minutos.
5. No menu da esquerda, clique no ícone **"SQL Editor"**.
6. Clique em **"New query"**.
7. Abra o arquivo **`supabase-setup.sql`** (que está junto com este README), copie **todo o conteúdo** e cole na tela do SQL Editor.
8. Clique no botão **"Run"** (ou "RUN"). Deve aparecer uma mensagem de sucesso.
9. No menu da esquerda, clique em **"Project Settings"** (ícone de engrenagem) → **"API"**.
10. Você vai ver duas informações que precisa guardar:
    - **Project URL** (algo como `https://xxxxx.supabase.co`)
    - **anon public** key (uma sequência longa de letras e números)
11. Guarde essas duas informações num bloco de notas — vai usar daqui a pouco.

---

## PARTE 2 — Colocar o código no GitHub

1. Acesse **https://github.com** e crie uma conta gratuita.
2. Clique no **"+"** no canto superior direito → **"New repository"**.
3. Dê um nome (ex: `meu-sistema`) e clique em **"Create repository"**.
4. Na página do repositório recém-criado, procure o link **"uploading an existing file"**.
5. Arraste **todos os arquivos e pastas** deste projeto (que você baixou) para essa tela.
   - Importante: envie os arquivos e pastas tal como estão (incluindo as pastas `pages`, `lib`, `styles`).
6. Role para baixo e clique em **"Commit changes"**.

---

## PARTE 3 — Publicar o site (Vercel)

1. Acesse **https://vercel.com** e crie uma conta gratuita — escolha **"Continue with GitHub"** para já conectar as duas contas.
2. Clique em **"Add New..."** → **"Project"**.
3. Encontre o repositório que você criou (ex: `meu-sistema`) e clique em **"Import"**.
4. Antes de clicar em Deploy, procure a seção **"Environment Variables"** (Variáveis de Ambiente) e adicione duas:
   - Nome: `NEXT_PUBLIC_SUPABASE_URL` → Valor: (cole o "Project URL" que você guardou)
   - Nome: `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Valor: (cole a "anon public key" que você guardou)
5. Clique em **"Deploy"**. Espere 1-2 minutos.
6. Ao terminar, a Vercel mostra um link (ex: `meu-sistema.vercel.app`) — **esse é o endereço do seu sistema**, acessível de qualquer lugar.

---

## PARTE 4 — Cadastrar os usuários (você, como administrador)

Não existe tela de "criar conta" — por segurança, só você cadastra quem pode entrar.

1. Volte ao **Supabase**, no menu esquerdo clique em **"Authentication"** → **"Users"**.
2. Clique em **"Add user"** → **"Create new user"**.
3. Preencha o e-mail e uma senha para essa pessoa, e clique em criar.
   - Repita isso para cada uma das pessoas que vão usar o sistema.
4. Agora vá em **"Table Editor"** (menu esquerdo) → tabela **`profiles`**.
   - Você vai ver que uma linha foi criada automaticamente para cada usuário, com `role` = `visualizante`.
5. Clique na célula `role` da pessoa que deve ter outro nível de acesso e mude o texto para:
   - `admin` (acesso total)
   - `operador` (acesso intermediário)
   - `visualizante` (acesso básico — é o padrão)
6. Pronto. Essa pessoa já pode entrar no site com o e-mail e a senha que você cadastrou.

---

## Como isso funciona por dentro (resumo simples)

- Cada pessoa faz login com e-mail e senha na tela inicial do site.
- O sistema pergunta ao Supabase: "qual é o nível dessa pessoa?"
- Dependendo da resposta (`admin`, `operador` ou `visualizante`), o painel mostra mais ou menos blocos de conteúdo.
- Hoje os blocos são só um exemplo de texto — quando você quiser adicionar funções de verdade (ex: uma tabela, um formulário), me diga o que precisa que eu adiciono no código.

---

## PARTE 5 — Ativar o controle financeiro (Clientes, Fornecedores, Projetos, Lançamentos)

1. Volte ao **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-financeiro.sql`** (veio junto com este projeto), copie tudo e cole na tela.
3. Clique em **"Run"**. Pode aparecer o mesmo aviso de "operação destrutiva" de antes — é normal, pode confirmar.
4. Agora atualize o site: vá até o seu repositório no **GitHub**, clique em **"Add file"** → **"Upload files"**.
5. Arraste **todos os arquivos e pastas** da nova versão do projeto (a que você acabou de baixar) — o GitHub vai avisar que alguns arquivos já existem e serão substituídos, isso é esperado.
6. Role para baixo e clique em **"Commit changes"**.
7. Não precisa fazer nada na Vercel — ela detecta a mudança no GitHub sozinha e publica a nova versão automaticamente em 1-2 minutos.
8. Depois de esperar, abra o link do seu site de novo. Deve aparecer um novo menu no topo: **Início, Lançamentos, Clientes, Fornecedores, Projetos, Relatórios**.

**O que cada tela faz:**
- **Clientes / Fornecedores / Projetos**: cadastro simples (nome + alguns dados). Todo lançamento pode ser ligado a um cliente, um fornecedor e/ou um projeto.
- **Lançamentos**: onde entram as entradas e saídas de dinheiro, com valor, data, status, programa de fidelidade, e o cliente/fornecedor/projeto relacionado.
- **Relatórios**: os mesmos filtros de Lançamentos, mas com totais (entradas, saídas, saldo) e um botão para exportar tudo em CSV (abre no Excel/Google Planilhas).

**Quem pode fazer o quê:**
- **Administrador**: cadastra, edita e apaga tudo.
- **Operador**: cadastra e edita, mas não apaga nada.
- **Visualizante**: só visualiza e filtra, sem alterar nada.

## Se algo der errado

Me mande uma mensagem descrevendo em que passo você travou (pode até ser um print da tela) e eu te ajudo a resolver.
