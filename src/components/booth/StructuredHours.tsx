'use client';

import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo } from 'react';

interface StructuredHoursProps {
  hours: string | null;
}

interface ParsedDay {
  day: string;
  displayDay: string;
  hours: string;
  isToday: boolean;
  isClosed: boolean;
}

interface OpenStatus {
  isOpen: boolean;
  message: string;
  color: string;
  dotColor: string;
}

// Parse hours string into structured format
function parseHoursString(hours: string | null): ParsedDay[] {
  if (!hours) return [];

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const displayDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = dayNames[now.getDay()];

  const lines = hours.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const parsed: ParsedDay[] = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Find which day this line is for
    const dayIndex = dayNames.findIndex(day => lowerLine.startsWith(day));

    if (dayIndex !== -1) {
      const day = dayNames[dayIndex];
      const displayDay = displayDayNames[dayIndex];

      // Extract hours part (after the day name and colon)
      const hoursPart = line.substring(displayDay.length).replace(/^:\s*/, '').trim();

      const isClosed = lowerLine.includes('closed');
      const isToday = day === currentDay;

      parsed.push({
        day,
        displayDay,
        hours: isClosed ? 'Closed' : hoursPart || 'Hours not listed',
        isToday,
        isClosed,
      });
    }
  }

  return parsed;
}

// Calculate open/closed status with time until next change
function calculateOpenStatus(hours: string | null): OpenStatus | null {
  if (!hours) return null;

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Parse hours string
  const lines = hours.split('\n').map(line => line.toLowerCase().trim());
  const todayLine = lines.find(line => line.startsWith(currentDay));

  if (!todayLine) return null;

  // Check for "closed"
  if (todayLine.includes('closed')) {
    return {
      isOpen: false,
      message: 'Closed Today',
      color: 'text-red-700',
      dotColor: 'bg-red-500',
    };
  }

  // Extract time range - handle various formats
  // Formats: "9:00 AM - 5:00 PM", "9AM - 5PM", "9:00am-5:00pm", "09:00-17:00"
  const timeMatch = todayLine.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?.*?(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);

  if (!timeMatch) return null;

  const [, startHourStr, startMinStr, startPeriod, endHourStr, endMinStr, endPeriod] = timeMatch;

  // Parse start time
  let startHour = parseInt(startHourStr);
  const startMin = parseInt(startMinStr || '0');
  if (startPeriod) {
    if (startPeriod.toLowerCase() === 'pm' && startHour !== 12) startHour += 12;
    if (startPeriod.toLowerCase() === 'am' && startHour === 12) startHour = 0;
  }

  // Parse end time
  let endHour = parseInt(endHourStr);
  const endMin = parseInt(endMinStr || '0');
  if (endPeriod) {
    if (endPeriod.toLowerCase() === 'pm' && endHour !== 12) endHour += 12;
    if (endPeriod.toLowerCase() === 'am' && endHour === 12) endHour = 0;
  }

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  const isOpen = currentTime >= startTime && currentTime < endTime;

  if (isOpen) {
    // Calculate time until closing
    const minsUntilClose = endTime - currentTime;
    const hoursUntilClose = Math.floor(minsUntilClose / 60);
    const remainingMins = minsUntilClose % 60;

    if (minsUntilClose <= 30) {
      return {
        isOpen: true,
        message: `Closes in ${minsUntilClose} min`,
        color: 'text-amber-700',
        dotColor: 'bg-amber-500',
      };
    } else if (minsUntilClose <= 60) {
      return {
        isOpen: true,
        message: `Closes in ${minsUntilClose} min`,
        color: 'text-green-700',
        dotColor: 'bg-green-500',
      };
    } else if (hoursUntilClose < 2) {
      return {
        isOpen: true,
        message: `Closes in ${hoursUntilClose}h ${remainingMins}m`,
        color: 'text-green-700',
        dotColor: 'bg-green-500',
      };
    } else {
      return {
        isOpen: true,
        message: 'Open Now',
        color: 'text-green-700',
        dotColor: 'bg-green-500',
      };
    }
  } else if (currentTime < startTime) {
    // Not open yet today
    const minsUntilOpen = startTime - currentTime;
    const hoursUntilOpen = Math.floor(minsUntilOpen / 60);
    const remainingMins = minsUntilOpen % 60;

    if (minsUntilOpen <= 30) {
      return {
        isOpen: false,
        message: `Opens in ${minsUntilOpen} min`,
        color: 'text-amber-700',
        dotColor: 'bg-amber-500',
      };
    } else if (minsUntilOpen <= 60) {
      return {
        isOpen: false,
        message: `Opens in ${minsUntilOpen} min`,
        color: 'text-red-700',
        dotColor: 'bg-red-500',
      };
    } else if (hoursUntilOpen < 3) {
      return {
        isOpen: false,
        message: `Opens in ${hoursUntilOpen}h ${remainingMins}m`,
        color: 'text-red-700',
        dotColor: 'bg-red-500',
      };
    } else {
      return {
        isOpen: false,
        message: 'Closed Now',
        color: 'text-red-700',
        dotColor: 'bg-red-500',
      };
    }
  } else {
    // After closing time
    return {
      isOpen: false,
      message: 'Closed Now',
      color: 'text-red-700',
      dotColor: 'bg-red-500',
    };
  }
}

export function StructuredHours({ hours }: StructuredHoursProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const parsedDays = useMemo(() => parseHoursString(hours), [hours]);
  const openStatus = useMemo(() => calculateOpenStatus(hours), [hours]);

  // Find today's hours for prominent display
  const todayHours = parsedDays.find(day => day.isToday);

  if (!hours || parsedDays.length === 0) {
    return (
      <div className="text-sm text-neutral-500 italic py-2">
        <Clock className="w-4 h-4 inline mr-1" />
        Hours not listed - check venue hours before visiting
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Current Status Badge */}
      {openStatus && (
        <div className={`flex items-center gap-2 p-3 rounded-lg bg-white border-2 ${
          openStatus.isOpen ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        }`}>
          <div className="relative flex items-center">
            <div className={`w-3 h-3 rounded-full ${openStatus.dotColor}`}>
              <div className={`w-3 h-3 rounded-full ${openStatus.dotColor} animate-ping absolute`} />
            </div>
          </div>
          <span className={`font-bold text-base ${openStatus.color}`}>
            {openStatus.message}
          </span>
          {todayHours && !todayHours.isClosed && (
            <span className="text-sm text-neutral-600 ml-auto">
              {todayHours.hours}
            </span>
          )}
        </div>
      )}

      {/* Today's Hours (if not already shown in status) */}
      {todayHours && !openStatus && (
        <div className="p-3 rounded-lg bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-900">
              {todayHours.displayDay} (Today)
            </span>
            <span className={`font-medium ${todayHours.isClosed ? 'text-red-600' : 'text-blue-800'}`}>
              {todayHours.hours}
            </span>
          </div>
        </div>
      )}

      {/* Full Week Schedule (Collapsible) */}
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 transition-colors group w-full"
        >
          <Clock className="w-4 h-4" />
          <span>Full Week Schedule</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 ml-auto group-hover:text-primary transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-auto group-hover:text-primary transition-colors" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-1 border border-neutral-200 rounded-lg overflow-hidden">
            {parsedDays.map((day) => (
              <div
                key={day.day}
                className={`flex justify-between items-center py-2.5 px-4 transition-colors ${
                  day.isToday
                    ? 'bg-blue-50 border-l-4 border-blue-500 font-semibold'
                    : 'bg-white hover:bg-neutral-50'
                }`}
              >
                <span className={`text-sm ${
                  day.isToday ? 'text-blue-900' : 'text-neutral-700'
                }`}>
                  {day.isToday && (
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2" />
                  )}
                  {day.displayDay}
                </span>
                <span className={`text-sm ${
                  day.isClosed
                    ? 'text-red-600 font-medium'
                    : day.isToday
                    ? 'text-blue-900'
                    : 'text-neutral-900'
                }`}>
                  {day.hours}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
