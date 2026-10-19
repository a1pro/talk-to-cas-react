import { Link } from "react-router-dom";

interface WorkspaceQuickLinkItem {
  label: string;
  description: string;
  to: string;
}

export function WorkspaceQuickLinks({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: WorkspaceQuickLinkItem[];
}) {
  return (
    <section className="card dashboard-helper-card">
      <div className="split-card-header">
        <div>
          <span className="eyebrow">Quick access</span>
          <h2>{title}</h2>
          <p className="muted">{subtitle}</p>
        </div>
      </div>

      <div className="workspace-quick-grid top-gap">
        {items.map((item) => (
          <Link key={item.to} to={item.to} className="workspace-quick-card">
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
