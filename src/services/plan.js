import { getCurrentMonthDetails } from '../utils/helpers'
export const minEmployeesPerShift = { morning: 5, evening: 4, night: 2 };
// export const daysInMonth = allDays.length;

export function generateWorkPlan(employees, minEmployeesPerShift, monthIndex = new Date().getMonth()) {
  // Get month details using monthIndex (0-11) instead of offset
  const { allDays } = getCurrentMonthDetails(monthIndex);
  const daysInMonth = allDays.length;

  const workPlan = Array.from({ length: daysInMonth }, (_, i) => ({
    dayName: allDays[i].name,
    morning: [],
    evening: [],
    night: [],
    reserves: [],
  }));

  // Tracking objects
  const shiftCounts = {};
  const daysOff = {};
  const lastAssignedShift = {};
  const weekendShifts = {}; // Track which weekends employees have worked
  const nightShiftDays = {}; // Track days when employees worked night shifts

  employees.forEach(employee => {
    shiftCounts[employee.id] = 0;
    daysOff[employee.id] = [];
    lastAssignedShift[employee.id] = null;
    weekendShifts[employee.id] = new Set();
    nightShiftDays[employee.id] = [];
  });

  function isWeekend(day) {
    return workPlan[day].dayName === "Saturday" || workPlan[day].dayName === "Sunday";
  }

  function getWeekendIdentifier(day) {
    // Group Saturday and Sunday of the same weekend together
    const date = new Date(allDays[day].date);
    const sunday = new Date(date);
    sunday.setDate(date.getDate() + (6 - date.getDay())); // Get the Sunday of this week
    return sunday.toISOString().split('T')[0];
  }

  function isAssignedToAnyShift(employeeId, day) {
    return (
      workPlan[day].morning.some(e => e.id === employeeId) ||
      workPlan[day].evening.some(e => e.id === employeeId) ||
      workPlan[day].night.some(e => e.id === employeeId)
    );
  }

  function assignShift(employee, day, shiftType, isProvision = false) {
    if (isAssignedToAnyShift(employee.id, day)) return false;

    // Check if this is a weekend day and employee has already worked this weekend
    if (isWeekend(day)) {
      const weekendId = getWeekendIdentifier(day);
      if (weekendShifts[employee.id].has(weekendId)) {
        return false;
      }
    }

    // Check if employee has days off on this day (including after night shifts)
    if (daysOff[employee.id].includes(day)) return false;

    // Check night shift conditions
    if (shiftType === "night") {
      // Ensure employee is willing to work night shifts
      if (!employee.want_night) return false;

      // Ensure the next two days are not already assigned
      if (day + 1 < daysInMonth && isAssignedToAnyShift(employee.id, day + 1)) return false;
      if (day + 2 < daysInMonth && isAssignedToAnyShift(employee.id, day + 2)) return false;

      // Ensure the next two days are not already days off for other reasons
      if (daysOff[employee.id].includes(day + 1) || daysOff[employee.id].includes(day + 2)) {
        return false;
      }
    }

    // Assign the shift
    workPlan[day][shiftType].push({
      id: employee.id,
      name: employee.name,
      provision: isProvision,
    });
    shiftCounts[employee.id]++;
    lastAssignedShift[employee.id] = shiftType;

    // Handle night shift rules
    if (shiftType === "night") {
      // Mark the next two days as days off
      if (day + 1 < daysInMonth) daysOff[employee.id].push(day + 1);
      if (day + 2 < daysInMonth) daysOff[employee.id].push(day + 2);

      // Track night shift days
      nightShiftDays[employee.id].push(day);
    }

    // Track weekend shifts
    if (isWeekend(day)) {
      const weekendId = getWeekendIdentifier(day);
      weekendShifts[employee.id].add(weekendId);
    }

    return true;
  }

  function getAvailableEmployees(day, shiftType, employees) {
    return employees.filter(employee => {
      // Basic checks
      if (shiftCounts[employee.id] >= employee.maxDays) return false;
      if (isAssignedToAnyShift(employee.id, day)) return false;
      if (daysOff[employee.id].includes(day)) return false;

      // Night shift specific checks
      if (shiftType === "night") {
        if (!employee.want_night) return false;

        // Check if the next two days are available
        if (day + 1 < daysInMonth && isAssignedToAnyShift(employee.id, day + 1)) return false;
        if (day + 2 < daysInMonth && isAssignedToAnyShift(employee.id, day + 2)) return false;
        if (daysOff[employee.id].includes(day + 1) || daysOff[employee.id].includes(day + 2)) return false;
      }

      // Weekend checks
      if (isWeekend(day)) {
        const weekendId = getWeekendIdentifier(day);
        if (weekendShifts[employee.id].has(weekendId)) return false;
      }

      return true;
    }).sort((a, b) => {
      // Prioritize employees with fewer shifts
      if (shiftCounts[a.id] !== shiftCounts[b.id]) {
        return shiftCounts[a.id] - shiftCounts[b.id];
      }
      // Then prioritize those who haven't worked recent night shifts
      const aLastNight = nightShiftDays[a.id].length > 0 ?
        Math.max(...nightShiftDays[a.id]) : -Infinity;
      const bLastNight = nightShiftDays[b.id].length > 0 ?
        Math.max(...nightShiftDays[b.id]) : -Infinity;
      return aLastNight - bLastNight;
    });
  }

  // First pass: Assign preferred shifts
  employees.forEach(employee => {
    if (employee.preferredShifts && employee.preferredShifts.length > 0) {
      employee.preferredShifts.sort((a, b) => new Date(a.date) - new Date(b.date));

      for (const pref of employee.preferredShifts) {
        const shiftType = pref.shift.trim().toLowerCase();
        const dayIndex = allDays.findIndex(d => d.date === pref.date);
        if (dayIndex === -1 || shiftCounts[employee.id] >= employee.maxDays) continue;

        assignShift(employee, dayIndex, shiftType);
      }
    }
  });

  // Second pass: Fill minimum required shifts
  for (let day = 0; day < daysInMonth; day++) {
    ["morning", "evening", "night"].forEach(shiftType => {
      while (workPlan[day][shiftType].length < minEmployeesPerShift[shiftType]) {
        const available = getAvailableEmployees(day, shiftType, employees);
        if (available.length === 0) break;
        assignShift(available[0], day, shiftType);
      }
    });
  }

  // Third pass: Distribute remaining shifts evenly
  let remainingAttempts = 3; // Prevent infinite loops
  while (remainingAttempts-- > 0) {
    let assignedAny = false;

    for (let day = 0; day < daysInMonth; day++) {
      ["morning", "evening", "night"].forEach(shiftType => {
        const available = getAvailableEmployees(day, shiftType, employees);
        if (available.length > 0) {
          if (assignShift(available[0], day, shiftType)) {
            assignedAny = true;
          }
        }
      });
    }

    if (!assignedAny) break;
  }

  // Final pass: Assign provision shifts to meet maxDays requirements
  employees.forEach(employee => {
    while (shiftCounts[employee.id] < employee.minDays) {
      let assigned = false;

      // Try to find days with existing shifts to minimize isolated shifts
      for (let day = 0; day < daysInMonth; day++) {
        if (isAssignedToAnyShift(employee.id, day) || daysOff[employee.id].includes(day)) continue;

        // Prefer shifts adjacent to existing shifts
        const adjacentShifts = [];
        if (day > 0 && isAssignedToAnyShift(employee.id, day - 1)) adjacentShifts.push(day - 1);
        if (day < daysInMonth - 1 && isAssignedToAnyShift(employee.id, day + 1)) adjacentShifts.push(day + 1);

        if (adjacentShifts.length > 0) {
          const shifts = ["morning", "evening", "night"].filter(shift => shift !== "night" || employee.want_night);
          for (const shiftType of shifts) {
            if (assignShift(employee, day, shiftType, true)) {
              assigned = true;
              break;
            }
          }
          if (assigned) break;
        }
      }

      // If no adjacent shifts found, assign anywhere
      if (!assigned) {
        for (let day = 0; day < daysInMonth; day++) {
          if (isAssignedToAnyShift(employee.id, day) || daysOff[employee.id].includes(day)) continue;

          const shifts = ["morning", "evening", "night"].filter(shift => shift !== "night" || employee.want_night);
          for (const shiftType of shifts) {
            if (assignShift(employee, day, shiftType, true)) {
              assigned = true;
              break;
            }
          }
          if (assigned) break;
        }
      }

      if (!assigned) break;
    }
  });

  return { workPlan, shiftCounts, weekendShifts, nightShiftDays };
}

export function getEmployeeSchedule(employeeId, workPlan) {
  let employeeSchedule = [];

  for (let day = 0; day < workPlan.length; day++) {
    // Check all shifts for the employee on this day
    ["morning", "evening", "night"].forEach(shiftType => {
      const shift = workPlan[day][shiftType].find(e => e.id === employeeId);
      if (shift) {
        employeeSchedule.push({
          day: day + 1, // Adding 1 to make the day 1-based
          shift: shiftType,
        });
      }
    });
  }

  return employeeSchedule;
}



export const updateShift = (dayIndex, shiftType, employeeId, newEmployeeId, employees, workPlan, setWorkPlan, minEmployeesPerShift) => {
  // Create a deep copy of the work plan to avoid direct state mutation
  const updatedWorkPlan = JSON.parse(JSON.stringify(workPlan));

  // Find the shift to update
  const shift = updatedWorkPlan[dayIndex][shiftType];
  const employeeIndex = shift.findIndex(e => e.id === employeeId);

  if (employeeIndex === -1) {
    console.error("Employee not found in this shift");
    return;
  }

  // Check if new employee exists
  const newEmployee = employees.find(e => e.id === newEmployeeId);
  if (!newEmployee) {
    console.error("New employee not found");
    return;
  }

  // Check if new employee is already assigned to any shift this day
  const isAlreadyAssigned = (
    updatedWorkPlan[dayIndex].morning.some(e => e.id === newEmployeeId) ||
    updatedWorkPlan[dayIndex].evening.some(e => e.id === newEmployeeId) ||
    updatedWorkPlan[dayIndex].night.some(e => e.id === newEmployeeId)
  );

  if (isAlreadyAssigned) {
    alert("Employee is already assigned to a shift this day");
    return;
  }

  // Check night shift specific rules
  if (shiftType === "night") {
    if (!newEmployee.want_night) {
      alert("This employee doesn't want night shifts");
      return;
    }

    // Check next two days availability
    if (dayIndex + 1 < workPlan.length && (
      updatedWorkPlan[dayIndex + 1].morning.some(e => e.id === newEmployeeId) ||
      updatedWorkPlan[dayIndex + 1].evening.some(e => e.id === newEmployeeId) ||
      updatedWorkPlan[dayIndex + 1].night.some(e => e.id === newEmployeeId)
    )) {
      alert("Employee is assigned to a shift the next day");
      return;
    }

    if (dayIndex + 2 < workPlan.length && (
      updatedWorkPlan[dayIndex + 2].morning.some(e => e.id === newEmployeeId) ||
      updatedWorkPlan[dayIndex + 2].evening.some(e => e.id === newEmployeeId) ||
      updatedWorkPlan[dayIndex + 2].night.some(e => e.id === newEmployeeId)
    )) {
      alert("Employee is assigned to a shift two days after");
      return;
    }
  }

  // Weekend check
  const isWeekend = (workPlan[dayIndex].dayName === "Saturday" || workPlan[dayIndex].dayName === "Sunday");
  if (isWeekend) {
    const weekendId = getWeekendIdentifier(dayIndex);
    const hasWorkedThisWeekend = workPlan.some((day, idx) => {
      if (idx === dayIndex) return false;
      const dayWeekendId = getWeekendIdentifier(idx);
      return dayWeekendId === weekendId && (
        day.morning.some(e => e.id === newEmployeeId) ||
        day.evening.some(e => e.id === newEmployeeId) ||
        day.night.some(e => e.id === newEmployeeId)
      );
    });

    if (hasWorkedThisWeekend) {
      alert("Employee has already worked this weekend");
      return;
    }
  }

  // Perform the update
  shift[employeeIndex] = {
    id: newEmployeeId,
    name: newEmployee.name,
    provision: shift[employeeIndex].provision // Keep the same provision status
  };

  // Ensure we don't go below minimum employees
  if (shift.length < minEmployeesPerShift[shiftType]) {
    alert(`Cannot have fewer than ${minEmployeesPerShift[shiftType]} employees in ${shiftType} shift`);
    return;
  }

  setWorkPlan(updatedWorkPlan);
};


export const deleteEmployeeFromShift = (dayIndex, shiftType, employeeId, workPlan, setWorkPlan, minEmployeesPerShift) => {
  const updatedWorkPlan = JSON.parse(JSON.stringify(workPlan));

  const shift = updatedWorkPlan[dayIndex][shiftType];
  const employeeIndex = shift.findIndex(e => e.id === employeeId);

  if (employeeIndex === -1) {
    console.error("Employee not found in this shift");
    return;
  }

  // Check if we're going below the minimum required
  if (shift.length - 1 < minEmployeesPerShift[shiftType]) {
    alert(`Cannot have fewer than ${minEmployeesPerShift[shiftType]} employees in ${shiftType} shift`);
    return;
  }

  // Remove the employee
  shift.splice(employeeIndex, 1);
  setWorkPlan(updatedWorkPlan);
};


export function isWeekend(dayIndex, workPlan) {
  return workPlan[dayIndex].dayName === "Saturday" || workPlan[dayIndex].dayName === "Sunday";
}




//   Helper Functions 
function getWeekendIdentifier(dayIndex, workPlan) {
  // Group Saturday and Sunday of the same weekend together
  // Assuming you have access to the dates in your workPlan
  const date = new Date(workPlan[dayIndex].date); // You'll need to adjust this based on your data structure
  const sunday = new Date(date);
  sunday.setDate(date.getDate() + (6 - date.getDay())); // Get the Sunday of this week
  return sunday.toISOString().split('T')[0];
} 