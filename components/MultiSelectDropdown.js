import { useEffect, useRef, useState } from 'react';

export default function MultiSelectDropdown({ options, selected, onToggle, placeholder, searchable }) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) setBusca('');
  }, [open]);

  const resumo =
    selected.length === 0
      ? placeholder
      : options
          .filter((o) => selected.includes(o.value))
          .map((o) => o.label)
          .join(', ');

  const opcoesFiltradas = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(busca.toLowerCase()))
    : options;

  return (
    <div className="dropdown-select" ref={ref}>
      <button type="button" className="dropdown-select-trigger" onClick={() => setOpen((v) => !v)}>
        <span>{resumo}</span>
        <span className="dropdown-caret">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="dropdown-select-panel">
          {searchable && (
            <input
              type="text"
              className="dropdown-select-search"
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              autoFocus
            />
          )}
          {opcoesFiltradas.length === 0 ? (
            <p className="empty-hint" style={{ padding: 10 }}>
              Nenhuma opção encontrada.
            </p>
          ) : (
            opcoesFiltradas.map((opt) => (
              <label key={opt.value} className="dropdown-select-option">
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => onToggle(opt.value)}
                />
                {opt.label}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
