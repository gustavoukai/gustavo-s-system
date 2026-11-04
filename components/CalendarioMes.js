import { MESES } from '../lib/horas';

const CABECALHO = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// Calendário simples de um mês: mostra os dias da semana, marca os dias que já
// têm registro e o dia selecionado. Clicar num dia seleciona ele.
export default function CalendarioMes({ ano, mes, diasMarcados = [], diaSelecionado, onSelecionar }) {
  if (!ano || !mes) return null;

  const primeiroDiaSemana = new Date(ano, mes - 1, 1).getDay();
  const totalDias = new Date(ano, mes, 0).getDate();
  const celulas = [];
  for (let i = 0; i < primeiroDiaSemana; i++) celulas.push(null);
  for (let d = 1; d <= totalDias; d++) celulas.push(d);

  return (
    <div className="calendario">
      <h3>
        {MESES[mes - 1]} de {ano}
      </h3>
      <div className="calendario-grade">
        {CABECALHO.map((letra, i) => (
          <div key={`cab-${i}`} className="calendario-cab">
            {letra}
          </div>
        ))}
        {celulas.map((dia, i) => {
          if (dia === null) return <div key={`vazio-${i}`} />;
          const diaSemana = new Date(ano, mes - 1, dia).getDay();
          const classes = ['cal-dia'];
          if (diaSemana === 0 || diaSemana === 6) classes.push('cal-dia-fds');
          if (diasMarcados.includes(dia)) classes.push('cal-dia-marcado');
          if (Number(diaSelecionado) === dia) classes.push('cal-dia-selecionado');
          return (
            <button key={dia} type="button" className={classes.join(' ')} onClick={() => onSelecionar && onSelecionar(String(dia))}>
              {dia}
            </button>
          );
        })}
      </div>
    </div>
  );
}
