import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  TabStopPosition,
  TabStopType,
} from 'docx';
import { saveAs } from 'file-saver';

export interface CVData {
  candidate: {
    full_name: string;
    email?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    date_of_birth?: string | null;
    nationality?: string | null;
    current_city?: string | null;
    current_country?: string | null;
    gender?: string | null;
    marital_status?: string | null;
    linkedin?: string | null;
    passport_number?: string | null;
    passport_expiry?: string | null;
    national_id_number?: string | null;
    parents_names?: string | null;
    driver_license?: any;
    salary_expectations?: any;
    availability?: any;
    job_preferences?: any;
  };
  education?: Array<{
    education_level: string;
    field_of_study?: string | null;
    institution_name?: string | null;
    graduation_year?: number | null;
    degree_obtained?: string | null;
  }>;
  workExperience?: Array<{
    job_title: string;
    company_name?: string | null;
    country?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    job_description?: string | null;
  }>;
  languages?: Array<{
    language_name: string;
    proficiency_level: string;
  }>;
  skills?: Array<{
    skill_name: string;
    years_experience?: number | null;
  }>;
  references?: Array<{
    reference_name: string;
    position_title?: string | null;
    phone?: string | null;
    email?: string | null;
    relationship?: string | null;
  }>;
}

export type CVSection =
  | 'personal_info'
  | 'education'
  | 'work_experience'
  | 'languages'
  | 'skills'
  | 'references'
  | 'documents_passport'
  | 'salary_availability';

export const CV_SECTIONS: { key: CVSection; label: string; icon: string }[] = [
  { key: 'personal_info', label: 'Personal Information', icon: '👤' },
  { key: 'education', label: 'Education', icon: '🎓' },
  { key: 'work_experience', label: 'Work Experience', icon: '💼' },
  { key: 'languages', label: 'Languages', icon: '🗣️' },
  { key: 'skills', label: 'Skills', icon: '🛠️' },
  { key: 'references', label: 'References', icon: '📋' },
  { key: 'documents_passport', label: 'Documents & Passport', icon: '📄' },
  { key: 'salary_availability', label: 'Salary & Availability', icon: '💰' },
];

// ─── Colors ──────────────────────────────────────────────────────────────────
const PRIMARY_COLOR = '1a5276';
const ACCENT_COLOR = '2e86c1';
const LIGHT_BG = 'eaf2f8';

function infoRow(label: string, value: string | null | undefined): TableRow | null {
  if (!value) return null;
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 3000, type: WidthType.DXA },
        borders: noBorders(),
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, color: PRIMARY_COLOR })] })],
      }),
      new TableCell({
        width: { size: 6500, type: WidthType.DXA },
        borders: noBorders(),
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 20 })] })],
      }),
    ],
  });
}

function noBorders() {
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return { top: none, bottom: none, left: none, right: none };
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 26, color: PRIMARY_COLOR, font: 'Calibri' })],
    spacing: { before: 300, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT_COLOR } },
  });
}

// ─── DOCX Generator ─────────────────────────────────────────────────────────

export async function generateDocx(data: CVData, sections: CVSection[]): Promise<void> {
  const children: any[] = [];

  // Header / Name
  children.push(
    new Paragraph({
      children: [new TextRun({ text: data.candidate.full_name, bold: true, size: 36, color: PRIMARY_COLOR, font: 'Calibri' })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
    })
  );

  // Subtitle contact line
  const contactParts = [data.candidate.email, data.candidate.phone, [data.candidate.current_city, data.candidate.current_country].filter(Boolean).join(', ')].filter(Boolean);
  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactParts.join('  •  '), size: 20, color: '555555' })],
        spacing: { after: 200 },
      })
    );
  }

  // ─── Personal Info ──────────────────────────────────────────────────────
  if (sections.includes('personal_info')) {
    children.push(sectionHeading('Personal Information'));
    const c = data.candidate;
    const rows = [
      infoRow('Full Name', c.full_name),
      infoRow('Date of Birth', c.date_of_birth),
      infoRow('Gender', c.gender),
      infoRow('Nationality', c.nationality),
      infoRow('Marital Status', c.marital_status),
      infoRow('Location', [c.current_city, c.current_country].filter(Boolean).join(', ') || null),
      infoRow('Email', c.email),
      infoRow('Phone', c.phone),
      infoRow('WhatsApp', c.whatsapp),
      infoRow('LinkedIn', c.linkedin),
      infoRow('Parents Names', c.parents_names),
    ].filter(Boolean) as TableRow[];

    if (rows.length > 0) {
      children.push(new Table({ rows, width: { size: 9500, type: WidthType.DXA } }));
    }
  }

  // ─── Education ──────────────────────────────────────────────────────────
  if (sections.includes('education') && data.education && data.education.length > 0) {
    children.push(sectionHeading('Education'));
    for (const e of data.education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${e.education_level}${e.field_of_study ? ` in ${e.field_of_study}` : ''}`, bold: true, size: 22 }),
          ],
          spacing: { before: 100 },
        })
      );
      const sub = [e.institution_name, e.graduation_year?.toString()].filter(Boolean).join(' • ');
      if (sub) {
        children.push(new Paragraph({ children: [new TextRun({ text: sub, size: 20, color: '666666', italics: true })] }));
      }
      if (e.degree_obtained) {
        children.push(new Paragraph({ children: [new TextRun({ text: `Degree: ${e.degree_obtained}`, size: 20 })] }));
      }
    }
  }

  // ─── Work Experience ────────────────────────────────────────────────────
  if (sections.includes('work_experience') && data.workExperience && data.workExperience.length > 0) {
    children.push(sectionHeading('Work Experience'));
    for (const w of data.workExperience) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: w.job_title, bold: true, size: 22 })],
          spacing: { before: 100 },
        })
      );
      const sub = [w.company_name, w.country].filter(Boolean).join(', ');
      const dates = [w.start_date, w.end_date || 'Present'].filter(Boolean).join(' – ');
      if (sub || dates) {
        children.push(new Paragraph({
          children: [new TextRun({ text: [sub, dates].filter(Boolean).join('  |  '), size: 20, color: '666666', italics: true })],
        }));
      }
      if (w.job_description) {
        children.push(new Paragraph({ children: [new TextRun({ text: w.job_description, size: 20 })], spacing: { before: 40 } }));
      }
    }
  }

  // ─── Languages ──────────────────────────────────────────────────────────
  if (sections.includes('languages') && data.languages && data.languages.length > 0) {
    children.push(sectionHeading('Languages'));
    for (const l of data.languages) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: l.language_name, bold: true, size: 20 }),
          new TextRun({ text: ` — ${l.proficiency_level}`, size: 20, color: '666666' }),
        ],
        spacing: { before: 40 },
      }));
    }
  }

  // ─── Skills ─────────────────────────────────────────────────────────────
  if (sections.includes('skills') && data.skills && data.skills.length > 0) {
    children.push(sectionHeading('Skills'));
    const skillTexts = data.skills.map(s => `${s.skill_name}${s.years_experience ? ` (${s.years_experience}y)` : ''}`);
    children.push(new Paragraph({ children: [new TextRun({ text: skillTexts.join('  •  '), size: 20 })] }));
  }

  // ─── References ─────────────────────────────────────────────────────────
  if (sections.includes('references') && data.references && data.references.length > 0) {
    children.push(sectionHeading('References'));
    for (const r of data.references) {
      children.push(new Paragraph({
        children: [new TextRun({ text: r.reference_name, bold: true, size: 22 })],
        spacing: { before: 100 },
      }));
      const details = [r.position_title, r.relationship].filter(Boolean).join(' • ');
      if (details) {
        children.push(new Paragraph({ children: [new TextRun({ text: details, size: 20, color: '666666', italics: true })] }));
      }
      const contact = [r.phone ? `Tel: ${r.phone}` : null, r.email ? `Email: ${r.email}` : null].filter(Boolean).join('  |  ');
      if (contact) {
        children.push(new Paragraph({ children: [new TextRun({ text: contact, size: 20 })] }));
      }
    }
  }

  // ─── Documents & Passport ──────────────────────────────────────────────
  if (sections.includes('documents_passport')) {
    const c = data.candidate;
    const hasData = c.passport_number || c.national_id_number || c.driver_license;
    if (hasData) {
      children.push(sectionHeading('Documents & Passport'));
      const rows = [
        infoRow('Passport Number', c.passport_number),
        infoRow('Passport Expiry', c.passport_expiry),
        infoRow('National ID', c.national_id_number),
      ].filter(Boolean) as TableRow[];

      if (c.driver_license && typeof c.driver_license === 'object') {
        const dl = c.driver_license as any;
        if (dl.has_license) {
          rows.push(infoRow('Driver License', dl.categories?.join(', ') || 'Yes')!);
        }
      }

      if (rows.length > 0) {
        children.push(new Table({ rows, width: { size: 9500, type: WidthType.DXA } }));
      }
    }
  }

  // ─── Salary & Availability ─────────────────────────────────────────────
  if (sections.includes('salary_availability')) {
    const c = data.candidate;
    const hasSalary = c.salary_expectations && typeof c.salary_expectations === 'object';
    const hasAvail = c.availability && typeof c.availability === 'object';
    if (hasSalary || hasAvail) {
      children.push(sectionHeading('Salary & Availability'));
      const rows: TableRow[] = [];
      if (hasSalary) {
        const sal = c.salary_expectations as any;
        rows.push(infoRow('Expected Salary', `${sal.amount || ''} ${sal.currency || ''} / ${sal.period || ''}`.trim())!);
      }
      if (hasAvail) {
        const av = c.availability as any;
        rows.push(infoRow('Availability', av.start_date || av.notice_period || JSON.stringify(av))!);
      }
      const validRows = rows.filter(Boolean);
      if (validRows.length > 0) {
        children.push(new Table({ rows: validRows, width: { size: 9500, type: WidthType.DXA } }));
      }
    }
  }

  // ─── Footer ────────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Generated by GlobalWorker App • ${new Date().toLocaleDateString()}`, size: 16, color: 'AAAAAA', italics: true })],
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER,
    })
  );

  const doc = new Document({
    sections: [{ children }],
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22 } },
      },
    },
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `CV_${data.candidate.full_name.replace(/\s+/g, '_')}.docx`);
}

// ─── PDF Generator (via print) ──────────────────────────────────────────────

export function generatePdfHtml(data: CVData, sections: CVSection[]): string {
  const styles = `
    <style>
      @page { margin: 20mm; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; color: #222; line-height: 1.5; font-size: 13px; }
      .header { margin-bottom: 16px; }
      .header h1 { font-size: 28px; color: #1a5276; margin: 0; font-weight: 700; }
      .header .contact { color: #666; font-size: 12px; margin-top: 4px; }
      .section-title { font-size: 16px; font-weight: 700; color: #1a5276; border-bottom: 2px solid #2e86c1; padding-bottom: 4px; margin: 20px 0 10px; }
      .info-grid { display: grid; grid-template-columns: 160px 1fr; gap: 4px 12px; }
      .info-label { font-weight: 600; color: #1a5276; font-size: 12px; }
      .info-value { font-size: 12px; }
      .entry { margin-bottom: 12px; }
      .entry-title { font-weight: 600; font-size: 14px; }
      .entry-sub { color: #666; font-style: italic; font-size: 12px; }
      .entry-desc { font-size: 12px; margin-top: 2px; }
      .badge-list { display: flex; flex-wrap: wrap; gap: 6px; }
      .badge { background: #eaf2f8; padding: 3px 10px; border-radius: 12px; font-size: 11px; color: #1a5276; }
      .footer { text-align: center; color: #aaa; font-size: 10px; margin-top: 30px; font-style: italic; }
    </style>
  `;

  let html = '';

  // Header
  const contactParts = [data.candidate.email, data.candidate.phone, [data.candidate.current_city, data.candidate.current_country].filter(Boolean).join(', ')].filter(Boolean);
  html += `<div class="header"><h1>${esc(data.candidate.full_name)}</h1>`;
  if (contactParts.length) html += `<div class="contact">${contactParts.map(esc).join('  •  ')}</div>`;
  html += `</div>`;

  // Personal Info
  if (sections.includes('personal_info')) {
    const c = data.candidate;
    const fields = [
      ['Full Name', c.full_name], ['Date of Birth', c.date_of_birth], ['Gender', c.gender],
      ['Nationality', c.nationality], ['Marital Status', c.marital_status],
      ['Location', [c.current_city, c.current_country].filter(Boolean).join(', ')],
      ['Email', c.email], ['Phone', c.phone], ['WhatsApp', c.whatsapp], ['LinkedIn', c.linkedin],
      ['Parents Names', c.parents_names],
    ].filter(([, v]) => v) as [string, string][];

    if (fields.length) {
      html += `<div class="section-title">Personal Information</div><div class="info-grid">`;
      for (const [l, v] of fields) html += `<div class="info-label">${esc(l)}</div><div class="info-value">${esc(v)}</div>`;
      html += `</div>`;
    }
  }

  // Education
  if (sections.includes('education') && data.education?.length) {
    html += `<div class="section-title">Education</div>`;
    for (const e of data.education) {
      html += `<div class="entry"><div class="entry-title">${esc(e.education_level)}${e.field_of_study ? ` in ${esc(e.field_of_study)}` : ''}</div>`;
      const sub = [e.institution_name, e.graduation_year?.toString()].filter(Boolean).join(' • ');
      if (sub) html += `<div class="entry-sub">${esc(sub)}</div>`;
      if (e.degree_obtained) html += `<div class="entry-desc">Degree: ${esc(e.degree_obtained)}</div>`;
      html += `</div>`;
    }
  }

  // Work Experience
  if (sections.includes('work_experience') && data.workExperience?.length) {
    html += `<div class="section-title">Work Experience</div>`;
    for (const w of data.workExperience) {
      html += `<div class="entry"><div class="entry-title">${esc(w.job_title)}</div>`;
      const sub = [w.company_name, w.country].filter(Boolean).join(', ');
      const dates = [w.start_date, w.end_date || 'Present'].filter(Boolean).join(' – ');
      if (sub || dates) html += `<div class="entry-sub">${[sub, dates].filter(Boolean).map(esc).join('  |  ')}</div>`;
      if (w.job_description) html += `<div class="entry-desc">${esc(w.job_description)}</div>`;
      html += `</div>`;
    }
  }

  // Languages
  if (sections.includes('languages') && data.languages?.length) {
    html += `<div class="section-title">Languages</div><div class="badge-list">`;
    for (const l of data.languages) html += `<div class="badge">${esc(l.language_name)} — ${esc(l.proficiency_level)}</div>`;
    html += `</div>`;
  }

  // Skills
  if (sections.includes('skills') && data.skills?.length) {
    html += `<div class="section-title">Skills</div><div class="badge-list">`;
    for (const s of data.skills) html += `<div class="badge">${esc(s.skill_name)}${s.years_experience ? ` (${s.years_experience}y)` : ''}</div>`;
    html += `</div>`;
  }

  // References
  if (sections.includes('references') && data.references?.length) {
    html += `<div class="section-title">References</div>`;
    for (const r of data.references) {
      html += `<div class="entry"><div class="entry-title">${esc(r.reference_name)}</div>`;
      const detail = [r.position_title, r.relationship].filter(Boolean).join(' • ');
      if (detail) html += `<div class="entry-sub">${esc(detail)}</div>`;
      const contact = [r.phone ? `Tel: ${r.phone}` : null, r.email ? `Email: ${r.email}` : null].filter(Boolean).join('  |  ');
      if (contact) html += `<div class="entry-desc">${esc(contact)}</div>`;
      html += `</div>`;
    }
  }

  // Documents & Passport
  if (sections.includes('documents_passport')) {
    const c = data.candidate;
    const fields: [string, string][] = [];
    if (c.passport_number) fields.push(['Passport Number', c.passport_number]);
    if (c.passport_expiry) fields.push(['Passport Expiry', c.passport_expiry]);
    if (c.national_id_number) fields.push(['National ID', c.national_id_number]);
    if (c.driver_license && typeof c.driver_license === 'object') {
      const dl = c.driver_license as any;
      if (dl.has_license) fields.push(['Driver License', dl.categories?.join(', ') || 'Yes']);
    }
    if (fields.length) {
      html += `<div class="section-title">Documents & Passport</div><div class="info-grid">`;
      for (const [l, v] of fields) html += `<div class="info-label">${esc(l)}</div><div class="info-value">${esc(v)}</div>`;
      html += `</div>`;
    }
  }

  // Salary & Availability
  if (sections.includes('salary_availability')) {
    const c = data.candidate;
    const fields: [string, string][] = [];
    if (c.salary_expectations && typeof c.salary_expectations === 'object') {
      const s = c.salary_expectations as any;
      fields.push(['Expected Salary', `${s.amount || ''} ${s.currency || ''} / ${s.period || ''}`.trim()]);
    }
    if (c.availability && typeof c.availability === 'object') {
      const a = c.availability as any;
      fields.push(['Availability', a.start_date || a.notice_period || JSON.stringify(a)]);
    }
    if (fields.length) {
      html += `<div class="section-title">Salary & Availability</div><div class="info-grid">`;
      for (const [l, v] of fields) html += `<div class="info-label">${esc(l)}</div><div class="info-value">${esc(v)}</div>`;
      html += `</div>`;
    }
  }

  // Footer
  html += `<div class="footer">Generated by GlobalWorker App • ${new Date().toLocaleDateString()}</div>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>CV - ${esc(data.candidate.full_name)}</title>${styles}</head><body>${html}</body></html>`;
}

export function downloadPdf(data: CVData, sections: CVSection[]) {
  const htmlContent = generatePdfHtml(data, sections);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

function esc(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
