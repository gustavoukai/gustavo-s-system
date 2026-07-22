const LIMIARES_DIAS = [10, 5, 2, 0];

// Retorna quantos dias faltam para a próxima ocorrência de uma data de nascimento (ignorando o ano).
function diasAteProximoAniversario(dataNascimento, hoje) {
  if (!dataNascimento) return null;
  const nascimento = new Date(dataNascimento + 'T00:00:00');
  if (isNaN(nascimento.getTime())) return null;

  const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  let proximo = new Date(hoje.getFullYear(), nascimento.getMonth(), nascimento.getDate());
  if (proximo < hojeSemHora) {
    proximo = new Date(hoje.getFullYear() + 1, nascimento.getMonth(), nascimento.getDate());
  }

  const diffMs = proximo - hojeSemHora;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function mensagemPara(dias) {
  if (dias === 0) return 'é hoje';
  if (dias === 1) return 'é amanhã';
  return `é em ${dias} dias`;
}

// Monta a lista de lembretes de aniversário (cliente, cônjuge e filhos) para os limiares de 10, 5, 2 e 0 dias.
export function getLembretesAniversario(clientes, hoje = new Date()) {
  const lembretes = [];

  (clientes || []).forEach((cliente) => {
    const candidatos = [
      { nome: cliente.nome, data: cliente.data_nascimento, papel: 'Cliente' },
      { nome: cliente.conjuge_nome, data: cliente.conjuge_data_nascimento, papel: 'Cônjuge de ' + cliente.nome },
    ];

    (cliente.filhos || []).forEach((filho) => {
      candidatos.push({
        nome: filho.nome,
        data: filho.data_nascimento,
        papel: 'Filho(a) de ' + cliente.nome,
      });
    });

    candidatos.forEach((c) => {
      if (!c.nome || !c.data) return;
      const dias = diasAteProximoAniversario(c.data, hoje);
      if (dias !== null && LIMIARES_DIAS.includes(dias)) {
        lembretes.push({
          texto: `Aniversário de ${c.nome} (${c.papel}) ${mensagemPara(dias)}.`,
          dias,
        });
      }
    });
  });

  return lembretes.sort((a, b) => a.dias - b.dias);
}
