import React, { useRef, useState } from "react";
import { API_BASE, apiFetch } from "./api";

function Upload({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState("general");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const chooseFile = (selected) => {
    const next = selected?.[0];
    if (!next) return;
    const extension = next.name.split(".").pop().toLowerCase();
    if (!["pdf", "jpg", "jpeg", "png", "docx"].includes(extension)) {
      setError("Choose a PDF, JPG, PNG, or DOCX document.");
      return;
    }
    if (next.size > 15 * 1024 * 1024) {
      setError("The maximum file size is 15 MB.");
      return;
    }
    setError("");
    setFile(next);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Select a document before starting verification.");
      return;
    }
    setBusy(true);
    setError("");
    const body = new FormData();
    body.append("file", file);
    body.append("document_type", documentType);
    try {
      const response = await apiFetch(`${API_BASE}/api/documents/upload`, { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || `Upload failed (${response.status}).`);
      onUploaded(payload);
    } catch (uploadError) {
      setError(uploadError.message || "The document could not be verified.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="upload-page">
      <div className="page-heading">
        <div><p className="eyebrow">DOCUMENT INTAKE</p><h1>Start a verification</h1><p className="muted">Upload a document for OCR, validation, compliance screening, and reviewer triage.</p></div>
        <div className="step-pill"><span>01</span> UPLOAD <i /> <span>02</span> REVIEW</div>
      </div>
      <form className="upload-layout" onSubmit={submit}>
        <div className="panel upload-panel">
          <h2>Document file</h2>
          <p className="muted">PDF, JPG, PNG, or DOCX · Up to 15 MB</p>
          <button
            type="button"
            className={`dropzone ${dragging ? "dragging" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files); }}
          >
            <span className="upload-icon">↑</span>
            <strong>{file ? file.name : "Drop your document here"}</strong>
            <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Ready to verify` : "or browse files from your device"}</span>
            <span className="browse-button">Browse files</span>
          </button>
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" hidden onChange={(event) => chooseFile(event.target.files)} />
          {file && <button type="button" className="text-button remove-file" onClick={() => setFile(null)}>Remove selected file</button>}
          <div className="privacy-note"><span>⌑</span><p><strong>Privacy by design</strong><br />The source file and unmasked OCR text are processed in memory and are not stored by the demo service.</p></div>
        </div>
        <aside className="panel intake-panel">
          <h2>Verification profile</h2>
          <label htmlFor="document-type">Document category</label>
          <select id="document-type" value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
            <option value="general">General application</option>
            <option value="pan">PAN card</option>
            <option value="aadhaar">Aadhaar identity</option>
            <option value="gstin">GST registration</option>
            <option value="tax_application">Tax application</option>
          </select>
          <div className="process-list">
            <p><span>01</span><b>Text extraction</b><small>OCR with scan-quality checks</small></p>
            <p><span>02</span><b>Field validation</b><small>Format checks and masked output</small></p>
            <p><span>03</span><b>Compliance screening</b><small>Versioned demo rule set</small></p>
            <p><span>04</span><b>Human review</b><small>Explainable findings, reviewer decides</small></p>
          </div>
          {error && <div className="notice error" role="alert">{error}</div>}
          <button className="primary-button full-width" type="submit" disabled={busy}>{busy ? "Processing document…" : "Run verification"} <span>→</span></button>
          <p className="disclaimer">This screening is not proof of identity, authenticity, or eligibility.</p>
        </aside>
      </form>
    </section>
  );
}

export default Upload;