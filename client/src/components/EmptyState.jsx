export default function EmptyState({ icon, title, desc, children }) {
  return (
    <div className="empty">
      {icon && <div className="icon">{icon}</div>}
      <div className="title">{title}</div>
      {desc && <div className="desc">{desc}</div>}
      {children}
    </div>
  );
}
