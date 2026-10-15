import { useState } from 'react';
import { ShieldCheck, Send, ClipboardList } from 'lucide-react';

const recruitmentEmail = 'leviemmanuel25@gmail.com';

function Field({ label, name, type = 'text', required = false, options, hint, full = false }) {
  return <div className={`field ${full ? 'field-full' : ''}`}>
    <label htmlFor={name}>{label}{required && <span className="required"> *</span>}</label>
    {options ? <select id={name} name={name} required={required} defaultValue="">
      <option value="">Select an option</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select> : type === 'textarea' ? <textarea id={name} name={name} rows="3" required={required} /> :
      <input id={name} name={name} type={type} required={required} />}
    {hint && <small>{hint}</small>}
  </div>;
}

function ChoiceGroup({ legend, name, options, type = 'radio', required = false }) {
  return <fieldset className="choice-group"><legend>{legend}{required && <span className="required"> *</span>}</legend>
    <div className="choice-list">{options.map((option) => <label className="choice" key={option}>
      <input type={type} name={name} value={option} required={required && type === 'radio'} /> <span>{option}</span>
    </label>)}</div>
  </fieldset>;
}

function Section({ number, title, description, children }) {
  return <section className="form-section">
    <div className="section-heading"><span className="section-number">{number}</span><div><h2>{title}</h2>{description && <p>{description}</p>}</div></div>
    <div className="field-grid">{children}</div>
  </section>;
}

function App() {
  const [status, setStatus] = useState({ kind: '', message: '' });
  const [sending, setSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ kind: '', message: '' });
    setSending(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    const application = {};
    for (const [key, value] of data.entries()) {
      if (key in application) application[key] = Array.isArray(application[key]) ? [...application[key], value] : [application[key], value];
      else application[key] = value;
    }
    try {
      const response = await fetch('https://support7care.onrender.com/api/applications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(application)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Submission failed. Please try again.');
      setStatus({ kind: 'success', message: 'Your application has been submitted successfully.' });
      form.reset();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setStatus({ kind: 'error', message: error.message || 'Could not submit. Check your connection and try again.' });
    } finally { setSending(false); }
  }

  return <main className="page-shell">
    <header className="brand-header">
      <div className="brand-mark"><ClipboardList size={27} /></div>
      <div><p className="eyebrow">SUPPORT7CARE LIMITED</p><h1>Application Form for Employment</h1><p className="subtitle">Please complete all applicable sections carefully.</p></div>
    </header>
    <div className="privacy-note"><ShieldCheck size={20} /><p><strong>Before you begin:</strong> This form requests personal, financial and health information. Complete it only through the employer-approved application channel.</p></div>
    {status.message && <div role="status" className={`status-message ${status.kind}`}>{status.message}</div>}

    <form onSubmit={handleSubmit}>
      <Section number="01" title="Personal Details">
        <Field label="Position Applied For" name="positionAppliedFor" required />
        <Field label="Title" name="title" options={['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Other']} required />
        <Field label="First Name" name="firstName" required />
        <Field label="Last Name" name="lastName" required />
        <Field label="Middle/Other Names" name="middleNames" />
        <Field label="Preferred Name" name="preferredName" />
        <Field label="Nationality" name="nationality" required />
        <Field label="Date of Birth" name="dateOfBirth" type="date" required />
        <Field label="Current Address" name="currentAddress" full required />
        <Field label="Post Code" name="postCode" />
        <Field label="Phone No." name="phoneNumber" type="tel" required />
        <Field label="Email Address" name="emailAddress" type="email" required />
        <Field label="National Insurance Number" name="nationalInsuranceNumber" />
        <Field label="NMC/GMP/HPC Number (if applicable)" name="professionalRegistrationNumber" />
        <ChoiceGroup legend="Do you have a full UK driver's licence?" name="ukDriversLicence" options={['Yes', 'No']} required />
        <ChoiceGroup legend="Do you own a car?" name="ownsCar" options={['Yes', 'No']} required />
        <ChoiceGroup legend="Do you have the right to work in the UK?" name="rightToWorkUK" options={['Yes', 'No']} required />
        <ChoiceGroup legend="Do you need a work permit?" name="needsWorkPermit" options={['Yes', 'No']} required />
      </Section>

      <Section number="02" title="Next of Kin">
        <Field label="Next of Kin Full Name" name="nextOfKinFullName" required />
        <Field label="Relationship" name="nextOfKinRelationship" required />
        <Field label="Contact No." name="nextOfKinContactNumber" type="tel" required />
        <Field label="Email Address" name="nextOfKinEmail" type="email" />
        <Field label="Phone No." name="nextOfKinPhone" type="tel" />
        <Field label="Current Address" name="nextOfKinAddress" full />
        <Field label="Post Code" name="nextOfKinPostCode" />
      </Section>

      <Section number="03" title="Previous Employment" description="A minimum of 5 years of full employment history. Start with your most recent employment and explain any gaps in each year.">
        {[1,2,3,4,5].map((n) => <div className="repeat-card field-full" key={n}><h3>Employment {n}</h3><div className="field-grid">
          <Field label="Start Date" name={`employment${n}StartDate`} type="date" />
          <Field label="End Date" name={`employment${n}EndDate`} type="date" />
          <Field label="Employment Company" name={`employment${n}Company`} />
          <Field label="Position Held" name={`employment${n}Position`} />
          <Field label="Reason for Leaving / Employment Gap" name={`employment${n}ReasonForLeaving`} full />
        </div></div>)}
      </Section>

      <Section number="04" title="Reference Details" description="Provide details of at least two professional referees. One must be your present or most recent employer. Work email addresses are required.">
        {[1,2,3].map((n) => <div className="repeat-card field-full" key={n}><h3>Referee {n}{n < 3 ? ' (required)' : ' (optional)'}</h3><div className="field-grid">
          <Field label="Name of Employer" name={`referee${n}Employer`} required={n < 3} />
          <Field label="Referee's Full Name" name={`referee${n}FullName`} required={n < 3} />
          <Field label="Work Email Address" name={`referee${n}Email`} type="email" required={n < 3} />
          <Field label="Phone No." name={`referee${n}Phone`} type="tel" />
          <Field label="Address" name={`referee${n}Address`} />
          <Field label="Post Code" name={`referee${n}PostCode`} />
          <Field label="Start Date" name={`referee${n}StartDate`} type="date" />
          <Field label="End Date" name={`referee${n}EndDate`} type="date" />
        </div></div>)}
        <ChoiceGroup legend="I permit the agency to contact the referees above" name="permissionToContactReferees" options={['Yes, I permit contact']} type="checkbox" />
      </Section>

      <Section number="05" title="Bank Details" description="Enter these details only if this form is being submitted through the company's approved secure channel.">
        <Field label="Account Name (as it appears on your account)" name="bankAccountName" required />
        <Field label="Bank/Building Society Name" name="bankName" required />
        <Field label="Account Number" name="bankAccountNumber" required />
        <Field label="Sort Code" name="bankSortCode" required />
        <Field label="Email Address for Pay Slip" name="payslipEmail" type="email" required />
        <ChoiceGroup legend="I confirm the bank details are correct and will advise the company of any changes" name="bankDetailsConfirmed" options={['I confirm']} type="checkbox" required />
      </Section>

      <Section number="06" title="Employee Statement" description="Select the statement that applies to you.">
        <ChoiceGroup legend="Please select A, B or C" name="employeeStatement" options={[
          'A — This is my first job since 6 April, and I have not received Jobseeker’s Allowance, Employment and Support Allowance, Taxable Incapacity Benefit, or a State or Occupational pension.',
          'B — This is now my only job, but since 6 April I have had another job or received Jobseeker’s Allowance, Employment and Support Allowance, or Taxable Incapacity Benefit. I do not receive a State or Occupational pension.',
          'C — As well as my new job, I have another job or receive a State or Occupational pension.'
        ]} required />
      </Section>

      <Section number="07" title="Student Loan">
        <ChoiceGroup legend="A. Does any of the following apply: you have no student loan; are still studying on the course; completed or left after the start of the current tax year on 6 April; or are already making agreed regular direct-debit repayments?" name="studentLoanStatus" options={['No', 'Yes']} required />
        <ChoiceGroup legend="B. If Yes, select all student loan plans that apply" name="studentLoanPlan" options={['Plan 1', 'Plan 2', 'Plan 4']} type="checkbox" />
        <p className="form-help field-full">The Word form includes a guide to student loan plan types. Confirm that the plan guidance remains current before publishing this online version.</p>
      </Section>

      <Section number="08" title="Rehabilitation of Offenders Act" description="The original form asks candidates to disclose convictions where legally required or relevant to the role. The employer should confirm that this wording is legally appropriate before publishing.">
        <ChoiceGroup legend="Do you have any convictions to disclose?" name="hasConvictions" options={['Yes', 'No']} required />
        <Field label="If Yes, please give details" name="convictionDetails" type="textarea" full />
      </Section>

      <Section number="09" title="Working Time Regulations" description="The original form explains the option to opt out of the 48-hour weekly working limit and states that signing is voluntary.">
        <Field label="Candidate Full Name" name="workingTimeCandidateName" />
        <Field label="Signature (type your full name)" name="workingTimeSignature" />
        <Field label="Date" name="workingTimeDate" type="date" />
      </Section>

      <Section number="10" title="Declarations and Data Protection">
        <div className="legal-copy field-full"><h3>Declarations</h3><p>I confirm that the information given in this application is correct to the best of my knowledge. I consent to Support7Care Limited verifying the information in this application to comply with recruitment procedures and patient-safety requirements.</p>
          <h3>Termination of Employment</h3><p>The original form states that misleading or false information may result in termination of employment and that company policies must be followed.</p>
          <h3>Data Protection and GDPR</h3><p>The original form explains how application data may be used for suitable locum opportunities, shared with relevant clients or auditors where appropriate, and processed in line with applicable data-protection legislation. The company should approve and verify the complete privacy notice before this form goes live.</p>
          <h3>Candidate Interviews</h3><p>By signing, the candidate declares that an interview has taken place in person or virtually and that they have seen and are happy with the interview contents and result.</p>
          <h3>Company Documentation</h3><p>By signing, the candidate declares that they have received, read and understood the applicable company documentation listed in the original form.</p>
        </div>
        <Field label="Candidate Full Name" name="declarationCandidateName" required />
        <Field label="Signature (type your full name)" name="declarationSignature" required />
        <Field label="Date" name="declarationDate" type="date" required />
        <ChoiceGroup legend="I have read and agree to the declarations above" name="declarationsAccepted" options={['I agree']} type="checkbox" required />
      </Section>

      <Section number="11" title="Equal Opportunity Monitoring" description="The original form includes gender, race/ethnicity, religion/belief and sexuality monitoring questions. Confirm the lawful basis, need, privacy handling and voluntary nature of these questions with the employer before collecting this data online.">
        <ChoiceGroup legend="Gender" name="gender" options={['Male', 'Female', 'I do not wish to disclose']} />
        <ChoiceGroup legend="Race / Ethnic Group" name="ethnicGroup" options={[
          'White British', 'White Irish', 'Any other white background', 'White & Asian', 'White & Black African', 'White & Black Caribbean', 'Any other mixed background',
          'Black African', 'Black Caribbean', 'Any other Black background', 'Bangladeshi', 'Indian', 'Pakistani', 'Chinese', 'Any other Asian background', 'Any other ethnic group', 'I do not want to disclose this'
        ]} />
        <ChoiceGroup legend="Religion / Belief" name="religionBelief" options={['Atheism', 'Buddhism', 'Christianity', 'Islam', 'Jainism', 'Sikhism', 'Judaism', 'Hinduism', 'Other', 'I do not wish to disclose this']} />
        <ChoiceGroup legend="Sexuality" name="sexuality" options={['Lesbian', 'Gay', 'Bisexual', 'Heterosexual', 'I do not wish to disclose this']} />
      </Section>

      <Section number="12" title="Health Questionnaire" description="These questions reproduce the topics in the Word form. Health information is sensitive personal data; the employer must approve the lawful basis, access controls and retention policy before collecting it online.">
        <ChoiceGroup legend="1. Do you have an illness, impairment or disability (physical or psychological) which may affect your work?" name="healthAffectWork" options={['Yes', 'No']} />
        <Field label="If Yes, give details" name="healthAffectWorkDetails" type="textarea" full />
        <ChoiceGroup legend="2. Have you ever had an illness, impairment or disability caused or made worse by your work?" name="workRelatedHealthCondition" options={['Yes', 'No']} />
        <Field label="If Yes, give details" name="workRelatedHealthDetails" type="textarea" full />
        <ChoiceGroup legend="2a. If you declared a condition, is it currently well managed and controlled?" name="conditionManaged" options={['Yes', 'No', 'Not applicable']} />
        <Field label="If No, give details" name="conditionManagedDetails" type="textarea" full />
        <ChoiceGroup legend="3. Are you having or waiting for treatment/investigations, or taking regular medication?" name="currentTreatmentMedication" options={['Yes', 'No']} />
        <Field label="If Yes, give details and list medication" name="treatmentMedicationDetails" type="textarea" full />
        <ChoiceGroup legend="3a. If Yes, is it currently well managed and controlled?" name="treatmentManaged" options={['Yes', 'No', 'Not applicable']} />
        <Field label="If No, give details" name="treatmentManagedDetails" type="textarea" full />
        <ChoiceGroup legend="4. Do you think you may need adjustments or assistance to do the job?" name="needsWorkAdjustments" options={['Yes', 'No']} />
        <Field label="If Yes, give details" name="workAdjustmentsDetails" type="textarea" full />
        <ChoiceGroup legend="Have you ever had or suffered from any of the following? Select all that apply." name="healthHistory" options={['Epilepsy/Blackouts', 'Mental Disorders', 'Migraine/Headaches', 'Sensory Impairment', 'Skin Allergies', 'Back pain/Previous Back problem', 'Heart Condition', 'Asthma or respiratory ailments', 'Recurring Incidence of Illness', 'Diabetes', 'High blood pressure', 'Medical condition affecting sleep', 'None of these']} type="checkbox" />
        <Field label="If Yes, please give details" name="healthHistoryDetails" type="textarea" full />
        <ChoiceGroup legend="Are you registered disabled?" name="registeredDisabled" options={['Yes', 'No']} />
        <Field label="If Yes, please give details" name="registeredDisabledDetails" type="textarea" full />
        <Field label="Periods spent outside the United Kingdom as a resident (do not include holidays)" name="ukAbsencePeriods" type="textarea" full hint="List up to three periods, including dates and country, if applicable." />
      </Section>

      <Section number="13" title="Immunisations and Vaccinations">
        <ChoiceGroup legend="Have you had a BCG vaccination?" name="bcgVaccination" options={['Yes', 'No']} />
        <ChoiceGroup legend="Have you been vaccinated for COVID-19?" name="covidVaccinated" options={['Yes', 'No']} />
        <Field label="Date of COVID-19 first vaccine" name="covidFirstVaccineDate" type="date" />
        <Field label="Date of COVID-19 second vaccine" name="covidSecondVaccineDate" type="date" />
        <Field label="Date of booster 1" name="covidBoosterDate1" type="date" />
        <Field label="Date of booster 2" name="covidBoosterDate2" type="date" />
        {[1,2,3].map((n) => <div className="repeat-card field-full" key={n}><h3>Other vaccination {n}</h3><div className="field-grid">
          <Field label="Immunisation / Vaccination" name={`otherVaccination${n}NameA`} />
          <Field label="Date" name={`otherVaccination${n}DateA`} type="date" />
          <Field label="Immunisation / Vaccination" name={`otherVaccination${n}NameB`} />
          <Field label="Date" name={`otherVaccination${n}DateB`} type="date" />
        </div></div>)}
      </Section>

      <Section number="14" title="Final Candidate Declaration">
        <p className="form-help field-full">I declare that the information given is correct to the best of my knowledge. I believe I am physically and mentally fit to undertake this post. I understand that omissions or false statements may disqualify me from employment or lead to dismissal. I give the employer the right to investigate all references.</p>
        <Field label="Candidate Full Name" name="finalCandidateName" required />
        <Field label="Signature (type your full name)" name="finalSignature" required />
        <Field label="Date" name="finalSignatureDate" type="date" required />
        <ChoiceGroup legend="I confirm this final declaration" name="finalDeclarationConfirmed" options={['I confirm']} type="checkbox" required />
      </Section>

      <div className="submit-panel"><div><h2>Ready to submit?</h2><p>Please review your answers. By selecting Submit Application, the details will be sent to the employer's configured recruitment email.</p></div>
        <button className="submit-button" type="submit" disabled={sending}>{sending ? 'Submitting…' : 'Submit Application'} <Send size={18} /></button>
        <p className="small-print">Company: Support7Care Limited · First Floor Winton House, Stoke Road, Stoke-on-Trent, ST4 2RW · Company No. 11360660</p>
      </div>
    </form>
    <footer>Support7Care Limited · Employment Application</footer>
  </main>;
}

export default App;
