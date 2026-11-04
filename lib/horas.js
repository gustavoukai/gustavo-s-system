export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const DIAS_SEMANA_CURTO = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function pad(n) {
  return String(n).padStart(2, '0');
}

export function dataISO(ano, mes, dia) {
  return `${ano}-${pad(mes)}-${pad(dia)}`;
}

// "2026-11-03" -> "03/11/2026"
export function dataBR(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

// "2026-11-03" -> "ter"
export function diaDaSemana(iso) {
  return DIAS_SEMANA_CURTO[new Date(`${iso}T00:00:00`).getDay()];
}

// Só dígitos; coloca os dois pontos sozinho: 0830 -> 08:30
export function formatHora(raw) {
  const d = (raw || '').replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

export function horaParaMinutos(txt) {
  const m = /^(\d{2}):(\d{2})$/.exec(txt || '');
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}

export function minutosParaHora(min) {
  const total = Math.max(Number(min) || 0, 0);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

// Soma os dois períodos do dia. Devolve { total, erro }.
export function calcularTotalMinutos(inicio1, fim1, inicio2, fim2) {
  let total = 0;
  const periodos = [
    [inicio1, fim1],
    [inicio2, fim2],
  ];
  for (let i = 0; i < periodos.length; i++) {
    const [ini, fim] = periodos[i];
    if (!ini && !fim) continue;
    if (!ini || !fim) return { total: 0, erro: `Período ${i + 1}: preencha o início e o fim.` };
    const a = horaParaMinutos(ini);
    const b = horaParaMinutos(fim);
    if (a == null || b == null) return { total: 0, erro: `Período ${i + 1}: use horários válidos no formato HH:MM.` };
    if (b <= a) return { total: 0, erro: `Período ${i + 1}: o fim precisa ser depois do início.` };
    total += b - a;
  }
  return { total, erro: '' };
}
