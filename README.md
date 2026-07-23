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

---

## PARTE 6 — Cadastro detalhado de clientes + ícone da aba

1. Volte ao **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-clientes-detalhado.sql`**, copie tudo e cole na tela.
3. Clique em **"Run"** (o aviso de "operação destrutiva" pode aparecer de novo — normal, pode confirmar).
4. Atualize o site: no **GitHub**, **"Add file"** → **"Upload files"** → arraste todos os arquivos e pastas da nova versão do projeto → confirme a substituição → **"Commit changes"**.
5. Espere 1-2 minutos e a Vercel publica sozinha.

O que mudou:
- A tela **Clientes** agora tem o cadastro completo (projeto(s), dados pessoais, endereço residencial, dados comerciais, cônjuge, filhos, endereço da obra e observações).
- O **ícone da aba do navegador** também foi trocado — depois de publicar, pode ser que o Chrome ainda mostre o ícone antigo por causa do cache; se isso acontecer, feche a aba e abra o site de novo, ou aperte Ctrl+Shift+R (recarregar sem cache) na página.

---

## PARTE 6 — Ficha completa de Clientes + ícone do site

1. Volte ao **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-clientes-v2.sql`**, copie tudo e cole na tela.
3. Clique em **"Run"**. Se aparecer o aviso de "operação destrutiva", pode confirmar — ele avisa por causa das duas colunas antigas (Documento e Contato) que estão sendo substituídas pelos novos campos.
4. Atualize o site: no **GitHub**, clique em **"Add file"** → **"Upload files"**, arraste **todos os arquivos e pastas** da nova versão do projeto (incluindo agora a pasta `public`, que é nova) e clique em **"Commit changes"**.
5. Espere 1-2 minutos — a Vercel publica sozinha.
6. Sobre o ícone da aba do navegador: como o Chrome guarda o ícone antigo em cache, pode ser que você precise fechar a aba do site e abrir de novo (ou apertar Ctrl+Shift+R para forçar a atualização) para ver o ícone novo aparecer.

**O que mudou na tela de Clientes:**
- Agora tem uma ficha completa: dados pessoais, endereço residencial, dados comerciais, dados do cônjuge (com a mesma estrutura), lista de filhos (pode adicionar quantos precisar) e observações por último.
- No topo do formulário, você pode vincular o cliente a um ou mais projetos já cadastrados, informando o endereço da obra de cada um — clique em "+ Adicionar projeto" para vincular mais de um.
- A listagem embaixo mostra só os dados principais (nome, CPF, celular, e-mail, cidade e projetos vinculados) para não ficar poluída — os demais dados ficam guardados, mesmo não aparecendo na tabela.

---

## PARTE 7 — Máscaras, CEP automático e nova cor

1. Volte ao **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-clientes-v3.sql`**, copie tudo e cole na tela.
3. Clique em **"Run"** (confirme o aviso de "operação destrutiva" se aparecer, é o mesmo caso de antes).
4. Atualize o site: no **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão do projeto, **"Commit changes"**.
5. Espere 1-2 minutos — a Vercel publica sozinha.

**O que mudou:**
- O campo **Nome** agora ocupa a linha inteira, sozinho.
- **CPF**, **RG** e todos os campos de telefone/celular: agora você só digita os números, e o sistema formata sozinho enquanto você digita.
- **CEP** virou o primeiro campo de cada endereço (residencial, comercial, do cônjuge, e da obra de cada projeto). Ao sair do campo CEP (clicar em outro campo), o sistema busca automaticamente **Logradouro**, **Bairro**, **Cidade** e **UF** usando o serviço gratuito ViaCEP — você só preenche **Número** e **Complemento** manualmente.
- Adicionei o campo **Telefone** na seção "Dados comerciais", com a mesma formatação automática.
- A cor principal do sistema agora é o azul solicitado (Pantone 315C / #00677F), no lugar do verde escuro anterior.

---

## PARTE 8 — Fluxo Novo/Editar, campos obrigatórios e data de cadastro

1. Volte ao **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-clientes-v4.sql`**, copie tudo e cole na tela.
3. Clique em **"Run"**.
4. Atualize o site: no **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
5. Espere 1-2 minutos.

**O que mudou na tela de Clientes:**
- Ao entrar em "Clientes", agora aparece um botão **"+ Novo cliente"**. Os campos só aparecem depois de clicar nele.
- Abaixo (quando o formulário não está aberto), aparece a lista de clientes já cadastrados: **Nome**, **data de cadastro/edição**, e um botão azul **"EDITAR"** que abre o cadastro daquele cliente para você alterar e salvar de novo.
- A lista fica em ordem alfabética pelo nome.
- **Nome** e **Celular 1** agora têm um aviso "(campo obrigatório)" — sem preencher os dois, não é possível salvar. Os demais campos continuam opcionais.
- Se você apagar o CEP que preencheu (em qualquer endereço), os campos que foram preenchidos automaticamente (Logradouro, Bairro, Cidade, UF) são limpos junto, sem precisar apagar um por um.
- Novo botão vermelho **"LIMPAR"**, ao lado de "Salvar cliente" — ele pede confirmação antes de apagar tudo que foi digitado no formulário aberto.
- Toda vez que um cliente é salvo (novo ou editado), a data e hora ficam registradas e aparecem na lista.

---

## PARTE 9 — Backup automático do cadastro de clientes

1. Volte ao **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-backups.sql`**, copie tudo e cole na tela.
3. Clique em **"Run"**.
4. Atualize o site: no **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
5. Espere 1-2 minutos.

**O que mudou:**
- Sobre apagar clientes: essa permissão **já era exclusiva do Administrador** desde o começo — Operador e Visualizante nunca puderam apagar um cliente inteiro, só o Administrador. Continua assim.
- A pergunta de confirmação do botão "LIMPAR" agora é: *"Tem certeza que quer limpar todas as informações inseridas?"*.
- Toda vez que um cliente é salvo (novo ou editado), o sistema gera automaticamente uma **cópia de segurança** (um arquivo HTML, só leitura) com tudo que estava no cadastro naquele momento. Cada nova cópia **substitui** a anterior daquele mesmo cliente.
- Essas cópias ficam guardadas num espaço separado e só o **Administrador** consegue vê-las, na nova aba **"Backups"** do menu (que só aparece para quem é Administrador).
- Na tela de Backups, o Administrador vê a lista de clientes com cópia disponível, a data da última cópia, e um botão para abrir o arquivo.

---

## PARTE 10 — Correções e lembrete de aniversário

Essa atualização não precisa de nenhum SQL novo. Só siga:

1. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
2. Espere 1-2 minutos.

**O que mudou:**
- **Backup**: agora mostra **todos os campos**, mesmo os que estão em branco (marcados com "—"), e a seção "Projetos vinculados" (que não estava aparecendo por um bug) já aparece corretamente. Ficou mais fácil de usar para recadastrar um cliente do zero, se precisar.
- **RG**: agora aceita a letra **X** como último caractere (comum em alguns RGs), além dos números.
- **Bug do Enter**: corrigido — apertar Enter dentro de qualquer campo do formulário de cliente não envia mais o cadastro sem querer. Só o botão "Salvar cliente" salva.
- **Endereço residencial do cônjuge**: removido do formulário, como pedido.
- **Lembrete de aniversário**: a tela **Início** agora mostra um aviso para **todos os usuários** (qualquer nível) sempre que o aniversário de um cliente, cônjuge ou filho(a) estiver a 10, 5, 2 dias ou for hoje. Como expliquei, isso aparece dentro do site (não por e-mail), para continuar 100% gratuito e simples.

---

## PARTE 11 — Backup em PDF (em vez de HTML)

1. Não precisa rodar nada no Supabase dessa vez.
2. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão (incluindo o `package.json` atualizado), **"Commit changes"**.
3. Espere 1-2 minutos — a Vercel instala a nova biblioteca de PDF sozinha durante a publicação.

**O que mudou:**
- O backup gerado ao salvar um cliente agora é um **arquivo PDF**, simples, no formato "Rótulo: valor", uma informação por linha — sem cores, sem tabela.
- Na tela **Backups** (só para Administrador), o botão "Abrir" agora abre esse PDF.
- Sobre o lembrete de aniversário: ele já está funcionando — só dispara nos dias combinados (10, 5, 2 e o próprio dia). Se quiser testar rapidinho, edite um cliente e coloque a data de nascimento como a de **hoje**.

---

## PARTE 12 — Cadastro completo de Fornecedores

1. Volte ao **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-fornecedores-v2.sql`**, copie tudo e cole na tela.
3. Clique em **"Run"** (confirme o aviso de "operação destrutiva" se aparecer).
4. Atualize o site: no **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
5. Espere 1-2 minutos.

**O que tem agora na tela de Fornecedores:**
- Botão **"+ Novo Fornecedor"**, que revela o formulário completo (Fornecedor, Categoria, Status com cor e explicação, CPF, CNPJ, Razão Social, Vendedor + telefone, Financeiro + telefone, NF, Programa de Fidelidade, Dados bancários, Observações).
- Botão vermelho **LIMPAR**, com confirmação.
- Backup em PDF gerado a cada cadastro/edição, igual ao de Clientes.
- Lista abaixo (quando o formulário está fechado): Fornecedor, Vendedor + telefone, Financeiro + telefone, data de cadastro/edição, botão azul Editar, e Apagar (só para Administrador) — em ordem alfabética.
- Campo de **busca**, que procura em qualquer campo preenchido do fornecedor.
- Filtros em sequência: botão **"Todos"** (limpa busca e filtros), depois **Categoria**, depois **Programa de Fidelidade** — cada um com "Todos" primeiro e as opções em ordem alfabética.
- A aba **Backups** agora tem duas listas separadas: Clientes e Fornecedores.

**Um detalhe pendente**: você mencionou que vai mandar a lista completa de **Programas de Fidelidade** — deixei esse campo já pronto no formulário, mas com a lista vazia por enquanto (aparece um aviso "Aguardando a lista..."). Assim que você me mandar os nomes, eu preencho.

**Sobre CPF e CNPJ**: você escreveu que os dois deveriam seguir "o mesmo padrão usado para telefones" — presumi que isso foi só uma repetição de frase ao escrever rápido, e apliquei o formato padrão de CPF (000.000.000-00) e CNPJ (00.000.000/0000-00) — os mesmos formatos usados no Brasil e semelhantes ao que já existe para o CPF de Clientes. Se era mesmo para formatar como telefone, me avisa que eu ajusto.

## Se algo der errado

Me mande uma mensagem descrevendo em que passo você travou (pode até ser um print da tela) e eu te ajudo a resolver.
