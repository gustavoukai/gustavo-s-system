import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';
import Rodape from '../components/Rodape';

const CAMPOS = [
  { chave: 'nome_escritorio', label: 'Nome' },
  { chave: 'endereco_linha1', label: 'Endereço' },
  { chave: 'endereco_linha2', label: 'Bairro / CEP' },
  { chave: 'endereco_linha3', label: 'Cidade / UF' },
  { chave: 'email', label: 'E-mail' },
  { chave: 'telefone', label: 'Telefone' },
];

const CAMPOS_EMPRESA = [
  { chave: 'razao_social', label: 'Razão Social' },
  { chave: 'cnpj', label: 'CNPJ' },
  { chave: 'ie', label: 'IE' },
];

function camposBanco(prefixo, tituloDoc) {
  return [
    { chave: `${prefixo}_titulo`, label: 'Observação' },
    { chave: `${prefixo}_titular`, label: 'Titular' },
    { chave: `${prefixo}_${tituloDoc}`, label: tituloDoc.toUpperCase() },
    { chave: `${prefixo}_banco`, label: 'Banco' },
    { chave: `${prefixo}_agencia`, label: 'Agência' },
    { chave: `${prefixo}_conta`, label: 'Conta' },
    { chave: `${prefixo}_pix`, label: 'Chave PIX' },
  ];
}

export default function DadosEscritorio() {
  const { loading, role } = useAuth();
  const [dados, setDados] = useState(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  async function loadDados() {
    const { data } = await supabase.from('dados_escritorio').select('*').eq('id', 1).single();
    setDados(data);
  }

  useEffect(() => {
    if (!loading) loadDados();
  }, [loading]);

  function abrirEdicao() {
    setForm(dados || {});
    setEditando(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setSaving(true);
    const { id, atualizado_em, ...resto } = form;
    await supabase
      .from('dados_escritorio')
      .update({ ...resto, atualizado_em: new Date().toISOString() })
      .eq('id', 1);
    setSaving(false);
    setEditando(false);
    loadDados();
  }

  function Bloco({ titulo, campos, dadosAtuais }) {
    return (
      <div className="section-card">
        <h2 style={{ marginBottom: 10 }}>{titulo}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '4px 20px', fontSize: 14 }}>
          {campos.map((c) => (
            <div key={c.chave} style={{ margin: '4px 0' }}>
              <strong>{c.label}:</strong> {dadosAtuais?.[c.chave] || '—'}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-center">
        <p className="loading-text">Carregando...</p>
      </div>
    );
  }

  const todosOsCampos = [
    ...CAMPOS,
    ...CAMPOS_EMPRESA,
    ...camposBanco('banco1', 'cpf'),
    ...camposBanco('banco2', 'cnpj'),
  ];

  return (
    <div className="wide-page">
      <div className="wide-page-inner">
        <Nav />

        <div className="toolbar">
          <h1>Dados do Escritório</h1>
          {role === 'admin' && !editando && (
            <button className="btn-secondary" onClick={abrirEdicao}>
              Editar
            </button>
          )}
        </div>

        {!editando ? (
          <>
            <Bloco titulo="Escritório" campos={CAMPOS} dadosAtuais={dados} />
            <Bloco titulo="Empresa" campos={CAMPOS_EMPRESA} dadosAtuais={dados} />
            <Bloco titulo="Dados bancários (pessoa física)" campos={camposBanco('banco1', 'cpf')} dadosAtuais={dados} />
            <Bloco titulo="Dados bancários (pessoa jurídica)" campos={camposBanco('banco2', 'cnpj')} dadosAtuais={dados} />
          </>
        ) : (
          <form className="section-card" onSubmit={salvar}>
            <div className="toolbar" style={{ marginBottom: 4 }}>
              <h2>Editar dados do escritório</h2>
              <button type="button" className="btn-secondary" onClick={() => setEditando(false)}>
                Cancelar
              </button>
            </div>
            <div className="form-grid">
              {todosOsCampos.map((c) => (
                <div key={c.chave}>
                  <label>{c.label}</label>
                  <input
                    value={form[c.chave] || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, [c.chave]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}

        <Rodape />
      </div>
    </div>
  );
}
