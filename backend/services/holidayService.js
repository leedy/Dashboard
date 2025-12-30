/**
 * Holiday Service for Disney Wait Time Tracking
 * Detects US holidays and special periods that affect park crowds
 * Uses date-holidays npm package
 */

const Holidays = require('date-holidays');

// Initialize for US holidays (Florida)
const hd = new Holidays('US', 'FL');

/**
 * High-impact holidays and periods for Disney World crowds
 * These typically cause significantly higher wait times
 */
const HIGH_IMPACT_HOLIDAYS = [
  "New Year's Day",
  "Martin Luther King Jr. Day",
  "Presidents' Day",
  "Memorial Day",
  "Independence Day",
  "Labor Day",
  "Columbus Day",
  "Veterans Day",
  "Thanksgiving Day",
  "Christmas Day"
];

/**
 * Check if a given date is a US holiday
 * @param {Date} date - Date to check
 * @returns {{isHoliday: boolean, holidayName: string | null, isHighImpact: boolean}}
 */
function checkHoliday(date = new Date()) {
  const holidays = hd.isHoliday(date);

  if (!holidays || holidays.length === 0) {
    return {
      isHoliday: false,
      holidayName: null,
      isHighImpact: false
    };
  }

  // Get the first/primary holiday
  const holiday = holidays[0];

  return {
    isHoliday: true,
    holidayName: holiday.name,
    isHighImpact: HIGH_IMPACT_HOLIDAYS.includes(holiday.name)
  };
}

/**
 * Check if date falls within a high-crowd period
 * (week of Thanksgiving, Christmas week, Spring Break, etc.)
 * @param {Date} date - Date to check
 * @returns {{isPeakPeriod: boolean, periodName: string | null}}
 */
function checkPeakPeriod(date = new Date()) {
  const month = date.getMonth() + 1;  // 1-12
  const day = date.getDate();

  // Christmas/New Year period (Dec 20 - Jan 3)
  if ((month === 12 && day >= 20) || (month === 1 && day <= 3)) {
    return { isPeakPeriod: true, periodName: 'Christmas/New Year Week' };
  }

  // Thanksgiving week (varies, but roughly Nov 20-30)
  if (month === 11 && day >= 20 && day <= 30) {
    return { isPeakPeriod: true, periodName: 'Thanksgiving Week' };
  }

  // Spring Break (roughly mid-March to mid-April)
  if ((month === 3 && day >= 10) || (month === 4 && day <= 20)) {
    return { isPeakPeriod: true, periodName: 'Spring Break' };
  }

  // Summer peak (mid-June to mid-August)
  if ((month === 6 && day >= 15) || month === 7 || (month === 8 && day <= 15)) {
    return { isPeakPeriod: true, periodName: 'Summer Peak' };
  }

  // Presidents Day week (mid-February)
  if (month === 2 && day >= 14 && day <= 21) {
    return { isPeakPeriod: true, periodName: "Presidents' Day Week" };
  }

  return { isPeakPeriod: false, periodName: null };
}

/**
 * Get full context for a date (holiday + peak period info)
 * @param {Date} date - Date to check
 * @returns {Object} Combined holiday and peak period information
 */
function getDateContext(date = new Date()) {
  const holidayInfo = checkHoliday(date);
  const peakInfo = checkPeakPeriod(date);

  return {
    ...holidayInfo,
    ...peakInfo,
    // Consider it a "busy" date if it's a high-impact holiday or peak period
    isBusyDate: holidayInfo.isHighImpact || peakInfo.isPeakPeriod
  };
}

/**
 * Get all holidays for a given year
 * @param {number} year - Year to get holidays for
 * @returns {Array} List of holidays
 */
function getHolidaysForYear(year = new Date().getFullYear()) {
  return hd.getHolidays(year);
}

module.exports = {
  checkHoliday,
  checkPeakPeriod,
  getDateContext,
  getHolidaysForYear,
  HIGH_IMPACT_HOLIDAYS
};
