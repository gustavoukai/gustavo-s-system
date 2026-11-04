import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import TabelaRolavel from './TabelaRolavel';
import CalendarioMes from './CalendarioMes';
import SeletorPeriodoEquipe from './SeletorPeriodoEquipe';
import { BotaoEditarIcone, BotaoApagarIcone } from './Icones';
import {
  dataISO,
  dataBR,
  diaDaSemana,
  formatHora,
  minutosParaHora,
  calcularTotalMinutos,
} from '../lib/horas';

const formVazio = { inicio1: '', fim1: '', inicio2: '', fim2: '' };

export default function EquipeHorario({ userId }) {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [dia, setDia] = useState('');
  const [linhas, setLinhas] = useState([]);
  const [form, setForm] = useState(formVazio);
  const [editingId, setEditingId] = useState(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    if (!userId || !ano || !mes) return;
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const { data } = await supabase
      .from('equipe_horarios')
      .select('*')
      .eq('user_id', userId)
      .gte('data', dataISO(ano, mes, 1))
      .lte('data', dataISO(ano, mes, ultimoDia))
      .order('data');
    setLinhas(data || []);
  }

  function cancelar() {
    setDia('');
    setForm(formVazio);
    setEditingId(null);
    setErro('');
  }

  useEffect(() => {
    cancelar();
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, ano, mes]);

  function abrirEdicao(linha) {
    setDia(String(Number(linha.data.slice(8, 10))));
    setEditingId(linha.id);
    setForm({
      inicio1: linha.inicio1 || '',
      fim1: linha.fim1 || '',
      inicio2: linha.inicio2 || '',
      fim2: linha.fim2 || '',
    });
    setErro('');
  }

  function selecionarDia(valor) {
    setDia(valor);
    setErro('');
    if (!valor) {
      setForm(formVazio);
      setEditingId(null);
      return;
    }
    const existente = linhas.find((l) => l.data === dataISO(ano, mes, Number(valor)));
    if (existente) {
      abrirEdicao(existente);
    } else {
      setEditingId(null);
      setForm(formVazio);
    }
  }

  function atualizarHora(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: formatHora(valor) }));
  }

  const calculo = calcularTotalMinutos(form.inicio1, form.fim1, form.inicio2, form.fim2);

  async function salvar() {
    if (calculo.erro) {
      setErro(calculo.erro);
      return;
    }
    if (calculo.total === 0) {
      setErro('Preencha pelo menos um período (início e fim).');
      return;
    }
    setSalvando(true);
    setErro('');

    const payload = {
      inicio1: form.inicio1 || null,
      fim1: form.fim1 || null,
      inicio2: form.inicio2 || null,
      fim2: form.fim2 || null,
      total_minutos: calculo.total,
      atualizado_em: new Date().toISOString(),
    };

    const resposta = editingId
      ? await supabase.from('equipe_horarios').update(payload).eq('id', editingId)
      : await supabase
          .from('equipe_horarios')
          .insert([{ ...payload, user_id: userId, data: dataISO(ano, mes, Number(dia)) }]);

    setSalvando(false);
    if (resposta.error) {
      setErro(`Não foi possível salvar: ${resposta.error.message}`);
      return;
    }
    cancelar();
    carregar();
  }

  async function apagar(linha) {
    if (!confirm(`Apagar o horário do dia ${dataBR(linha.data)}?`)) return;
    await supabase.from('equipe_horarios').delete().eq('id', linha.id);
    if (editingId === linha.id) cancelar();
    carregar();
  }

  const diasTrabalhados = linhas.filter((l) => (l.total_minutos || 0) > 0).length;
  const horasTrabalhadas = linhas.reduce((soma, l) => soma + (l.total_minutos || 0), 0);

  return (
    <div className="equipe-layout">
      <div className="equipe-principal">
        <SeletorPeriodoEquipe ano={ano} mes={mes} dia={dia} onAno={setAno} onMes={setMes} onDia={selecionarDia} />

        {dia && (
          <div className="section-card">
            <h2 style={{ marginBottom: 12 }}>
              Dia {dataBR(dataISO(ano, mes, Number(dia)))} ({diaDaSemana(dataISO(ano, mes, Number(dia)))})
            </h2>
            <div className="equipe-linha">
              {[
                ['inicio1', 'Início'],
                ['fim1', 'Fim'],
                ['inicio2', 'Início'],
                ['fim2', 'Fim'],
              ].map(([campo, rotulo]) => (
                <div key={campo}>
                  <label>{rotulo}</label>
                  <input
                    value={form[campo]}
                    onChange={(e) => atualizarHora(campo, e.target.value)}
                    placeholder="HH:MM"
                    inputMode="numeric"
                    style={{ width: 92, marginBottom: 0 }}
                  />
                </div>
              ))}
              <div>
                <label>Total</label>
                <input
                  value={calculo.erro ? '--:--' : minutosParaHora(calculo.total)}
                  disabled
                  style={{ width: 92, marginBottom: 0, fontWeight: 700 }}
                />
              </div>
            </div>
            {erro && (
              <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>{erro}</p>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button type="button" style={{ width: 'auto', padding: '10px 18px' }} onClick={salvar} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" className="btn-secondary" onClick={cancelar}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {linhas.length === 0 ? (
          <p className="empty-hint">Nenhum horário registrado neste mês.</p>
        ) : (
          <TabelaRolavel>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dia</th>
                  <th>Início</th>
                  <th>Fim</th>
                  <th>Início</th>
                  <th>Fim</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.id}>
                    <td>
                      {dataBR(l.data).slice(0, 5)} ({diaDaSemana(l.data)})
                    </td>
                    <td>{l.inicio1 || '—'}</td>
                    <td>{l.fim1 || '—'}</td>
                    <td>{l.inicio2 || '—'}</td>
                    <td>{l.fim2 || '—'}</td>
                    <td>
                      <strong>{minutosParaHora(l.total_minutos)}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <BotaoEditarIcone onClick={() => abrirEdicao(l)} />
                        <BotaoApagarIcone onClick={() => apagar(l)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ fontWeight: 700 }}>
                    Dias trabalhados: {diasTrabalhados}
                  </td>
                  <td colSpan={3} style={{ fontWeight: 700 }}>
                    Horas trabalhadas: {minutosParaHora(horasTrabalhadas)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </TabelaRolavel>
        )}
      </div>

      <div className="equipe-lateral">
        <CalendarioMes
          ano={ano}
          mes={mes}
          diasMarcados={linhas.map((l) => Number(l.data.slice(8, 10)))}
          diaSelecionado={dia}
          onSelecionar={selecionarDia}
        />
      </div>
    </div>
  );
}
