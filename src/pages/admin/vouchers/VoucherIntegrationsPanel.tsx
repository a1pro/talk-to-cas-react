import type { IntegrationPlaybookPayloadLocal } from "../types";

interface VoucherIntegrationsPanelProps {
  integrationPlaybook: IntegrationPlaybookPayloadLocal | null;
}

export function VoucherIntegrationsPanel({ integrationPlaybook }: VoucherIntegrationsPanelProps) {
  return (
    <>
      <div className="split-grid">
        <section className="card">
          <span className="eyebrow">Webhook endpoints</span>
          <h2 style={{ marginBottom: 8 }}>Go-live endpoint checklist</h2>
          <div className="list compact-list">
            {Object.entries(integrationPlaybook?.urls || {}).map(([key, value]) => (
              <div key={key} className="list-row align-start">
                <div>
                  <strong>{key.replace(/_/g, " ")}</strong>
                  <p>{value || "Not configured"}</p>
                </div>
                <span className="info-badge">{value ? "ready" : "missing"}</span>
              </div>
            ))}
          </div>
          <div className="list compact-list" style={{ marginTop: 16 }}>
            {Object.entries(integrationPlaybook?.signature_headers || {}).map(([key, value]) => (
              <div key={key} className="list-row align-start">
                <div>
                  <strong>{key}</strong>
                  <p>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <span className="eyebrow">Latest references</span>
          <h2 style={{ marginBottom: 8 }}>Recent IDs for testing</h2>
          <div className="list compact-list">
            {Object.entries(integrationPlaybook?.records || {}).map(([key, value]) => (
              <div key={key} className="list-row align-start">
                <div>
                  <strong>{key.replace(/_/g, " ")}</strong>
                  <p>{value || "No recent record yet"}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <span className="eyebrow">Sample payloads</span>
        <h2 style={{ marginBottom: 8 }}>Copy-ready webhook examples</h2>
        <div className="list">
          {Object.entries(integrationPlaybook?.examples || {}).map(([key, example]) => (
            <div key={key} className="card" style={{ padding: 16, background: "rgba(255,255,255,0.04)" }}>
              <strong style={{ display: "block", marginBottom: 8 }}>{example.title || key}</strong>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", overflowX: "auto" }}>{JSON.stringify(example.payload || {}, null, 2)}</pre>
              {example.curl ? <pre style={{ marginTop: 12, whiteSpace: "pre-wrap", overflowX: "auto" }}>{example.curl}</pre> : null}
              {example.notes ? <p className="muted" style={{ marginTop: 12 }}>{example.notes}</p> : null}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
