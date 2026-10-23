import React, { useState } from "react";
import { API_BASE, apiFetch } from "./api";

function Report({ report, onReviewed, onBack }) {
  const [reviewing, setReviewing] = useState(false);
  const [decision, setDecision] = useState("verified");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const reviewed = report.human_review;

  const downloadPdf = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      const response = await apiFetch(`${API_BASE}/api/documents/${report.id}/report?format=pdf`);
      if (!response.ok) throw new Error(`PDF download failed (${response.status}).`);
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `verification-${report.id}.pdf`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadFailure) {
      setDownloadError(downloadFailure.message || "Could not download this report.");
    } finally {
      setDownloading(false);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setReviewing(true);
    setError("");
    try {
      const response = await apiFetch(`${API_BASE}/api/documents/${report.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || `Review update failed (${response.status}).`);
      const refreshed = await apiFetch(`${API_BASE}/api/documents/${report.id}/report`);
      if (!refreshed.ok) throw new Error("Review saved, but the updated report could not be loaded.");
      onReviewed(await refreshed.json());
    } catch (reviewError) {
      setError(reviewError.message || "Review could not be saved.");
    } finally {
      setReviewing(false);
    }
  };

  return (
    <section className="report-page">
      <button className="back-button" onClick={onBack}>← Back to review desk</button>
      <div className="page-heading report-heading">
        <div><p className="eyebrow">VERIFICATION REPORT / {report.id?.slice(0, 8)}</p><h1>Document findings</h1><p className="muted">{report.document_name} · {new Date(report.created_at).toLocaleString()}</p></div>
        <div className="report-actions"><span className={`badge ${report.risk_level === "Pass" ? "pass" : report.risk_level === "Fraud suspected" ? "fraud" : "warning"}`}>{report.risk_level}</span><button className="secondary-button link-button" type="button" onClick={downloadPdf} disabled={downloading}>↓ <span>{downloading ? "Preparing PDF…" : "Download PDF"}</span></button></div>
      </div>
      {downloadError && <div className="notice error" role="alert">{downloadError}</div>}
      <div className="notice advisory"><span>ⓘ</span>{report.review_notice || "Automated findings are advisory. A trained reviewer must make the final decision."}</div>
      <div className="report-summary-grid">
        <article className="summary-card"><small>OCR QUALITY</small><strong>{report.ocr?.quality ?? "—"}<em>/100</em></strong><span>{report.ocr?.pages ?? 0} page(s) · {report.ocr?.language || "unknown language"}</span></article>
        <article className="summary-card"><small>VALIDATION FINDINGS</small><strong>{(report.validation?.fields?.length || 0) + (report.validation?.invalid_fields?.length || 0)}</strong><span>Fields screened; identifiers masked</span></article>
        <article className="summary-card"><small>COMPLIANCE RULES</small><strong>{report.compliance?.rules_checked ?? 0}</strong><span>Versioned screening checks</span></article>
      </div>
      <div className="report-columns">
        <div className="report-main">
          <section className="panel result-panel">
            <div className="panel-heading"><div><p className="eyebrow">FIELD EXTRACTION</p><h2>Validation results</h2></div><span className="mini-label">EXPLAINABLE</span></div>
            {report.validation?.fields?.length || report.validation?.invalid_fields?.length ? (
              <div className="finding-list">
                {[...(report.validation.fields || []).map((item) => ({ ...item, valid: true })), ...(report.validation.invalid_fields || []).map((item) => ({ ...item, valid: false }))].map((item, index) => (
                  <div className="finding" key={`${item.field}-${index}`}><span className={`finding-icon ${item.valid ? "good" : "attention"}`}>{item.valid ? "✓" : "!"}</span><div><strong>{item.field}</strong><p>{item.value || "Not detected"} · {item.valid ? "Format/checksum check passed" : item.reason || "Needs manual verification"}</p></div><span className={`finding-state ${item.valid ? "good-text" : "attention-text"}`}>{item.valid ? "Screened" : "Review"}</span></div>
                ))}
              </div>
            ) : <p className="muted empty-inline">No supported identifiers were detected in the extracted text.</p>}
            {(report.validation?.warnings || []).map((warning, index) => <p className="inline-warning" key={index}>! {warning}</p>)}
            <p className="method-note">{report.validation?.explanation}</p>
          </section>
          <section className="panel result-panel">
            <div className="panel-heading"><div><p className="eyebrow">RULE ENGINE</p><h2>Compliance screening</h2></div><span className={`badge ${report.compliance?.status === "pass" ? "pass" : "warning"}`}>{report.compliance?.status || "not checked"}</span></div>
            <div className="finding-list">{(report.compliance?.results || []).map((item) => <div className="finding" key={item.rule_id}><span className={`finding-icon ${item.status === "pass" ? "good" : "attention"}`}>{item.status === "pass" ? "✓" : "!"}</span><div><strong>{item.name}</strong><p>{item.explanation}</p></div><span className="finding-state">{item.status.replaceAll("_", " ")}</span></div>)}</div>
            <p className="method-note">{report.compliance?.explanation}</p>
          </section>
          <section className="panel result-panel">
            <div className="panel-heading"><div><p className="eyebrow">DOCUMENT FORENSICS</p><h2>Integrity indicators</h2></div><span className="mini-label">HEURISTIC</span></div>
            {report.fraud?.indicators?.length ? <div className="finding-list">{report.fraud.indicators.map((item, index) => <div className="finding" key={`${item.signal}-${index}`}><span className="finding-icon attention">!</span><div><strong>{item.signal.replaceAll("_", " ")}</strong><p>{item.explanation}</p></div><span className="finding-state">{item.severity}</span></div>)}</div> : <p className="muted empty-inline">No high-level metadata indicators detected. This does not establish authenticity.</p>}
            <p className="method-note">{report.fraud?.explanation}</p>
          </section>
        </div>
        <aside className="panel reviewer-panel">
          <p className="eyebrow">HUMAN DECISION</p><h2>Reviewer action</h2>
          {reviewed ? (
            <div className="review-complete"><span className="finding-icon good">✓</span><strong>Review recorded</strong><span className="badge pass">{reviewed.decision.replaceAll("_", " ")}</span><p>{reviewed.note || "No reviewer note added."}</p><small>{new Date(reviewed.reviewed_at).toLocaleString()}</small></div>
          ) : (
            <form onSubmit={submitReview}>
              <label htmlFor="decision">Decision</label>
              <select id="decision" value={decision} onChange={(event) => setDecision(event.target.value)}>
                <option value="verified">Verified</option><option value="needs_information">Needs information</option><option value="rejected">Rejected</option>
              </select>
              <label htmlFor="review-note">Reviewer note <span className="muted">(optional)</span></label>
              <textarea id="review-note" rows="4" maxLength="2000" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Record evidence considered and any follow-up…" />
              {error && <div className="notice error" role="alert">{error}</div>}
              <button className="primary-button full-width" disabled={reviewing}>{reviewing ? "Saving…" : "Save review"} <span>→</span></button>
            </form>
          )}
          <div className="reviewer-guidance"><strong>Review guidance</strong><ul><li>Verify the original source document.</li><li>Do not treat a heuristic as proof of fraud.</li><li>Confirm current rules and effective dates.</li></ul></div>
        </aside>
      </div>
    </section>
  );
}

export default Report;