import { useEffect, useRef } from 'react';

// Envolve uma <table className="data-table"> com uma barra de rolagem horizontal
// no topo (sincronizada com a rolagem real da tabela, embaixo) e mantém o
// cabeçalho (thead) fixo no topo da tela enquanto rola a página pra baixo.
export default function TabelaRolavel({ children }) {
  const topoRef = useRef(null);
  const baixoRef = useRef(null);
  const espacadorRef = useRef(null);
  const sincronizando = useRef(false);

  useEffect(() => {
    function sincronizarLargura() {
      const container = baixoRef.current;
      const espacador = espacadorRef.current;
      if (!container || !espacador) return;
      const tabela = container.querySelector('table');
      espacador.style.width = tabela ? `${tabela.scrollWidth}px` : '100%';
    }

    sincronizarLargura();
    window.addEventListener('resize', sincronizarLargura);

    let observer;
    if (baixoRef.current && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(sincronizarLargura);
      observer.observe(baixoRef.current, { childList: true, subtree: true, characterData: true });
    }

    return () => {
      window.removeEventListener('resize', sincronizarLargura);
      if (observer) observer.disconnect();
    };
  }, [children]);

  function handleTopoScroll() {
    if (sincronizando.current) return;
    sincronizando.current = true;
    if (baixoRef.current && topoRef.current) {
      baixoRef.current.scrollLeft = topoRef.current.scrollLeft;
    }
    sincronizando.current = false;
  }

  function handleBaixoScroll() {
    if (sincronizando.current) return;
    sincronizando.current = true;
    if (baixoRef.current && topoRef.current) {
      topoRef.current.scrollLeft = baixoRef.current.scrollLeft;
    }
    sincronizando.current = false;
  }

  return (
    <div>
      <div ref={topoRef} className="tabela-rolagem-topo" onScroll={handleTopoScroll}>
        <div ref={espacadorRef} style={{ height: 1 }} />
      </div>
      <div ref={baixoRef} className="data-table-wrap" onScroll={handleBaixoScroll}>
        {children}
      </div>
    </div>
  );
}
