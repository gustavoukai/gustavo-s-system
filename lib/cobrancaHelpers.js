export const CATEGORIA_CLIENTE = ['Projeto', 'Assessoria', 'Reembolso'];
export const CATEGORIA_FORNECEDOR = ['RT', 'Reembolso', 'Outros'];

export const PAGAMENTO_STATUS_OPTIONS = [
  { codigo: 'PAGO', texto: 'PAGAMENTO JÁ EFETUADO', cor: '#bcdcf2', corTexto: '#1c3f5e' },
  { codigo: 'COBRAR', texto: 'COBRAR PAGAMENTO', cor: '#f3e6a3', corTexto: '#5a4a06' },
  { codigo: 'NF', texto: 'NOTA FISCAL EMITIDA E ENVIADA AO FORNECEDOR, AGUARDANDO PAGAMENTO', cor: '#f7d2ab', corTexto: '#5a3a12' },
  { codigo: 'AGUARDANDO', texto: 'SITUAÇÃO DEFINIDA OU PAGAMENTO COBRADO, AGUARDANDO PAGAMENTO', cor: '#c2e8c6', corTexto: '#1e6b3a' },
  { codigo: 'FOLLOW UP', texto: 'TRATATIVAS EM ANDAMENTO, FAZER FOLLOW-UP, VER OBSERVAÇÕES', cor: '#dcd0f0', corTexto: '#3a2a5e' },
  { codigo: 'NENHUM', texto: 'ITEM SEM RT, APENAS PARA CÁLCULO DE ASSESSORIA OU COM REMUNERAÇÃO DIFERENCIADA', cor: '#e6e6e6', corTexto: '#4a4a4a' },
  { codigo: 'INFO', texto: 'LEVANTAR INFORMAÇÕES SOBRE PAGAMENTO', cor: '#9fbdd6', corTexto: '#0f2a40' },
];

export function statusCor(codigo) {
  const opcao = PAGAMENTO_STATUS_OPTIONS.find((s) => s.codigo === codigo);
  if (!opcao) return { backgroundColor: '#ffffff', color: 'var(--ink)' };
  return { backgroundColor: opcao.cor, color: opcao.corTexto };
}

export function formatParcelaLabel(atual, total) {
  if (!total) return '—';
  return `${atual}/${String(total).padStart(2, '0')}`;
}

export function calcPercentual(total) {
  if (!total || total < 1) return null;
  return Math.round((100 / total) * 100) / 100;
}
