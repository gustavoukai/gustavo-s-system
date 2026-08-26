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

---

## PARTE 13 — Programas de fidelidade e título das páginas

1. Não precisa rodar nada no Supabase.
2. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
3. Espere 1-2 minutos.

**O que mudou:**
- **Programa de Fidelidade**: a lista já está carregada (Gabriel PRO, We.Brasil, Club&Casa, ID - D&D). Você pode marcar quantos quiser, ou nenhum.
- **Título da aba do navegador**: agora muda sozinho conforme a página (ex: "Clientes — Sistema Financeiro", "Fornecedores — Sistema Financeiro"). Usei "Sistema Financeiro" como nome provisório — me diga o nome que você quer (do seu escritório, por exemplo) que eu troco rapidinho.

---

## PARTE 14 — Identidade visual (logo, cores e rodapé)

1. Não precisa rodar nada no Supabase.
2. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão (incluindo a pasta `public`, com os logos), **"Commit changes"**.
3. Espere 1-2 minutos.

**O que mudou:**
- **Logo**: aparece fixo no topo de cada página, à esquerda do menu (ícone), e também na tela de login (logo horizontal).
- **Cores**: troquei a paleta do sistema para as cores oficiais do seu manual — Azul Taneli (#297480), Cinza Ukai, Chumbo e Branco.
- **Rodapé**: adicionei o elemento gráfico do manual no rodapé de todas as páginas.
- **Ícone da aba do navegador**: agora é o ícone real da marca.
- **Título das páginas**: agora segue o padrão "Tema - Taneli Ukai" (ex: "Clientes - Taneli Ukai", "Fornecedores - Taneli Ukai").

---

## PARTE 15 — Ajustes visuais + cadastro completo de Projetos

1. Volte ao **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-projetos-v2.sql`**, copie tudo e cole na tela.
3. Clique em **"Run"** (confirme o aviso de "operação destrutiva" se aparecer).
4. Atualize o site: no **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
5. Espere 1-2 minutos.

**O que mudou:**
- **Menu**: agora mostra a logo horizontal (ícone + "taneli ukai"), maior, seguida dos botões.
- **Rodapé**: o grafismo ficou bem maior (quase a largura toda da página), e o texto abaixo agora é "taneli ukai arquitetura", um pouco maior e num cinza mais escuro.
- **Projetos**: agora funciona igual a Clientes e Fornecedores — botão "+ Novo Projeto", formulário com Nome, Número (4 ou 5 dígitos, formato AANN/AANNN), Cliente (escolha única, entre os já cadastrados), Endereço da obra (com CEP automático, igual ao de Clientes) e Observações. Botão LIMPAR com confirmação.
- **Lista de projetos**: mostra Número, Nome, data de cadastro/edição, Editar e Apagar (Administrador) — ordenada do número mais recente para o mais antigo (ex: 2613, 2608, 2411, 2407, 2305, 2301, 2202).

---

## PARTE 16 — Vínculo entre Cliente e Projeto nos dois sentidos

1. Não precisa rodar nada no Supabase dessa vez.
2. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
3. Espere 1-2 minutos.

**O que mudou:**
- Agora existe **um único vínculo** entre cliente e projeto (o mesmo dos dois lados): se você escolhe o cliente na tela de Projetos, esse projeto passa a aparecer marcado na ficha daquele cliente — e vice-versa.
- Na ficha do **Cliente**, a seção "Projetos vinculados" agora é só uma lista de caixinhas para marcar (sem endereço, como você pediu), mostrando **Número - Nome do projeto**, na mesma ordem da página de Projetos (do número mais recente para o mais antigo).
- Marcar/desmarcar um projeto ali já atualiza o mesmo vínculo usado na tela de Projetos.
- A lista de Clientes na tela de Projetos continua em ordem alfabética, como já estava certo.

---

## PARTE 17 — Ícone de status em Fornecedores + menu expansível em Clientes

1. Não precisa rodar nada no Supabase.
2. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
3. Espere 1-2 minutos.

**O que mudou:**
- **Fornecedores**: na lista, entre o nome do fornecedor e o do vendedor, agora aparece um ícone: **check verde** (AP ou MP), **triângulo amarelo de alerta** (R), ou **X vermelho** (X ou NE).
- **Clientes**: o campo "Projetos vinculados" agora é um menu expansível — clique nele pra abrir a lista de projetos e marcar os que quiser, igual ao campo de Cliente na tela de Projetos, só que permitindo mais de um marcado.

---

## PARTE 18 — Mostrar os projetos vinculados sem precisar abrir a lista

1. Não precisa rodar nada no Supabase.
2. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
3. Espere 1-2 minutos.

**O que mudou:**
- No campo "Projetos vinculados" da ficha de Cliente, agora aparecem escritos, direto no campo (sem precisar clicar para abrir), todos os projetos já vinculados àquele cliente.

---

## PARTE 19 — Lista completa de categorias de Fornecedores

1. Não precisa rodar nada no Supabase.
2. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
3. Espere 1-2 minutos.

**O que mudou:**
- A lista de **Categorias** no cadastro e no filtro de Fornecedores agora tem todos os itens que você mandou (removi as poucas repetições, como "Vidraçaria" e "Tapetes" que vieram duplicadas), em ordem alfabética.

---

## PARTE 20 — Ajustes no cadastro de Fornecedores

1. Não precisa rodar nada no Supabase.
2. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
3. Espere 1-2 minutos.

**O que mudou:**
- **Telefone do vendedor**: não é mais obrigatório.
- **NF**: o rótulo agora é "Exige emissão de NF?".
- **Categoria**: virou um menu expansível (clique para abrir e marcar), igual ao campo de Projetos vinculados em Clientes — em vez dos quadradinhos sempre visíveis.

---

## PARTE 21 — Mais programas de fidelidade e ajustes de menu

1. Não precisa rodar nada no Supabase.
2. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
3. Espere 1-2 minutos.

**O que mudou:**
- **Programa de Fidelidade**: adicionei Fast Shop Pro, Telhanorte Pro, Dexco e Hunter Douglas à lista (agora com 8 no total), e o campo virou menu expansível, igual ao de Categoria.
- **Status**: as opções do menu agora mostram o significado ao lado da sigla (ex: "AP: OK, ALTO PADRÃO").

---

## PARTE 22 — Status NU, campo "Trabalhou em" e mais ajustes

1. Volte ao **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-fornecedores-v3.sql`**, copie tudo e cole na tela.
3. Clique em **"Run"**.
4. Atualize o site: no **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
5. Espere 1-2 minutos.

**O que mudou:**
- **Novo status "NU - NUNCA UTILIZADO"**: cor laranja pastel no menu, ícone de interrogação laranja na lista.
- **Ícone do status R**: agora é um triângulo amarelo de verdade (com "!" dentro), não mais um quadrado.
- **Ícone do status MP**: virou verde clarinho (pastel), diferente do AP, que continua verde escuro.
- **Novo campo "Trabalhou em"**: antes de Observações, no cadastro de Fornecedores — menu expansível com os projetos cadastrados, do mais recente para o mais antigo, permitindo marcar mais de um.
- **Categoria "Reembolso Cliente"** virou **"Reembolso - Cliente"**.
- **Duas categorias novas**: Galeria de Arte e Energia Solar.
- **Busca dentro do menu de Categoria**: agora tem uma caixinha para digitar e filtrar as opções na hora.

---

## PARTE 23 — Contas a Pagar (no lugar de Lançamentos)

1. Volte ao **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-contas-a-pagar.sql`**, copie tudo e cole na tela.
3. Clique em **"Run"**.
4. Atualize o site: no **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
5. Espere 1-2 minutos.

**O que mudou:**
- O menu agora tem **"Contas a Pagar"** e **"Cobranças"** no lugar de "Lançamentos" (Cobranças ainda é só uma página avisando que vem por aí — você vai me detalhar depois).
- Em **Contas a Pagar**: escolha o **Ano** (com botão **"+ Criar ano"** pra ir adicionando os próximos) e depois o **Mês** — aí aparece a legenda dos status e a lista das contas daquele mês.
- **Nova conta**: formulário com todos os campos que você pediu — Pagamento, Referência (Mês corrente / Mês anterior / Parcela no formato 00/00), Recebedor, Pagador, Dia do vencimento, Status, Data do pagamento (só digita os números, formata sozinho), Valor pago e Valor previsto (só digita os números — vira "R$ X,00" automaticamente), Observações.
- **Recorrência mensal**: ao cadastrar uma conta nova, escolha quantos meses repetir (1 a 14) — ela é criada automaticamente nos meses seguintes também, cada uma podendo ser editada depois separadamente.
- **Memória de valores**: os campos Pagamento, Recebedor e Pagador vão guardando o que você já digitou antes — comece a digitar de novo e vão aparecer sugestões pra escolher.

---

## PARTE 24 — Correção do valor + referência automática + cores de status

1. Volte ao **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-contas-a-pagar-v2.sql`**, copie tudo e cole na tela.
3. Clique em **"Run"**.
4. Atualize o site: no **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
5. Espere 1-2 minutos.

**O que mudou:**
- **Valor pago / Valor previsto**: corrigido o bug dos zeros se multiplicando. Agora o campo só aceita os números que você digitar (ex: `1351`), e logo abaixo aparece uma prévia de como vai ficar (ex: "= R$ 1.351,00"). Backspace também funciona normalmente agora.
- **Ordem da lista**: por dia de vencimento; havendo empate no mesmo dia, por ordem alfabética do nome do pagamento.
- **Referência automática**: ao escolher "Mês corrente" ou "Mês anterior", a lista mostra o mês e ano de verdade (ex: "julho/25"), calculado com base no mês da conta.
- **Cores dos status**: atualizadas conforme você pediu (aberto laranja pastel, agendado verde claro, débito lilás, pago azul claro, reembolso vermelho vivo, não pago cinza claro, info amarelo pastel, indefinido cinza médio).

---

## PARTE 25 — Ajustes finos em Contas a Pagar

1. Não precisa rodar SQL novo — **mas confirme que você já rodou o `supabase-setup-contas-a-pagar-v2.sql`** da Parte 24. Esse é o motivo mais provável do erro ao salvar (o sistema tentou usar uma coluna que só existe depois desse script).
2. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
3. Espere 1-2 minutos.

**O que mudou:**
- **Mensagem de erro mais clara**: agora, se o salvamento falhar, aparece o motivo real (não só "tente novamente"), o que ajuda a identificar o problema na hora.
- **Recorrência**: "Não repetir" agora é a primeira opção, para cadastrar uma conta avulsa sem repetição.
- **Status "indefinido"**: texto escurecido para ficar legível sobre o cinza.

**Sobre suas duas dúvidas:**
- O campo de valor **não muda visualmente** ao apertar Enter — isso é intencional: ele mostra só os números que você digita, e a conversão para "R$ X,00" some na linha logo abaixo ("= R$ 1.351,00"), sem mexer no que você está digitando.
- A **Referência** ("Mês corrente"/"Mês anterior") também não muda visualmente no formulário — ela continua mostrando o nome da opção escolhida ali. A conversão para o mês/ano de verdade (ex: "julho/25") só aparece **na lista**, depois de salvo.

---

## PARTE 26 — Lembrete de contas a pagar na Home

1. Não precisa rodar nada no Supabase.
2. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
3. Espere 1-2 minutos.

**O que mudou:**
- A tela **Home** agora mostra um aviso com todas as contas a pagar que vencem nos próximos 7 dias (incluindo hoje), ordenadas da mais urgente para a mais distante.

---

## PARTE 27 — Cobranças

1. Volte ao **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-cobrancas.sql`**, copie tudo e cole na tela.
3. Clique em **"Run"**.
4. Atualize o site: no **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
5. Espere 1-2 minutos.

**Como usar:**
- Entre em **Cobranças** → escolha **"Lista por Projeto"** ou **"Lista por Fornecedor"**.
- **Por Projeto**: mostra todos os projetos (mais recente primeiro) — clique em "Abrir" num deles pra ver as cobranças daquele projeto e cadastrar novas ali dentro.
- **Por Fornecedor**: mostra todos os fornecedores em ordem alfabética — clique em "Abrir" pra ver todas as cobranças daquele fornecedor, de qualquer projeto (essa tela é só consulta, não cadastra).
- Ao cadastrar uma cobrança nova: escolha **Cliente** ou um **Fornecedor**, a Categoria muda de acordo com a escolha, o campo **Parcela** já cria uma cobrança pra cada parcela automaticamente (com o % calculado sozinho), e depois os grupos **Pedido**, **Pagamento**, **Nota Fiscal** e **Programa de Fidelidade** (esse último já vem preenchido com o programa do fornecedor escolhido).
- Cada cobrança aparece na lista dentro de uma caixa colorida conforme o status do Pagamento.

---

## PARTE 28 — Recebimentos (automáticos a partir de Cobranças pagas)

1. Volte ao **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-recebimentos.sql`**, copie tudo e cole na tela.
3. Clique em **"Run"**.
4. Atualize o site: no **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
5. Espere 1-2 minutos.

**Como funciona:**
- Nova aba **"Recebimentos"** no menu.
- Toda vez que você salvar uma cobrança com status **"PAGO"** e os campos **Valor** e **Data** (do subgrupo Pagamento) preenchidos, um recebimento aparece sozinho nessa tela — não precisa fazer nada manualmente. Se você tirar o status "PAGO" ou apagar o valor/data depois, o recebimento some junto.
- Na tela, escolha o **Ano** e depois um ou mais **Meses** — os recebimentos aparecem separados por mês, do mais recente pro mais antigo, com o total somado no fim de cada mês.
- Cada recebimento mostra Data, Projeto, Fornecedor/Cliente, Categoria, Parcela, %, Recebedor, Valor, Nº NF e Observações — tudo preenchido sozinho a partir da cobrança. Os campos **Recebedor** e **Observações** ficam em branco (são só seus, pra preencher manualmente) — clique em **Editar** pra completá-los ou ajustar qualquer outro campo, se precisar.

---

## PARTE 29 — Layout de Cobranças, "Ver por Período", Dados do Escritório, avisos na Home

1. Volte ao **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-dados-escritorio.sql`**, copie tudo e cole na tela.
3. Clique em **"Run"**.
4. Atualize o site: no **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
5. Espere 1-2 minutos.

**O que mudou:**
- **Caixa de cada cobrança**: nome do fornecedor maior; categoria do fornecedor + vendedor + financeiro aparecem ao lado do nome; status do pagamento maior, com o significado dele escrito do lado; aviso (triângulo amarelo) se a fidelidade estiver como "Lançar", ou se a NF estiver marcada como "Sim" mas número e emissão ainda vazios.
- Cobranças de **Cliente + Assessoria** não mostram mais os campos Pedido salvo, Pedido nº, Pedido data e Fidelidade (não fazem sentido nesse caso).
- Os três botões de Cobranças agora são **"Ver por Projeto"**, **"Ver por Fornecedor"** e o novo **"Ver por Período"** — escolha uma data de início e fim, e aparecem todas as cobranças com previsão de pagamento dentro desse intervalo.
- Nova aba **"Dados do Escritório"** no menu: mostra os dados do escritório, da empresa e as duas contas bancárias — visível para todos, mas só o Administrador pode editar (botão "Editar" só aparece pra ele).
- Três novos avisos na **Home**: cobranças com previsão de pagamento nos próximos 7 dias; cobranças com previsão vencida há até 5 dias que ainda não foram marcadas como "Pago"; e cobranças cadastradas hoje (com quem cadastrou, projeto e fornecedor/cliente).
- Nova seção **"Checklist Financeiro"** na Home, ainda em branco — você me passa os detalhes quando quiser.

---

## PARTE 30 — Nome de usuário, boas-vindas semanal, aviso até ser visto, menu reordenado

1. Volte ao **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-parte30.sql`**, copie tudo e cole na tela.
3. Clique em **"Run"**.
4. **Cadastre o nome de cada usuário**: no Supabase, vá em **"Table Editor"** → tabela **`profiles`** → clique na célula da coluna **`nome`** na linha de cada usuário e digite o nome e sobrenome dele (ex: "Gustavo Ukai"). É o mesmo lugar onde você já ajusta o `role` de cada um.
5. Atualize o site: no **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
6. Espere 1-2 minutos.

**O que mudou:**
- Corrigido o texto da conta bancária de pessoa física para **"PARA PAGAMENTO SEM NF"**.
- A mensagem de **boas-vindas** agora aparece primeiro que todos os outros avisos na Home, e só uma vez por semana, por usuário (some sozinha depois disso e volta a aparecer só depois de 7 dias).
- Onde tinha o e-mail do usuário (mensagem de boas-vindas, aviso de cobrança cadastrada), agora aparece o **nome** cadastrado (se ainda não tiver nome cadastrado, continua mostrando o e-mail).
- O aviso de **"nova cobrança cadastrada"** agora não some mais sozinho — ele fica na Home até alguém com nível Operador ou Admin clicar em **"✔ Marcar como visto"**.
- Menu reordenado: Home, Dados do Escritório, Projetos, Clientes, Fornecedores, Cobranças, Contas a Pagar, Recebimentos, Relatórios e Backups (por último, só pra admin).
- O nível **Visualizante** não vê mais as seções de Contas a Pagar, Recebimentos e Relatórios (nem no menu, nem digitando o endereço direto), e não recebe mais os avisos de pagamentos e cobranças na Home (o de aniversário continua aparecendo pra todo mundo).
- Conferido: todas as ações de apagar do sistema já pedem confirmação antes de excluir — isso já estava certo.

---

## PARTE 31 — Checklist como botão, Visualizante pode cadastrar, cadastro de usuários pelo portal, log de acessos

Essa parte tem **um passo a mais que o normal** (pegar uma chave no Supabase e colar na Vercel), mas só precisa fazer uma vez. Segue certinho na ordem:

### Passo 1 — SQL no Supabase
1. **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-parte31.sql`**, copie tudo e cole na tela.
3. Clique em **"Run"**.

### Passo 2 — Pegar a chave "service role" no Supabase
1. No Supabase, clique em **"Project Settings"** (ícone de engrenagem, no menu da esquerda).
2. Clique em **"API"**.
3. Procure a seção **"Project API keys"**. Vai ter duas chaves: `anon` `public` (essa você já usa) e **`service_role`** `secret`.
4. Clique no ícone de "olho" ou "copiar" ao lado de `service_role` pra copiar essa chave. **Ela é secreta — não mande ela pra mim nem mostre pra ninguém.**

### Passo 3 — Colar a chave na Vercel
1. Na **Vercel**, entre no seu projeto → aba **"Settings"** → **"Environment Variables"**.
2. Em **"Key"**, digite: `SUPABASE_SERVICE_ROLE_KEY`
3. Em **"Value"**, cole a chave que você copiou no passo anterior.
4. Deixe marcado **"Production"** (e pode marcar os outros também) e clique em **"Save"**.

### Passo 4 — Subir os arquivos e reiniciar
1. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
2. Depois que o deploy terminar, vá em **Vercel → Deployments**, clique nos "..." da implantação mais recente e clique em **"Redeploy"** (isso garante que a nova chave seja usada — só subir o código não é suficiente dessa vez).

**O que mudou:**
- **Checklist Financeiro** agora é um botão no menu (não aparece mais como aviso na Home). A página continua em branco até você me detalhar o que ela precisa ter.
- O nível **Visualizante** agora pode cadastrar e editar em **Clientes, Fornecedores, Projetos e Cobranças** (mas continua sem poder apagar nada, em nenhuma seção).
- Nova aba **"Usuários"** (só admin vê): cadastra um novo usuário direto pelo site (nome, e-mail, senha provisória e nível de acesso) — sem precisar mexer no Supabase. Também dá pra editar o nome e o nível de qualquer usuário já existente, clicando em "Editar" na lista.
- Nova aba **"Log de Acessos"** (só admin vê): mostra todo login feito no sistema, com data e hora, e filtros por usuário e por período.

## Se algo der errado

Me mande uma mensagem descrevendo em que passo você travou (pode até ser um print da tela) e eu te ajudo a resolver.

---

## PARTE 32 — Botão de nova cobrança avulso, destaques na tela inicial, avisos de cliente/projeto, senha e permissões

1. Volte ao **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-parte32.sql`**, copie tudo e cole na tela.
3. Clique em **"Run"**.
4. Atualize o site: no **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
5. Espere 1-2 minutos.

**O que mudou:**
- **Cobranças**: agora tem um botão **"+ Nova cobrança"** direto na tela inicial (antes dos três botões de "Ver por..."), com um campo a mais pra escolher o Projeto — não precisa mais entrar num projeto pra cadastrar. Logo abaixo, aparece a lista de todas as cobranças com status **"Cobrar"** ou **"Follow Up"**, organizadas por projeto (mais recente primeiro).
- **Fornecedores**: legenda dos ícones de status agora aparece entre a busca e a lista.
- **Home**: novos avisos de "novo cliente cadastrado" e "novo projeto cadastrado" (com botão de marcar como visto, igual às cobranças), e um aviso de aniversários que já passaram (até 5 dias atrás).
- **Usuários**: no topo da página, a tabela com o que cada nível pode fazer, sempre atualizada. Cada usuário agora tem um botão **"Redefinir senha"** — sobre isso, uma explicação importante:

**Sobre mostrar senhas:** não é possível (nem seria seguro) o sistema guardar ou mostrar a senha real de alguém depois de criada — isso vale pra qualquer sistema sério, banco, e-mail, etc., não é uma limitação daqui. O que dá pra fazer, e o que já deixei pronto, é você **redefinir a senha de qualquer usuário quando quiser** — a senha nova aparece na tela só naquele momento, pra você anotar ou avisar a pessoa na hora.
- **Visualizante** agora pode cadastrar e editar em Clientes, Fornecedores, Projetos e Cobranças (mas continua sem poder apagar nada).

## Se algo der errado

Me mande uma mensagem descrevendo em que passo você travou (pode até ser um print da tela) e eu te ajudo a resolver.

---

## PARTE 33 — Mês corrente por padrão, legenda em Cobranças, fornecedores no projeto

1. Não precisa rodar nada no Supabase.
2. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
3. Espere 1-2 minutos.

**O que mudou:**
- **Recebimentos**: ao entrar na tela, já aparece o mês corrente selecionado sozinho, com a lista logo abaixo (do mais recente pro mais antigo) — não precisa mais escolher ano/mês toda vez.
- **Contas a Pagar**: mesma coisa — já entra mostrando o mês corrente, em ordem cronológica.
- **Cobranças → Ver por Período**: legenda dos status do Pagamento, entre os campos de busca por data e a lista de resultados.
- **Projetos**: ao editar um projeto já cadastrado, aparece uma lista com os fornecedores que trabalharam nele (preenchida automaticamente com base no campo "Trabalhou em" de cada fornecedor — não precisa fazer nada a mais, só marcar lá no cadastro do fornecedor).

## Se algo der errado

Me mande uma mensagem descrevendo em que passo você travou (pode até ser um print da tela) e eu te ajudo a resolver.

---

## PARTE 34 — Legenda em todas as telas de Cobranças, botão de backup fixo, lembretes uniformizados

1. Não precisa rodar nada no Supabase.
2. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
3. Espere 1-2 minutos.

**O que mudou:**
- A legenda de status do Pagamento agora aparece na tela inicial de **Cobranças** (junto com os três botões) e também nas telas **"Ver por Projeto"**, **"Ver por Fornecedor"** e **"Ver por Período"** (essa já tinha).
- Nova aba fixa **"Backup Completo"**: um botão na Home, só visível pro Administrador, que leva direto para o passo a passo completo de como fazer backup do código (já protegido pelo histórico do GitHub) e dos dados (exportando as tabelas do Supabase em CSV). Fica sempre disponível ali — não preciso mais te perguntar isso a cada mensagem.
- Lembretes da Home uniformizados: aniversários, cobranças com previsão de pagamento e contas a pagar agora seguem todos a mesma janela — **até 7 dias antes** e **até 5 dias depois**.

## Se algo der errado

Me mande uma mensagem descrevendo em que passo você travou (pode até ser um print da tela) e eu te ajudo a resolver.

---

## PARTE 35 — Checklist Financeiro

1. Volte ao **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-checklist-financeiro.sql`**, copie tudo e cole na tela.
3. Clique em **"Run"**.
4. Atualize o site: no **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
5. Espere 1-2 minutos.

**Como funciona:**
- Ao entrar em **Checklist Financeiro**, já aparece o checklist do mês corrente. Pra ver outro mês, escolha o **Mês** e o **Ano** no topo e clique em **Buscar**.
- Cada item (Cobrança de RTs, Atualizações no Sistema, Conciliação, Emissão de NF, Cobrança de Projeto, Produção da Planilha de Assessoria, Cobrança de Assessoria) mostra a quantidade de caixinhas correspondente à periodicidade dele naquele mês — já vem calculado automaticamente, sem precisar configurar nada.
- Marque a caixinha conforme for cumprindo a tarefa, e preencha a data logo abaixo (só os números — formata sozinho pra DD/MM/AA). Cada marcação salva na hora.
- No fim de cada item tem um campo de **Observações** livre.

## Se algo der errado

Me mande uma mensagem descrevendo em que passo você travou (pode até ser um print da tela) e eu te ajudo a resolver.

---

## PARTE 36 — Observações em histórico, avisos do Checklist para o admin, acesso restrito

1. Volte ao **Supabase** → **"SQL Editor"** → **"New query"**.
2. Abra o arquivo **`supabase-setup-checklist-parte36.sql`**, copie tudo e cole na tela.
3. Clique em **"Run"**.
4. Atualize o site: no **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
5. Espere 1-2 minutos.

**O que mudou no Checklist Financeiro:**
- A caixa de **Observações** agora aceita várias linhas — aperte Enter pra pular linha, e ela cresce sozinha conforme você escreve.
- Ao clicar em **Salvar**, o texto sai da caixa, vai para uma lista acima (com a data do dia), e a caixa fica vazia pra você digitar a próxima observação.
- O nível **Visualizante** não vê mais "Checklist Financeiro" no menu, e nem consegue abrir a página digitando o endereço direto (só Operador e Admin).
- Toda vez que uma caixinha é marcada/desmarcada ou uma observação é salva, um aviso aparece na **Home do Administrador** (com quem fez, o quê, e quando) — com botão de marcar como visto.

## Se algo der errado

Me mande uma mensagem descrevendo em que passo você travou (pode até ser um print da tela) e eu te ajudo a resolver.

---

## PARTE 37 — Botão de Visualizar, cruzamento cliente/projeto, ordenação de destaques, datas automáticas por parcela, backup no menu

1. Não precisa rodar nada no Supabase.
2. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
3. Espere 1-2 minutos.

**O que mudou:**
- **Backup Sistema** agora é um item do menu principal (ao lado de Backups), só visível pro Admin — tirei o botão que estava solto na Home.
- **Cobranças**: os destaques da tela inicial ("Cobrar"/"Follow Up") agora aparecem ordenados pela previsão de recebimento mais próxima primeiro.
- **Cobranças com parcelas**: se você preencher a data de previsão ao cadastrar uma cobrança parcelada, cada parcela seguinte já recebe automaticamente a data um mês depois da anterior (mesmo dia) — ex: 15/10/26, 15/11/26, 15/12/26...
- **Clientes**: nova coluna mostrando o(s) projeto(s) vinculado(s) na lista, e um botão **"Visualizar"** (à esquerda de "Editar") que abre a ficha só para consulta, sem poder editar nada.
- **Fornecedores**: mesmo botão **"Visualizar"** adicionado na lista.
- **Projetos**: nova coluna mostrando o cliente vinculado, e o mesmo botão **"Visualizar"**.

## Se algo der errado

Me mande uma mensagem descrevendo em que passo você travou (pode até ser um print da tela) e eu te ajudo a resolver.

---

## PARTE 38 — Correção do bug de salvamento no Checklist, editar histórico, novas quantidades

1. **Antes de tudo**: confirme que você rodou o SQL da **Parte 36** (`supabase-setup-checklist-parte36.sql`). Era essa a causa mais provável do bug — se a coluna do histórico não existisse ainda no banco, todo salvamento falhava silenciosamente. Se não tiver rodado ainda, roda agora.
2. Não tem SQL novo nesta parte.
3. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
4. Espere 1-2 minutos.

**O que mudou:**
- Agora, se um salvamento falhar por qualquer motivo, aparece uma mensagem de erro visível no topo da tela — antes isso falhava calado, e por isso os checkboxes e o histórico pareciam sumir.
- Se a quantidade de caixinhas de um item mudar no futuro, o que já estava marcado é preservado (só completa com caixinhas novas vazias, não apaga mais nada).
- Novo botão **"Editar histórico"**, acima da caixa de Observações, à direita — permite corrigir o texto de qualquer observação já salva.
- Novas quantidades de caixinhas por mês: **Conciliação** e **Emissão de NF** agora com 10 cada; **Cobrança de Projeto**, **Produção da Planilha de Assessoria** e **Cobrança de Assessoria** agora com 5 cada.

**Teste assim:** marque uma caixinha, mude de mês e volte pro mês original — ela deve continuar marcada. Se ainda sumir ou der erro, me manda a mensagem de erro que aparecer na tela (agora ela vai aparecer, o que facilita achar a causa exata).

## Se algo der errado

Me mande uma mensagem descrevendo em que passo você travou (pode até ser um print da tela) e eu te ajudo a resolver.

---

## PARTE 39 — Correção de 4 bugs (editar/apagar cobranças, botão cortado, apagar histórico)

1. Não precisa rodar nada no Supabase.
2. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
3. Espere 1-2 minutos.

**O que foi corrigido:**
- **Editar cobrança na tela inicial de Cobranças**: o formulário não abria (as cobranças simplesmente somiam da tela). Agora abre certinho.
- **Apagar cobrança**: agora a lista atualiza na hora, sem precisar dar F5 ou trocar de seção, em qualquer uma das telas (inicial, por projeto, por fornecedor ou por período).
- **Botão "Apagar" cortado em Fornecedores**: era um espacinho faltando na borda da tabela — corrigido em todas as listas do sistema.
- **Checklist Financeiro**: agora, ao editar o histórico, tem um botão **"Apagar"** em cada linha pra remover a entrada inteira (não só o texto).

## Se algo der errado

Me mande uma mensagem descrevendo em que passo você travou (pode até ser um print da tela) e eu te ajudo a resolver.

---

## PARTE 40 — Correção definitiva do botão "Apagar" cortado

1. Não precisa rodar nada no Supabase.
2. No **GitHub**, **"Add file"** → **"Upload files"**, arraste todos os arquivos e pastas da nova versão, **"Commit changes"**.
3. Espere 1-2 minutos.

**O que mudou:**
- A correção anterior não bastou porque a tabela de Fornecedores (e outras com muitos botões) ficou larga demais pra caber na tela sem precisar rolar pro lado — e essa rolagem não estava visível/óbvia.
- Os botões **Visualizar**, **Editar** e **Apagar** agora são um pouco mais compactos nas listas, o que já resolve o corte na maioria das telas.
- Também deixei a barra de rolagem da tabela mais visível, caso ainda precise rolar pro lado em telas menores.

## Se algo der errado

Me mande uma mensagem descrevendo em que passo você travou (pode até ser um print da tela) e eu te ajudo a resolver.
