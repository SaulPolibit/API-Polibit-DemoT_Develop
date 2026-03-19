/**
 * Interest Calculator Utility
 * Day count convention calculations for Debt structures
 */

/**
 * Calculate actual days between two dates
 * @param {Date} startDate - Period start date
 * @param {Date} endDate - Period end date
 * @returns {number} Number of actual calendar days
 */
function actualDaysBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate days between two dates using 30/360 ISDA method
 * Each month is treated as 30 days, each year as 360 days.
 * @param {Date} startDate - Period start date
 * @param {Date} endDate - Period end date
 * @returns {number} Number of days per 30/360 convention
 */
function days30_360(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  let d1 = start.getDate();
  let m1 = start.getMonth() + 1;
  let y1 = start.getFullYear();

  let d2 = end.getDate();
  let m2 = end.getMonth() + 1;
  let y2 = end.getFullYear();

  // ISDA 30/360: if d1 is 31, change to 30. If d2 is 31 and d1 is 30 or 31, change d2 to 30.
  if (d1 === 31) d1 = 30;
  if (d2 === 31 && d1 >= 30) d2 = 30;

  return (360 * (y2 - y1)) + (30 * (m2 - m1)) + (d2 - d1);
}

/**
 * Calculate interest using a day count convention
 * @param {number} principal - The principal amount
 * @param {number} annualRate - Annual interest rate as a percentage (e.g., 10 for 10%)
 * @param {Date|string} startDate - Period start date
 * @param {Date|string} endDate - Period end date
 * @param {string} convention - Day count convention: 'actual_365', 'actual_360', or '30_360'
 * @returns {{ interest: number, dayCount: number, yearFraction: number }}
 */
function calculateInterest(principal, annualRate, startDate, endDate, convention = 'actual_365') {
  if (!principal || !annualRate || !startDate || !endDate) {
    return { interest: 0, dayCount: 0, yearFraction: 0 };
  }

  let dayCount;
  let divisor;

  switch (convention) {
    case 'actual_360':
      dayCount = actualDaysBetween(startDate, endDate);
      divisor = 360;
      break;
    case '30_360':
      dayCount = days30_360(startDate, endDate);
      divisor = 360;
      break;
    case 'actual_365':
    default:
      dayCount = actualDaysBetween(startDate, endDate);
      divisor = 365;
      break;
  }

  const yearFraction = dayCount / divisor;
  const interest = principal * (annualRate / 100) * yearFraction;

  return {
    interest: Math.round(interest * 100) / 100,
    dayCount,
    yearFraction: Math.round(yearFraction * 1000000) / 1000000
  };
}

module.exports = {
  calculateInterest,
  actualDaysBetween,
  days30_360
};
