import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import { useBloqueiaVisualizante } from '../lib/acessoRestrito';
import Nav from '../components/Nav';
import Rodape from '../components/Rodape';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import { formatDataCurta, sanitizeValorComCentavos, previewValorComCentavos, parseValorComCentavos } from '../lib/masks';
import { formatParcelaLabel } from '../lib/cobrancaHelpers';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const emptyEdit = {
  data: '',
  categoria: '',
  parcela_atual: '',
  parcela_total: '',
  percentual: '',
  recebedor: '',
  valor: '',
  nf_numero: '',
  observacoes: '',
};

export default function Recebimentos() {
  const { loading, canEdit, role } = useAuth();
  useBloqueiaVisualizante(role, loading);
  const [anos, setAnos] = useState([]);
  const [anoSelecionado, setAnoSelecionado] = useState(() => new Date().getFullYear());
  const [mesesSelecionados, setMesesSelecionados] = useState(() => [new Date().getMonth() + 1]);
  const [itens, setItens] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyEdit);
  const [saving, setSaving] = useState(false);

  async function loadAnos() {
    const { data } = await supabase.from('contas_pagar_anos').select('ano').order('ano');
    setAnos((data || []).map((a) => a.ano));
  }

  async function loadRecebimentos() {
    if (!anoSelecionado || mesesSelecionados.length === 0) {
      setItens([]);
      return;
    }
    const { data } = await supabase
      .from('recebimentos')
      .select('*, projetos(numero_projeto, nome), fornecedores(nome)')
      .eq('ano', anoSelecionado)
      .in('mes', mesesSelecionados);
    setItens(data || []);
  }

  useEffect(() => {
    if (!loading) loadAnos();
  }, [loading]);

  useEffect(() => {
    loadRecebimentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anoSelecionado, mesesSelecionados]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function openEdit(item) {
    setForm({
      data: item.data || '',
      categoria: item.categoria || '',
      parcela_atual: item.parcela_atual || '',
      parcela_total: item.parcela_total || '',
      percentual: item.percentual != null ? String(item.percentual) : '',
      recebedor: item.recebedor || '',
      valor: item.valor != null ? String(item.valor).replace('.', ',') : '',
      nf_numero: item.nf_numero || '',
      observacoes: item.observacoes || '',
    });
    setEditingId(item.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyEdit);
  }

  async function salvarEdicao(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      data: form.data || null,
      categoria: form.categoria || null,
      parcela_atual: form.parcela_atual ? parseInt(form.parcela_atual, 10) : null,
      parcela_total: form.parcela_total ? parseInt(form.parcela_total, 10) : null,
      percentual: form.percentual ? parseFloat(form.percentual.replace(',', '.')) : null,
      recebedor: form.recebedor || null,
      valor: form.valor ? parseValorComCentavos(form.valor) : null,
      nf_numero: form.nf_numero || null,
      observacoes: form.observacoes || null,
      atualizado_em: new Date().toISOString(),
    };

    await supabase.from('recebimentos').update(payload).eq('id', editingId);

    setSaving(false);
    cancelEdit();
    loadRecebimentos();
  }

  function formatMoney(value) {
    if (value == null) return '—';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Agrupa por mês e ordena do mais recente para o mais antigo
  function parseDataCurtaOrdenar(str) {
    if (!str) return 0;
    const partes = str.split('/');
    if (partes.length !== 3) return 0;
    const [d, m, a] = partes;
    const ano = Number(a) < 100 ? 2000 + Number(a) : Number(a);
    return new Date(ano, Number(m) - 1, Number(d)).getTime();
  }

  const mesesComItens = [...new Set(itens.map((i) => i.mes))].sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="page-center">
        <p className="loading-text">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="wide-page">
      <div className="wide-page-inner">
        <Nav />

        <h1 style={{ marginBottom: 18 }}>Recebimentos</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 18 }}>
          Esta lista é gerada automaticamente: toda cobrança marcada como "PAGO", com Valor e Data
          preenchidos, aparece aqui sozinha.
        </p>

        <div className="filters-bar" style={{ alignItems: 'flex-end' }}>
          <div>
            <label>Ano</label>
            <select
              value={anoSelecionado}
              onChange={(e) => {
                setAnoSelecionado(e.target.value);
                setMesesSelecionados([]);
              }}
            >
              <option value="">Selecione...</option>
              {anos.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          </div>
          {anoSelecionado && (
            <div style={{ minWidth: 260 }}>
              <label>Meses</label>
              <MultiSelectDropdown
                options={MESES.map((mes, index) => ({ value: index + 1, label: mes }))}
                selected={mesesSelecionados}
                onToggle={(mes) =>
                  setMesesSelecionados((prev) =>
                    prev.includes(mes) ? prev.filter((m) => m !== mes) : [...prev, mes]
                  )
                }
                placeholder="Selecione os meses..."
              />
            </div>
          )}
        </div>

        {anoSelecionado && mesesSelecionados.length > 0 && (
          <>
            {mesesComItens.length === 0 ? (
              <p className="empty-hint">Nenhum recebimento nesse período.</p>
            ) : (
              mesesComItens.map((mes) => {
                const itensDoMes = itens
                  .filter((i) => i.mes === mes)
                  .sort((a, b) => parseDataCurtaOrdenar(b.data) - parseDataCurtaOrdenar(a.data));
                const totalMes = itensDoMes.reduce((soma, i) => soma + (Number(i.valor) || 0), 0);

                return (
                  <div key={mes} style={{ marginBottom: 28 }}>
                    <h2 style={{ marginBottom: 10 }}>
                      {MESES[mes - 1]}/{String(anoSelecionado).slice(-2)}
                    </h2>

                    <div className="data-table-wrap" style={{ marginBottom: 8 }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Projeto</th>
                            <th>Fornecedor/Cliente</th>
                            <th>Categoria</th>
                            <th>Parcela</th>
                            <th>%</th>
                            <th>Recebedor</th>
                            <th>Valor</th>
                            <th>Nº NF</th>
                            <th>Observações</th>
                            {canEdit && <th></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {itensDoMes.map((item) => (
                            <tr key={item.id}>
                              <td>{item.data || '—'}</td>
                              <td>
                                {item.projetos
                                  ? `${item.projetos.numero_projeto} - ${item.projetos.nome}`
                                  : '—'}
                              </td>
                              <td>
                                {item.fornecedor_tipo === 'cliente' ? 'Cliente' : item.fornecedores?.nome || '—'}
                              </td>
                              <td>{item.categoria || '—'}</td>
                              <td>{item.parcela_total ? formatParcelaLabel(item.parcela_atual, item.parcela_total) : '-'}</td>
                              <td>{item.percentual != null ? `${item.percentual}%` : '100%'}</td>
                              <td>{item.recebedor || '—'}</td>
                              <td>{formatMoney(item.valor)}</td>
                              <td>{item.nf_numero || '—'}</td>
                              <td>{item.observacoes || '—'}</td>
                              {canEdit && (
                                <td>
                                  <button className="btn-editar" onClick={() => openEdit(item)}>
                                    EDITAR
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ textAlign: 'right', fontWeight: 700 }}>
                      Total do mês: {formatMoney(totalMes)}
                    </p>
                  </div>
                );
              })
            )}
          </>
        )}

        {editingId && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              padding: 20,
            }}
          >
            <form
              className="section-card"
              onSubmit={salvarEdicao}
              style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div className="toolbar" style={{ marginBottom: 4 }}>
                <h2>Editar recebimento</h2>
                <button type="button" className="btn-secondary" onClick={cancelEdit}>
                  Cancelar
                </button>
              </div>

              <div className="form-grid">
                <div>
                  <label>Data</label>
                  <input
                    value={form.data}
                    onChange={(e) => updateField('data', formatDataCurta(e.target.value))}
                    placeholder="DD/MM/AA"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label>Categoria</label>
                  <input value={form.categoria} onChange={(e) => updateField('categoria', e.target.value)} />
                </div>
                <div>
                  <label>Parcela atual</label>
                  <input
                    value={form.parcela_atual}
                    onChange={(e) => updateField('parcela_atual', e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label>Parcela total</label>
                  <input
                    value={form.parcela_total}
                    onChange={(e) => updateField('parcela_total', e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label>%</label>
                  <input value={form.percentual} onChange={(e) => updateField('percentual', e.target.value)} />
                </div>
                <div>
                  <label>Recebedor</label>
                  <input value={form.recebedor} onChange={(e) => updateField('recebedor', e.target.value)} />
                </div>
                <div>
                  <label>Valor</label>
                  <input
                    value={form.valor}
                    onChange={(e) => updateField('valor', sanitizeValorComCentavos(e.target.value))}
                    placeholder="1500 ou 1500,50"
                    inputMode="decimal"
                  />
                  {form.valor && (
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: -12, marginBottom: 18 }}>
                      = {previewValorComCentavos(form.valor)}
                    </p>
                  )}
                </div>
                <div>
                  <label>Nº NF</label>
                  <input value={form.nf_numero} onChange={(e) => updateField('nf_numero', e.target.value)} />
                </div>
              </div>

              <div className="form-grid">
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Observações</label>
                  <input value={form.observacoes} onChange={(e) => updateField('observacoes', e.target.value)} />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        )}

        <Rodape />
      </div>
    </div>
  );
}
