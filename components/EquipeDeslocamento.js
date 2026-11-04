import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import TabelaRolavel from './TabelaRolavel';
import CalendarioMes from './CalendarioMes';
import SeletorPeriodoEquipe from './SeletorPeriodoEquipe';
import { BotaoEditarIcone, BotaoApagarIcone } from './Icones';
import { sanitizeValorComCentavos, previewValorComCentavos, parseValorComCentavos } from '../lib/masks';
import { dataISO, dataBR, diaDaSemana } from '../lib/horas';

const formVazio = { origem: '', destino: '', vt: false, km: '', uber: '' };

function dinheiro(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function numeroBR(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

export default function EquipeDeslocamento({ userId, ehAdmin }) {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [dia, setDia] = useState('');
  const [linhas, setLinhas] = useState([]);
  const [form, setForm] = useState(formVazio);
  const [editingId, setEditingId] = useState(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [config, setConfig] = useState({ valor_vt: 0, valor_km: 0 });
  const [editandoConfig, setEditandoConfig] = useState(false);
  const [formConfig, setFormConfig] = useState({ valor_vt: '', valor_km: '' });
  const [erroConfig, setErroConfig] = useState('');

  async function carregar() {
    if (!userId || !ano || !mes) return;
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const { data } = await supabase
      .from('equipe_deslocamentos')
      .select('*')
      .eq('user_id', userId)
      .gte('data', dataISO(ano, mes, 1))
      .lte('data', dataISO(ano, mes, ultimoDia))
      .order('data')
      .order('created_at');
    setLinhas(data || []);
  }

  async function carregarConfig() {
    const { data } = await supabase.from('equipe_config').select('valor_vt, valor_km').eq('id', 1).maybeSingle();
    if (data) setConfig({ valor_vt: Number(data.valor_vt) || 0, valor_km: Number(data.valor_km) || 0 });
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

  useEffect(() => {
    carregarConfig();
  }, []);

  function selecionarDia(valor) {
    setDia(valor);
    setErro('');
    setEditingId(null);
    setForm(formVazio);
  }

  function abrirEdicao(linha) {
    setDia(String(Number(linha.data.slice(8, 10))));
    setEditingId(linha.id);
    setForm({
      origem: linha.origem || '',
      destino: linha.destino || '',
      vt: !!linha.vt,
      km: linha.km != null ? String(linha.km).replace('.', ',') : '',
      uber: linha.uber != null ? String(linha.uber).replace('.', ',') : '',
    });
    setErro('');
  }

  function atualizar(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  // Só um dos três pode ser preenchido: VT, KM ou Uber.
  const vtBloqueado = !!form.km || !!form.uber;
  const kmBloqueado = form.vt || !!form.uber;
  const uberBloqueado = form.vt || !!form.km;

  async function salvar() {
    if (!form.vt && !form.km && !form.uber) {
      setErro('Marque o VT ou informe o KM ou o valor do Uber.');
      return;
    }
    setSalvando(true);
    setErro('');

    const payload = {
      origem: form.origem || null,
      destino: form.destino || null,
      vt: !!form.vt,
      km: form.km ? parseValorComCentavos(form.km) : null,
      uber: form.uber ? parseValorComCentavos(form.uber) : null,
      atualizado_em: new Date().toISOString(),
    };

    const resposta = editingId
      ? await supabase.from('equipe_deslocamentos').update(payload).eq('id', editingId)
      : await supabase
          .from('equipe_deslocamentos')
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
    if (!confirm(`Apagar o deslocamento do dia ${dataBR(linha.data)}?`)) return;
    await supabase.from('equipe_deslocamentos').delete().eq('id', linha.id);
    if (editingId === linha.id) cancelar();
    carregar();
  }

  function abrirEdicaoConfig() {
    setFormConfig({
      valor_vt: String(config.valor_vt).replace('.', ','),
      valor_km: String(config.valor_km).replace('.', ','),
    });
    setErroConfig('');
    setEditandoConfig(true);
  }

  async function salvarConfig() {
    const { error } = await supabase
      .from('equipe_config')
      .update({
        valor_vt: parseValorComCentavos(formConfig.valor_vt) || 0,
        valor_km: parseValorComCentavos(formConfig.valor_km) || 0,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', 1);
    if (error) {
      setErroConfig(`Não foi possível salvar: ${error.message}`);
      return;
    }
    setEditandoConfig(false);
    carregarConfig();
  }

  const totalVT = linhas.filter((l) => l.vt).length;
  const totalKM = linhas.reduce((soma, l) => soma + (Number(l.km) || 0), 0);
  const totalUber = linhas.reduce((soma, l) => soma + (Number(l.uber) || 0), 0);
  const totalVTemReais = totalVT * config.valor_vt;
  const totalKMemReais = totalKM * config.valor_km;
  const totalReembolso = totalVTemReais + totalKMemReais + totalUber;

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
              <div style={{ flex: '1 1 160px' }}>
                <label>Origem</label>
                <input
                  value={form.origem}
                  onChange={(e) => atualizar('origem', e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
              <div style={{ flex: '1 1 160px' }}>
                <label>Destino</label>
                <input
                  value={form.destino}
                  onChange={(e) => atualizar('destino', e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
              <div>
                <label>VT</label>
                <input
                  type="checkbox"
                  checked={form.vt}
                  disabled={vtBloqueado}
                  onChange={(e) => atualizar('vt', e.target.checked)}
                  style={{ width: 20, height: 20, marginBottom: 10 }}
                />
              </div>
              <div>
                <label>KM</label>
                <input
                  value={form.km}
                  disabled={kmBloqueado}
                  onChange={(e) => atualizar('km', sanitizeValorComCentavos(e.target.value))}
                  placeholder="0"
                  inputMode="decimal"
                  style={{ width: 90, marginBottom: 0 }}
                />
              </div>
              <div>
                <label>Uber</label>
                <input
                  value={form.uber}
                  disabled={uberBloqueado}
                  onChange={(e) => atualizar('uber', sanitizeValorComCentavos(e.target.value))}
                  placeholder="0,00"
                  inputMode="decimal"
                  style={{ width: 110, marginBottom: 0 }}
                />
                {form.uber && (
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, marginBottom: 0 }}>
                    = {previewValorComCentavos(form.uber)}
                  </p>
                )}
              </div>
            </div>
            {erro && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>{erro}</p>}
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
          <p className="empty-hint">Nenhum deslocamento registrado neste mês.</p>
        ) : (
          <TabelaRolavel>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dia</th>
                  <th>Origem</th>
                  <th>Destino</th>
                  <th>VT</th>
                  <th>KM</th>
                  <th>Uber</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.id}>
                    <td>
                      {dataBR(l.data).slice(0, 5)} ({diaDaSemana(l.data)})
                    </td>
                    <td>{l.origem || '—'}</td>
                    <td>{l.destino || '—'}</td>
                    <td>{l.vt ? '✔' : '—'}</td>
                    <td>{l.km != null ? numeroBR(l.km) : '—'}</td>
                    <td>{l.uber != null ? dinheiro(l.uber) : '—'}</td>
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
                    Totais do mês
                  </td>
                  <td style={{ fontWeight: 700 }}>{totalVT} VT</td>
                  <td style={{ fontWeight: 700 }}>{numeroBR(totalKM)} km</td>
                  <td style={{ fontWeight: 700 }}>{dinheiro(totalUber)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </TabelaRolavel>
        )}

        <div className="section-card" style={{ marginTop: 20 }}>
          <div className="toolbar" style={{ marginBottom: 8 }}>
            <h2>Reembolso do mês</h2>
            {ehAdmin && !editandoConfig && (
              <button type="button" className="btn-secondary" onClick={abrirEdicaoConfig}>
                Editar valores
              </button>
            )}
          </div>

          {ehAdmin && editandoConfig && (
            <div className="equipe-linha" style={{ marginBottom: 14 }}>
              <div>
                <label>Valor de cada VT (R$)</label>
                <input
                  value={formConfig.valor_vt}
                  onChange={(e) => setFormConfig((p) => ({ ...p, valor_vt: sanitizeValorComCentavos(e.target.value) }))}
                  inputMode="decimal"
                  style={{ width: 130, marginBottom: 0 }}
                />
              </div>
              <div>
                <label>Valor de cada KM (R$)</label>
                <input
                  value={formConfig.valor_km}
                  onChange={(e) => setFormConfig((p) => ({ ...p, valor_km: sanitizeValorComCentavos(e.target.value) }))}
                  inputMode="decimal"
                  style={{ width: 130, marginBottom: 0 }}
                />
              </div>
              <button type="button" style={{ width: 'auto', padding: '10px 18px' }} onClick={salvarConfig}>
                Salvar valores
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditandoConfig(false)}>
                Cancelar
              </button>
              {erroConfig && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{erroConfig}</p>}
            </div>
          )}

          <table className="data-table" style={{ width: '100%' }}>
            <tbody>
              <tr>
                <td>
                  VT: {totalVT} × {dinheiro(config.valor_vt)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{dinheiro(totalVTemReais)}</td>
              </tr>
              <tr>
                <td>
                  KM: {numeroBR(totalKM)} × {dinheiro(config.valor_km)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{dinheiro(totalKMemReais)}</td>
              </tr>
              <tr>
                <td>Uber</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{dinheiro(totalUber)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td style={{ fontWeight: 700 }}>Total a reembolsar no mês</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{dinheiro(totalReembolso)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="equipe-lateral">
        <CalendarioMes
          ano={ano}
          mes={mes}
          diasMarcados={[...new Set(linhas.map((l) => Number(l.data.slice(8, 10))))]}
          diaSelecionado={dia}
          onSelecionar={selecionarDia}
        />
      </div>
    </div>
  );
}
