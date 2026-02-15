import { Account } from '../types/finance';
import { formatCurrency } from '../utils/format';

interface AccountCardProps {
  account: Account;
  projectedCommitments: number;
}

export function AccountCard({ account, projectedCommitments }: AccountCardProps) {
  const projectedBalance = account.balance - projectedCommitments;

  return (
    <article className="account-card" style={{ borderColor: account.color }}>
      <h4>
        <span className="dot" style={{ background: account.color }} />
        {account.name}
      </h4>
      <p className="meta">Percentual: {account.percentage}%</p>
      <p className="value">Saldo atual: {formatCurrency(account.balance)}</p>
      <p className="meta">Saldo projetado: {formatCurrency(projectedBalance)}</p>
    </article>
  );
}
