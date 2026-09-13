export function IconeEditar({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"
        stroke="#297480"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        fill="#297480"
      />
    </svg>
  );
}

export function IconeApagar({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 7h16" stroke="#d9342b" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 3h4a1 1 0 0 1 1 1v2H9V4a1 1 0 0 1 1-1z" fill="#d9342b" />
      <path
        d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"
        stroke="#d9342b"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" stroke="#d9342b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Botões prontos, já com o clique parando de "vazar" pro clique da linha
// (seleção de linha) e com o cursor certo.
export function BotaoEditarIcone({ onClick, title = 'Editar' }) {
  return (
    <button
      type="button"
      className="icon-btn"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <IconeEditar />
    </button>
  );
}

export function BotaoApagarIcone({ onClick, title = 'Apagar' }) {
  return (
    <button
      type="button"
      className="icon-btn"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <IconeApagar />
    </button>
  );
}
