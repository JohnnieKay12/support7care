# Support7Care Employment Application — starter project

This starter recreates the broad sections of the supplied Word application as a responsive React form and includes a Node/Express API that can email submissions using Resend.

## Important before production
- Get the employer's approval for the exact online form wording, especially the conviction, equality-monitoring, health, vaccination, GDPR and working-time sections.
- This form collects sensitive personal and financial information. Do not use this starter in production until the company has approved the lawful basis, secure access, retention/deletion, incident handling and whether full data should be emailed. Ordinary email may not be an appropriate channel for all fields.
- The starter sends the form's submitted fields in the email body; it does not create a PDF attachment or save applications to a database.
- Add rate limiting, bot protection, server-side validation, logging policy, and a secure deployment configuration before production.
- The sender email/domain must be verified with Resend. Use a company-controlled account and API key.

## Install

```bash
npm install
```

Create `server/.env` based on `.env.example` (copy the variables into it) and supply a real Resend API key and verified sender address. Never expose the API key in React or commit it to Git.

## Run locally

Terminal 1:

```bash
npm run server
```

Terminal 2:

```bash
npm run dev
```

Open the Vite URL shown in Terminal 2. The Vite development server proxies `/api` requests to `http://localhost:4000`.

## Email setup

1. Create a Resend account controlled by the company.
2. Verify the company's sending domain/address as required by Resend.
3. Add `RESEND_API_KEY`, `FROM_EMAIL`, and `RECRUITMENT_EMAIL` to `server/.env`.
4. Test with non-real sample information and a company-approved test inbox.

## Known next steps
- Review all labels/options against the Word document with the employer.
- Add more precise validation and accessible error summaries.
- Add server-side rate limiting and spam protection.
- Decide whether to store applications in a protected database or send a secure download link rather than email sensitive fields directly.
- Deploy the API and frontend with environment variables configured in the hosting dashboards; set `FRONTEND_ORIGIN` to the actual site origin and configure the frontend API URL for production.
