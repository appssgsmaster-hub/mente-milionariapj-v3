import { FormEvent, useMemo, useState } from 'react';
import { SectionCard } from '../components/SectionCard';
import { useFinanceStore } from '../store/useFinanceStore';
import { MonthKey, ProjectionCategory } from '../types/finance';
import { MONTHS, PROJECTION_CATEGORIES } from '../utils/constants';
import { formatCurrency, formatDate, todayInput } from '../utils/format';

export function ProjectionsPage() {
  const accounts = useFinanceStore((state) => state.accounts.filter((account) => account.enabled));
  const projections = useFinanceStore((state) => state.projections);
  const addProjection = useFinanceStore((state) => state.addProjection);
  const editProjection = useFinanceStore((state) => state.editProjection);
  const deleteProjection = useFinanceStore((state) => state.deleteProjection);

  const [selectedMonth, setSelectedMonth] = useState<MonthKey>('Jan');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: todayInput(),
    category: PROJECTION_CATEGORIES[0] as ProjectionCategory,
    kind: 'fixed' as 'fixed' | 'installment',
    accountId: accounts[0]?.id ?? '',
    month: 'Jan' as MonthKey,
    recurrenceCount: '1'
  });

  const monthIndex = MONTHS.indexOf(selectedMonth);

  const monthlyProjections = useMemo(
    () => projections.filter((projection) => projection.month === selectedMonth),
    [projections, selectedMonth]
  );

  const monthlyCommitted = monthlyProjections.reduce(
    (sum, projection) => sum + Math.max(0, projection.amount - projection.paidAmount),
    0
  );

  const projectedBalances = accounts.map((account) => {
    const commitment = monthlyProjections
      .filter((projection) => projection.accountId === account.id)
      .reduce((sum, projection) => sum + Math.max(0, projection.amount - projection.paidAmount), 0);
    return {
      ...account,
      commitment,
      projectedBalance: account.balance - commitment
    };
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount);
    const recurrenceCount = Number(form.recurrenceCount);
    if (!Number.isFinite(amount) || amount <= 0 || !form.accountId) {
      return;
    }

    if (editingId) {
      editProjection(editingId, {
        description: form.description,
        amount,
        date: form.date,
        category: form.category,
        kind: form.kind,
        accountId: form.accountId,
        month: form.month
      });
      setEditingId(null);
    } else {
      addProjection({
        description: form.description,
        amount,
        date: form.date,
        category: form.category,
        kind: form.kind,
        accountId: form.accountId,
        month: form.month,
        recurrenceCount: Number.isFinite(recurrenceCount) ? recurrenceCount : 1
      });
    }

    setForm((prev) => ({
      ...prev,
      description: '',
      amount: '',
      recurrenceCount: '1',
      month: selectedMonth,
      accountId: accounts[0]?.id ?? ''
    }));
  };

  const handleEdit = (projectionId: string) => {
    const projection = projections.find((item) => item.id === projectionId);
    if (!projection) {
      return;
    }

    setEditingId(projection.id);
    setForm({
      description: projection.description,
      amount: String(projection.amount),
      date: projection.date,
      category: projection.category,
      kind: projection.kind,
      accountId: projection.accountId,
      month: projection.month,
      recurrenceCount: String(projection.installmentTotal)
    });
  };

  return (
    <div className="page-grid">
      <SectionCard title="Projeções" subtitle="Compromissos futuros por mês, conta e categoria.">
        <div className="month-nav">
          <button type="button" onClick={() => setSelectedMonth(MONTHS[(monthIndex + 11) % 12])}>
            ◀
          </button>
          <h4>{selectedMonth}</h4>
          <button type="button" onClick={() => setSelectedMonth(MONTHS[(monthIndex + 1) % 12])}>
            ▶
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Descrição do compromisso
            <input
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              required
            />
          </label>
          <label>
            Valor total
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
              required
            />
          </label>
          <label>
            Data
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              required
            />
          </label>
          <label>
            Categoria
            <select
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value as ProjectionCategory }))}
            >
              {PROJECTION_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo
            <select
              value={form.kind}
              onChange={(event) => setForm((prev) => ({ ...prev, kind: event.target.value as 'fixed' | 'installment' }))}
            >
              <option value="fixed">Fixo</option>
              <option value="installment">Parcelado</option>
            </select>
          </label>
          <label>
            Conta vinculada
            <select
              value={form.accountId}
              onChange={(event) => setForm((prev) => ({ ...prev, accountId: event.target.value }))}
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
            Mês inicial
            <select
              value={form.month}
              onChange={(event) => setForm((prev) => ({ ...prev, month: event.target.value as MonthKey }))}
            >
              {MONTHS.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </label>
          <label>
            {form.kind === 'installment' ? 'Quantidade de parcelas' : 'Recorrência em meses'}
            <input
              type="number"
              min="1"
              max="24"
              value={form.recurrenceCount}
              onChange={(event) => setForm((prev) => ({ ...prev, recurrenceCount: event.target.value }))}
              required
            />
          </label>
          <button type="submit">{editingId ? 'Salvar edição' : 'Criar compromisso'}</button>
        </form>
      </SectionCard>

      <SectionCard title={`Resumo de ${selectedMonth}`}>
        <p className="highlight">Total comprometido no mês: {formatCurrency(monthlyCommitted)}</p>
        <div className="account-grid">
          {projectedBalances.map((account) => (
            <article key={account.id} className="account-card" style={{ borderColor: account.color }}>
              <h4>
                <span className="dot" style={{ background: account.color }} />
                {account.name}
              </h4>
              <p>Compromissos: {formatCurrency(account.commitment)}</p>
              <p>Saldo projetado: {formatCurrency(account.projectedBalance)}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Compromissos do mês selecionado">
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Tipo</th>
              <th>Conta</th>
              <th>Valor</th>
              <th>Pago</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {monthlyProjections.map((projection) => {
              const account = accounts.find((item) => item.id === projection.accountId);
              const status = projection.paidAmount >= projection.amount ? 'Pago' : 'Aberto';

              return (
                <tr key={projection.id}>
                  <td>{formatDate(projection.date)}</td>
                  <td>{projection.description}</td>
                  <td>{projection.category}</td>
                  <td>{projection.kind === 'installment' ? `${projection.installmentIndex}/${projection.installmentTotal}` : 'Fixo'}</td>
                  <td>{account?.name ?? projection.accountId}</td>
                  <td>{formatCurrency(projection.amount)}</td>
                  <td>{formatCurrency(projection.paidAmount)}</td>
                  <td>
                    <span className={status === 'Pago' ? 'badge-success' : 'badge-warning'}>{status}</span>
                  </td>
                  <td>
                    <button type="button" onClick={() => handleEdit(projection.id)}>
                      Editar
                    </button>
                    <button type="button" onClick={() => deleteProjection(projection.id)}>
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
