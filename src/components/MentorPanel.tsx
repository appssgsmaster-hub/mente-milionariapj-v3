import { useFinanceStore } from '../store/useFinanceStore';
import { formatDate } from '../utils/format';

export function MentorPanel() {
  const messages = useFinanceStore((state) => state.mentorMessages.slice(0, 6));

  return (
    <div className="mentor-panel">
      <h3>Mentor AI</h3>
      <ul>
        {messages.map((message) => (
          <li key={message.id} className={`mentor-${message.type}`}>
            <strong>{formatDate(message.createdAt.slice(0, 10))}</strong>
            <span>{message.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
