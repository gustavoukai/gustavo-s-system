import { useState } from 'react';

// Campo de texto com lista de sugestões "memorizadas".
// Para esquecer uma sugestão: com a lista aberta, passe o mouse sobre ela
// (sem clicar) e aperte a tecla Delete.
export default function CampoComMemoria({ value, onChange, sugestoes = [], onExcluir, placeholder }) {
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);

  const termo = (value || '').trim().toLowerCase();
  const filtradas = sugestoes.filter((s) => s.toLowerCase().includes(termo)).slice(0, 60);

  function escolher(valor) {
    onChange(valor);
    setAberto(false);
    setAtivo(-1);
  }

  function aoTeclar(e) {
    if (e.key === 'Delete' && aberto && ativo >= 0 && filtradas[ativo]) {
      e.preventDefault();
      if (onExcluir) onExcluir(filtradas[ativo]);
      setAtivo(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAberto(true);
      setAtivo((i) => Math.min(i + 1, filtradas.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAtivo((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && aberto && ativo >= 0 && filtradas[ativo]) {
      e.preventDefault();
      escolher(filtradas[ativo]);
    } else if (e.key === 'Escape') {
      setAberto(false);
      setAtivo(-1);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setAberto(true);
          setAtivo(-1);
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => {
          setAberto(false);
          setAtivo(-1);
        }}
        onKeyDown={aoTeclar}
      />

      {aberto && filtradas.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% - 16px)',
            left: 0,
            right: 0,
            zIndex: 30,
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: 6,
            boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {filtradas.map((s, i) => (
            <div
              key={s}
              onMouseDown={(e) => {
                e.preventDefault();
                escolher(s);
              }}
              onMouseEnter={() => setAtivo(i)}
              onMouseLeave={() => setAtivo(-1)}
              style={{
                padding: '8px 12px',
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
                background: ativo === i ? '#eef2f0' : 'transparent',
              }}
            >
              <span>{s}</span>
              {ativo === i && onExcluir && (
                <span style={{ fontSize: 11, color: 'var(--danger)', whiteSpace: 'nowrap' }}>Delete = esquecer</span>
              )}
            </div>
          ))}
          <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
            Passe o mouse sobre uma opção e aperte Delete para apagá-la da memória.
          </div>
        </div>
      )}
    </div>
  );
}
