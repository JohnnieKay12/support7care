import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });
import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';

const app = express();
const port = Number(process.env.PORT || 4000);
app.use(cors({ 
  origin: [
    'https://support7care.vercel.app',
    'http://localhost:5173'
  ]
}));
app.use(express.json({ limit: '100kb' }));

const recruitmentEmails = (process.env.RECRUITMENT_EMAIL || '')
  .split(',')
  .map(email => email.trim())
  .filter(Boolean);

const allowedKeys = new Set([
  'positionAppliedFor','title','firstName','lastName','middleNames','preferredName','nationality','dateOfBirth','currentAddress','postCode','phoneNumber','emailAddress','nationalInsuranceNumber','professionalRegistrationNumber','ukDriversLicence','ownsCar','rightToWorkUK','needsWorkPermit',
  'nextOfKinFullName','nextOfKinRelationship','nextOfKinContactNumber','nextOfKinEmail','nextOfKinPhone','nextOfKinAddress','nextOfKinPostCode',
  'permissionToContactReferees','bankAccountName','bankName','bankAccountNumber','bankSortCode','payslipEmail','bankDetailsConfirmed','employeeStatement','studentLoanStatus','studentLoanPlan','hasConvictions','convictionDetails',
  'workingTimeCandidateName','workingTimeSignature','workingTimeDate','declarationCandidateName','declarationSignature','declarationDate','declarationsAccepted','gender','ethnicGroup','religionBelief','sexuality',
  'healthAffectWork','healthAffectWorkDetails','workRelatedHealthCondition','workRelatedHealthDetails','conditionManaged','conditionManagedDetails','currentTreatmentMedication','treatmentMedicationDetails','treatmentManaged','treatmentManagedDetails','needsWorkAdjustments','workAdjustmentsDetails','healthHistory','healthHistoryDetails','registeredDisabled','registeredDisabledDetails','ukAbsencePeriods','bcgVaccination','covidVaccinated','covidFirstVaccineDate','covidSecondVaccineDate','covidBoosterDate1','covidBoosterDate2','finalCandidateName','finalSignature','finalSignatureDate','finalDeclarationConfirmed',
  ...Array.from({length:5},(_,i)=>{const n=i+1;return [`employment${n}StartDate`,`employment${n}EndDate`,`employment${n}Company`,`employment${n}Position`,`employment${n}ReasonForLeaving`]}).flat(),
  ...Array.from({length:3},(_,i)=>{const n=i+1;return [`referee${n}Employer`,`referee${n}FullName`,`referee${n}Email`,`referee${n}Phone`,`referee${n}Address`,`referee${n}PostCode`,`referee${n}StartDate`,`referee${n}EndDate`]}).flat(),
  ...Array.from({length:3},(_,i)=>{const n=i+1;return [`otherVaccination${n}NameA`,`otherVaccination${n}DateA`,`otherVaccination${n}NameB`,`otherVaccination${n}DateB`]}).flat()
]);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.post('/api/applications', async (req, res) => {
  try {
    if (
      !process.env.RESEND_API_KEY ||
      !process.env.FROM_EMAIL ||
      recruitmentEmails.length === 0
    ){
      return res.status(503).json({ message: 'Email is not configured yet. Please contact the site administrator.' });
    }
    const input = req.body;
    if (!input || typeof input !== 'object' || Array.isArray(input)) return res.status(400).json({ message: 'Invalid application data.' });
    const application = {};
    for (const [key, value] of Object.entries(input)) {
      if (!allowedKeys.has(key)) continue;
      const normalized = Array.isArray(value) ? value.slice(0, 30).map(v => String(v).slice(0, 3000)) : String(value ?? '').slice(0, 3000);
      application[key] = normalized;
    }
    for (const key of ['firstName','lastName','positionAppliedFor','emailAddress']) {
      if (!String(application[key] || '').trim()) return res.status(400).json({ message: 'Please complete the required name, position and email fields.' });
    }
    const rows = Object.entries(application).map(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
      const shown = Array.isArray(value) ? value.join(', ') : value;
      return `<tr><th style="text-align:left;vertical-align:top;padding:8px;border:1px solid #ddd;background:#f5f7fa">${escapeHtml(label)}</th><td style="padding:8px;border:1px solid #ddd;white-space:pre-wrap">${escapeHtml(shown || '—')}</td></tr>`;
    }).join('');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: recruitmentEmails,
      replyTo: String(application.emailAddress),
      subject: `Employment application: ${String(application.firstName)} ${String(application.lastName)} — ${String(application.positionAppliedFor)}`,
      html: `<h2>Support7Care Limited — Employment Application</h2><p>A new application was submitted through the website.</p><table style="border-collapse:collapse;width:100%;font:14px Arial,sans-serif">${rows}</table><p style="color:#666;font-size:12px">This email contains sensitive personal information. Handle it only under the company's approved data-protection and retention procedures.</p>`
    });
    if (error) {
      console.error('Email provider error:', error.message);
      return res.status(502).json({ message: 'The email provider could not send the application. Please try again later.' });
    }
    return res.status(200).json({ message: 'Application submitted.' });
  } catch (error) {
    console.error('Submission error:', error.message);
    return res.status(500).json({ message: 'Something went wrong while submitting. Please try again later.' });
  }
});

app.listen(port, () => console.log(`Support7Care API running on http://localhost:${port}`));
