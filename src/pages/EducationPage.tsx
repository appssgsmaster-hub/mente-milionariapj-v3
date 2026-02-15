import { SectionCard } from '../components/SectionCard';

export function EducationPage() {
  return (
    <div className="page-grid">
      <SectionCard title="Educação financeira" subtitle="Práticas essenciais para gestão PJ.">
        <ul className="activity-list">
          <li>Fechamento semanal: confira receitas, despesas e diferenças entre saldo real e projetado.</li>
          <li>Regra de proteção: mantenha ao menos 10% da receita acumulada em Reservas / Stability.</li>
          <li>Antes de assumir um compromisso novo, valide impacto mensal e fonte de pagamento.</li>
          <li>Use o módulo de Projeções para planejar tributos, contratos fixos e parcelamentos longos.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
