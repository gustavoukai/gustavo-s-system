import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';
import Rodape from '../components/Rodape';

export default function ChecklistFinanceiro() {
  const { loading } = useAuth();

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
        <h1 style={{ marginBottom: 18 }}>Checklist Financeiro</h1>
        <div className="section-card">
          <p>Esta seção ainda vai ser detalhada. Assim que as regras forem definidas, ela é construída aqui.</p>
        </div>
        <Rodape />
      </div>
    </div>
  );
}
