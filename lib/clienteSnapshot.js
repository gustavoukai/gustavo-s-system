function linha(label, value) {
  const exibido = value ? String(value) : '—';
  return `<tr><td style="padding:5px 14px 5px 0;color:#5b6b6c;white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:5px 0;font-weight:600;">${exibido}</td></tr>`;
}

function secao(titulo, linhasHtml) {
  return `
    <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.04em;color:#00677f;border-top:1px solid #dfe6e6;padding-top:16px;margin-top:24px;margin-bottom:8px;">${titulo}</h2>
    <table style="border-collapse:collapse;font-size:14px;width:100%;">${linhasHtml.join('')}</table>
  `;
}

export function generateClienteSnapshotHtml(cliente, filhos, projetosVinculados, projetosList) {
  const nomeProjeto = (id) => projetosList.find((p) => p.id === id)?.nome || '(projeto não encontrado)';

  const vinculos = projetosVinculados || [];
  const projetosHtml =
    vinculos.length === 0
      ? '<p style="color:#5b6b6c;">Nenhum projeto vinculado.</p>'
      : vinculos
          .map(
            (p) => `
        <div style="margin-bottom:10px;padding:10px;border:1px solid #dfe6e6;border-radius:6px;">
          <strong>${p.projeto_id ? nomeProjeto(p.projeto_id) : '(projeto não selecionado)'}</strong><br/>
          <span style="color:#5b6b6c;font-size:13px;">
            ${[p.logradouro_obra, p.numero_obra, p.complemento_obra].filter(Boolean).join(', ') || '—'}
            ${p.bairro_obra ? ' - ' + p.bairro_obra : ''}
            ${p.cidade_obra ? ' - ' + p.cidade_obra : ''}${p.uf_obra ? '/' + p.uf_obra : ''}
            ${p.cep_obra ? ' - CEP ' + p.cep_obra : ''}
          </span>
        </div>`
          )
          .join('');

  const listaFilhos = filhos || [];
  const filhosHtml =
    listaFilhos.length === 0
      ? '<p style="color:#5b6b6c;">Nenhum filho cadastrado.</p>'
      : listaFilhos
          .map(
            (f) =>
              `<div style="margin-bottom:4px;">${f.nome || '(sem nome)'} — nascimento: ${f.data_nascimento || '—'}</div>`
          )
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
  <h1 style="font-size:24px; margin-bottom:0;">${cliente.nome || '(sem nome)'}</h1>
  <p style="color:#5b6b6c; font-size:13px; margin-top:4px;">
    Gerada automaticamente em ${new Date().toLocaleString('pt-BR')} — use esta página para recadastrar o cliente caso o cadastro original seja apagado.
  </p>

  <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.04em;color:#00677f;border-top:1px solid #dfe6e6;padding-top:16px;margin-top:24px;margin-bottom:8px;">Projetos vinculados</h2>
  ${projetosHtml}

  ${secao('Dados do cliente', [
    linha('Nome', cliente.nome),
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

  <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.04em;color:#00677f;border-top:1px solid #dfe6e6;padding-top:16px;margin-top:24px;margin-bottom:8px;">Filhos</h2>
  ${filhosHtml}

  <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.04em;color:#00677f;border-top:1px solid #dfe6e6;padding-top:16px;margin-top:24px;margin-bottom:8px;">Observações</h2>
  <p>${cliente.observacoes || '—'}</p>
</body>
</html>`;
}
