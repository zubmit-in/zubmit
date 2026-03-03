"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  degreeList,
  getSpecializations,
  getMaxSemester,
  getSubjects,
} from "@/lib/curriculum";

interface SubjectSelectorProps {
  defaultDegree?: string;
  defaultSpecialization?: string;
  defaultSemester?: number;
  onChange: (data: {
    degree: string;
    specialization: string;
    semester: string;
    subject: string;
  }) => void;
}

export function SubjectSelector({
  defaultDegree,
  defaultSpecialization,
  defaultSemester,
  onChange,
}: SubjectSelectorProps) {
  const [degree, setDegree] = useState(defaultDegree || "");
  const [specialization, setSpecialization] = useState(defaultSpecialization || "");
  const [semester, setSemester] = useState(defaultSemester?.toString() || "");
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState(false);
  const [customText, setCustomText] = useState("");

  const specializations = degree ? getSpecializations(degree) : [];
  const maxSemester = degree ? getMaxSemester(degree) : 0;
  const subjects =
    degree && specialization && semester
      ? getSubjects(degree, specialization, parseInt(semester))
      : [];

  useEffect(() => {
    const selectedSubject = customSubject ? customText : subject;
    onChange({ degree, specialization, semester, subject: selectedSubject });
  }, [degree, specialization, semester, subject, customSubject, customText]);

  return (
    <div className="space-y-4">
      <div>
        <Label>Degree</Label>
        <Select value={degree} onValueChange={(v) => { setDegree(v); setSpecialization(""); setSemester(""); setSubject(""); }}>
          <SelectTrigger>
            <SelectValue placeholder="Select your degree" />
          </SelectTrigger>
          <SelectContent>
            {degreeList.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {specializations.length > 0 && (
        <div>
          <Label>Specialization</Label>
          <Select value={specialization} onValueChange={(v) => { setSpecialization(v); setSubject(""); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select specialization" />
            </SelectTrigger>
            <SelectContent>
              {specializations.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {maxSemester > 0 && (
        <div>
          <Label>Semester</Label>
          <Select value={semester} onValueChange={(v) => { setSemester(v); setSubject(""); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: maxSemester }, (_, i) => i + 1).map((s) => (
                <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!customSubject && subjects.length > 0 && (
        <div>
          <Label>Subject</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Checkbox
          checked={customSubject}
          onCheckedChange={(c) => setCustomSubject(c as boolean)}
          id="custom-subject"
        />
        <label htmlFor="custom-subject" className="text-sm text-[var(--muted)] cursor-pointer">
          Can&apos;t find your subject? Enter manually
        </label>
      </div>

      {customSubject && (
        <div>
          <Label>Subject Name</Label>
          <Input
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Enter your subject name"
          />
        </div>
      )}
    </div>
  );
}
