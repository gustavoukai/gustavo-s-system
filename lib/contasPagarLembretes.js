// Monta a lista de contas a pagar com vencimento entre hoje e os próximos 7 dias,
// ordenada da mais urgente (vence hoje) para a mais distante (vence em 7 dias).
export function getContasProximasDoVencimento(contas, hoje = new Date()) {
  const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  const resultado = [];

  (contas || []).forEach((conta) => {
    if (!conta.dia_vencimento || !conta.ano || !conta.mes) return;

    const vencimento = new Date(conta.ano, conta.mes - 1, conta.dia_vencimento);
    const diffDias = Math.round((vencimento - hojeSemHora) / (1000 * 60 * 60 * 24));

    if (diffDias >= 0 && diffDias <= 7) {
      resultado.push({ ...conta, diffDias, vencimento });
    }
  });

  return resultado.sort((a, b) => a.diffDias - b.diffDias);
}

export function mensagemVencimento(diffDias) {
  if (diffDias === 0) return 'vence hoje';
  if (diffDias === 1) return 'vence amanhã';
  return `vence em ${diffDias} dias`;
}
