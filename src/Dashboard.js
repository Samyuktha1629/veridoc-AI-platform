import React from "react";

const riskClass = (risk) => risk === "Pass" ? "pass" : risk === "Fraud suspected" ? "fraud" : "warning";

function Dashboard({ records, onSelect, onRefresh }) {
  const pending = records.filter((record) => record.status === "pending_review").length;
  const flagged = records.filter((record) => record.risk_level !== "Pass").length;

  return (
    <section>
      <div className="page-heading">
        <div><p className="eyebrow">OVERVIEW / REVIEW DESK</p><h1>Verification desk</h1><p className="muted">Human-centered document screening with clear, explainable evidence.</p></div>
        <button className="secondary-button" onClick={onRefresh}>↻ <span>Refresh</span></button>
      </div>
      <div className="stat-grid">
        <article className="stat-card"><span className="stat-icon blue">▤</span><div><small>DOCUMENTS REVIEWED</small><strong>{records.length}</strong><span className="stat-caption">Latest 100 submissions</span></div></article>
        <article className="stat-card"><span className="stat-icon amber">◷</span><div><small>AWAITING REVIEW</small><strong>{pending}</strong><span className="stat-caption">Require human decision</span></div></article>
        <article className="stat-card"><span className="stat-icon red">⚑</span><div><small>FLAGGED FOR ATTENTION</small><strong>{flagged}</strong><span className="stat-caption">Warnings or elevated signals</span></div></article>
      </div>
      <div className="section-title"><div><p className="eyebrow">CASE QUEUE</p><h2>Recent submissions</h2></div><span className="count-chip">{records.length} total</span></div>
      <div className="panel table-panel">
        {records.length ? (
          <div className="table-scroll">
            <table>
              <thead><tr><th>DOCUMENT</th><th>TYPE</th><th>RISK SIGNAL</th><th>REVIEW STATUS</th><th>RECEIVED</th><th /></tr></thead>
              <tbody>{records.map((record) => (
                <tr key={record.id} onClick={() => onSelect(record)} tabIndex="0" onKeyDown={(event) => event.key === "Enter" && onSelect(record)}>
                  <td><span className="doc-icon">▤</span><span className="doc-name">{record.document_name}</span><small className="id-caption">{record.id.slice(0, 8)}</small></td>
                  <td>{record.document_type.replaceAll("_", " ")}</td>
                  <td><span className={`badge ${riskClass(record.risk_level)}`}>{record.risk_level}</span></td>
                  <td><span className={`status-dot ${record.status === "pending_review" ? "pending" : "done"}`} />{record.status.replaceAll("_", " ")}</td>
                  <td>{new Date(record.created_at).toLocaleString()}</td>
                  <td><button className="row-action" aria-label={`Open ${record.document_name}`}>→</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><span className="empty-icon">▤</span><h3>No documents yet</h3><p>Upload an application to see its explainable verification report here.</p></div>
        )}
      </div>
      <div className="review-callout"><span>ⓘ</span><p><strong>Human review is part of the process.</strong> Risk signals are screening aids, not a final decision or proof of fraud. Check the source and current regulations before deciding.</p></div>
    </section>
  );
}

export default Dashboard;