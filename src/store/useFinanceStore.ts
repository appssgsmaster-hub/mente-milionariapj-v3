import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_ACCOUNTS, MONTHS, STORAGE_KEY } from '../utils/constants';
import { makeId } from '../utils/id';
import {
  Account,
  Activity,
  DeletedItem,
  FinanceState,
  Income,
  MentorMessage,
  Payment,
  Projection,
  ProjectionCategory
} from '../types/finance';

interface AddIncomePayload {
  amount: number;
  description: string;
  date: string;
}

interface AddPaymentPayload {
  accountId: string;
  amount: number;
  description: string;
  date: string;
  projectionId?: string;
}

interface AddProjectionPayload {
  description: string;
  amount: number;
  date: string;
  category: ProjectionCategory;
  kind: 'fixed' | 'installment';
  accountId: string;
  month: Projection['month'];
  recurrenceCount: number;
}

interface EditProjectionPayload {
  description: string;
  amount: number;
  date: string;
  category: ProjectionCategory;
  kind: 'fixed' | 'installment';
  accountId: string;
  month: Projection['month'];
}

interface FinanceActions {
  addIncome: (payload: AddIncomePayload) => void;
  addPayment: (payload: AddPaymentPayload) => void;
  addProjection: (payload: AddProjectionPayload) => void;
  editProjection: (id: string, payload: EditProjectionPayload) => void;
  deleteIncome: (id: string) => void;
  deletePayment: (id: string) => void;
  deleteProjection: (id: string) => void;
  undoDelete: (deletedId: string) => void;
  updateAccount: (accountId: string, updates: Partial<Pick<Account, 'name' | 'percentage'>>) => void;
  toggleProfitAccount: (enabled: boolean) => void;
  resetBalances: () => void;
  resetProjections: () => void;
  resetSystem: () => void;
}

type FinanceStore = FinanceState & FinanceActions;

const createMentorMessage = (text: string, type: MentorMessage['type']): MentorMessage => ({
  id: makeId('mentor'),
  text,
  type,
  createdAt: new Date().toISOString()
});

const pushMentorMessage = (messages: MentorMessage[], text: string, type: MentorMessage['type']): MentorMessage[] => {
  if (messages[0]?.text === text) {
    return messages;
  }

  return [createMentorMessage(text, type), ...messages].slice(0, 40);
};

const pushActivity = (activities: Activity[], type: Activity['type'], description: string): Activity[] => {
  const next: Activity = {
    id: makeId('activity'),
    type,
    description,
    createdAt: new Date().toISOString()
  };

  return [next, ...activities].slice(0, 80);
};

const zeroAccounts = (): Account[] => DEFAULT_ACCOUNTS.map((account) => ({ ...account, balance: 0 }));

const baseState: FinanceState = {
  accounts: zeroAccounts(),
  incomes: [],
  payments: [],
  projections: [],
  mentorMessages: [createMentorMessage('Bem-vindo! Registre receitas e monitore compromissos futuros com disciplina.', 'info')],
  activities: [],
  deletedItems: []
};

const monthAtOffset = (start: Projection['month'], offset: number): Projection['month'] => {
  const index = MONTHS.indexOf(start);
  return MONTHS[(index + offset) % MONTHS.length];
};

const enrichMentorRules = (state: FinanceState): FinanceState => {
  const totalIncome = state.incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalBalance = state.accounts.reduce((sum, account) => sum + account.balance, 0);
  const outstandingCommitments = state.projections.reduce(
    (sum, projection) => sum + Math.max(0, projection.amount - projection.paidAmount),
    0
  );

  let mentorMessages = state.mentorMessages;

  state.accounts
    .filter((account) => account.balance < 0)
    .forEach((account) => {
      mentorMessages = pushMentorMessage(
        mentorMessages,
        `A conta ${account.name} entrou em saldo negativo. Replaneje pagamentos imediatamente.`,
        'warning'
      );
    });

  const reserves = state.accounts.find((account) => account.id === 'reserves');
  if (reserves && totalIncome > 0 && reserves.balance < totalIncome * 0.1) {
    mentorMessages = pushMentorMessage(
      mentorMessages,
      'Reserva abaixo de 10% da receita acumulada. Direcione próximos aportes para estabilidade.',
      'warning'
    );
  }

  if (totalIncome > 0 && outstandingCommitments > totalIncome) {
    mentorMessages = pushMentorMessage(
      mentorMessages,
      'Compromissos totais superam a receita acumulada. Revise prazos e prioridades.',
      'warning'
    );
  }

  if (totalBalance > 0 && outstandingCommitments > totalBalance * 0.7) {
    mentorMessages = pushMentorMessage(
      mentorMessages,
      'Compromissos em nível crítico: acima de 70% do saldo atual do ecossistema.',
      'warning'
    );
  }

  return { ...state, mentorMessages };
};

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set) => ({
      ...baseState,
      addIncome: ({ amount, description, date }) =>
        set((state) => {
          const activeAccounts = state.accounts.filter((account) => account.enabled);
          const distributions = activeAccounts.reduce<Record<string, number>>((acc, account) => {
            acc[account.id] = (amount * account.percentage) / 100;
            return acc;
          }, {});

          const accounts = state.accounts.map((account) => ({
            ...account,
            balance: account.balance + (distributions[account.id] ?? 0)
          }));

          const income: Income = {
            id: makeId('income'),
            amount,
            description,
            date,
            distributions,
            createdAt: new Date().toISOString()
          };

          let nextState: FinanceState = {
            ...state,
            accounts,
            incomes: [income, ...state.incomes],
            activities: pushActivity(state.activities, 'income', `Receita registrada: ${description} (${amount.toFixed(2)})`)
          };

          nextState.mentorMessages = pushMentorMessage(
            nextState.mentorMessages,
            `Receita de ${amount.toFixed(2)} recebida e distribuída com sucesso.`,
            'success'
          );

          return enrichMentorRules(nextState);
        }),
      addPayment: ({ accountId, amount, description, date, projectionId }) =>
        set((state) => {
          const projection = state.projections.find((item) => item.id === projectionId);
          const remainingProjection = projection ? Math.max(0, projection.amount - projection.paidAmount) : undefined;
          const appliedAmount = remainingProjection !== undefined ? Math.min(amount, remainingProjection) : amount;

          const accounts = state.accounts.map((account) =>
            account.id === accountId ? { ...account, balance: account.balance - amount } : account
          );

          const payment: Payment = {
            id: makeId('payment'),
            accountId,
            amount,
            description,
            date,
            projectionId,
            createdAt: new Date().toISOString()
          };

          const projections = state.projections.map((item) =>
            item.id === projectionId
              ? { ...item, paidAmount: Math.min(item.amount, item.paidAmount + appliedAmount) }
              : item
          );

          let nextState: FinanceState = {
            ...state,
            accounts,
            payments: [payment, ...state.payments],
            projections,
            activities: pushActivity(state.activities, 'payment', `Pagamento registrado: ${description} (${amount.toFixed(2)})`)
          };

          if (amount >= 5000) {
            nextState.mentorMessages = pushMentorMessage(
              nextState.mentorMessages,
              'Despesa alta detectada. Garanta cobertura de caixa dos próximos compromissos.',
              'warning'
            );
          }

          return enrichMentorRules(nextState);
        }),
      addProjection: (payload) =>
        set((state) => {
          const count = Math.max(1, payload.recurrenceCount);
          const groupId = makeId('projection-group');
          const installmentValue = payload.kind === 'installment' ? Number((payload.amount / count).toFixed(2)) : payload.amount;

          const generated: Projection[] = Array.from({ length: count }, (_, index) => ({
            id: makeId('projection'),
            description:
              payload.kind === 'installment'
                ? `${payload.description} (${index + 1}/${count})`
                : payload.description,
            amount: installmentValue,
            date: payload.date,
            category: payload.category,
            kind: payload.kind,
            accountId: payload.accountId,
            month: monthAtOffset(payload.month, index),
            paidAmount: 0,
            groupId,
            installmentIndex: index + 1,
            installmentTotal: count,
            createdAt: new Date().toISOString()
          }));

          const nextState: FinanceState = {
            ...state,
            projections: [...generated, ...state.projections],
            activities: pushActivity(
              state.activities,
              'projection',
              `Compromisso criado: ${payload.description} (${count} ${payload.kind === 'installment' ? 'parcelas' : 'meses'})`
            )
          };

          return enrichMentorRules(nextState);
        }),
      editProjection: (id, payload) =>
        set((state) => ({
          ...state,
          projections: state.projections.map((projection) =>
            projection.id === id
              ? {
                  ...projection,
                  ...payload,
                  paidAmount: Math.min(projection.paidAmount, payload.amount)
                }
              : projection
          ),
          activities: pushActivity(state.activities, 'projection', `Compromisso atualizado: ${payload.description}`)
        })),
      deleteIncome: (id) =>
        set((state) => {
          const income = state.incomes.find((item) => item.id === id);
          if (!income) {
            return state;
          }

          const accounts = state.accounts.map((account) => ({
            ...account,
            balance: account.balance - (income.distributions[account.id] ?? 0)
          }));

          const deleted: DeletedItem = {
            id: makeId('deleted'),
            entityType: 'income',
            data: income,
            deletedAt: new Date().toISOString()
          };

          return {
            ...state,
            accounts,
            incomes: state.incomes.filter((item) => item.id !== id),
            deletedItems: [deleted, ...state.deletedItems],
            activities: pushActivity(state.activities, 'income', `Receita removida: ${income.description}`)
          };
        }),
      deletePayment: (id) =>
        set((state) => {
          const payment = state.payments.find((item) => item.id === id);
          if (!payment) {
            return state;
          }

          const accounts = state.accounts.map((account) =>
            account.id === payment.accountId ? { ...account, balance: account.balance + payment.amount } : account
          );

          const projections = state.projections.map((projection) =>
            projection.id === payment.projectionId
              ? { ...projection, paidAmount: Math.max(0, projection.paidAmount - payment.amount) }
              : projection
          );

          const deleted: DeletedItem = {
            id: makeId('deleted'),
            entityType: 'payment',
            data: payment,
            deletedAt: new Date().toISOString()
          };

          return {
            ...state,
            accounts,
            projections,
            payments: state.payments.filter((item) => item.id !== id),
            deletedItems: [deleted, ...state.deletedItems],
            activities: pushActivity(state.activities, 'payment', `Pagamento removido: ${payment.description}`)
          };
        }),
      deleteProjection: (id) =>
        set((state) => {
          const projection = state.projections.find((item) => item.id === id);
          if (!projection) {
            return state;
          }

          const deleted: DeletedItem = {
            id: makeId('deleted'),
            entityType: 'projection',
            data: projection,
            deletedAt: new Date().toISOString()
          };

          return {
            ...state,
            projections: state.projections.filter((item) => item.id !== id),
            deletedItems: [deleted, ...state.deletedItems],
            activities: pushActivity(state.activities, 'projection', `Compromisso removido: ${projection.description}`)
          };
        }),
      undoDelete: (deletedId) =>
        set((state) => {
          const entry = state.deletedItems.find((item) => item.id === deletedId);
          if (!entry) {
            return state;
          }

          let nextState: FinanceState = {
            ...state,
            deletedItems: state.deletedItems.filter((item) => item.id !== deletedId)
          };

          if (entry.entityType === 'income') {
            const income = entry.data as Income;
            nextState = {
              ...nextState,
              incomes: [income, ...nextState.incomes],
              accounts: nextState.accounts.map((account) => ({
                ...account,
                balance: account.balance + (income.distributions[account.id] ?? 0)
              }))
            };
          }

          if (entry.entityType === 'payment') {
            const payment = entry.data as Payment;
            nextState = {
              ...nextState,
              payments: [payment, ...nextState.payments],
              accounts: nextState.accounts.map((account) =>
                account.id === payment.accountId ? { ...account, balance: account.balance - payment.amount } : account
              ),
              projections: nextState.projections.map((projection) =>
                projection.id === payment.projectionId
                  ? { ...projection, paidAmount: Math.min(projection.amount, projection.paidAmount + payment.amount) }
                  : projection
              )
            };
          }

          if (entry.entityType === 'projection') {
            nextState = {
              ...nextState,
              projections: [entry.data as Projection, ...nextState.projections]
            };
          }

          return {
            ...nextState,
            activities: pushActivity(nextState.activities, entry.entityType, `Desfazer exclusão de ${entry.entityType}`)
          };
        }),
      updateAccount: (accountId, updates) =>
        set((state) => ({
          ...state,
          accounts: state.accounts.map((account) =>
            account.id === accountId
              ? {
                  ...account,
                  ...updates
                }
              : account
          )
        })),
      toggleProfitAccount: (enabled) =>
        set((state) => ({
          ...state,
          accounts: state.accounts.map((account) =>
            account.id === 'profit'
              ? {
                  ...account,
                  enabled
                }
              : account
          )
        })),
      resetBalances: () =>
        set((state) => ({
          ...state,
          accounts: state.accounts.map((account) => ({ ...account, balance: 0 })),
          incomes: [],
          payments: [],
          projections: state.projections.map((projection) => ({ ...projection, paidAmount: 0 })),
          activities: pushActivity(state.activities, 'settings', 'Saldos, receitas e pagamentos resetados')
        })),
      resetProjections: () =>
        set((state) => ({
          ...state,
          projections: [],
          payments: state.payments.map((payment) => ({ ...payment, projectionId: undefined })),
          activities: pushActivity(state.activities, 'settings', 'Projeções e vínculos de pagamentos resetados')
        })),
      resetSystem: () =>
        set({
          ...baseState,
          accounts: zeroAccounts(),
          mentorMessages: [createMentorMessage('Sistema reiniciado. Defina percentuais e registre nova receita.', 'info')]
        })
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage)
    }
  )
);
