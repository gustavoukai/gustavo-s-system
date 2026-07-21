function linha(label, value) {
  if (!value) return '';
  return `<tr><td style="padding:4px 10px 4px 0;color:#5b6b6c;white-space:nowrap;">${label}</td><td style="padding:4px 0;font-weight:600;">${value}</td></tr>`;
}

function secao(titulo, linhasHtml) {
  const conteudo = linhasHtml.filter(Boolean).join('');
  if (!conteudo) return '';
  return `
    <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.04em;color:#00677f;border-top:1px solid #dfe6e6;padding-top:16px;margin-top:24px;">${titulo}</h2>
    <table style="border-collapse:collapse;font-size:14px;">${conteudo}</table>
  `;
}

export function generateClienteSnapshotHtml(cliente, filhos, projetosVinculados, projetosList) {
  const nomeProjeto = (id) => projetosList.find((p) => p.id === id)?.nome || '(projeto não encontrado)';

  const projetosHtml = (projetosVinculados || [])
    .filter((p) => p.projeto_id)
    .map(
      (p) => `
        <div style="margin-bottom:10px;padding:10px;border:1px solid #dfe6e6;border-radius:6px;">
          <strong>${nomeProjeto(p.projeto_id)}</strong><br/>
          ${[p.logradouro_obra, p.numero_obra, p.complemento_obra].filter(Boolean).join(', ')}
          ${p.bairro_obra ? ' - ' + p.bairro_obra : ''}
          ${p.cidade_obra ? ' - ' + p.cidade_obra : ''}${p.uf_obra ? '/' + p.uf_obra : ''}
          ${p.cep_obra ? ' - CEP ' + p.cep_obra : ''}
        </div>`
    )
    .join('');

  const filhosHtml = (filhos || [])
    .map((f) => `<div>${f.nome || '(sem nome)'} ${f.data_nascimento ? '- nascido(a) em ' + f.data_nascimento : ''}</div>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Cópia de segurança - ${cliente.nome || 'Cliente'}</title>
</head>
<body style="font-family: -apple-system, Arial, sans-serif; color:#16211d; max-width:760px; margin:32px auto; padding:0 20px;">
  <div style="background:#00677f; color:white; padding:16px 20px; border-radius:8px; margin-bottom:8px;">
    <strong style="font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Cópia de segurança — somente leitura</strong>
  </div>
  <h1 style="font-size:22px; margin-bottom:0;">${cliente.nome || ''}</h1>
  <p style="color:#5b6b6c; font-size:13px; margin-top:4px;">
    Gerada automaticamente em ${new Date().toLocaleString('pt-BR')}
  </p>

  ${projetosHtml ? secao('Projetos vinculados', ['']).replace('<table style="border-collapse:collapse;font-size:14px;"></table>', projetosHtml) : ''}

  ${secao('Dados do cliente', [
    linha('CPF', cliente.cpf),
    linha('RG', cliente.rg),
    linha('Data de nascimento', cliente.data_nascimento),
    linha('Celular 1', cliente.celular1),
    linha('Celular 2', cliente.celular2),
    linha('E-mail', cliente.email),
    linha('Instagram', cliente.instagram),
    linha('Profissão', cliente.profissao),
  ])}

  ${secao('Endereço residencial', [
    linha('CEP', cliente.cep_residencial),
    linha('Logradouro', cliente.logradouro_residencial),
    linha('Número', cliente.numero_residencial),
    linha('Complemento', cliente.complemento_residencial),
    linha('Bairro', cliente.bairro_residencial),
    linha('Cidade', cliente.cidade_residencial),
    linha('UF', cliente.uf_residencial),
  ])}

  ${secao('Dados comerciais', [
    linha('Empresa', cliente.empresa),
    linha('E-mail comercial', cliente.email_comercial),
    linha('Telefone', cliente.telefone_comercial),
    linha('Contato', cliente.contato_comercial),
  ])}

  ${secao('Endereço comercial', [
    linha('CEP', cliente.cep_comercial),
    linha('Logradouro', cliente.logradouro_comercial),
    linha('Número', cliente.numero_comercial),
    linha('Complemento', cliente.complemento_comercial),
    linha('Bairro', cliente.bairro_comercial),
    linha('Cidade', cliente.cidade_comercial),
    linha('UF', cliente.uf_comercial),
  ])}

  ${secao('Dados do cônjuge', [
    linha('Nome', cliente.conjuge_nome),
    linha('CPF', cliente.conjuge_cpf),
    linha('RG', cliente.conjuge_rg),
    linha('Data de nascimento', cliente.conjuge_data_nascimento),
    linha('Celular 1', cliente.conjuge_celular1),
    linha('Celular 2', cliente.conjuge_celular2),
    linha('E-mail', cliente.conjuge_email),
    linha('Instagram', cliente.conjuge_instagram),
    linha('Profissão', cliente.conjuge_profissao),
  ])}

  ${secao('Endereço residencial do cônjuge', [
    linha('CEP', cliente.conjuge_cep_residencial),
    linha('Logradouro', cliente.conjuge_logradouro_residencial),
    linha('Número', cliente.conjuge_numero_residencial),
    linha('Complemento', cliente.conjuge_complemento_residencial),
    linha('Bairro', cliente.conjuge_bairro_residencial),
    linha('Cidade', cliente.conjuge_cidade_residencial),
    linha('UF', cliente.conjuge_uf_residencial),
  ])}

  ${secao('Dados comerciais do cônjuge', [
    linha('Empresa', cliente.conjuge_empresa),
    linha('E-mail comercial', cliente.conjuge_email_comercial),
    linha('Contato', cliente.conjuge_contato_comercial),
  ])}

  ${secao('Endereço comercial do cônjuge', [
    linha('CEP', cliente.conjuge_cep_comercial),
    linha('Logradouro', cliente.conjuge_logradouro_comercial),
    linha('Número', cliente.conjuge_numero_comercial),
    linha('Complemento', cliente.conjuge_complemento_comercial),
    linha('Bairro', cliente.conjuge_bairro_comercial),
    linha('Cidade', cliente.conjuge_cidade_comercial),
    linha('UF', cliente.conjuge_uf_comercial),
  ])}

  ${filhosHtml ? `<h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.04em;color:#00677f;border-top:1px solid #dfe6e6;padding-top:16px;margin-top:24px;">Filhos</h2>${filhosHtml}` : ''}

  ${cliente.observacoes ? `<h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.04em;color:#00677f;border-top:1px solid #dfe6e6;padding-top:16px;margin-top:24px;">Observações</h2><p>${cliente.observacoes}</p>` : ''}
</body>
</html>`;
}
