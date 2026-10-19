import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { createLead } from "@/api/leads";
import type { LeadGeneratorPayload } from "@/types";

export default function LeadGeneratorPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const flowType = searchParams.get("flow") === "order_food" ? "order_food" : "going_out";
  const journeyType = flowType === "order_food" ? "food" : "nightlife";

  const [customerName, setCustomerName] = useState(user?.name || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "");
  const [postcode, setPostcode] = useState(searchParams.get("postcode") || user?.postcode || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [desiredVenueName, setDesiredVenueName] = useState(searchParams.get("venue") || "");
  const [desiredCategory, setDesiredCategory] = useState(
    searchParams.get("category") || (journeyType === "food" ? "restaurant" : "club")
  );
  const [notes, setNotes] = useState("");
  const [contactConsent, setContactConsent] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LeadGeneratorPayload | null>(null);

  const source = useMemo(() => {
    const value = searchParams.get("source");
    if (value === "discovery_no_results" || value === "waiting_list" || value === "tag_missing_venue") {
      return value;
    }
    return "manual";
  }, [searchParams]);

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = await createLead({
        customer_name: customerName,
        customer_email: customerEmail || undefined,
        customer_phone: customerPhone || undefined,
        postcode: postcode.toUpperCase(),
        city: city || undefined,
        journey_type: journeyType,
        flow_type: flowType,
        desired_venue_name: desiredVenueName || undefined,
        desired_category: desiredCategory || undefined,
        source,
        notes: notes || undefined,
        submitted_from: "lead-generator-page",
        contact_consent: contactConsent,
      });

      setResult(payload);
    } catch (caught: any) {
      setError(
        caught?.response?.data?.errors?.contact?.[0] ||
          caught?.response?.data?.errors?.contact_consent?.[0] ||
          caught?.response?.data?.message ||
          "Could not save your request right now."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title="Lead generator"
      subtitle="Capture demand when a venue is missing, outside the live area, or not yet running an active offer. This creates a waiting-list lead so TALK to CAS can email users when a venue goes live nearby."
    >
      <section className="split-grid hero-split">
        <article className="card">
          <span className="eyebrow">Waiting list</span>
          <h2>{journeyType === "food" ? "Tell us which food venue you want" : "Tell us which nightlife venue you want"}</h2>
          <p className="muted">
            Use this when the right venue is missing from the ranked results. CAS can save the demand, link it to a nearby merchant area, and email users when a new merchant launches in that postcode cluster.
          </p>

          <div className="flow-list compact-flow top-gap">
            <div className="flow-step">
              <span>1</span>
              <div>
                <strong>Capture the request</strong>
                <p>Save venue demand even when there are no live offers for the user right now.</p>
              </div>
            </div>
            <div className="flow-step">
              <span>2</span>
              <div>
                <strong>Match the area</strong>
                <p>CAS can match the request to a postcode or city area for future merchant activation.</p>
              </div>
            </div>
            <div className="flow-step">
              <span>3</span>
              <div>
                <strong>Follow up later</strong>
                <p>When supply improves, TALK to CAS can notify users in that postcode area about the new launch.</p>
              </div>
            </div>
          </div>
        </article>

        <article className="card">
          <h2>Request form</h2>
          {error ? <div className="error-box">{error}</div> : null}
          {result ? (
            <div className="success-box">
              <strong>Waiting-list request saved.</strong>
              <p>{result.next_step}</p>
              <p className="muted small-text">
                Reference: #{result.lead.id} · {result.lead.postcode}
              </p>
            </div>
          ) : null}

          <form className="form-grid" onSubmit={submitLead}>
            <label>
              Name
              <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
            </label>

            <label>
              Email
              <input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} />
            </label>

            <label>
              Phone
              <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
            </label>

            <label>
              Postcode
              <input value={postcode} onChange={(event) => setPostcode(event.target.value.toUpperCase())} required />
            </label>

            <label>
              City
              <input value={city} onChange={(event) => setCity(event.target.value)} />
            </label>

            <label>
              Preferred venue name
              <input value={desiredVenueName} onChange={(event) => setDesiredVenueName(event.target.value)} placeholder="Optional venue or brand name" />
            </label>

            <label>
              Preferred category
              <select value={desiredCategory} onChange={(event) => setDesiredCategory(event.target.value)}>
                {journeyType === "food" ? (
                  <>
                    <option value="restaurant">Restaurant</option>
                    <option value="takeaway">Takeaway</option>
                    <option value="cafe">Cafe</option>
                  </>
                ) : (
                  <>
                    <option value="club">Club</option>
                    <option value="bar">Bar</option>
                    <option value="lounge">Lounge</option>
                  </>
                )}
              </select>
            </label>

            <label className="full-span">
              Notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Anything useful about the venue, area, or the kind of deal you expected"
              />
            </label>

            <label className="checkbox-row full-span">
              <input type="checkbox" checked={contactConsent} onChange={(event) => setContactConsent(event.target.checked)} />
              <span>I agree that TALK to CAS can contact me about this request and related venue launches in my area.</span>
            </label>

            <div className="action-row wrap-actions full-span">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Saving request..." : "Save request"}
              </button>
              <Link
                to={flowType === "order_food" ? "/welcome" : "/welcome"}
                className="secondary-button link-button"
              >
                Back to discovery
              </Link>
            </div>
          </form>
        </article>
      </section>
    </AppShell>
  );
}
