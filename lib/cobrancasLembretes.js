function parseDataCurta(str) {
  if (!str) return null;
  const partes = str.split('/');
  if (partes.length !== 3) return null;
  const [d, m, a] = partes;
  const ano = Number(a) < 100 ? 2000 + Number(a) : Number(a);
  const data = new Date(ano, Number(m) - 1, Number(d));
  return isNaN(data.getTime()) ? null : data;
}

function nomeFornecedorOuCliente(item) {
  if (item.fornecedor_tipo === 'cliente') return 'Cliente';
  return item.fornecedores?.nome || '(fornecedor)';
}

function nomeProjeto(item) {
  if (!item.projetos) return '—';
  return `${item.projetos.numero_projeto} - ${item.projetos.nome}`;
}

// Cobranças cuja previsão de pagamento cai nos próximos 7 dias (incluindo hoje).
export function getCobrancasComPrevisaoProxima(cobrancas, hoje = new Date()) {
  const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const resultado = [];

  (cobrancas || []).forEach((item) => {
    const previsao = parseDataCurta(item.pagamento_previsao);
    if (!previsao) return;
    const diffDias = Math.round((previsao - hojeSemHora) / (1000 * 60 * 60 * 24));
    if (diffDias >= 0 && diffDias <= 7) {
      resultado.push({
        id: item.id,
        diffDias,
        texto: `${nomeFornecedorOuCliente(item)} — ${nomeProjeto(item)} — previsão ${item.pagamento_previsao}`,
      });
    }
  });

  return resultado.sort((a, b) => a.diffDias - b.diffDias);
}

// Cobranças cuja previsão já passou (até 5 dias) e o pagamento ainda não foi marcado como PAGO.
export function getCobrancasAtrasadas(cobrancas, hoje = new Date()) {
  const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const resultado = [];

  (cobrancas || []).forEach((item) => {
    if (item.pagamento_status === 'PAGO') return;
    const previsao = parseDataCurta(item.pagamento_previsao);
    if (!previsao) return;
    const diffDias = Math.round((hojeSemHora - previsao) / (1000 * 60 * 60 * 24));
    if (diffDias > 0 && diffDias <= 5) {
      resultado.push({
        id: item.id,
        diffDias,
        texto: `${nomeFornecedorOuCliente(item)} — ${nomeProjeto(item)} — previsão era ${item.pagamento_previsao} (${diffDias} dia${diffDias > 1 ? 's' : ''} atrás)`,
      });
    }
  });

  return resultado.sort((a, b) => b.diffDias - a.diffDias);
}

// Cobranças cadastradas hoje, com autor, projeto e fornecedor/cliente.
export function getCobrancasNovasHoje(cobrancas, mapaEmails, hoje = new Date()) {
  const hojeStr = hoje.toDateString();
  return (cobrancas || [])
    .filter((item) => item.created_at && new Date(item.created_at).toDateString() === hojeStr)
    .map((item) => ({
      id: item.id,
      texto: `${mapaEmails[item.created_by] || 'Usuário'} cadastrou uma cobrança no projeto ${nomeProjeto(item)} com ${nomeFornecedorOuCliente(item)}, em ${new Date(item.created_at).toLocaleString('pt-BR')}.`,
    }));
}
