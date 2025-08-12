const moment = require('moment');


exports.getWeekStartEnd = (year, week) => {
  const startDate = moment().year(year).week(week).startOf('week').toDate();
  const endDate = moment().year(year).week(week).endOf('week').toDate();
  return { startDate, endDate };
};


exports.getWeekRange = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day; // Adjust to get Monday
  start.setDate(start.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0); // Set to start of the day

  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Set to Sunday
  end.setHours(23, 59, 59, 999); // Set to end of the day

  return { start: start, end: end };
}


