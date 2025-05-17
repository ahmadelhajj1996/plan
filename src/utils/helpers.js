export const getCurrentMonthDetails = (monthIndex, year = new Date().getFullYear()) => {
  // monthIndex should be between 0 (January) and 11 (December)
  // year is optional and defaults to current year
  
  const month = monthIndex + 1; // Adjust for 1-based month in Date constructor
  
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);

  const daysInMonth = lastDay.getDate(); 

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentMonthName = monthNames[monthIndex];

  const weeks = [];
  let currentWeek = [];

  const weekends = [];
  const allDays = [];

  const weekdayNames = [
    "Sunday", "Monday", "Tuesday", "Wednesday", 
    "Thursday", "Friday", "Saturday"
  ];

  const shifts = ["morning", "evening", "night"];

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDay = new Date(year, monthIndex, day);
    const dayName = weekdayNames[currentDay.getDay()];

    allDays.push({
      date: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`,
      dayName: dayName,
      shifts: shifts,
    });

    if (currentDay.getDay() === 6 || currentDay.getDay() === 0) {
      weekends.push(`${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`);
    }

    if (currentDay.getDay() === 0 || day === daysInMonth) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  return {
    month: monthIndex,
    year,
    monthName: currentMonthName,
    daysInMonth,
    weeks,
    weekends,
    allDays,
    // firstDay: firstDay.toISOString().split('T')[0],
    // lastDay: lastDay.toISOString().split('T')[0],
  };
};


