export interface TierConfig {
  label: string;
  min: number;
  max: number;
  status: "normal" | "abnormal" | "critical" | "high" | "low" | "borderline";
}

export interface RangeConfig {
  description: string;
  min?: number;
  max?: number;
  tiers?: TierConfig[];
}

export interface ParameterSeed {
  name: string;
  unit?: string;
  resultType?: "numeric" | "text" | "qualitative";
  isGenderSensitive?: boolean;
  isHeader?: boolean;
  indentationLevel?: number;
  allRange?: RangeConfig;
  maleRange?: RangeConfig;
  femaleRange?: RangeConfig;
}

export interface TestSeed {
  id: string;
  name: string;
  categoryName: string;
  price: number;
  targetType: "category" | "parameter";
  parameters: ParameterSeed[];
}

export const pathologySeederData: TestSeed[] = [
  // ==========================================
  // 1. Hematology (Blood Basics)
  // ==========================================
  {
    id: "cbc",
    name: "Complete Blood Count (CBC)",
    categoryName: "Hematology",
    price: 500,
    targetType: "category",
    parameters: [
      { 
        name: "Hemoglobin", unit: "gm/dl", isGenderSensitive: true, resultType: "numeric",
        maleRange: { min: 14.0, max: 18.0, description: "14.0 - 18.0 gm/dl" },
        femaleRange: { min: 12.0, max: 16.0, description: "12.0 - 16.0 gm/dl" }
      },
      { 
        name: "Total Leucocyte Count", unit: "Cells/cumm", resultType: "numeric",
        allRange: { min: 4000, max: 11000, description: "4000 - 11000 Cells/cumm" } 
      },
      { name: "Differential Leucocyte Count", isHeader: true, indentationLevel: 0, allRange: { description: "" } },
      { name: "Neutrophil", unit: "%", indentationLevel: 1, resultType: "numeric", allRange: { min: 40, max: 75, description: "40 - 75 %" } },
      { name: "Lymphocyte", unit: "%", indentationLevel: 1, resultType: "numeric", allRange: { min: 20, max: 45, description: "20 - 45 %" } },
      { name: "Monocyte", unit: "%", indentationLevel: 1, resultType: "numeric", allRange: { min: 1, max: 10, description: "1 - 10 %" } },
      { name: "Eosinophil", unit: "%", indentationLevel: 1, resultType: "numeric", allRange: { min: 0, max: 6, description: "0 - 6 %" } },
      { name: "Basophil", unit: "%", indentationLevel: 1, resultType: "numeric", allRange: { min: 0, max: 1, description: "0 - 1 %" } },
      { 
        name: "Total Platelet Count", unit: "Cells/cumm", resultType: "numeric",
        allRange: { min: 150000, max: 400000, description: "150,000 - 400,000 Cells/cumm" }
      },
      { 
        name: "Total RBC Count", unit: "million", isGenderSensitive: true, resultType: "numeric",
        maleRange: { min: 4.5, max: 5.5, description: "4.5 - 5.5 million" },
        femaleRange: { min: 4.0, max: 5.0, description: "4.0 - 5.0 million" }
      },
      { name: "PCV", unit: "%", resultType: "numeric", allRange: { min: 40, max: 54, description: "40 - 54 %" } },
      { name: "MCV", unit: "fl", resultType: "numeric", allRange: { min: 82, max: 92, description: "82 - 92 fl" } },
      { name: "MCH", unit: "pg", resultType: "numeric", allRange: { min: 26, max: 34, description: "26 - 34 pg" } },
      { name: "MCHC", unit: "%", resultType: "numeric", allRange: { min: 32, max: 36, description: "32 - 36 %" } }
    ]
  },
  {
    id: "esr",
    name: "Erythrocyte Sedimentation Rate (ESR)",
    categoryName: "Hematology",
    price: 150,
    targetType: "parameter",
    parameters: [
      {
        name: "ESR", unit: "mm/hr", isGenderSensitive: true, resultType: "numeric",
        maleRange: { min: 0, max: 15, description: "0 - 15 mm/hr" },
        femaleRange: { min: 0, max: 20, description: "0 - 20 mm/hr" }
      }
    ]
  },
  {
    id: "blood_group",
    name: "Blood Grouping & Rh Factor",
    categoryName: "Hematology",
    price: 200,
    targetType: "parameter",
    parameters: [
      { name: "Blood Group", unit: "", resultType: "text", allRange: { description: "A, B, AB, O" } },
      { name: "Rh Factor", unit: "", resultType: "text", allRange: { description: "Positive / Negative" } }
    ]
  },
  {
    id: "pbs",
    name: "Peripheral Blood Smear (PBS)",
    categoryName: "Hematology",
    price: 300,
    targetType: "parameter",
    parameters: [
      { name: "RBC Morphology", unit: "", resultType: "text", allRange: { description: "Normocytic Normochromic" } },
      { name: "WBC Morphology", unit: "", resultType: "text", allRange: { description: "Normal" } },
      { name: "Platelets", unit: "", resultType: "text", allRange: { description: "Adequate" } },
      { name: "Hemoparasites", unit: "", resultType: "text", allRange: { description: "Not Seen" } }
    ]
  },
  {
    id: "pt_inr",
    name: "Prothrombin Time (PT/INR)",
    categoryName: "Hematology",
    price: 450,
    targetType: "parameter",
    parameters: [
      { name: "Prothrombin Time (Patient)", unit: "sec", resultType: "numeric", allRange: { min: 11, max: 15, description: "11 - 15 sec" } },
      { name: "Prothrombin Time (Control)", unit: "sec", resultType: "numeric", allRange: { min: 11, max: 15, description: "11 - 15 sec" } },
      { name: "INR", unit: "", resultType: "numeric", allRange: { min: 0.8, max: 1.2, description: "0.8 - 1.2" } }
    ]
  },
  {
    id: "aptt",
    name: "Activated Partial Thromboplastin Time (aPTT)",
    categoryName: "Hematology",
    price: 500,
    targetType: "parameter",
    parameters: [
      { name: "aPTT (Patient)", unit: "sec", resultType: "numeric", allRange: { min: 25, max: 35, description: "25 - 35 sec" } },
      { name: "aPTT (Control)", unit: "sec", resultType: "numeric", allRange: { min: 25, max: 35, description: "25 - 35 sec" } }
    ]
  },

  // ==========================================
  // 2. Biochemistry
  // ==========================================
  {
    id: "lft",
    name: "Liver Function Test (LFT)",
    categoryName: "Biochemistry",
    price: 1300,
    targetType: "category",
    parameters: [
      { name: "Bilirubin Total", unit: "mg/dL", resultType: "numeric", allRange: { min: 0.1, max: 1.2, description: "0.1-1.2 mg/dL" } },
      { name: "Bilirubin Direct", unit: "mg/dL", resultType: "numeric", allRange: { min: 0.0, max: 0.3, description: "0.0-0.3 mg/dL" } },
      { name: "Bilirubin Indirect", unit: "mg/dL", resultType: "numeric", allRange: { min: 0.1, max: 0.9, description: "0.1-0.9 mg/dL" } },
      { name: "SGOT (AST)", unit: "U/L", resultType: "numeric", allRange: { min: 0, max: 40, description: "Up to 40 U/L" } },
      { name: "SGPT (ALT)", unit: "U/L", resultType: "numeric", allRange: { min: 0, max: 40, description: "Up to 40 U/L" } },
      { name: "Alkaline Phosphatase (ALP)", unit: "U/L", resultType: "numeric", allRange: { min: 44, max: 147, description: "44-147 U/L" } },
      { name: "Total Protein", unit: "g/dL", resultType: "numeric", allRange: { min: 6.0, max: 8.3, description: "6.0-8.3 g/dL" } },
      { name: "Albumin", unit: "g/dL", resultType: "numeric", allRange: { min: 3.5, max: 5.0, description: "3.5-5.0 g/dL" } },
      { name: "Globulin", unit: "g/dL", resultType: "numeric", allRange: { min: 2.3, max: 3.5, description: "2.3-3.5 g/dL" } },
      { name: "A/G Ratio", unit: "", resultType: "numeric", allRange: { min: 1.2, max: 2.2, description: "1.2-2.2" } }
    ]
  },
  {
    id: "rft",
    name: "Renal Function Test (RFT/KFT)",
    categoryName: "Biochemistry",
    price: 1500,
    targetType: "category",
    parameters: [
      { name: "Blood Urea", unit: "mg/dL", resultType: "numeric", allRange: { min: 10, max: 50, description: "10-50 mg/dL" } },
      { name: "Serum Creatinine", unit: "mg/dL", resultType: "numeric", allRange: { min: 0.6, max: 1.2, description: "0.6-1.2 mg/dL" } },
      { name: "Uric Acid", unit: "mg/dL", resultType: "numeric", allRange: { min: 3.5, max: 7.2, description: "3.5-7.2 mg/dL" } },
      { name: "Sodium (Na+)", unit: "mEq/L", resultType: "numeric", allRange: { min: 135, max: 145, description: "135-145 mEq/L" } },
      { name: "Potassium (K+)", unit: "mEq/L", resultType: "numeric", allRange: { min: 3.5, max: 5.1, description: "3.5-5.1 mEq/L" } }
    ]
  },
  {
    id: "lipid",
    name: "Lipid Profile",
    categoryName: "Biochemistry",
    price: 1200,
    targetType: "category",
    parameters: [
      { name: "Total Cholesterol", unit: "mg/dL", resultType: "numeric", allRange: { min: 0, max: 200, description: "< 200 mg/dL" } },
      { name: "Triglycerides", unit: "mg/dL", resultType: "numeric", allRange: { min: 0, max: 150, description: "< 150 mg/dL" } },
      { name: "HDL Cholesterol", unit: "mg/dL", resultType: "numeric", allRange: { min: 40, max: 60, description: "40 - 60 mg/dL" } },
      { name: "LDL Cholesterol", unit: "mg/dL", resultType: "numeric", allRange: { min: 0, max: 100, description: "< 100 mg/dL" } },
      { name: "VLDL Cholesterol", unit: "mg/dL", resultType: "numeric", allRange: { min: 5, max: 40, description: "5 - 40 mg/dL" } }
    ]
  },
  {
    id: "sugar_fasting",
    name: "Fasting Blood Sugar (FBS)",
    categoryName: "Biochemistry",
    price: 150,
    targetType: "parameter",
    parameters: [
      { 
        name: "Blood Sugar Fasting (BSF)", unit: "mg/dL", resultType: "numeric", 
        allRange: { min: 70, max: 100, description: "70 - 100 mg/dL", tiers: [{ label: "Normal", min: 70, max: 100, status: "normal" }, { label: "Prediabetes", min: 100.1, max: 125, status: "borderline" }, { label: "Diabetes", min: 126, max: 1000, status: "high" }] } 
      }
    ]
  },
  {
    id: "sugar_pp",
    name: "Post Prandial Blood Sugar (PPBS)",
    categoryName: "Biochemistry",
    price: 150,
    targetType: "parameter",
    parameters: [
      { 
        name: "Blood Sugar Post Prandial (BSPP)", unit: "mg/dL", resultType: "numeric", 
        allRange: { min: 70, max: 140, description: "70 - 140 mg/dL", tiers: [{ label: "Normal", min: 70, max: 140, status: "normal" }, { label: "Prediabetes", min: 140.1, max: 199, status: "borderline" }, { label: "Diabetes", min: 200, max: 1000, status: "high" }] } 
      }
    ]
  },
  {
    id: "sugar_random",
    name: "Random Blood Sugar (RBS)",
    categoryName: "Biochemistry",
    price: 150,
    targetType: "parameter",
    parameters: [
      { name: "Blood Sugar Random (RBS)", unit: "mg/dL", resultType: "numeric", allRange: { min: 70, max: 140, description: "70 - 140 mg/dL" } }
    ]
  },
  {
    id: "hba1c",
    name: "HbA1c (Glycosylated Hemoglobin)",
    categoryName: "Biochemistry",
    price: 800,
    targetType: "parameter",
    parameters: [
      { name: "HbA1c", unit: "%", resultType: "numeric", allRange: { min: 4.0, max: 5.6, description: "4.0 - 5.6 %", tiers: [{ label: "Normal", min: 4.0, max: 5.6, status: "normal" }, { label: "Prediabetes", min: 5.7, max: 6.4, status: "borderline" }, { label: "Diabetes", min: 6.5, max: 20, status: "high" }] } },
      { name: "Estimated Average Glucose (eAG)", unit: "mg/dL", resultType: "numeric", allRange: { description: "Calculated based on HbA1c" } }
    ]
  },
  {
    id: "electrolytes",
    name: "Serum Electrolytes",
    categoryName: "Biochemistry",
    price: 800,
    targetType: "category",
    parameters: [
      { name: "Sodium (Na+)", unit: "mEq/L", resultType: "numeric", allRange: { min: 135, max: 145, description: "135 - 145 mEq/L" } },
      { name: "Potassium (K+)", unit: "mEq/L", resultType: "numeric", allRange: { min: 3.5, max: 5.1, description: "3.5 - 5.1 mEq/L" } },
      { name: "Chloride (Cl-)", unit: "mEq/L", resultType: "numeric", allRange: { min: 98, max: 107, description: "98 - 107 mEq/L" } },
      { name: "Calcium Total", unit: "mg/dL", resultType: "numeric", allRange: { min: 8.5, max: 10.5, description: "8.5 - 10.5 mg/dL" } },
      { name: "Magnesium", unit: "mg/dL", resultType: "numeric", allRange: { min: 1.7, max: 2.2, description: "1.7 - 2.2 mg/dL" } }
    ]
  },
  {
    id: "pancreatic",
    name: "Amylase & Lipase",
    categoryName: "Biochemistry",
    price: 1200,
    targetType: "parameter",
    parameters: [
      { name: "Serum Amylase", unit: "U/L", resultType: "numeric", allRange: { min: 28, max: 100, description: "28 - 100 U/L" } },
      { name: "Serum Lipase", unit: "U/L", resultType: "numeric", allRange: { min: 13, max: 60, description: "13 - 60 U/L" } }
    ]
  },

  // ==========================================
  // 3. Immunology & Endocrinology
  // ==========================================
  {
    id: "tft",
    name: "Thyroid Function Test (TFT)",
    categoryName: "Immunology",
    price: 1200,
    targetType: "category",
    parameters: [
      { name: "Total T3", unit: "ng/dL", resultType: "numeric", allRange: { min: 80, max: 200, description: "80 - 200 ng/dL" } },
      { name: "Total T4", unit: "µg/dL", resultType: "numeric", allRange: { min: 4.5, max: 12.0, description: "4.5 - 12.0 µg/dL" } },
      { name: "TSH", unit: "µIU/mL", resultType: "numeric", allRange: { min: 0.45, max: 4.5, description: "0.45 - 4.5 µIU/mL" } }
    ]
  },
  {
    id: "vitamins",
    name: "Vitamin Profile (B12 & D3)",
    categoryName: "Immunology",
    price: 2500,
    targetType: "parameter",
    parameters: [
      { name: "Vitamin B12", unit: "pg/mL", resultType: "numeric", allRange: { min: 200, max: 900, description: "200 - 900 pg/mL" } },
      { name: "Vitamin D3 (25-OH)", unit: "ng/mL", resultType: "numeric", allRange: { min: 30, max: 100, description: "30 - 100 ng/mL" } }
    ]
  },
  {
    id: "hcg",
    name: "Beta-hCG (Pregnancy)",
    categoryName: "Immunology",
    price: 800,
    targetType: "parameter",
    parameters: [
      { name: "Beta-hCG", unit: "mIU/mL", resultType: "numeric", allRange: { description: "Non-pregnant: <5, Pregnant: Depends on weeks" } }
    ]
  },
  {
    id: "fertility",
    name: "Fertility Panel",
    categoryName: "Immunology",
    price: 3500,
    targetType: "category",
    parameters: [
      { name: "Testosterone (Total)", unit: "ng/dL", resultType: "numeric", maleRange: { min: 280, max: 1100, description: "280 - 1100 ng/dL" }, femaleRange: { min: 15, max: 70, description: "15 - 70 ng/dL" }, isGenderSensitive: true },
      { name: "Estrogen (E2)", unit: "pg/mL", resultType: "numeric", allRange: { description: "Varies by cycle phase" } },
      { name: "Prolactin", unit: "ng/mL", resultType: "numeric", maleRange: { min: 2, max: 18, description: "2 - 18 ng/mL" }, femaleRange: { min: 2, max: 29, description: "2 - 29 ng/mL" }, isGenderSensitive: true },
      { name: "FSH", unit: "mIU/mL", resultType: "numeric", allRange: { description: "Varies by cycle phase" } },
      { name: "LH", unit: "mIU/mL", resultType: "numeric", allRange: { description: "Varies by cycle phase" } }
    ]
  },
  {
    id: "iron",
    name: "Iron Profile",
    categoryName: "Immunology",
    price: 1500,
    targetType: "category",
    parameters: [
      { name: "Serum Iron", unit: "µg/dL", resultType: "numeric", allRange: { min: 60, max: 170, description: "60 - 170 µg/dL" } },
      { name: "TIBC", unit: "µg/dL", resultType: "numeric", allRange: { min: 240, max: 450, description: "240 - 450 µg/dL" } },
      { name: "Transferrin Saturation", unit: "%", resultType: "numeric", allRange: { min: 20, max: 50, description: "20 - 50 %" } },
      { name: "Ferritin", unit: "ng/mL", resultType: "numeric", maleRange: { min: 24, max: 336, description: "24 - 336 ng/mL" }, femaleRange: { min: 11, max: 307, description: "11 - 307 ng/mL" }, isGenderSensitive: true }
    ]
  },

  // ==========================================
  // 4. Serology & Infectious Diseases
  // ==========================================
  {
    id: "widal",
    name: "Widal Test (Typhoid)",
    categoryName: "Serology",
    price: 300,
    targetType: "parameter",
    parameters: [
      { name: "S. Typhi O", unit: "", resultType: "text", allRange: { description: "< 1:80 (Negative)" } },
      { name: "S. Typhi H", unit: "", resultType: "text", allRange: { description: "< 1:80 (Negative)" } },
      { name: "S. Paratyphi AH", unit: "", resultType: "text", allRange: { description: "< 1:80 (Negative)" } },
      { name: "S. Paratyphi BH", unit: "", resultType: "text", allRange: { description: "< 1:80 (Negative)" } }
    ]
  },
  {
    id: "dengue",
    name: "Dengue Profile",
    categoryName: "Serology",
    price: 1500,
    targetType: "parameter",
    parameters: [
      { name: "Dengue NS1 Antigen", unit: "", resultType: "qualitative", allRange: { description: "Non-Reactive" } },
      { name: "Dengue IgG Antibody", unit: "", resultType: "qualitative", allRange: { description: "Non-Reactive" } },
      { name: "Dengue IgM Antibody", unit: "", resultType: "qualitative", allRange: { description: "Non-Reactive" } }
    ]
  },
  {
    id: "hiv",
    name: "HIV I & II",
    categoryName: "Serology",
    price: 500,
    targetType: "parameter",
    parameters: [
      { name: "HIV I & II Antibodies", unit: "", resultType: "qualitative", allRange: { description: "Non-Reactive" } }
    ]
  },
  {
    id: "hbsag",
    name: "HBsAg (Hepatitis B)",
    categoryName: "Serology",
    price: 400,
    targetType: "parameter",
    parameters: [
      { name: "HBsAg Rapid", unit: "", resultType: "qualitative", allRange: { description: "Non-Reactive" } }
    ]
  },
  {
    id: "hcv",
    name: "HCV (Hepatitis C)",
    categoryName: "Serology",
    price: 400,
    targetType: "parameter",
    parameters: [
      { name: "Anti-HCV", unit: "", resultType: "qualitative", allRange: { description: "Non-Reactive" } }
    ]
  },
  {
    id: "vdrl",
    name: "VDRL / RPR",
    categoryName: "Serology",
    price: 250,
    targetType: "parameter",
    parameters: [
      { name: "RPR (Syphilis)", unit: "", resultType: "qualitative", allRange: { description: "Non-Reactive" } }
    ]
  },
  {
    id: "crp",
    name: "C-Reactive Protein (CRP)",
    categoryName: "Serology",
    price: 500,
    targetType: "parameter",
    parameters: [
      { name: "CRP Quantitative", unit: "mg/L", resultType: "numeric", allRange: { min: 0, max: 6, description: "< 6.0 mg/L" } }
    ]
  },
  {
    id: "ra_factor",
    name: "Rheumatoid Factor (RA Factor)",
    categoryName: "Serology",
    price: 500,
    targetType: "parameter",
    parameters: [
      { name: "RA Factor", unit: "IU/mL", resultType: "numeric", allRange: { min: 0, max: 14, description: "< 14 IU/mL" } }
    ]
  },
  {
    id: "aso",
    name: "ASO Titre",
    categoryName: "Serology",
    price: 500,
    targetType: "parameter",
    parameters: [
      { name: "ASO Titre", unit: "IU/mL", resultType: "numeric", allRange: { min: 0, max: 200, description: "< 200 IU/mL" } }
    ]
  },

  // ==========================================
  // 5. Clinical Pathology
  // ==========================================
  {
    id: "urine_rm",
    name: "Urine Routine & Microscopic (R/M)",
    categoryName: "Clinical Pathology",
    price: 300,
    targetType: "category",
    parameters: [
      { name: "Physical Examination", isHeader: true, indentationLevel: 0, allRange: { description: "" } },
      { name: "Color", unit: "", resultType: "text", indentationLevel: 1, allRange: { description: "Pale Yellow" } },
      { name: "Appearance", unit: "", resultType: "text", indentationLevel: 1, allRange: { description: "Clear" } },
      { name: "Chemical Examination", isHeader: true, indentationLevel: 0, allRange: { description: "" } },
      { name: "Reaction (pH)", unit: "", resultType: "numeric", indentationLevel: 1, allRange: { min: 4.5, max: 8.0, description: "4.5-8.0" } },
      { name: "Specific Gravity", unit: "", resultType: "numeric", indentationLevel: 1, allRange: { min: 1.005, max: 1.030, description: "1.005-1.030" } },
      { name: "Proteins", unit: "", resultType: "qualitative", indentationLevel: 1, allRange: { description: "Nil" } },
      { name: "Glucose", unit: "", resultType: "qualitative", indentationLevel: 1, allRange: { description: "Nil" } },
      { name: "Ketones", unit: "", resultType: "qualitative", indentationLevel: 1, allRange: { description: "Nil" } },
      { name: "Microscopic Examination", isHeader: true, indentationLevel: 0, allRange: { description: "" } },
      { name: "Pus Cells", unit: "/hpf", resultType: "text", indentationLevel: 1, allRange: { description: "0-5 /hpf" } },
      { name: "RBC", unit: "/hpf", resultType: "text", indentationLevel: 1, allRange: { description: "0-2 /hpf" } },
      { name: "Epithelial Cells", unit: "/hpf", resultType: "text", indentationLevel: 1, allRange: { description: "Few" } }
    ]
  },
  {
    id: "stool_rm",
    name: "Stool Routine Examination",
    categoryName: "Clinical Pathology",
    price: 300,
    targetType: "category",
    parameters: [
      { name: "Color", unit: "", resultType: "text", allRange: { description: "Brown" } },
      { name: "Consistency", unit: "", resultType: "text", allRange: { description: "Formed" } },
      { name: "Mucus", unit: "", resultType: "qualitative", allRange: { description: "Absent" } },
      { name: "Ova/Cysts", unit: "", resultType: "text", allRange: { description: "Not Seen" } }
    ]
  },
  {
    id: "stool_occult",
    name: "Stool Occult Blood",
    categoryName: "Clinical Pathology",
    price: 250,
    targetType: "parameter",
    parameters: [
      { name: "Occult Blood", unit: "", resultType: "qualitative", allRange: { description: "Negative" } }
    ]
  },
  {
    id: "semen",
    name: "Semen Analysis",
    categoryName: "Clinical Pathology",
    price: 800,
    targetType: "category",
    parameters: [
      { name: "Volume", unit: "mL", resultType: "numeric", allRange: { min: 1.5, max: 5.0, description: "1.5 - 5.0 mL" } },
      { name: "Liquefaction Time", unit: "mins", resultType: "numeric", allRange: { min: 10, max: 30, description: "10 - 30 mins" } },
      { name: "Sperm Count", unit: "million/mL", resultType: "numeric", allRange: { min: 15, max: 200, description: "> 15 million/mL" } },
      { name: "Active Motility", unit: "%", resultType: "numeric", allRange: { min: 40, max: 100, description: "> 40 %" } },
      { name: "Normal Morphology", unit: "%", resultType: "numeric", allRange: { min: 4, max: 100, description: "> 4 %" } }
    ]
  },
  {
    id: "csf",
    name: "CSF Analysis",
    categoryName: "Clinical Pathology",
    price: 1500,
    targetType: "category",
    parameters: [
      { name: "Appearance", unit: "", resultType: "text", allRange: { description: "Clear & Colorless" } },
      { name: "Total Cell Count", unit: "cells/cumm", resultType: "numeric", allRange: { min: 0, max: 5, description: "0 - 5 cells/cumm" } },
      { name: "Glucose (CSF)", unit: "mg/dL", resultType: "numeric", allRange: { min: 40, max: 70, description: "40 - 70 mg/dL" } },
      { name: "Protein (CSF)", unit: "mg/dL", resultType: "numeric", allRange: { min: 15, max: 45, description: "15 - 45 mg/dL" } }
    ]
  },

  // ==========================================
  // 6. Microbiology (Cultures)
  // ==========================================
  {
    id: "urine_culture",
    name: "Urine Culture & Sensitivity",
    categoryName: "Microbiology",
    price: 800,
    targetType: "parameter",
    parameters: [
      { name: "Organism Isolated", unit: "", resultType: "text", allRange: { description: "No Growth After 48 Hrs" } },
      { name: "Colony Count", unit: "CFU/mL", resultType: "text", allRange: { description: "< 10^5" } }
    ]
  },
  {
    id: "blood_culture",
    name: "Blood Culture & Sensitivity",
    categoryName: "Microbiology",
    price: 1200,
    targetType: "parameter",
    parameters: [
      { name: "Aerobic Culture", unit: "", resultType: "text", allRange: { description: "No Growth After 5 Days" } }
    ]
  },
  {
    id: "sputum_culture",
    name: "Sputum Culture & AFB",
    categoryName: "Microbiology",
    price: 1000,
    targetType: "parameter",
    parameters: [
      { name: "AFB Smear (Z-N Stain)", unit: "", resultType: "text", allRange: { description: "Negative" } },
      { name: "Organism Isolated", unit: "", resultType: "text", allRange: { description: "Normal Commensals" } }
    ]
  },
  {
    id: "pus_culture",
    name: "Pus Culture & Sensitivity",
    categoryName: "Microbiology",
    price: 900,
    targetType: "parameter",
    parameters: [
      { name: "Gram Stain", unit: "", resultType: "text", allRange: { description: "No Organism Seen" } },
      { name: "Culture Result", unit: "", resultType: "text", allRange: { description: "No Pathogenic Growth" } }
    ]
  }
];
