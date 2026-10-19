import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="center-screen">
      <div className="card narrow">
        <Logo className="not-found-logo" />
        <h1>Page not found</h1>
        <p className="muted">Return to the new landing page or log in again.</p>
        <div className="hero-cta-row">
          <Link className="primary-button link-button" to="/">
            Go home
          </Link>
          <Link className="secondary-button link-button" to="/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
