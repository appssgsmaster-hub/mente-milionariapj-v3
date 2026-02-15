import { FormEvent, useMemo, useState } from 'react';
import { SectionCard } from '../components/SectionCard';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatCurrency, formatDate, todayInput } from '../utils/format';

export function PaymentsPage() {
  const accounts = useFinanceStore((state) => state.accounts.filter((account) => account.enabled));
  const projections = useFinanceStore((state) => state.projections);
  const payments = useFinanceStore((state) => state.payments);
  const addPayment = useFinanceStore((state) => state.addPayment);
  const deletePayment = useFinanceStore((state) => state.deletePayment);

  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayInput());
  const [projectionId, setProjectionId] = useState('');

  const openProjections = useMemo(
    () => projections.filter((projection) => projection.accountId === accountId && projection.paidAmount < projection.amount),
    [accountId, projections]
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !accountId) {
      return;
    }

    addPayment({
      accountId,
      amount: parsedAmount,
      description,
      date,
      projectionId: projectionId || undefined
    });

    setAmount('');
    setDescription('');
    setProjectionId('');
  };

  return (
    <div className="page-grid">
      <SectionCard title="Registrar pagamento" subtitle="Pagamentos reduzem saldo e podem dar baixa em compromissos.">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Conta
            <select
              value={accountId}
              onChange={(event) => {
                setAccountId(event.target.value);
                setProjectionId('');
              }}
              required
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Valor
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </label>
          <label>
            Descrição
            <input value={description} onChange={(event) => setDescription(event.target.value)} required />
          </label>
          <label>
            Data
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>
          <label>
            Compromisso vinculado (opcional)
            <select value={projectionId} onChange={(event) => setProjectionId(event.target.value)}>
              <option value="">Nenhum</option>
              {openProjections.map((projection) => (
                <option key={projection.id} value={projection.id}>
                  {projection.description} — restante {formatCurrency(projection.amount - projection.paidAmount)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Registrar despesa</button>
        </form>
      </SectionCard>

      <SectionCard title="Histórico completo de pagamentos">
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Conta</th>
              <th>Descrição</th>
              <th>Compromisso</th>
              <th>Valor</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const account = accounts.find((item) => item.id === payment.accountId);
              const linkedProjection = projections.find((projection) => projection.id === payment.projectionId);

              return (
                <tr key={payment.id}>
                  <td>{formatDate(payment.date)}</td>
                  <td>{account?.name ?? payment.accountId}</td>
                  <td>{payment.description}</td>
                  <td>{linkedProjection?.description ?? 'Sem vínculo'}</td>
                  <td className="expense-value">-{formatCurrency(payment.amount)}</td>
                  <td>
                    <button type="button" onClick={() => deletePayment(payment.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}
