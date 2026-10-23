# Veridoc AI — Document Verification

AI-assisted document validation and regulatory screening for Smart India Hackathon 2026. The service produces explainable screening signals and a human review workflow; it does **not** establish identity, authenticity, eligibility, or fraud.

## Project layout

- `frontend/` — React upload, review desk, and report viewer.
- `backend/app.py` — FastAPI REST API.
- `backend/ocr.py` — PDF/DOCX text extraction and OpenCV + Tesseract OCR.
- `backend/validation.py` — PAN/GSTIN checks, Aadhaar Verhoeff checksum screening, optional local Transformers NER/LLM explanations.
- `backend/compliance.py` — versioned, database-backed rule engine.
- `backend/fraud_detection.py` — conservative image, PDF, and DOCX metadata/structure heuristics.
- `backend/database.py`, `backend/schema.sql` — SQLAlchemy access and MySQL 8 schema.
- `backend/report.py` — JSON and PDF reports.

## Run locally (Windows PowerShell)

1. Install Python 3.10+ and Tesseract OCR. Add Tesseract to `PATH`, or set `TESSERACT_CMD` to its executable path. Install language packs as needed; `TESSERACT_LANG` defaults to `eng` (for example `eng+hin`).
2. From the repository root:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   uvicorn backend.app:app --reload
   ```

   The local demo creates `backend/data/verification.db` automatically.
3. In another terminal:

   ```powershell
   cd frontend
   npm install
   npm start
   ```

   Open `http://localhost:3000` and create an account or sign in. Public registration remains available after initial setup. All accounts share the same review workspace and records. The API is documented at `http://localhost:8000/docs`. Development uses a local-only session-signing key; configure your own `SESSION_SECRET` for production.

To use MySQL 8 instead, create a database, apply `backend/schema.sql`, and set `DATABASE_URL` before starting the API:

```text
mysql+pymysql://USER:PASSWORD@HOST:3306/veridoc_ai
```

Never put production credentials in source control. The SQLite default is for development only.

### Optional local Transformers models

The deterministic rules work without model downloads. To enable NER and masked-finding explanations with Transformers, install `requirements-ai.txt` and configure:

```text
ENABLE_HF_NER=true
HF_NER_MODEL=dslim/bert-base-NER
ENABLE_HF_LLM=true
HF_LLM_MODEL=google/flan-t5-small
```

Models run on the host; download/pin approved model artifacts before handling sensitive documents, especially in on-premise/offline deployments. NER report output contains labels and confidence only, not extracted entity text. The optional LLM sees only masked, deterministic findings and cannot change validation outcomes.

## REST API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Liveness |
| `POST` | `/api/documents/upload` | Multipart `file` + optional `document_type`; runs OCR, checks, report persistence |
| `POST` | `/api/validate` | JSON `{ "text": "...", "document_type": "pan" }`, no persistence |
| `POST` | `/api/compliance/check` | JSON text screening against enabled rules |
| `POST` | `/api/fraud/check` | Multipart image, PDF, or DOCX for metadata/structure heuristics |
| `GET` | `/api/documents` | Recent review queue |
| `GET` | `/api/documents/{id}/report` | JSON verification report |
| `GET` | `/api/documents/{id}/report?format=pdf` | Download PDF |
| `PATCH` | `/api/documents/{id}/review` | Record reviewer decision and optional note |

Example upload:

```bash
curl -X POST http://localhost:8000/api/documents/upload \
  -F "file=@sample.pdf" \
  -F "document_type=tax_application"
```

Example API calls:

```bash
curl -X POST http://localhost:8000/api/validate \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"PAN ABCDE1234F\",\"document_type\":\"pan\"}"

curl http://localhost:8000/api/documents
curl -X PATCH http://localhost:8000/api/documents/REPORT_ID/review \
  -H "Content-Type: application/json" \
  -d "{\"decision\":\"needs_information\",\"note\":\"Please provide a clearer scan.\"}"
```

Supported `document_type` values include `general`, `pan`, `aadhaar`, `gstin`, and `tax_application`. The frontend selects the appropriate profile.

## Privacy and deployment notes

- The service processes uploads in memory and does not save original files or raw OCR text. Stored reports contain masked identifiers and findings; filenames and reviewer notes may still contain personal information.
- Anyone can create an account at any time. Passwords are stored as salted PBKDF2 hashes. All accounts access the same review queue, reports, uploads, and review actions; the app does not provide per-user data isolation, roles, or reviewer-specific audit attribution.
- Because registration is public and the workspace is shared, restrict access at the hosting/network layer or use only with data appropriate for a shared workspace. The workspace has no password recovery flow; back up the database securely and use a carefully controlled database-operator recovery procedure if an account password is lost.
- Configure retention, encryption at rest/in transit, backups, audit logging, provider-side login rate limits, and secure secret management before deployment.
- Keep deployment CORS origins restricted using `CORS_ORIGINS`. Use TLS and a private network for database access.
- OCR language packs must be installed locally. Poor scan quality and unsupported language coverage are surfaced as warnings; review the original document.
- Demo compliance rules are examples only, with demo versions/effective dates. Have authorized domain owners verify jurisdiction, authoritative sources, and rule changes before production use.
- Image/PDF/DOCX forensics are weak indicators: metadata is user-editable, document actions/links may have benign uses, and resaving/scanning creates artifacts. The service does not execute embedded content. Do not use these results as standalone fraud findings or adverse decisions.
- Aadhaar checksum verification is not proof that a number was issued or that a person owns it. PAN/GSTIN checks are format checks, not authoritative government lookups.

## Public deployment (not yet deployed)

The repository includes a Docker image for the FastAPI service and hosting configurations for the React frontend. These files prepare the project for hosting; they do not create hosting accounts, publish the site, register a domain, or mean that any URL is live.

### Required before exposing the API

- Production mode refuses to start unless `SESSION_SECRET` is at least 32 bytes and `CORS_ORIGINS` lists exact HTTPS frontend origins. Users can create accounts through the sign-up option; the API stores salted password hashes, returns eight-hour bearer tokens, and requires authentication for document, report, review, validation, compliance, and fraud endpoints.
- Public registrations share access to all workspace records and actions. Keep the service private or behind provider access controls unless that shared access is intended for every registrant, and use only data appropriate for the shared workspace.
- Add provider-side login rate limits and monitoring before launch. There is no password-reset flow; maintain protected backups and use a controlled database recovery process if credentials are lost.
- Configure a managed MySQL 8 database with TLS, backups, and a private/allowlisted connection. The SQLite default is ephemeral on most hosts and must not be used for production records.
- Install Tesseract and required OCR language packs in the backend image. `Dockerfile` installs the English Tesseract package.
- Public hosting and custom domains require provider accounts, configuration, DNS control, and may incur charges. Use generated provider hostnames until the custom domain is registered and DNS/HTTPS checks pass.

### Deploy the backend

1. This project folder is already a Git repository with a remote configured. Confirm it points to a repository you control, and review the working tree before committing:

   ```powershell
   git remote -v
   git status --short
   ```

   Stage only the files intended for publication. Do not commit virtual environments, generated files, `.env` files, or credentials.
2. Provision a managed MySQL 8 database. Store its TLS-enabled SQLAlchemy URL as `DATABASE_URL` in the backend service's secret settings (format: `mysql+pymysql://USER:PASSWORD@HOST:3306/DATABASE`).
3. Create a Docker web service from the repository in your backend host (for example, Render). Set the Dockerfile path to `./Dockerfile`, the health-check path to `/api/health`, and configure:
   - `APP_ENV=production`
   - `DATABASE_URL` to the secret managed-database URL
   - `SESSION_SECRET` to a newly generated random value of at least 32 bytes
   - `CORS_ORIGINS` to the exact HTTPS frontend origin, with no wildcard (for example, `https://your-site.netlify.app`)
   - `MAX_UPLOAD_MB=15`
4. Set the frontend API URL after the backend host provides its HTTPS service URL. Do not put database or authentication secrets in frontend variables.
5. Before opening the public frontend, restrict access using the hosting provider's access controls if available, visit the site over HTTPS, and create an account. Remove temporary provider restrictions only if public registration and shared workspace access are intended.

Generate a session secret locally in PowerShell:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Backend image commands for local verification:

```powershell
docker build -t veridoc-ai-api .
Copy-Item .env.example .env
docker run --rm -p 8000:8000 --env-file .env veridoc-ai-api
```

For a Git-connected Render service, configure the service once in the provider dashboard to build from this repository's `Dockerfile`; subsequent deployments are triggered by pushing a commit to the connected branch:

```powershell
git add .
git status --short
git commit -m "Update Veridoc AI deployment"
git push origin main
```

The commands above require a Git remote and a configured service. Review staged files before committing, and never commit `.env` or credentials.

### Deploy the frontend

1. Import the repository into Netlify; `netlify.toml` sets the frontend base directory, build command, output directory, and single-page-app fallback.
2. Set the Netlify build environment variable `REACT_APP_API_URL` to the backend's HTTPS URL, then trigger a fresh deploy. This variable is public frontend configuration and must contain only the API base URL.
3. Add the final Netlify site origin to the backend `CORS_ORIGINS` setting and redeploy the backend. CORS origins must include the scheme and exact host, with no trailing path.
4. The same frontend can be built locally with:

```powershell
Set-Location frontend
npm ci
$env:REACT_APP_API_URL = "https://YOUR-BACKEND-HTTPS-URL"
npm run build
```

After installing the Netlify CLI and linking the site once (`npm install --global netlify-cli`, `netlify login`, `netlify link`), configure the public API URL and deploy from the repository root:

```powershell
netlify env:set REACT_APP_API_URL "https://YOUR-BACKEND-HTTPS-URL"
netlify deploy --build --prod
```

For the first deployment, follow the CLI prompts to select the existing site or create one. Check the CLI's proposed build output before confirming production deployment.

### Deploy the frontend to GitHub Pages

GitHub Pages hosts only the static React frontend; it does not run the FastAPI backend. Deploy the backend separately using the instructions above before expecting sign-in, uploads, or reports to work.

1. In the GitHub repository, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**.
2. If the backend is already hosted, in **Settings → Secrets and variables → Actions → Variables**, create the repository variable `REACT_APP_API_URL` with its public HTTPS base URL (for example, `https://api.example.com`). This value is included in the public frontend bundle; never put credentials or other secrets there. The frontend can deploy without this variable, but API features will not work until a backend is configured.
3. Add the GitHub Pages site origin (for this repository, `https://samyuktha1629.github.io`) to the backend's comma-separated `CORS_ORIGINS` setting, then redeploy the backend.
4. Push the workflow and frontend changes to `main`, or run **Deploy frontend to GitHub Pages** from the repository's **Actions** tab. The workflow builds the app with the correct repository subpath and publishes `frontend/build`.
5. After a successful run, open the URL shown by the deployment job (normally `https://samyuktha1629.github.io/Veridoc-AI/`) and verify that the page loads and can reach the API.

GitHub Pages sites are public. The backend's public-registration/shared-workspace and privacy considerations above apply; do not upload real identity documents unless the deployment has been secured and approved for that use.

### Custom domain and verification

1. Check whether `veridoc.ai` (or your chosen name) is available with an accredited domain registrar and register it in your account if available. Registration and renewal are paid account actions.
2. Add the registered domain in Netlify's domain settings. Apply the DNS records Netlify displays at your registrar; do not guess record values. Wait for DNS propagation and the provider to issue HTTPS.
3. If using a separate API subdomain such as `api.veridoc.ai`, add it at the backend host, apply that host's displayed DNS records, enable HTTPS, set `REACT_APP_API_URL=https://api.veridoc.ai`, and set backend `CORS_ORIGINS` to the exact frontend origin. Rebuild/redeploy the frontend and restart/redeploy the backend after changing settings.
4. From a second device on a separate network, open the HTTPS site, sign in, upload a permitted test document, open its report, download its PDF, save a reviewer decision, and confirm sign-out/expired-session behavior. Also test a rejected file type and a backend outage. Do not use real identity documents for smoke tests.

No service, custom domain, or second-device test is claimed as live or complete by this repository change. Connecting Git hosting, setting production secrets, purchasing/configuring a domain, paying any provider fees, and performing the live-device check still require your accounts and approval.

## Tests

Run focused backend logic tests from the repository root:

```powershell
python -m unittest discover -s backend\tests
```
