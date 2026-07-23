import { jsPDF } from 'jspdf';

export function generateFornecedorPdfBlob(fornecedor, statusLabel) {
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

  doc.setFont(undefined, 'bold');
  doc.setFontSize(15);
  doc.text(`Cópia de segurança — ${fornecedor.nome || '(sem nome)'}`, margemEsquerda, y);
  y += 8;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text(`Gerada em ${new Date().toLocaleString('pt-BR')}`, margemEsquerda, y);
  y += 10;
  doc.setFontSize(11);

  titulo('Dados do fornecedor');
  campo('Fornecedor', fornecedor.nome);
  campo('Categoria', (fornecedor.categorias || []).join(', '));
  campo('Status', statusLabel || fornecedor.status);
  campo('CPF', fornecedor.cpf);
  campo('CNPJ', fornecedor.cnpj);
  campo('Razão Social', fornecedor.razao_social);

  titulo('Vendedor');
  campo('Vendedor', fornecedor.vendedor);
  campo('Telefone', fornecedor.telefone_vendedor);

  titulo('Financeiro');
  campo('Financeiro', fornecedor.financeiro);
  campo('Telefone', fornecedor.telefone_financeiro);

  titulo('Outras informações');
  campo('NF', fornecedor.nf === 'sim' ? 'Sim' : fornecedor.nf === 'nao' ? 'Não' : '—');
  campo('Programa de fidelidade', (fornecedor.programas_fidelidade || []).join(', '));

  titulo('Dados bancários');
  campo('Banco', fornecedor.banco);
  campo('Agência', fornecedor.agencia);
  campo('Conta', fornecedor.conta);
  campo('Nomenclatura bancária', fornecedor.nomenclatura_bancaria);

  titulo('Observações');
  campo('Observações', fornecedor.observacoes);

  return doc.output('blob');
}
