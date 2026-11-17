import { useState } from 'react';

// Menu expansível com busca: mostra só o botão fechado e, ao clicar, abre a lista.
// Clicar numa opção chama onSelecionar(valor) e fecha o menu.
export default function MenuExpansivel({ opcoes = [], onSelecionar, placeholder = 'Selecione...', textoBusca = 'Buscar...' }) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [ativo, setAtivo] = useState(-1);

  const termo = busca.trim().toLowerCase();
  const filtradas = opcoes.filter((o) => o.label.toLowerCase().includes(termo));

  function fechar() {
    setAberto(false);
    setBusca('');
    setAtivo(-1);
  }

  function escolher(valor) {
    fechar();
    onSelecionar(valor);
  }

  return (
    <div style={{ position: 'relative', maxWidth: 460, marginBottom: 24 }}>
      <button
        type="button"
        className="btn-secondary"
        style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', padding: '12px 14px' }}
        onClick={() => (aberto ? fechar() : setAberto(true))}
      >
        <span>{placeholder}</span>
        <span>{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <>
          <div onClick={fechar} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 20,
              marginTop: 4,
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: 6,
              boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
              maxHeight: 340,
              overflowY: 'auto',
            }}
          >
            <input
              autoFocus
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setAtivo(-1);
              }}
              placeholder={textoBusca}
              style={{ width: 'calc(100% - 20px)', margin: '10px 10px 6px 10px', marginBottom: 6 }}
            />
            {filtradas.length === 0 ? (
              <p className="empty-hint" style={{ padding: 12 }}>
                Nada encontrado.
              </p>
            ) : (
              filtradas.map((o, i) => (
                <div
                  key={o.value}
                  onClick={() => escolher(o.value)}
                  onMouseEnter={() => setAtivo(i)}
                  onMouseLeave={() => setAtivo(-1)}
                  style={{
                    padding: '9px 14px',
                    fontSize: 14,
                    cursor: 'pointer',
                    background: ativo === i ? '#eef2f0' : 'transparent',
                  }}
                >
                  {o.label}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
