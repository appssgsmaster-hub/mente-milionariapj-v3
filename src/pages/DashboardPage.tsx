import { FormEvent, useMemo, useState } from 'react';
import { AccountCard } from '../components/AccountCard';
import { SectionCard } from '../components/SectionCard';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatCurrency, formatDate, todayInput } from '../utils/format';

export function DashboardPage() {
  const accounts = useFinanceStore((state) => state.accounts.filter((account) => account.enabled));
  const activities = useFinanceStore((state) => state.activities.slice(0, 8));
  const projections = useFinanceStore((state) => state.projections);
  const addIncome = useFinanceStore((state) => state.addIncome);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayInput());

  const totalBalance = useMemo(() => accounts.reduce((acc, account) => acc + account.balance, 0), [accounts]);

  const commitmentsPerAccount = useMemo(
    () =>
      projections.reduce<Record<string, number>>((acc, projection) => {
        const remaining = Math.max(0, projection.amount - projection.paidAmount);
        acc[projection.accountId] = (acc[projection.accountId] ?? 0) + remaining;
        return acc;
      }, {}),
    [projections]
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    addIncome({
      amount: parsedAmount,
      description,
      date
    });

    setAmount('');
    setDescription('');
  };

  return (
    <div className="page-grid">
      <SectionCard title="Registrar receita" subtitle="A distribuição respeita os percentuais ativos automaticamente.">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Valor da receita
            <input
              value={amount}
              type="number"
              min="0"
              step="0.01"
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </label>
          <label>
            Fonte / descrição
            <input value={description} onChange={(event) => setDescription(event.target.value)} required />
          </label>
          <label>
            Data
            <input value={date} type="date" onChange={(event) => setDate(event.target.value)} required />
          </label>
          <button type="submit">Registrar receita</button>
        </form>
      </SectionCard>

      <SectionCard title="Visão geral de contas">
        <p className="highlight">Saldo total do ecossistema: {formatCurrency(totalBalance)}</p>
        <div className="account-grid">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              projectedCommitments={commitmentsPerAccount[account.id] ?? 0}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Atividades recentes">
        <ul className="activity-list">
          {activities.map((activity) => (
            <li key={activity.id}>
              <strong>{formatDate(activity.createdAt.slice(0, 10))}</strong> — {activity.description}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
