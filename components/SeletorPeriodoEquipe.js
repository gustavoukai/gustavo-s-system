import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MESES } from '../lib/horas';

// Ano (com botão "+ Criar ano"), mês e dia — usado em Horário e Deslocamento.
export default function SeletorPeriodoEquipe({ ano, mes, dia, onAno, onMes, onDia }) {
  const [anos, setAnos] = useState([2026, 2027, 2028, 2029, 2030]);

  async function carregarAnos() {
    const { data } = await supabase.from('equipe_anos').select('ano').order('ano');
    if (data && data.length > 0) setAnos(data.map((a) => a.ano));
  }

  useEffect(() => {
    carregarAnos();
  }, []);

  async function criarAno() {
    const proximo = anos.length > 0 ? Math.max(...anos) + 1 : new Date().getFullYear();
    const { error } = await supabase.from('equipe_anos').insert([{ ano: proximo }]);
    if (!error) carregarAnos();
  }

  const diasNoMes = ano && mes ? new Date(ano, mes, 0).getDate() : 31;

  return (
    <div className="filters-bar" style={{ alignItems: 'flex-end' }}>
      <div>
        <label>Ano</label>
        <select value={ano} onChange={(e) => onAno(Number(e.target.value))}>
          {anos.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <div>
        <button type="button" className="btn-secondary" onClick={criarAno}>
          + Criar ano
        </button>
      </div>
      <div>
        <label>Mês</label>
        <select value={mes} onChange={(e) => onMes(Number(e.target.value))}>
          {MESES.map((nome, i) => (
            <option key={nome} value={i + 1}>
              {nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Dia</label>
        <select value={dia} onChange={(e) => onDia(e.target.value)}>
          <option value="">Selecione...</option>
          {Array.from({ length: diasNoMes }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {String(d).padStart(2, '0')}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
