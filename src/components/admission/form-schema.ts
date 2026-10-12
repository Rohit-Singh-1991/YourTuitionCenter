export type FieldType =
  | "text"
  | "textarea"
  | "date"
  | "tel"
  | "email"
  | "number"
  | "radio"
  | "select"
  | "checkbox";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  maxLength?: number;
};

export type FormPage = {
  id: string;
  title: string;
  hint?: string;
  fields: Field[];
};

export const CLASSES = ["Class 1-5", "Class 6-8", "Class 9-10", "Class 11-12 Commerce", "Banking Exam Prep"];

/** Pages mirror the printed Teach Nation admission form. */
export const FORM_PAGES: FormPage[] = [
  {
    id: "student",
    title: "Student details",
    hint: "Details of the student being admitted.",
    fields: [
      { name: "student_name", label: "Student's full name", type: "text", required: true },
      { name: "class_applied", label: "Class applied for", type: "select", required: true, options: CLASSES },
      { name: "gender", label: "Gender", type: "radio", required: true, options: ["Male", "Female", "Other"] },
      { name: "dob", label: "Date of birth", type: "date", required: true },
      { name: "place_of_birth", label: "Place of birth", type: "text" },
      { name: "nationality", label: "Nationality", type: "text", placeholder: "Indian" },
      { name: "religion", label: "Religion", type: "text" },
      { name: "category", label: "Category", type: "radio", options: ["General", "OBC", "SC", "ST", "EWS"] },
      { name: "mother_tongue", label: "Mother tongue", type: "text" },
      { name: "blood_group", label: "Blood group", type: "select", options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Not known"] },
      { name: "previous_school", label: "Previous school / institute (if any)", type: "text" },
      { name: "interest_area", label: "Subjects or goals of interest", type: "textarea", maxLength: 300 },
    ],
  },
  {
    id: "parents",
    title: "Parent / guardian details",
    hint: "We pre-fill what we already have from your account.",
    fields: [
      { name: "father_name", label: "Father's name", type: "text", required: true },
      { name: "father_qualification", label: "Father's qualification", type: "text" },
      { name: "father_occupation", label: "Father's occupation", type: "text" },
      { name: "father_designation", label: "Father's designation", type: "text" },
      { name: "father_income", label: "Father's annual income (₹)", type: "number" },
      { name: "father_mobile", label: "Father's mobile", type: "tel", required: true },
      { name: "father_email", label: "Father's email", type: "email" },
      { name: "father_aadhar", label: "Father's Aadhaar number", type: "text", maxLength: 14 },
      { name: "mother_name", label: "Mother's name", type: "text", required: true },
      { name: "mother_qualification", label: "Mother's qualification", type: "text" },
      { name: "mother_occupation", label: "Mother's occupation", type: "text" },
      { name: "mother_designation", label: "Mother's designation", type: "text" },
      { name: "mother_income", label: "Mother's annual income (₹)", type: "number" },
      { name: "mother_mobile", label: "Mother's mobile", type: "tel" },
      { name: "mother_email", label: "Mother's email", type: "email" },
      { name: "mother_aadhar", label: "Mother's Aadhaar number", type: "text", maxLength: 14 },
    ],
  },
  {
    id: "family",
    title: "Family information",
    hint: "Address, siblings and who we should call in an emergency.",
    fields: [
      { name: "residential_address", label: "Residential address", type: "textarea", required: true, maxLength: 300 },
      { name: "city", label: "City", type: "text" },
      { name: "pincode", label: "PIN code", type: "text", maxLength: 6 },
      { name: "siblings", label: "Sibling names & ages", type: "textarea", maxLength: 300 },
      { name: "sibling_in_school", label: "Is a sibling already enrolled with us?", type: "radio", options: ["Yes", "No"] },
      { name: "emergency_name", label: "Emergency contact name", type: "text", required: true },
      { name: "emergency_relation", label: "Relation to student", type: "text", required: true },
      { name: "emergency_mobile", label: "Emergency contact number", type: "tel", required: true },
      { name: "pickup_persons", label: "Authorised pickup persons (if applicable)", type: "textarea", maxLength: 300 },
    ],
  },
  {
    id: "medical",
    title: "Health & emergency information",
    hint: "Optional details that help our faculty support the student safely.",
    fields: [
      { name: "allergies", label: "Allergies (food, medicine, other)", type: "textarea", maxLength: 300 },
      { name: "medical_conditions", label: "Ongoing medical conditions / medication", type: "textarea", maxLength: 300 },
      { name: "doctor_name", label: "Family doctor name", type: "text" },
      { name: "doctor_mobile", label: "Family doctor contact", type: "tel" },
      { name: "special_needs", label: "Any learning or physical assistance required", type: "textarea", maxLength: 300 },
    ],
  },
];

export type DocSlot = { key: string; label: string; required?: boolean; accept: string };

export const DOC_SLOTS: DocSlot[] = [
  { key: "child_photo", label: "Student passport photo", required: true, accept: "image/*" },
  { key: "father_photo", label: "Father passport photo", accept: "image/*" },
  { key: "mother_photo", label: "Mother passport photo", accept: "image/*" },
  { key: "child_aadhar", label: "Student Aadhaar copy", accept: "image/*,application/pdf" },
  { key: "parent_aadhar", label: "Parents Aadhaar copy", required: true, accept: "image/*,application/pdf" },
  { key: "birth_certificate", label: "Birth certificate / previous marksheet", accept: "image/*,application/pdf" },
];

export const DECLARATIONS = [
  { key: "decl_true", label: "I declare that the information given above is true to the best of my knowledge." },
  { key: "decl_rules", label: "I agree to abide by the rules, batch timings and fee policy of Teach Nation Coaching Institute." },
  { key: "decl_media", label: "I permit the institute to use the student's photographs for institute activities and updates." },
];