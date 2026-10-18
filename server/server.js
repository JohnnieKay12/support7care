import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://support7care.vercel.app'
  ]
}));

app.use(express.json({ limit: '100kb' }));

const allowedKeys = new Set([
  'positionAppliedFor','title','firstName','lastName','middleNames',
  'preferredName','nationality','dateOfBirth','currentAddress','postCode',
  'phoneNumber','emailAddress','nationalInsuranceNumber',
  'professionalRegistrationNumber','ukDriversLicence','ownsCar',
  'rightToWorkUK','needsWorkPermit',
  'nextOfKinFullName','nextOfKinRelationship','nextOfKinContactNumber',
  'nextOfKinEmail','nextOfKinPhone','nextOfKinAddress','nextOfKinPostCode',
  'permissionToContactReferees','bankAccountName','bankName',
  'bankAccountNumber','bankSortCode','payslipEmail','bankDetailsConfirmed',
  'employeeStatement','studentLoanStatus','studentLoanPlan','hasConvictions',
  'convictionDetails','workingTimeCandidateName','workingTimeSignature',
  'workingTimeDate','declarationCandidateName','declarationSignature',
  'declarationDate','declarationsAccepted','gender','ethnicGroup',
  'religionBelief','sexuality','healthAffectWork','healthAffectWorkDetails',
  'workRelatedHealthCondition','workRelatedHealthDetails',
  'conditionManaged','conditionManagedDetails','currentTreatmentMedication',
  'treatmentMedicationDetails','treatmentManaged','treatmentManagedDetails',
  'needsWorkAdjustments','workAdjustmentsDetails','healthHistory',
  'healthHistoryDetails','registeredDisabled','registeredDisabledDetails',
  'ukAbsencePeriods','bcgVaccination','covidVaccinated',
  'covidFirstVaccineDate','covidSecondVaccineDate','covidBoosterDate1',
  'covidBoosterDate2','finalCandidateName','finalSignature',
  'finalSignatureDate','finalDeclarationConfirmed',

  ...Array.from({ length: 5 }, (_, i) => {
    const n = i + 1;
    return [
      `employment${n}StartDate`,
      `employment${n}EndDate`,
      `employment${n}Company`,
      `employment${n}Position`,
      `employment${n}ReasonForLeaving`
    ];
  }).flat(),

  ...Array.from({ length: 3 }, (_, i) => {
    const n = i + 1;
    return [
      `referee${n}Employer`,
      `referee${n}FullName`,
      `referee${n}Email`,
      `referee${n}Phone`,
      `referee${n}Address`,
      `referee${n}PostCode`,
      `referee${n}StartDate`,
      `referee${n}EndDate`
    ];
  }).flat(),

  ...Array.from({ length: 3 }, (_, i) => {
    const n = i + 1;
    return [
      `otherVaccination${n}NameA`,
      `otherVaccination${n}DateA`,
      `otherVaccination${n}NameB`,
      `otherVaccination${n}DateB`
    ];
  }).flat()
]);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/applications', async (req, res) => {
  try {
    if (
      !process.env.RESEND_API_KEY ||
      !process.env.FROM_EMAIL ||
      !process.env.RECRUITMENT_EMAIL
    ) {
      return res.status(503).json({
        message: 'Email is not configured yet. Please contact the site administrator.'
      });
    }

    const input = req.body;

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return res.status(400).json({
        message: 'Invalid application data.'
      });
    }

    const application = {};

    for (const [key, value] of Object.entries(input)) {
      if (!allowedKeys.has(key)) continue;

      application[key] = Array.isArray(value)
        ? value.slice(0, 30).map(v => String(v).slice(0, 3000))
        : String(value ?? '').slice(0, 3000);
    }

    for (const key of [
      'firstName',
      'lastName',
      'positionAppliedFor',
      'emailAddress'
    ]) {
      if (!String(application[key] || '').trim()) {
        return res.status(400).json({
          message: 'Please complete the required name, position and email fields.'
        });
      }
    }

    const rows = Object.entries(application).map(([key, value]) => {
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, s => s.toUpperCase());

      const shown = Array.isArray(value) ? value.join(', ') : value;

      return `
        <tr>
          <th style="text-align:left;vertical-align:top;padding:8px;border:1px solid #ddd;background:#f5f7fa">
            ${escapeHtml(label)}
          </th>
          <td style="padding:8px;border:1px solid #ddd;white-space:pre-wrap">
            ${escapeHtml(shown || '—')}
          </td>
        </tr>
      `;
    }).join('');

    const resend = new Resend(process.env.RESEND_API_KEY);

    const applicantName =
      `${application.firstName} ${application.lastName}`;

    const subject =
      `Employment application: ${applicantName} — ${application.positionAppliedFor}`;

    // 1. Send the full application to the admin/recruitment team.
    const { error: adminError } = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: [process.env.RECRUITMENT_EMAIL],
      replyTo: String(application.emailAddress),
      subject,
      html: `
        <h2>Support7Care Limited — Employment Application</h2>
        <p>A new application was submitted through the website.</p>

        <table style="border-collapse:collapse;width:100%;font:14px Arial,sans-serif">
          ${rows}
        </table>

        <p style="color:#666;font-size:12px">
          This email contains sensitive personal information.
          Handle it only under the company's approved data-protection
          and retention procedures.
        </p>
      `
    });

    if (adminError) {
      console.error('Admin email error:', adminError.message);

      return res.status(502).json({
        message: 'We could not send your application. Please try again later.'
      });
    }

    // 2. Send a receipt confirmation to the applicant.
    // Do not include their sensitive application details in this email.
    const { error: applicantError } = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: [String(application.emailAddress)],
      subject: 'We have received your Support7Care application',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#333;line-height:1.6">
          <h2>Support7Care Limited</h2>

          <p>Dear ${escapeHtml(application.firstName)},</p>

          <p>
            Thank you for applying for the position of
            <strong>${escapeHtml(application.positionAppliedFor)}</strong>
            at Support7Care Limited.
          </p>

          <p>
            We have received your application. Our recruitment team
            will review it and contact you if further information
            is required.
          </p>

          <p>
            This email confirms receipt of your application only.
            It does not mean that you have been offered a position.
          </p>

          <p>Thank you for your interest in Support7Care Limited.</p>

          <p>
            Kind regards,<br />
            Support7Care Recruitment Team
          </p>
        </div>
      `
    });

    if (applicantError) {
      console.error(
        'Applicant confirmation email error:',
        applicantError.message
      );

      // The admin has already received the application.
      return res.status(200).json({
        message: 'Your application was received by the recruitment team, but we could not send your confirmation email. Please contact the recruitment team if necessary.'
      });
    }

    return res.status(200).json({
      message: 'Application submitted successfully. A confirmation email has been sent to your email address.'
    });

  } catch (error) {
    console.error('Submission error:', error.message);

    return res.status(500).json({
      message: 'Something went wrong while submitting. Please try again later.'
    });
  }
});

app.listen(port, () => {
  console.log(`Support7Care API running on port ${port}`);
});
































// import dotenv from 'dotenv';
// dotenv.config({ path: 'server/.env' });
// import express from 'express';
// import cors from 'cors';
// import { Resend } from 'resend';

// const app = express();
// const port = Number(process.env.PORT || 4000);
// app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
// app.use(express.json({ limit: '100kb' }));

// const allowedKeys = new Set([
//   'positionAppliedFor','title','firstName','lastName','middleNames','preferredName','nationality','dateOfBirth','currentAddress','postCode','phoneNumber','emailAddress','nationalInsuranceNumber','professionalRegistrationNumber','ukDriversLicence','ownsCar','rightToWorkUK','needsWorkPermit',
//   'nextOfKinFullName','nextOfKinRelationship','nextOfKinContactNumber','nextOfKinEmail','nextOfKinPhone','nextOfKinAddress','nextOfKinPostCode',
//   'permissionToContactReferees','bankAccountName','bankName','bankAccountNumber','bankSortCode','payslipEmail','bankDetailsConfirmed','employeeStatement','studentLoanStatus','studentLoanPlan','hasConvictions','convictionDetails',
//   'workingTimeCandidateName','workingTimeSignature','workingTimeDate','declarationCandidateName','declarationSignature','declarationDate','declarationsAccepted','gender','ethnicGroup','religionBelief','sexuality',
//   'healthAffectWork','healthAffectWorkDetails','workRelatedHealthCondition','workRelatedHealthDetails','conditionManaged','conditionManagedDetails','currentTreatmentMedication','treatmentMedicationDetails','treatmentManaged','treatmentManagedDetails','needsWorkAdjustments','workAdjustmentsDetails','healthHistory','healthHistoryDetails','registeredDisabled','registeredDisabledDetails','ukAbsencePeriods','bcgVaccination','covidVaccinated','covidFirstVaccineDate','covidSecondVaccineDate','covidBoosterDate1','covidBoosterDate2','finalCandidateName','finalSignature','finalSignatureDate','finalDeclarationConfirmed',
//   ...Array.from({length:5},(_,i)=>{const n=i+1;return [`employment${n}StartDate`,`employment${n}EndDate`,`employment${n}Company`,`employment${n}Position`,`employment${n}ReasonForLeaving`]}).flat(),
//   ...Array.from({length:3},(_,i)=>{const n=i+1;return [`referee${n}Employer`,`referee${n}FullName`,`referee${n}Email`,`referee${n}Phone`,`referee${n}Address`,`referee${n}PostCode`,`referee${n}StartDate`,`referee${n}EndDate`]}).flat(),
//   ...Array.from({length:3},(_,i)=>{const n=i+1;return [`otherVaccination${n}NameA`,`otherVaccination${n}DateA`,`otherVaccination${n}NameB`,`otherVaccination${n}DateB`]}).flat()
// ]);

// function escapeHtml(value) {
//   return String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
// }

// app.get('/api/health', (_req, res) => res.json({ ok: true }));
// app.post('/api/applications', async (req, res) => {
//   try {
//     if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL || !process.env.RECRUITMENT_EMAIL) {
//       return res.status(503).json({ message: 'Email is not configured yet. Please contact the site administrator.' });
//     }
//     const input = req.body;
//     if (!input || typeof input !== 'object' || Array.isArray(input)) return res.status(400).json({ message: 'Invalid application data.' });
//     const application = {};
//     for (const [key, value] of Object.entries(input)) {
//       if (!allowedKeys.has(key)) continue;
//       const normalized = Array.isArray(value) ? value.slice(0, 30).map(v => String(v).slice(0, 3000)) : String(value ?? '').slice(0, 3000);
//       application[key] = normalized;
//     }
//     for (const key of ['firstName','lastName','positionAppliedFor','emailAddress']) {
//       if (!String(application[key] || '').trim()) return res.status(400).json({ message: 'Please complete the required name, position and email fields.' });
//     }
//     const rows = Object.entries(application).map(([key, value]) => {
//       const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
//       const shown = Array.isArray(value) ? value.join(', ') : value;
//       return `<tr><th style="text-align:left;vertical-align:top;padding:8px;border:1px solid #ddd;background:#f5f7fa">${escapeHtml(label)}</th><td style="padding:8px;border:1px solid #ddd;white-space:pre-wrap">${escapeHtml(shown || '—')}</td></tr>`;
//     }).join('');
//     const resend = new Resend(process.env.RESEND_API_KEY);
//     const { error } = await resend.emails.send({
//       from: process.env.FROM_EMAIL,
//       to: [process.env.RECRUITMENT_EMAIL],
//       replyTo: String(application.emailAddress),
//       subject: `Employment application: ${String(application.firstName)} ${String(application.lastName)} — ${String(application.positionAppliedFor)}`,
//       html: `<h2>Support7Care Limited — Employment Application</h2><p>A new application was submitted through the website.</p><table style="border-collapse:collapse;width:100%;font:14px Arial,sans-serif">${rows}</table><p style="color:#666;font-size:12px">This email contains sensitive personal information. Handle it only under the company's approved data-protection and retention procedures.</p>`
//     });
//     if (error) {
//       console.error('Email provider error:', error.message);
//       return res.status(502).json({ message: 'The email provider could not send the application. Please try again later.' });
//     }
//     return res.status(200).json({ message: 'Application submitted.' });
//   } catch (error) {
//     console.error('Submission error:', error.message);
//     return res.status(500).json({ message: 'Something went wrong while submitting. Please try again later.' });
//   }
// });

// app.listen(port, () => console.log(`Support7Care API running on http://localhost:${port}`));
