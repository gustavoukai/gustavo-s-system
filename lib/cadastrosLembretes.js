// Clientes cadastrados cujo aviso ainda não foi marcado como visto.
export function getClientesNovosNaoLidos(clientes, mapaNomes) {
  return (clientes || [])
    .filter((item) => !item.aviso_lido)
    .map((item) => ({
      id: item.id,
      texto: `${mapaNomes[item.created_by] || 'Usuário'} cadastrou o cliente ${item.nome}, em ${item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : '—'}.`,
    }));
}

// Projetos cadastrados cujo aviso ainda não foi marcado como visto.
export function getProjetosNovosNaoLidos(projetos, mapaNomes) {
  return (projetos || [])
    .filter((item) => !item.aviso_lido)
    .map((item) => ({
      id: item.id,
      texto: `${mapaNomes[item.created_by] || 'Usuário'} cadastrou o projeto ${item.numero_projeto} - ${item.nome}, em ${item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : '—'}.`,
    }));
}
