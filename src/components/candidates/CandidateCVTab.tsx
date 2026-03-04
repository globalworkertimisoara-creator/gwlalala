import { Loader2 } from 'lucide-react';
import { useUpdateCandidate } from '@/hooks/useCandidates';
import {
  useCandidateEducation,
  useSaveCandidateEducation,
  useCandidateWorkExperience,
  useSaveCandidateWorkExperience,
  useCandidateLanguages,
  useSaveCandidateLanguages,
  useCandidateSkills,
  useSaveCandidateSkills,
  useCandidateReferences,
  useSaveCandidateReferences,
} from '@/hooks/useCandidateCV';

import { CVPersonalInfo } from './cv/CVPersonalInfo';
import { CVEducation } from './cv/CVEducation';
import { CVWorkExperience } from './cv/CVWorkExperience';
import { CVLanguagesSkills } from './cv/CVLanguagesSkills';
import { CVDocumentsPassport } from './cv/CVDocumentsPassport';
import { CVSalaryAvailability } from './cv/CVSalaryAvailability';
import { CVReferences } from './cv/CVReferences';
import { CVInternalNotes } from './cv/CVInternalNotes';

interface CandidateData {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  nationality: string | null;
  current_country: string | null;
  linkedin: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  number_of_children?: number | null;
  whatsapp?: string | null;
  current_city?: string | null;
  passport_number: string | null;
  passport_issue_date: string | null;
  passport_expiry: string | null;
  passport_issued_by: string | null;
  national_id_number?: string | null;
  driver_license?: any;
  salary_expectations?: any;
  availability?: any;
  job_preferences?: any;
  family_info?: any;
  internal_notes?: any;
}

interface Props {
  candidate: CandidateData;
}

export function CandidateCVTab({ candidate }: Props) {
  const updateCandidate = useUpdateCandidate();

  // Structured data hooks
  const { data: education = [], isLoading: eduLoading } = useCandidateEducation(candidate.id);
  const { data: workExperience = [], isLoading: workLoading } = useCandidateWorkExperience(candidate.id);
  const { data: languages = [], isLoading: langLoading } = useCandidateLanguages(candidate.id);
  const { data: skills = [], isLoading: skillsLoading } = useCandidateSkills(candidate.id);
  const { data: references = [], isLoading: refsLoading } = useCandidateReferences(candidate.id);

  const saveEducation = useSaveCandidateEducation();
  const saveWorkExp = useSaveCandidateWorkExperience();
  const saveLanguages = useSaveCandidateLanguages();
  const saveSkills = useSaveCandidateSkills();
  const saveReferences = useSaveCandidateReferences();

  const isLoading = eduLoading || workLoading || langLoading || skillsLoading || refsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Parse JSON fields safely
  const driverLicense = candidate.driver_license && typeof candidate.driver_license === 'object'
    ? candidate.driver_license
    : { has_license: false, license_type: '', years_experience: null };

  const salaryExpectations = candidate.salary_expectations && typeof candidate.salary_expectations === 'object'
    ? candidate.salary_expectations
    : { current_salary: '', expected_salary: '', currency: 'EUR', negotiable: false };

  const availability = candidate.availability && typeof candidate.availability === 'object'
    ? candidate.availability
    : { available_to_start: '', employment_status: '', notice_period: '', willing_to_relocate: false };

  const jobPreferences = candidate.job_preferences && typeof candidate.job_preferences === 'object'
    ? candidate.job_preferences
    : { preferred_titles: '', preferred_countries: '', preferred_work_type: '' };

  const familyInfo = candidate.family_info && typeof candidate.family_info === 'object'
    ? candidate.family_info
    : { has_spouse: false, children_ages: '', family_willing_to_relocate: false };

  const internalNotes = candidate.internal_notes && typeof candidate.internal_notes === 'object'
    ? candidate.internal_notes
    : { recruiter_notes: '', interview_feedback: '', quality_rating: '' };

  const handleUpdateCandidate = (data: any) => {
    updateCandidate.mutate({ id: candidate.id, ...data });
  };

  return (
    <div className="space-y-8">
      {/* Personal Info + Contact */}
      <CVPersonalInfo
        data={{
          full_name: candidate.full_name,
          date_of_birth: (candidate as any).date_of_birth || null,
          gender: (candidate as any).gender || null,
          nationality: candidate.nationality,
          marital_status: (candidate as any).marital_status || null,
          number_of_children: (candidate as any).number_of_children ?? null,
          email: candidate.email,
          phone: candidate.phone,
          whatsapp: (candidate as any).whatsapp || null,
          current_country: candidate.current_country,
          current_city: (candidate as any).current_city || null,
          linkedin: candidate.linkedin,
        }}
        onSave={handleUpdateCandidate}
        saving={updateCandidate.isPending}
      />

      {/* Education */}
      <CVEducation
        entries={education.map((e: any) => ({
          education_level: e.education_level || '',
          field_of_study: e.field_of_study || '',
          institution_name: e.institution_name || '',
          graduation_year: e.graduation_year,
          degree_obtained: e.degree_obtained || '',
        }))}
        onSave={(entries) => saveEducation.mutate({ candidateId: candidate.id, entries })}
        saving={saveEducation.isPending}
      />

      {/* Work Experience */}
      <CVWorkExperience
        entries={workExperience.map((e: any) => ({
          job_title: e.job_title || '',
          company_name: e.company_name || '',
          country: e.country || '',
          start_date: e.start_date || '',
          end_date: e.end_date || '',
          job_description: e.job_description || '',
        }))}
        onSave={(entries) => saveWorkExp.mutate({ candidateId: candidate.id, entries })}
        saving={saveWorkExp.isPending}
      />

      {/* Languages & Skills */}
      <CVLanguagesSkills
        languages={languages.map((l: any) => ({
          language_name: l.language_name || '',
          proficiency_level: l.proficiency_level || 'basic',
        }))}
        skills={skills.map((s: any) => ({
          skill_name: s.skill_name || '',
          years_experience: s.years_experience,
        }))}
        onSaveLanguages={(entries) => saveLanguages.mutate({ candidateId: candidate.id, entries })}
        onSaveSkills={(entries) => saveSkills.mutate({ candidateId: candidate.id, entries })}
        savingLang={saveLanguages.isPending}
        savingSkills={saveSkills.isPending}
      />

      {/* Documents & Passport & Driver License */}
      <CVDocumentsPassport
        passportData={{
          passport_number: candidate.passport_number,
          passport_issue_date: candidate.passport_issue_date,
          passport_expiry: candidate.passport_expiry,
          passport_issued_by: candidate.passport_issued_by,
          national_id_number: (candidate as any).national_id_number || null,
        }}
        driverLicense={driverLicense}
        onSave={handleUpdateCandidate}
        saving={updateCandidate.isPending}
      />

      {/* Salary, Availability, Preferences, Family */}
      <CVSalaryAvailability
        salary={salaryExpectations}
        availability={availability}
        jobPreferences={jobPreferences}
        family={familyInfo}
        onSave={handleUpdateCandidate}
        saving={updateCandidate.isPending}
      />

      {/* References */}
      <CVReferences
        entries={references.map((r: any) => ({
          reference_name: r.reference_name || '',
          position_title: r.position_title || '',
          phone: r.phone || '',
          email: r.email || '',
          relationship: r.relationship || '',
        }))}
        onSave={(entries) => saveReferences.mutate({ candidateId: candidate.id, entries })}
        saving={saveReferences.isPending}
      />

      {/* Internal Notes */}
      <CVInternalNotes
        data={internalNotes}
        onSave={(data) => handleUpdateCandidate({ internal_notes: data })}
        saving={updateCandidate.isPending}
      />
    </div>
  );
}
