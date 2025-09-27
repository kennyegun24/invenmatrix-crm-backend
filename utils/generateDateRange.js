// Helper: generate date range array
function generateDateRange(start, end, type = "daily") {
  const dates = [];
  const current = new Date(start);

  while (current <= end) {
    if (type.toLowerCase() === "yearly") {
      dates.push({
        year: current.getFullYear(),
        month: current.getMonth() + 1,
      });
      current.setMonth(current.getMonth() + 1, 1); // next month
    } else {
      dates.push({
        year: current.getFullYear(),
        month: current.getMonth() + 1,
        day: current.getDate(),
      });
      current.setDate(current.getDate() + 1); // next day
    }
  }

  return dates;
}

module.exports = { generateDateRange };
