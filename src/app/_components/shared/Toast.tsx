export function Toast({ message }: { message: string }) {
  return (
    <div className="toast">
      <div className="neo-surface">{message}</div>
    </div>
  );
}
