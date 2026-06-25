import './Toast.css';

interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  if (!visible) return null;

  return (
    <div className="toast" role="status">
      <span className="toast__icon">✓</span>
      {message}
    </div>
  );
}