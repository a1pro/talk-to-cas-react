import { Link } from "react-router-dom";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  Download,
  FileCog,
  Landmark,
  LayoutDashboard,
  MessageCircle,
  Settings,
  ShieldCheck,
  Store,
  TicketCheck,
  Upload,
  Users,
  WalletCards,
  XCircle,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  active: boolean;
  description?: string;
  icon?: string;
  badge?: number | string | null;
}

interface AdminNavigationProps {
  familyNav: NavItem[];
  sectionNav: NavItem[];
}

const ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  merchants: Store,
  pending: ShieldCheck,
  approved: CheckCircle2,
  rejected: XCircle,
  finance: WalletCards,
  venues: Building2,
  approvals: ShieldCheck,
  address: Landmark,
  vouchers: TicketCheck,
  upload: Upload,
  download: Download,
  users: Users,
  whatsapp: MessageCircle,
  settings: Settings,
  integrations: FileCog,
  reports: BarChart3,
};

function NavIcon({ name, active }: { name?: string; active?: boolean }) {
  const Icon = ICONS[name || ""] || ChevronRight;
  return <Icon className={`admin-nav-icon ${active ? "active" : ""}`} size={18} strokeWidth={2} />;
}

export function AdminNavigation({ familyNav, sectionNav }: AdminNavigationProps) {
  return (
    <section className="card admin-command-nav">
      <div className="admin-command-header">
        <div>
          <span className="eyebrow">Admin command center</span>
          <h2>Manage CAS operations</h2>
          <p className="muted">Separate workspaces for merchants, venues, vouchers, users, and settings.</p>
        </div>
        <span className="info-badge">Full access mode</span>
      </div>

      <div className="admin-family-grid">
        {familyNav.map((item) => (
          <Link key={item.path} className={`admin-family-tile ${item.active ? "active" : ""}`} to={item.path}>
            <span className="admin-family-icon"><NavIcon name={item.icon} active={item.active} /></span>
            <span>
              <strong>{item.label}</strong>
              {item.description ? <small>{item.description}</small> : null}
            </span>
            {item.badge !== null && item.badge !== undefined ? <em>{item.badge}</em> : null}
          </Link>
        ))}
      </div>

      <div className="admin-subnav-bar">
        {sectionNav.map((item) => (
          <Link key={item.path} className={`admin-subnav-chip ${item.active ? "active" : ""}`} to={item.path}>
            <NavIcon name={item.icon} active={item.active} />
            <span>{item.label}</span>
            {item.badge !== null && item.badge !== undefined ? <strong>{item.badge}</strong> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
