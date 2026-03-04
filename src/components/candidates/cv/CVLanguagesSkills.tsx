import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Plus, Trash2, Languages, Wrench } from 'lucide-react';

interface LanguageEntry {
  language_name: string;
  proficiency_level: string;
}

interface SkillEntry {
  skill_name: string;
  years_experience: number | null;
}

interface Props {
  languages: LanguageEntry[];
  skills: SkillEntry[];
  onSaveLanguages: (entries: LanguageEntry[]) => void;
  onSaveSkills: (entries: SkillEntry[]) => void;
  savingLang?: boolean;
  savingSkills?: boolean;
}

const PROFICIENCY = ['Basic', 'Intermediate', 'Advanced', 'Fluent', 'Native'];

export function CVLanguagesSkills({ languages: initLang, skills: initSkills, onSaveLanguages, onSaveSkills, savingLang, savingSkills }: Props) {
  const [languages, setLanguages] = useState<LanguageEntry[]>(initLang);
  const [skills, setSkills] = useState<SkillEntry[]>(initSkills);

  useEffect(() => { setLanguages(initLang); }, [initLang]);
  useEffect(() => { setSkills(initSkills); }, [initSkills]);

  return (
    <div className="space-y-6">
      {/* Languages */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Languages className="h-4 w-4" /> Languages
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setLanguages([...languages, { language_name: '', proficiency_level: 'basic' }])} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {languages.length === 0 && <p className="text-sm text-muted-foreground">No languages added.</p>}
          {languages.map((l, i) => (
            <div key={i} className="flex items-end gap-3">
              <div className="flex-1">
                <Label>Language</Label>
                <Input value={l.language_name} onChange={e => setLanguages(languages.map((x, j) => j === i ? { ...x, language_name: e.target.value } : x))} />
              </div>
              <div className="w-40">
                <Label>Proficiency</Label>
                <Select value={l.proficiency_level} onValueChange={v => setLanguages(languages.map((x, j) => j === i ? { ...x, proficiency_level: v } : x))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROFICIENCY.map(p => <SelectItem key={p} value={p.toLowerCase()}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0" onClick={() => setLanguages(languages.filter((_, j) => j !== i))}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {languages.length > 0 && (
            <div className="flex justify-end pt-2">
              <Button onClick={() => onSaveLanguages(languages)} disabled={savingLang} className="gap-2">
                <Save className="h-4 w-4" /> Save Languages
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4" /> Key Skills
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setSkills([...skills, { skill_name: '', years_experience: null }])} disabled={skills.length >= 10} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {skills.length === 0 && <p className="text-sm text-muted-foreground">No skills added.</p>}
          {skills.map((s, i) => (
            <div key={i} className="flex items-end gap-3">
              <div className="flex-1">
                <Label>Skill</Label>
                <Input value={s.skill_name} onChange={e => setSkills(skills.map((x, j) => j === i ? { ...x, skill_name: e.target.value } : x))} />
              </div>
              <div className="w-32">
                <Label>Years</Label>
                <Input type="number" min={0} value={s.years_experience ?? ''} onChange={e => setSkills(skills.map((x, j) => j === i ? { ...x, years_experience: parseInt(e.target.value) || null } : x))} />
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0" onClick={() => setSkills(skills.filter((_, j) => j !== i))}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {skills.length > 0 && (
            <div className="flex justify-end pt-2">
              <Button onClick={() => onSaveSkills(skills)} disabled={savingSkills} className="gap-2">
                <Save className="h-4 w-4" /> Save Skills
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
