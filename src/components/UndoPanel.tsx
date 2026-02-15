import { useFinanceStore } from '../store/useFinanceStore';
import { formatDate } from '../utils/format';

export function UndoPanel() {
  const deletedItems = useFinanceStore((state) => state.deletedItems.slice(0, 8));
  const undoDelete = useFinanceStore((state) => state.undoDelete);

  if (deletedItems.length === 0) {
    return null;
  }

  return (
    <div className="undo-panel">
      <h3>Lixeira rápida (desfazer)</h3>
      {deletedItems.map((item) => (
        <div key={item.id} className="undo-item">
          <span>
            {item.entityType} excluído em {formatDate(item.deletedAt.slice(0, 10))}
          </span>
          <button type="button" onClick={() => undoDelete(item.id)}>
            Desfazer
          </button>
        </div>
      ))}
    </div>
  );
}
