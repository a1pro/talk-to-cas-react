import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { bnplApi } from "@/api/bnpl";
import type { BnplVoucherOrder } from "@/types";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BnplVoucherCheckoutPage() {
  const { checkoutCode = "" } = useParams();
  const [order, setOrder] = useState<BnplVoucherOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadOrder() {
    try {
      const payload = await bnplApi.getOrder(checkoutCode);
      setOrder(payload);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not load this voucher upgrade checkout.");
    }
  }

  useEffect(() => {
    if (checkoutCode) {
      void loadOrder();
    }
  }, [checkoutCode]);

  async function simulatePayment() {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const payload = await bnplApi.simulatePayment(checkoutCode);
      setOrder(payload);
      setMessage("Simulated payment confirmed. Voucher upgrade is now marked as issued.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not simulate payment confirmation.");
    } finally {
      setBusy(false);
    }
  }

  function openCheckout() {
    if (!order?.checkout_url) return;
    window.open(order.checkout_url, "_blank", "noopener,noreferrer");
  }

  return (
    <AppShell
      title="Voucher upgrade checkout"
      subtitle="Review your BNPL order, open the checkout handoff when it is configured, and watch this page update after Stripe webhook confirmation or localhost simulation."
    >
      {error ? <div className="error-box top-gap">{error}</div> : null}
      {message ? <div className="success-box top-gap">{message}</div> : null}

      <section className="card-grid four">
        <article className="card stat-card">
          <h3>Plan</h3>
          <strong>{order?.plan_name || "-"}</strong>
        </article>
        <article className="card stat-card">
          <h3>Amount</h3>
          <strong>£{order?.amount_gbp || order?.amount || "0.00"}</strong>
        </article>
        <article className="card stat-card">
          <h3>Payment</h3>
          <strong>{order?.payment_status || "pending"}</strong>
        </article>
        <article className="card stat-card">
          <h3>Voucher</h3>
          <strong>{order?.voucher_status || "pending"}</strong>
        </article>
      </section>

      <section className="split-grid hero-split">
        <article className="card">
          <h2>Order details</h2>
          <div className="list top-gap">
            <div className="list-row">
              <strong>Checkout code</strong>
              <span>{order?.checkout_code || "-"}</span>
            </div>
            <div className="list-row">
              <strong>Customer</strong>
              <span>{order?.customer_name || "-"}</span>
            </div>
            <div className="list-row">
              <strong>Email</strong>
              <span>{order?.customer_email || "-"}</span>
            </div>
            <div className="list-row">
              <strong>Phone</strong>
              <span>{order?.customer_phone || "-"}</span>
            </div>
            <div className="list-row">
              <strong>Payment reference</strong>
              <span>{order?.payment_reference || "-"}</span>
            </div>
            <div className="list-row">
              <strong>Payment confirmed</strong>
              <span>{formatDateTime(order?.payment_confirmed_at)}</span>
            </div>
            <div className="list-row">
              <strong>Voucher issued</strong>
              <span>{formatDateTime(order?.voucher_issued_at)}</span>
            </div>
          </div>

          {order?.failure_reason ? (
            <div className="error-box top-gap">
              <strong>Payment update</strong>
              <p>{order.failure_reason}</p>
            </div>
          ) : null}

          <div className="action-row wrap-actions top-gap">
            {order?.payment_status !== "paid" ? (
              <button className="primary-button" onClick={openCheckout} disabled={!order?.checkout_url}>
                {order?.live_checkout_ready ? "Open secure checkout" : "Open review page"}
              </button>
            ) : null}
            {order?.simulate_payment_available && order?.payment_status !== "paid" ? (
              <button className="secondary-button" onClick={() => void simulatePayment()} disabled={busy}>
                {busy ? "Confirming..." : "Simulate payment received"}
              </button>
            ) : null}
            <button className="secondary-button" onClick={() => void loadOrder()} disabled={busy}>
              Refresh status
            </button>
            <Link className="secondary-button link-button" to="/voucher-upgrade">
              Start another upgrade
            </Link>
          </div>
        </article>

        <article className="card">
          <h2>Issued voucher</h2>
          {order?.voucher_code ? (
            <div className="info-box top-gap">
              <strong>{order.voucher_code}</strong>
              <p>Your upgrade voucher code is now available. Payment confirmation has issued this voucher and stored the settlement details in the order record.</p>
            </div>
          ) : (
            <p className="muted top-gap">Voucher code will appear here after payment confirmation.</p>
          )}

          <div className="marketing-list top-gap">
            <div className="marketing-list-item">
              <span className="marketing-dot" />
              <p>TALK to CAS remains the merchant of record for this flow.</p>
            </div>
            <div className="marketing-list-item">
              <span className="marketing-dot" />
              <p>This page now supports hosted checkout handoff when TALKTOCAS_BNPL_LINK is configured in the backend.</p>
            </div>
            <div className="marketing-list-item">
              <span className="marketing-dot" />
              <p>Stripe webhook confirmation or localhost simulation can move the order from pending payment to issued voucher.</p>
            </div>
          </div>

          <div className="info-box top-gap">
            <strong>Checkout mode</strong>
            <p>
              {order?.live_checkout_ready
                ? "Hosted payment link ready. Open secure checkout above, then return here to refresh the payment result if needed."
                : "Review-only mode is active. Add TALKTOCAS_BNPL_LINK to the backend env when you are ready to send users to a hosted payment page."}
            </p>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
