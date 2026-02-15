import { FormEvent, useMemo, useState } from 'react';
import { SectionCard } from '../components/SectionCard';
import { useFinanceStore } from '../store/useFinanceStore';

export function SettingsPage() {
  const accounts = useFinanceStore((state) => state.accounts);
  const updateAccount = useFinanceStore((state) => state.updateAccount);
  const toggleProfitAccount = useFinanceStore((state) => state.toggleProfitAccount);
  const resetBalances = useFinanceStore((state) => state.resetBalances);
  const resetProjections = useFinanceStore((state) => state.resetProjections);
  const resetSystem = useFinanceStore((state) => state.resetSystem);

  const [message, setMessage] = useState('');

  const activeAccounts = useMemo(() => accounts.filter((account) => account.enabled), [accounts]);
  const percentageSum = activeAccounts.reduce((acc, account) => acc + account.percentage, 0);
  const profitEnabled = accounts.find((account) => account.id === 'profit')?.enabled ?? false;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (percentageSum !== 100) {
      setMessage('Erro: a soma dos percentuais das contas ativas deve ser exatamente 100%.');
      return;
    }

    setMessage('Configurações aplicadas com sucesso.');
  };

  return (
    <div className="page-grid">
      <SectionCard title="Contas e percentuais" subtitle="Renomeie contas e ajuste a distribuição da receita.">
        <form className="form-grid" onSubmit={handleSubmit}>
          {accounts.map((account) => (
            <div key={account.id} className="row setting-row">
              <label>
                Nome da conta
                <input
                  value={account.name}
                  onChange={(event) => updateAccount(account.id, { name: event.target.value })}
                  disabled={account.id === 'profit' && !profitEnabled}
                />
              </label>
              <label>
                Percentual (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={account.percentage}
                  onChange={(event) => updateAccount(account.id, { percentage: Number(event.target.value) })}
                  disabled={!account.enabled}
                />
              </label>
            </div>
          ))}

          <label className="row checkbox-row">
            <input type="checkbox" checked={profitEnabled} onChange={(event) => toggleProfitAccount(event.target.checked)} />
            Ativar conta Profit
          </label>

          <p className={percentageSum === 100 ? 'status-ok' : 'status-warning'}>Soma atual das contas ativas: {percentageSum}%</p>
          {message && <p>{message}</p>}
          <button type="submit">Validar configuração</button>
        </form>
      </SectionCard>

      <SectionCard title="Reset e manutenção" subtitle="Controle reset total ou por módulo.">
        <div className="row">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Resetar saldos, receitas e pagamentos?')) {
                resetBalances();
              }
            }}
          >
            Resetar saldos
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Resetar todas as projeções e vínculos?')) {
                resetProjections();
              }
            }}
          >
            Resetar projeções
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Resetar todo o sistema?')) {
                resetSystem();
              }
            }}
          >
            Reset total
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
