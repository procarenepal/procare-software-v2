/**
 * Enhanced Utility functions for converting between AD (Gregorian) and BS (Bikram Sambat) dates
 * Based on the fact that Nepali Calendar is approximately 56 years and 8 months ahead of Gregorian Calendar
 *
 * Key Facts:
 * - Nepali Calendar is ~56 years and 8 months ahead of Gregorian Calendar
 * - BS 2000/01/01 corresponds to AD 1943/04/14 (approximately)
 * - Average offset: 56 years, 8 months, 15 days
 */

// More comprehensive BS year data with days in each month
const bsData: { [year: number]: number[] } = {
  2075: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 2018-2019
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2019-2020
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 2020-2021
  2078: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2021-2022
  2079: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 2022-2023
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2023-2024
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 2024-2025
  2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2025-2026
  2083: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 2026-2027
  2084: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2027-2028
  2085: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 2028-2029
  2086: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2029-2030
  2087: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30], // 2030-2031
  2088: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31], // 2031-2032
  2089: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 2032-2033
  2090: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2033-2034
};

// Enhanced reference points for more accurate conversion
// BS 2081/01/01 corresponds to AD 2024/04/13 (verified reference point)
const BS_AD_REFERENCE = {
  bsYear: 2081,
  bsMonth: 1,
  bsDay: 1,
  adYear: 2024,
  adMonth: 4, // April
  adDay: 13,
};

// Standard offset: 56 years, 8 months, 15 days (approximately)
const STANDARD_OFFSET = {
  years: 56,
  months: 8,
  days: 15,
};

/**
 * Convert AD date to BS date using enhanced algorithm
 * @param adDate - JavaScript Date object in AD
 * @returns Object with BS year, month, day and formatted string
 */
export function adToBS(adDate: Date): {
  year: number;
  month: number;
  day: number;
  formatted: string;
} {
  try {
    // For dates close to our reference point, use precise calculation
    // Use UTC to avoid timezone issues
    const referenceDate = new Date(
      Date.UTC(
        BS_AD_REFERENCE.adYear,
        BS_AD_REFERENCE.adMonth - 1,
        BS_AD_REFERENCE.adDay,
      ),
    );
    const daysDiff = Math.floor(
      (adDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // If within a reasonable range of our reference point, use precise calculation
    if (Math.abs(daysDiff) < 365 * 10) {
      // Within 10 years of reference point
      return calculatePreciseConversion(adDate, daysDiff);
    } else {
      // For dates far from reference, use approximation method
      return calculateApproximateConversion(adDate);
    }
  } catch (error) {
    console.error("Error converting AD to BS:", error);

    // Fallback to simple approximation
    return calculateApproximateConversion(adDate);
  }
}

/**
 * Calculate precise conversion using reference point and day counting
 */
function calculatePreciseConversion(
  adDate: Date,
  daysDiff: number,
): { year: number; month: number; day: number; formatted: string } {
  let bsYear = BS_AD_REFERENCE.bsYear;
  let bsMonth = BS_AD_REFERENCE.bsMonth;
  let bsDay = BS_AD_REFERENCE.bsDay + daysDiff;

  // Adjust for negative days (dates before reference)
  while (bsDay <= 0) {
    bsMonth--;
    if (bsMonth <= 0) {
      bsMonth = 12;
      bsYear--;
    }
    const daysInPrevMonth = getDaysInBSMonth(bsYear, bsMonth);

    bsDay += daysInPrevMonth;
  }

  // Adjust for days exceeding month length
  while (true) {
    const daysInMonth = getDaysInBSMonth(bsYear, bsMonth);

    if (bsDay <= daysInMonth) break;

    bsDay -= daysInMonth;
    bsMonth++;
    if (bsMonth > 12) {
      bsMonth = 1;
      bsYear++;
    }
  }

  const formatted = `${bsYear}/${bsMonth.toString().padStart(2, "0")}/${bsDay.toString().padStart(2, "0")}`;

  return {
    year: bsYear,
    month: bsMonth,
    day: bsDay,
    formatted,
  };
}

/**
 * Calculate approximate conversion using standard offset (56 years, 8 months, 15 days)
 */
function calculateApproximateConversion(adDate: Date): {
  year: number;
  month: number;
  day: number;
  formatted: string;
} {
  const adYear = adDate.getFullYear();
  const adMonth = adDate.getMonth() + 1; // Convert to 1-based
  const adDay = adDate.getDate();

  // Add the standard offset
  let bsYear = adYear + STANDARD_OFFSET.years;
  let bsMonth = adMonth + STANDARD_OFFSET.months;
  let bsDay = adDay + STANDARD_OFFSET.days;

  // Adjust month overflow
  if (bsMonth > 12) {
    bsYear += Math.floor((bsMonth - 1) / 12);
    bsMonth = ((bsMonth - 1) % 12) + 1;
  }

  // Approximate day adjustment (simplified)
  const maxDaysInBSMonth = getDaysInBSMonth(bsYear, bsMonth);

  if (bsDay > maxDaysInBSMonth) {
    bsDay = Math.min(bsDay, maxDaysInBSMonth);
  }

  const formatted = `${bsYear}/${bsMonth.toString().padStart(2, "0")}/${bsDay.toString().padStart(2, "0")}`;

  return {
    year: bsYear,
    month: bsMonth,
    day: bsDay,
    formatted,
  };
}

/**
 * Get number of days in a BS month
 * @param year - BS year
 * @param month - BS month (1-12)
 * @returns Number of days in the month
 */
function getDaysInBSMonth(year: number, month: number): number {
  if (bsData[year] && bsData[year][month - 1]) {
    return bsData[year][month - 1];
  }

  // Default days for each month if data not available
  const defaultDays = [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30];

  return defaultDays[month - 1] || 30;
}

/**
 * Get total number of days in a BS year
 * @param year - BS year
 * @returns Total days in the year
 */
function getTotalDaysInBSYear(year: number): number {
  let totalDays = 0;

  for (let month = 1; month <= 12; month++) {
    totalDays += getDaysInBSMonth(year, month);
  }

  return totalDays;
}

/**
 * Convert BS date string to AD date using enhanced algorithm
 * @param bsDateString - BS date in YYYY/MM/DD format
 * @returns JavaScript Date object
 */
export function bsToAD(bsDateString: string): Date {
  try {
    // Handle both slash and dash separators
    const parts = bsDateString.includes("/")
      ? bsDateString.split("/")
      : bsDateString.split("-");

    if (parts.length !== 3) {
      throw new Error("Invalid BS date format. Use YYYY/MM/DD or YYYY-MM-DD");
    }

    const bsYear = parseInt(parts[0], 10);
    const bsMonth = parseInt(parts[1], 10);
    const bsDay = parseInt(parts[2], 10);

    // Validate input
    if (!isValidBSDate(bsYear, bsMonth, bsDay)) {
      throw new Error("Invalid BS date");
    }

    // For dates close to our reference point, use precise calculation
    const yearDiff = Math.abs(bsYear - BS_AD_REFERENCE.bsYear);

    if (yearDiff < 10) {
      // Within 10 years of reference point
      return calculatePreciseBSToAD(bsYear, bsMonth, bsDay);
    } else {
      // For dates far from reference, use approximation method
      return calculateApproximateBSToAD(bsYear, bsMonth, bsDay);
    }
  } catch (error) {
    console.error("Error converting BS to AD:", error);
    // Fallback to simple approximation
    const bsYear = parseInt(bsDateString.split(/[/-]/)[0], 10) || 2081;
    const adYear = bsYear - STANDARD_OFFSET.years;

    return new Date(adYear, 3, 15); // Default to April 15
  }
}

/**
 * Calculate precise BS to AD conversion using reference point
 */
function calculatePreciseBSToAD(
  bsYear: number,
  bsMonth: number,
  bsDay: number,
): Date {
  // Use UTC to avoid timezone issues
  const referenceDate = new Date(
    Date.UTC(
      BS_AD_REFERENCE.adYear,
      BS_AD_REFERENCE.adMonth - 1,
      BS_AD_REFERENCE.adDay,
    ),
  );

  // Calculate total days from BS reference to the given BS date
  let totalDays = 0;

  // Add/subtract years
  if (bsYear >= BS_AD_REFERENCE.bsYear) {
    // Forward calculation
    for (let year = BS_AD_REFERENCE.bsYear; year < bsYear; year++) {
      totalDays += getTotalDaysInBSYear(year);
    }
  } else {
    // Backward calculation
    for (let year = bsYear; year < BS_AD_REFERENCE.bsYear; year++) {
      totalDays -= getTotalDaysInBSYear(year);
    }
  }

  // Add/subtract months within the target year
  if (bsYear >= BS_AD_REFERENCE.bsYear) {
    for (let month = BS_AD_REFERENCE.bsMonth; month < bsMonth; month++) {
      totalDays += getDaysInBSMonth(bsYear, month);
    }
  } else {
    for (let month = bsMonth; month < BS_AD_REFERENCE.bsMonth; month++) {
      totalDays -= getDaysInBSMonth(bsYear, month);
    }
  }

  // Add/subtract days
  totalDays += bsDay - BS_AD_REFERENCE.bsDay;

  // Calculate the final AD date using UTC to avoid timezone issues
  const resultDate = new Date(
    referenceDate.getTime() + totalDays * 24 * 60 * 60 * 1000,
  );

  return resultDate;
}

/**
 * Calculate approximate BS to AD conversion using standard offset
 */
function calculateApproximateBSToAD(
  bsYear: number,
  bsMonth: number,
  bsDay: number,
): Date {
  // Subtract the standard offset
  let adYear = bsYear - STANDARD_OFFSET.years;
  let adMonth = bsMonth - STANDARD_OFFSET.months;
  let adDay = bsDay - STANDARD_OFFSET.days;

  // Adjust month underflow
  if (adMonth <= 0) {
    adYear += Math.floor((adMonth - 12) / 12);
    adMonth = ((adMonth - 1) % 12) + 12;
  }

  // Adjust day underflow (simplified)
  if (adDay <= 0) {
    adMonth--;
    if (adMonth <= 0) {
      adMonth = 12;
      adYear--;
    }
    // Use 30 days as approximate month length
    adDay += 30;
  }

  // Create the AD date using UTC to avoid timezone issues
  const adDate = new Date(Date.UTC(adYear, adMonth - 1, Math.min(adDay, 31)));

  return adDate;
}

/**
 * Format BS date for display
 * @param year - BS year
 * @param month - BS month
 * @param day - BS day
 * @returns Formatted string
 */
export function formatBSDate(year: number, month: number, day: number): string {
  const monthNames = [
    "Baisakh",
    "Jestha",
    "Ashadh",
    "Shrawan",
    "Bhadra",
    "Ashwin",
    "Kartik",
    "Mangsir",
    "Poush",
    "Magh",
    "Falgun",
    "Chaitra",
  ];

  return `${day} ${monthNames[month - 1]} ${year}`;
}

/**
 * Validate BS date
 * @param year - BS year
 * @param month - BS month
 * @param day - BS day
 * @returns boolean indicating if date is valid
 */
export function isValidBSDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;

  const daysInMonth = getDaysInBSMonth(year, month);

  return day <= daysInMonth;
}

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date of birth as Date object or string
 * @returns Age in years
 */
export function calculateAgeFromDOB(dateOfBirth: Date | string): number {
  const birthDate =
    typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Get age description with years and months
 * @param dateOfBirth - Date of birth as Date object or string
 * @returns Age description like "25 years, 3 months"
 */
export function getDetailedAge(dateOfBirth: Date | string): string {
  const birthDate =
    typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const daysInLastMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      0,
    ).getDate();

    days += daysInLastMonth;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const parts = [];

  if (years > 0) parts.push(`${years} year${years !== 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} month${months !== 1 ? "s" : ""}`);

  return parts.length > 0 ? parts.join(", ") : "Less than 1 month";
}
