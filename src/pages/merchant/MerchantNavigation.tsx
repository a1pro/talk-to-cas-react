import { Link } from "react-router-dom";

interface NavItem {
  label: string;
  path: string;
  active: boolean;
}

interface MerchantNavigationProps {
  familyNav: NavItem[];
  sectionNav: NavItem[];
}

export function MerchantNavigation({ familyNav, sectionNav }: MerchantNavigationProps) {
  return (
    <section className="card admin-nav-card compact-admin-nav">
      <div>
        <p className="admin-nav-label">Main menu</p>
        <div className="admin-nav-row admin-main-nav-row">
          {familyNav.map((item) => (
            <Link key={item.path} className={`admin-nav-pill ${item.active ? "active" : ""}`} to={item.path}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <p className="admin-nav-label">Sub menu</p>
        <div className="admin-nav-row">
          {sectionNav.map((item) => (
            <Link key={item.path} className={`admin-subnav-pill ${item.active ? "active" : ""}`} to={item.path}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
