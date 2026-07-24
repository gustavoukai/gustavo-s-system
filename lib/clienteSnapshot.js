import { jsPDF } from 'jspdf';

export function generateClientePdfBlob(cliente, filhos, projetosVinculados) {
  const doc = new jsPDF();
  const margemEsquerda = 15;
  const larguraUtil = 180;
  let y = 18;

  function garantirEspaco(linhasNecessarias = 1) {
    if (y + linhasNecessarias * 6 > 285) {
      doc.addPage();
      y = 18;
    }
  }

  function titulo(texto) {
    garantirEspaco(2);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text(texto, margemEsquerda, y);
    y += 8;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
  }

  function campo(label, valor) {
    const texto = `${label}: ${valor || '—'}`;
    const linhas = doc.splitTextToSize(texto, larguraUtil);
    garantirEspaco(linhas.length);
    doc.text(linhas, margemEsquerda, y);
    y += linhas.length * 6;
  }

  // Cabeçalho
  doc.setFont(undefined, 'bold');
  doc.setFontSize(15);
  doc.text(`Cópia de segurança — ${cliente.nome || '(sem nome)'}`, margemEsquerda, y);
  y += 8;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text(`Gerada em ${new Date().toLocaleString('pt-BR')}`, margemEsquerda, y);
  y += 10;
  doc.setFontSize(11);

  titulo('Dados do cliente');
  campo('Nome', cliente.nome);
  campo('CPF', cliente.cpf);
  campo('RG', cliente.rg);
  campo('Data de nascimento', cliente.data_nascimento);
  campo('Celular 1', cliente.celular1);
  campo('Celular 2', cliente.celular2);
  campo('E-mail', cliente.email);
  campo('Instagram', cliente.instagram);
  campo('Profissão', cliente.profissao);

  titulo('Endereço residencial');
  campo('CEP', cliente.cep_residencial);
  campo('Logradouro', cliente.logradouro_residencial);
  campo('Número', cliente.numero_residencial);
  campo('Complemento', cliente.complemento_residencial);
  campo('Bairro', cliente.bairro_residencial);
  campo('Cidade', cliente.cidade_residencial);
  campo('UF', cliente.uf_residencial);

  titulo('Dados comerciais');
  campo('Empresa', cliente.empresa);
  campo('E-mail comercial', cliente.email_comercial);
  campo('Telefone', cliente.telefone_comercial);
  campo('Contato', cliente.contato_comercial);

  titulo('Endereço comercial');
  campo('CEP', cliente.cep_comercial);
  campo('Logradouro', cliente.logradouro_comercial);
  campo('Número', cliente.numero_comercial);
  campo('Complemento', cliente.complemento_comercial);
  campo('Bairro', cliente.bairro_comercial);
  campo('Cidade', cliente.cidade_comercial);
  campo('UF', cliente.uf_comercial);

  titulo('Dados do cônjuge');
  campo('Nome', cliente.conjuge_nome);
  campo('CPF', cliente.conjuge_cpf);
  campo('RG', cliente.conjuge_rg);
  campo('Data de nascimento', cliente.conjuge_data_nascimento);
  campo('Celular 1', cliente.conjuge_celular1);
  campo('Celular 2', cliente.conjuge_celular2);
  campo('E-mail', cliente.conjuge_email);
  campo('Instagram', cliente.conjuge_instagram);
  campo('Profissão', cliente.conjuge_profissao);

  titulo('Dados comerciais do cônjuge');
  campo('Empresa', cliente.conjuge_empresa);
  campo('E-mail comercial', cliente.conjuge_email_comercial);
  campo('Contato', cliente.conjuge_contato_comercial);

  titulo('Endereço comercial do cônjuge');
  campo('CEP', cliente.conjuge_cep_comercial);
  campo('Logradouro', cliente.conjuge_logradouro_comercial);
  campo('Número', cliente.conjuge_numero_comercial);
  campo('Complemento', cliente.conjuge_complemento_comercial);
  campo('Bairro', cliente.conjuge_bairro_comercial);
  campo('Cidade', cliente.conjuge_cidade_comercial);
  campo('UF', cliente.conjuge_uf_comercial);

  titulo('Projetos vinculados');
  const vinculos = projetosVinculados || [];
  if (vinculos.length === 0) {
    campo('Projetos', 'Nenhum');
  } else {
    vinculos.forEach((p, index) => {
      campo(`Projeto ${index + 1}`, `${p.numero_projeto || ''} - ${p.nome || ''}`.trim());
    });
  }

  titulo('Filhos');
  const listaFilhos = filhos || [];
  if (listaFilhos.length === 0) {
    campo('Filhos', 'Nenhum');
  } else {
    listaFilhos.forEach((f, index) => {
      campo(`Filho(a) ${index + 1} - Nome`, f.nome);
      campo(`Filho(a) ${index + 1} - Data de nascimento`, f.data_nascimento);
    });
  }

  titulo('Observações');
  campo('Observações', cliente.observacoes);

  return doc.output('blob');
}
