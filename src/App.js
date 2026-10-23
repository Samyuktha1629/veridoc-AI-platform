import React, { useCallback, useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import Login from "./Login";
import Report from "./Report";
import Upload from "./Upload";
import Logo from "./Logo";
import "./styles.css";
import { API_BASE, apiFetch, clearAccessToken, getAccessToken } from "./api";

function App() {
  const [records, setRecords] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [loadError, setLoadError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [booting, setBooting] = useState(true);

  const refreshRecords = useCallback(async () => {
    try {
      const response = await apiFetch(`${API_BASE}/api/documents`);
      if (!response.ok) throw new Error(`Dashboard request failed (${response.status}).`);
      setRecords(await response.json());
      setLoadError("");
    } catch (error) {
      setLoadError(error.message || "Could not connect to the verification service.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/api/auth/status`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Service status request failed (${response.status}).`);
        return response.json();
      })
      .then(({ required, setup_required: setupIsRequired }) => {
        if (!active) return;
        setAuthRequired(required);
        setSetupRequired(setupIsRequired);
        setAuthenticated(!required || Boolean(getAccessToken()));
        setBooting(false);
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(error.message || "Could not connect to the verification service.");
        setAuthRequired(true);
        setBooting(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (authenticated) refreshRecords();
  }, [authenticated, refreshRecords]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setAuthenticated(false);
      setLoadError("Your session expired. Sign in again to continue.");
    };
    window.addEventListener("veridoc:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("veridoc:unauthorized", handleUnauthorized);
  }, []);

  const handleUploaded = (report) => {
    setSelectedReport(report);
    setActiveView("report");
    refreshRecords();
  };

  const openReport = async (record) => {
    try {
      const response = await apiFetch(`${API_BASE}/api/documents/${record.id}/report`);
      if (!response.ok) throw new Error(`Report request failed (${response.status}).`);
      setSelectedReport(await response.json());
      setActiveView("report");
    } catch (error) {
      setLoadError(error.message || "Could not load this report.");
    }
  };

  const handleAuthenticated = () => {
    setLoadError("");
    setSetupRequired(false);
    setAuthenticated(true);
  };

  const handleSignOut = () => {
    clearAccessToken();
    setAuthenticated(false);
    setSelectedReport(null);
    setActiveView("dashboard");
  };

  if (booting) {
    return <div className="loading-screen"><Logo /><strong>Veridoc AI</strong><span>Preparing your verification workspace…</span></div>;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#dashboard" onClick={() => setActiveView("dashboard")}>
          <Logo />
          <span>Veridoc AI <small>VERIFY. VALIDATE. TRUST.</small></span>
        </a>
        {authenticated && (
          <>
            <nav aria-label="Main navigation">
              <button className={activeView === "dashboard" ? "nav-link active" : "nav-link"} onClick={() => { setActiveView("dashboard"); setSelectedReport(null); }}>Review desk</button>
              <button className={activeView === "upload" ? "nav-link active" : "nav-link"} onClick={() => setActiveView("upload")}>New verification <span aria-hidden="true">＋</span></button>
              {authRequired && <button className="nav-link nav-logout" onClick={handleSignOut}>Sign out</button>}
            </nav>
            <div className="reviewer"><span className="online-dot" /> SECURE REVIEW WORKSPACE</div>
          </>
        )}
      </header>

      <main className="page-content">
        {!authenticated ? (
          <Login onAuthenticated={handleAuthenticated} setupRequired={setupRequired} statusMessage={loadError} />
        ) : (
          <>
            {loadError && <div className="notice error" role="alert">{loadError}</div>}
            {activeView === "upload" && <Upload onUploaded={handleUploaded} />}
            {activeView === "dashboard" && (
              <Dashboard records={records} onSelect={openReport} onRefresh={refreshRecords} />
            )}
            {activeView === "report" && selectedReport && (
              <Report report={selectedReport} onReviewed={(updated) => { setSelectedReport(updated); refreshRecords(); }} onBack={() => { setActiveView("dashboard"); setSelectedReport(null); }} />
            )}
          </>
        )}
      </main>
      <footer className="site-footer">
        <span>Veridoc AI · Verify. Validate. Trust.</span>
        <span>AI outputs are advisory and require human review.</span>
      </footer>
    </div>
  );
}

export default App;