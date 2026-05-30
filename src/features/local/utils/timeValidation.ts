export const timeStringToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

export const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

export const isEndTimeAfterStart = (start: string, end: string): boolean => {
  if (!isValidTimeFormat(start) || !isValidTimeFormat(end)) {
    return false;
  }
  return timeStringToMinutes(end) > timeStringToMinutes(start);
};

export const hasTimeSlotOverlap = (timeSlots: { start: string; end: string }[]): boolean => {
  const validSlots = timeSlots.filter(slot =>
    isValidTimeFormat(slot.start) && isValidTimeFormat(slot.end)
  );

  for (let i = 0; i < validSlots.length; i++) {
    for (let j = i + 1; j < validSlots.length; j++) {
      const slot1Start = timeStringToMinutes(validSlots[i].start);
      const slot1End = timeStringToMinutes(validSlots[i].end);
      const slot2Start = timeStringToMinutes(validSlots[j].start);
      const slot2End = timeStringToMinutes(validSlots[j].end);

      if (slot1Start < slot2End && slot2Start < slot1End) {
        return true;
      }
    }
  }
  return false;
};