import { useEffect, useRef, useState } from 'react';

export default function MultiSelectDropdown({ options, selected, onToggle, placeholder }) {
  const [open, setOpen] = useState(false);
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

  const resumo =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label || `1 selecionado`
      : `${selected.length} selecionados`;

  return (
    <div className="dropdown-select" ref={ref}>
      <button type="button" className="dropdown-select-trigger" onClick={() => setOpen((v) => !v)}>
        <span>{resumo}</span>
        <span className="dropdown-caret">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="dropdown-select-panel">
          {options.length === 0 ? (
            <p className="empty-hint" style={{ padding: 10 }}>
              Nenhuma opção disponível.
            </p>
          ) : (
            options.map((opt) => (
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
