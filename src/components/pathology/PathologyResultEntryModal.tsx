import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  IoFlaskOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoSaveOutline,
  IoCloseOutline,
  IoCalculatorOutline,
  IoArrowBackOutline,
  IoAddOutline,
  IoTrashOutline,
  IoShieldCheckmarkOutline
} from "react-icons/io5";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PathologyOrder,
  PathologyParameter,
  PathologyTestTemplate,
  PathologyResult
} from "@/types/models";

interface PathologyResultEntryModalProps {
  order: PathologyOrder;
  templates: PathologyTestTemplate[];
  parameters: PathologyParameter[];
  categories: any[];
  onSave: (results: PathologyResult[], status: PathologyOrder["status"], microData?: any) => Promise<void>;
  onClose: () => void;
}

const COMMON_ANTIBIOTICS = [
  "Amikacin", "Amoxicillin", "Ampicillin", "Azithromycin", "Cefixime",
  "Ceftriaxone", "Ciprofloxacin", "Clarithromycin", "Cotrimoxazole",
  "Gentamicin", "Levofloxacin", "Meropenem", "Nitrofurantoin", "Norfloxacin",
  "Ofloxacin", "Piperacillin/Tazobactam", "Vancomycin", "Linezolid", "Imipenem"
];

export default function PathologyResultEntryModal({
  order,
  templates,
  parameters,
  categories,
  onSave,
  onClose
}: PathologyResultEntryModalProps) {
  const [results, setResults] = useState<PathologyResult[]>(order.results || []);
  const [loading, setLoading] = useState(false);

  // Microbiology State
  const [organismIsolated, setOrganismIsolated] = useState(order.organismIsolated || "");
  const [colonyCount, setColonyCount] = useState(order.colonyCount || "");
  const [sensitivities, setSensitivities] = useState<any[]>(order.sensitivities || []);

  const isMicrobiology = order.isMicrobiology || order.testTemplateIds?.some(tid => templates.find(t => t.id === tid)?.isMicrobiology);

  // Initialize results if empty
  useEffect(() => {
    if ((!order.results || order.results.length === 0) && order.testTemplateIds) {
      const initialResults: PathologyResult[] = [];

      order.testTemplateIds.forEach(templateId => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
          template.parameters.forEach(paramId => {
            const param = parameters.find(p => p.id === paramId);
            const override = template.parameterOverrides?.find(o => o.id === paramId);

            if (param) {
              // Priority: Override string -> Master parameter object description -> Master parameter allRange description
              const maleR = override?.maleRange || param.maleRange?.description || param.allRange?.description;
              const femaleR = override?.femaleRange || param.femaleRange?.description || param.allRange?.description;
              const allR = override?.allRange || param.allRange?.description;

              initialResults.push({
                parameterId: param.id,
                parameterName: override?.name || param.name,
                value: "",
                unit: override?.unit || param.unit,
                referenceRange: param.isGenderSensitive
                  ? (order.patientGender === 'female' ? (femaleR || "—") : (maleR || "—"))
                  : (allR || "—"),
                status: "normal",
                isHeader: param.isHeader,
                indentationLevel: param.indentationLevel
              });
            }
          });
        }
      });
      setResults(initialResults);
    }
  }, [order, templates, parameters]);

  const formatRange = (range: any) => {
    if (!range) return "—";
    if (range.description) return range.description;
    if (range.min !== undefined && range.max !== undefined) return `${range.min}-${range.max}`;
    if (range.min !== undefined) return `>${range.min}`;
    if (range.max !== undefined) return `<${range.max}`;
    return range.normalValue || "—";
  };

  const evaluateResult = (param: PathologyParameter, value: string) => {
    let status: "normal" | "abnormal" | "critical" = "normal";
    let flag: "N" | "L" | "B" | "C" | "H" = "N";

    if (!value) return { status, flag };

    const isNumericType = param.resultType === 'numeric' || param.resultType === 'calculated';
    const numValue = parseFloat(value);
    const isNumericValue = !isNaN(numValue) && isFinite(numValue);

    const range = param.isGenderSensitive
      ? (order.patientGender === 'female' ? param.femaleRange : param.maleRange)
      : param.allRange;

    if (!range) return { status, flag };

    // Dynamically parse range description if min/max are not defined
    let rangeMin = range.min;
    let rangeMax = range.max;

    if ((rangeMin === undefined || rangeMin === null) && (rangeMax === undefined || rangeMax === null)) {
      const desc = range.description || "";
      // Match formats like "30-400ng/ml" or "30 - 400" or "> 30" or "< 400"
      const match = desc.trim().match(/^([\d.]+)\s*[-–]\s*([\d.]+)/);
      if (match) {
        rangeMin = parseFloat(match[1]);
        rangeMax = parseFloat(match[2]);
      } else {
        const ltMatch = desc.trim().match(/^[<]\s*([\d.]+)/);
        if (ltMatch) rangeMax = parseFloat(ltMatch[1]);
        const gtMatch = desc.trim().match(/^[>]\s*([\d.]+)/);
        if (gtMatch) rangeMin = parseFloat(gtMatch[1]);
      }
    }

    const hasNumericRange = (rangeMin !== undefined && rangeMin !== null) || (rangeMax !== undefined && rangeMax !== null);

    if ((isNumericType || hasNumericRange) && isNumericValue) {
      if (range.tiers && range.tiers.length > 0) {
        const matchedTier = range.tiers.find(tier => {
          const min = (tier.min !== undefined && tier.min !== null) ? tier.min : -Infinity;
          const max = (tier.max !== undefined && tier.max !== null) ? tier.max : Infinity;
          return numValue >= min && numValue <= max;
        });

        if (matchedTier) {
          flag = matchedTier.status === 'normal' ? 'N' :
            matchedTier.status === 'low' ? 'L' :
              matchedTier.status === 'borderline' ? 'B' :
                matchedTier.status === 'critical' ? 'C' : 'H';
          status = matchedTier.status === 'normal' ? 'normal' :
            matchedTier.status === 'critical' ? 'critical' : 'abnormal';
        }
      } else if (rangeMin !== undefined && rangeMin !== null && numValue < rangeMin) {
        status = "abnormal";
        flag = "L";
      } else if (rangeMax !== undefined && rangeMax !== null && numValue > rangeMax) {
        status = "abnormal";
        flag = "H";
      }
    } else {
      const expectedValue = (range.description || "").toLowerCase();
      const inputValue = value.trim().toLowerCase();

      const normalSynonyms = ["negative", "absent", "nil", "normal", "non-reactive", "clear", "pale yellow", "sterile", "no growth"];
      const abnormalSynonyms = ["positive", "present", "reactive", "abnormal", "turbid", "blur", "found", "growth"];

      // If the input is empty, it's normal by default
      if (inputValue === "") return { status, flag };

      // Parse expected value into multiple options if it contains commas or slashes
      const expectedOptions = expectedValue
        .split(/[,\/]/)
        .map(opt => opt.trim())
        .filter(Boolean);

      // Exact match with expected description or any of the expected options is always normal
      const isExactMatch = inputValue === expectedValue || expectedOptions.includes(inputValue);

      // If not an exact match, check if it's a known 'normal' synonym
      const isKnownNormal = normalSynonyms.includes(inputValue);
      const isKnownAbnormal = abnormalSynonyms.includes(inputValue);

      if (!isExactMatch && !isKnownNormal && (isKnownAbnormal || expectedValue !== "")) {
        status = "abnormal";
        flag = "H";
      }
    }

    return { status, flag };
  };

  const handleValueChange = (index: number, value: string) => {
    const newResults = [...results];
    const param = parameters.find(p => p.id === newResults[index].parameterId);

    if (param) {
      const { status, flag } = evaluateResult(param, value);
      newResults[index] = { ...newResults[index], value, status, flag };
    }

    // --- Calculation Engine ---
    newResults.forEach((res) => {
      const p = parameters.find(pParam => pParam.id === res.parameterId);
      if (p?.resultType === 'calculated' && p.formula) {
        let formula = p.formula;
        let canCalculate = true;

        const matches = formula.match(/\{([^}]+)\}/g);
        if (matches) {
          matches.forEach(match => {
            const paramName = match.replace(/[{}]/g, "");
            const relatedRes = newResults.find(r => r.parameterName.toLowerCase() === paramName.toLowerCase());
            const val = parseFloat(relatedRes?.value || "NaN");

            if (isNaN(val)) canCalculate = false;
            formula = formula.replace(match, val.toString());
          });
        }

        if (canCalculate) {
          try {
            // eslint-disable-next-line no-eval
            const computed = eval(formula);
            if (typeof computed === 'number' && !isNaN(computed) && isFinite(computed)) {
              const computedStr = Number.isInteger(computed) ? computed.toString() : computed.toFixed(2);

              if (res.value !== computedStr) {
                res.value = computedStr;
                res.isCalculated = true;

                // Apply the same unified flagging logic to calculated results
                const evalRes = evaluateResult(p, computedStr);
                res.status = evalRes.status;
                res.flag = evalRes.flag;
              }
            }
          } catch (e) { console.error(e); }
        }
      }
    });

    setResults(newResults);
  };

  const handleAddSensitivity = (antibiotic?: string) => {
    setSensitivities([...sensitivities, {
      antibiotic: antibiotic || "",
      sensitivity: "None",
      zoneOfInhibition: ""
    }]);
  };

  const handleRemoveSensitivity = (index: number) => {
    setSensitivities(sensitivities.filter((_, i) => i !== index));
  };

  const updateSensitivity = (index: number, field: string, value: string) => {
    const updated = [...sensitivities];
    updated[index] = { ...updated[index], [field]: value };
    setSensitivities(updated);
  };

  const handleSave = async (status: PathologyOrder["status"]) => {
    try {
      setLoading(true);
      const microData = isMicrobiology ? {
        isMicrobiology: true,
        organismIsolated,
        colonyCount,
        sensitivities
      } : {};

      await onSave(results, status, microData);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2">
      <div className="absolute inset-0 bg-mountain-900/70 backdrop-blur-2xl" onClick={onClose} />

      <div className="relative z-10 bg-white w-[98vw] h-[98vh] rounded-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3 border-b border-mountain-100 bg-mountain-50/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-[14px] font-semibold text-mountain-900">
              Result Entry - {order.orderNumber}
            </h2>
            <div className="w-[1px] h-4 bg-mountain-200 mx-1" />
            <p className="text-[13px] text-mountain-600">
              {order.patientName} ({order.patientAge}y • {order.patientGender})
            </p>
            {isMicrobiology && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase tracking-tight border border-indigo-200">
                Microbiology Test
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-mountain-400 hover:text-mountain-700 transition-colors"
          >
            <IoArrowBackOutline className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-mountain-50/20">
          <div className="grid grid-cols-12 gap-4 mb-4 px-4 text-[12px] font-bold text-mountain-400 tracking-wide">
            <div className="col-span-4">Parameter</div>
            <div className="col-span-3">Result Value</div>
            <div className="col-span-2 text-center">Unit</div>
            <div className="col-span-3">Reference Range</div>
          </div>

          <div className="space-y-3">
            {(() => {
              const paramToTemplateMap: Record<string, string> = {};
              templates.forEach(template => {
                template.parameters.forEach(pId => {
                  if (order.testTemplateIds?.includes(template.id) || order.testNames?.includes(template.name)) {
                    paramToTemplateMap[pId] = template.name;
                  }
                });
              });

              let lastGroupHeader = "";
              return results.map((result, index) => {
                const param = parameters.find(p => p.id === result.parameterId);
                const templateName = paramToTemplateMap[result.parameterId];
                const categoryObj = categories.find(c => c.id === param?.categoryId);

                const currentGroupHeader = templateName || categoryObj?.name || "";
                const showGroupHeader = currentGroupHeader && currentGroupHeader !== lastGroupHeader;
                if (showGroupHeader) {
                  lastGroupHeader = currentGroupHeader;
                }

                return (
                  <div key={index} className="contents">
                    {showGroupHeader && currentGroupHeader && (
                      <div className="col-span-12 flex items-center gap-2 px-3 py-2 border border-teal-200 bg-teal-50/50 rounded-md mt-5 first:mt-0 shadow-sm">
                        <IoFlaskOutline className="w-4 h-4 text-teal-600" />
                        <p className="text-[12px] font-bold text-teal-800 uppercase tracking-wider">
                          {currentGroupHeader}
                        </p>
                      </div>
                    )}

                    <div
                      className={`grid grid-cols-12 gap-4 items-center px-4 py-1 transition-all border-l-4 duration-75 ${result.isHeader ? 'bg-mountain-100/20 border-teal-500 mt-2 py-1.5' :
                          'border-transparent hover:bg-teal-50/30 focus-within:border-teal-500 focus-within:bg-teal-50/50'
                        }`}
                      style={{
                        marginLeft: result.indentationLevel ? `${result.indentationLevel * 16}px` : '0px'
                      }}
                    >
                      {result.isHeader ? (
                        <div className="col-span-12 flex items-center gap-2">
                          <p className="text-[12px] font-bold text-teal-700">
                            {result.parameterName}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="col-span-4">
                            <p className={`text-[13px] font-bold ${result.status === 'critical' ? 'text-red-600' :
                                result.status === 'abnormal' ? 'text-amber-600' :
                                  'text-mountain-800'
                              }`}>
                              {result.parameterName}
                              {result.flag && (result.status === 'abnormal' || result.status === 'critical') && (
                                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-black border ${result.status === 'critical' ? 'bg-red-600 text-white border-red-700' : 'bg-amber-500 text-white border-amber-600'
                                  }`}>
                                  {result.flag}
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="col-span-3 relative">
                            {param?.resultType === 'text' ? (
                              <textarea
                                id={`input-${index}`}
                                autoFocus={index === 0}
                                className={`w-full p-1.5 rounded border focus:outline-none transition-all font-medium text-[13px] min-h-[40px] ${result.status === 'critical' ? 'bg-red-50 border-red-300 text-red-900 focus:border-red-500' :
                                    result.status === 'abnormal' ? 'bg-amber-50 border-amber-300 text-amber-900 focus:border-amber-500' :
                                      'bg-white border-mountain-200 text-mountain-900 focus:border-teal-500'
                                  }`}
                                value={result.value}
                                onChange={(e) => handleValueChange(index, e.target.value)}
                                placeholder="..."
                              />
                            ) : (
                              <input
                                id={`input-${index}`}
                                autoFocus={index === 0}
                                className={`w-full h-[28px] px-2 rounded border focus:outline-none transition-all font-bold text-[13.5px] ${result.status === 'critical' ? 'bg-red-50 border-red-300 text-red-900 focus:border-red-500' :
                                    result.status === 'abnormal' ? 'bg-amber-50 border-amber-300 text-amber-900 focus:border-amber-500' :
                                      'bg-white border-mountain-200 text-mountain-900 focus:border-teal-500'
                                  }`}
                                value={result.value}
                                onChange={(e) => handleValueChange(index, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    document.getElementById(`input-${index + 1}`)?.focus();
                                  }
                                }}
                                placeholder="0.00"
                              />
                            )}
                          </div>

                          <div className="col-span-2 text-center text-mountain-400 font-medium text-[12px]">
                            {result.unit || "—"}
                          </div>

                          <div className="col-span-3">
                            <div className="px-2 py-0.5 bg-mountain-50/50 border border-mountain-100 rounded text-center text-[11px] text-mountain-500 font-medium">
                              {result.referenceRange || "—"}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              });
            })()}

            {/* Microbiology Specialized Section */}
            {isMicrobiology && (
              <div className="mt-8 border-t-2 border-indigo-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <IoShieldCheckmarkOutline className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-[14px] font-bold text-indigo-900 uppercase tracking-wider">
                      Microbiology Culture & Sensitivity
                    </h3>
                  </div>
                  <Button
                    size="sm"
                    variant="flat"
                    color="secondary"
                    onClick={() => {
                      setOrganismIsolated("No Growth after 48 hours of aerobic incubation");
                      setColonyCount("N/A");
                      setSensitivities([]);
                    }}
                  >
                    No Growth Shortcut
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <Input
                    label="Organism Isolated"
                    placeholder="e.g. Escherichia coli (E. coli)"
                    value={organismIsolated}
                    onValueChange={setOrganismIsolated}
                    className="bg-white"
                  />
                  <Input
                    label="Colony Count"
                    placeholder="e.g. > 10^5 CFU/ml"
                    value={colonyCount}
                    onValueChange={setColonyCount}
                    className="bg-white"
                  />
                </div>

                <div className="bg-white border border-indigo-100 rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-indigo-50/50 px-4 py-2 border-b border-indigo-100 flex justify-between items-center">
                    <p className="text-[12px] font-bold text-indigo-800">ANTIBIOTIC SENSITIVITY MATRIX</p>
                    <div className="flex gap-2">
                      <select
                        className="h-8 border border-indigo-200 rounded px-2 text-[11px] bg-white text-indigo-700 outline-none"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddSensitivity(e.target.value);
                            e.target.value = "";
                          }
                        }}
                      >
                        <option value="">+ Quick Add Antibiotic</option>
                        {COMMON_ANTIBIOTICS.filter(a => !sensitivities.some(s => s.antibiotic === a)).map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                      <Button size="sm" color="primary" variant="flat" startContent={<IoAddOutline />} onClick={() => handleAddSensitivity()}>
                        Custom
                      </Button>
                    </div>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-mountain-50/50 border-b border-mountain-100">
                        <th className="px-4 py-2 text-[11px] font-bold text-mountain-500">Antibiotic Name</th>
                        <th className="px-4 py-2 text-[11px] font-bold text-mountain-500 text-center">Sensitivity (S/I/R)</th>
                        <th className="px-4 py-2 text-[11px] font-bold text-mountain-500">Zone of Inhibition</th>
                        <th className="px-4 py-2 text-right text-[11px] font-bold text-mountain-500">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sensitivities.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-mountain-400 text-[12px]">
                            No antibiotics added to the matrix yet.
                          </td>
                        </tr>
                      ) : (
                        sensitivities.map((s, i) => (
                          <tr key={i} className="border-b border-mountain-50 hover:bg-mountain-50/30 transition-colors">
                            <td className="px-4 py-2">
                              <input
                                className="w-full h-8 px-2 border-none bg-transparent text-[13px] font-medium text-mountain-800 focus:outline-none"
                                value={s.antibiotic}
                                onChange={(e) => updateSensitivity(i, "antibiotic", e.target.value)}
                                placeholder="Antibiotic name..."
                              />
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex justify-center gap-1">
                                {["S", "I", "R", "None"].map(val => (
                                  <button
                                    key={val}
                                    onClick={() => updateSensitivity(i, "sensitivity", val)}
                                    className={`w-8 h-8 rounded text-[11px] font-black transition-all ${s.sensitivity === val
                                        ? (val === 'S' ? 'bg-emerald-500 text-white shadow-md scale-110' :
                                          val === 'I' ? 'bg-amber-500 text-white shadow-md scale-110' :
                                            val === 'R' ? 'bg-rose-500 text-white shadow-md scale-110' :
                                              'bg-slate-500 text-white shadow-md scale-110')
                                        : 'bg-mountain-100 text-mountain-400 hover:bg-mountain-200'
                                      }`}
                                  >
                                    {val}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-[13px] text-mountain-500">
                              <input
                                className="w-full h-8 px-2 border-none bg-transparent text-[13px] focus:outline-none"
                                value={s.zoneOfInhibition}
                                onChange={(e) => updateSensitivity(i, "zoneOfInhibition", e.target.value)}
                                placeholder="e.g. 18mm"
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                onClick={() => handleRemoveSensitivity(i)}
                                className="p-1.5 text-mountain-300 hover:text-red-500 transition-colors"
                              >
                                <IoTrashOutline className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div className="bg-indigo-50/30 px-4 py-2 border-t border-indigo-100 flex gap-4">
                    <p className="text-[10px] text-indigo-500 font-bold uppercase"><span className="text-emerald-600 mr-1">S:</span> Sensitive</p>
                    <p className="text-[10px] text-indigo-500 font-bold uppercase"><span className="text-amber-600 mr-1">I:</span> Intermediate</p>
                    <p className="text-[10px] text-indigo-500 font-bold uppercase"><span className="text-rose-600 mr-1">R:</span> Resistant</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-mountain-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <p className="text-[12px] text-mountain-500">
                Current Status: <span className="font-semibold">{order.status}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="flat" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="flat"
              color="primary"
              startContent={<IoSaveOutline />}
              isLoading={loading}
              onClick={() => handleSave('processing')}
            >
              Save Draft
            </Button>
            <Button
              size="sm"
              color="primary"
              variant="flat"
              startContent={<IoCheckmarkCircleOutline />}
              isLoading={loading}
              onClick={() => handleSave('completed')}
            >
              Mark Completed
            </Button>
            <Button
              size="sm"
              color="primary"
              startContent={<IoCheckmarkCircleOutline />}
              isLoading={loading}
              onClick={() => handleSave('verified')}
            >
              Verify & Sign
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
