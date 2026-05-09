import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { bnplApi } from "@/api/bnpl";
import type { BnplOptionsPayload, BnplPlan } from "@/types";

export default function BnplVoucherUpgradePage() {
  const navigate = useNavigate();
  const [options, setOptions] = useState<BnplOptionsPayload | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("standard");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    bnplApi
      .getOptions()
      .then((payload) => {
        setOptions(payload);
        if (payload.plans?.[0]?.key) {
          setSelectedPlan(payload.plans[0].key);
        }
      })
      .catch((err: any) => {
        setError(err?.response?.data?.message || "Could not load voucher upgrade options right now.");
      });
  }, []);

  const selected = useMemo<BnplPlan | null>(
    () => options?.plans?.find((plan) => plan.key === selectedPlan) ?? null,
    [options, selectedPlan]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const order = await bnplApi.createOrder({
        plan_key: selectedPlan,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        source_context: "public_bnpl_page",
      });

      navigate(`/voucher-upgrade/${order.checkout_code}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not start the voucher upgrade checkout.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="Voucher upgrade"
      subtitle="Choose a bigger Uber voucher option, create the order, and continue into the checkout review flow. When a hosted payment link is configured, the order page can open it directly and wait for Stripe webhook confirmation."
    >
      {error ? <div className="error-box top-gap">{error}</div> : null}

      <section className="card">
        <div className="split-card-header">
          <div>
            <span className="eyebrow">BNPL checkout</span>
            <h2>Choose your voucher option</h2>
            <p className="muted">
              {options?.merchant_of_record || "TALK to CAS"} acts as merchant of record. {options?.compliance_message}
            </p>
          </div>
          <div className="badge-row compact-badges">
            <span className="info-badge">Provider: {options?.provider || "stripe_bnpl"}</span>
            <span className="info-badge">Checkout: {options?.live_checkout_ready ? "hosted link ready" : "review mode"}</span>
          </div>
        </div>

        <div className="card-grid four top-gap">
          {options?.plans?.map((plan) => {
            const active = selectedPlan === plan.key;
            return (
              <article
                key={plan.key}
                className="card stat-card"
                style={active ? { outline: "2px solid var(--accent, #7c3aed)" } : undefined}
              >
                <h3>{plan.name || plan.title || plan.key}</h3>
                <strong>£{plan.amount_gbp}</strong>
                <p className="muted">{plan.description}</p>
                <button className={active ? "primary-button small" : "secondary-button small"} onClick={() => setSelectedPlan(plan.key)}>
                  {active ? "Selected" : "Choose"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="split-grid hero-split">
        <article className="card">
          <h2>Checkout details</h2>
          <form className="auth-form top-gap" onSubmit={handleSubmit}>
            <label>
              Full name
              <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
            </label>
            <label>
              Email address
              <input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} required />
            </label>
            <label>
              Phone number
              <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} required />
            </label>

            <button className="primary-button" type="submit" disabled={busy || !selectedPlan}>
              {busy ? "Creating checkout..." : `Continue with ${selected?.name || "selected option"}`}
            </button>
          </form>
        </article>

        <article className="card">
          <h2>What this batch includes</h2>
          <div className="marketing-list top-gap">
            <div className="marketing-list-item">
              <span className="marketing-dot" />
              <p>Proposal-aligned voucher options: £30, £50, £75, and £100.</p>
            </div>
            <div className="marketing-list-item">
              <span className="marketing-dot" />
              <p>Each order stores a checkout code, review URL, and hosted payment-link handoff when configured.</p>
            </div>
            <div className="marketing-list-item">
              <span className="marketing-dot" />
              <p>Voucher issuance still waits for payment confirmation, including Stripe webhook settlement or localhost simulation.</p>
            </div>
          </div>

          <div className="info-box top-gap">
            <strong>Terms summary</strong>
            <p>{options?.terms_summary || "Pay later options are subject to approval."}</p>
          </div>

          <div className="info-box top-gap">
            <strong>Checkout mode</strong>
            <p>
              {options?.live_checkout_ready
                ? "A hosted payment link is configured. After you create the order, open the checkout from the review page."
                : "The review page is ready now. Add TALKTOCAS_BNPL_LINK in backend env later to open a hosted payment page directly."}
            </p>
          </div>

          {selected ? (
            <div className="info-box top-gap">
              <strong>{selected.name || selected.title}</strong>
              <p>
                £{selected.amount_gbp} · {selected.instalment_copy || selected.description}
              </p>
            </div>
          ) : null}
        </article>
      </section>
    </AppShell>
  );
}
