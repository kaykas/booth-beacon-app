'use client';

import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { useMemo } from 'react';

interface HoursStatusProps {
  hours: string | null;
  className?: string;
}

export function HoursStatus({ hours, className = '' }: HoursStatusProps) {
  const status = useMemo(() => {
    if (!hours) return null;

    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Parse hours string (format: "Monday: 9:00 AM - 5:00 PM")
    const lines = hours.split('\n').map(line => line.toLowerCase().trim());
    const todayLine = lines.find(line => line.startsWith(currentDay));

    if (!todayLine) return null;

    // Check for "closed"
    if (todayLine.includes('closed')) {
      return { isOpen: false, message: 'Closed today' };
    }

    // Extract time range
    const timeMatch = todayLine.match(/(\d{1,2}):(\d{2})\s*(am|pm).*?(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (!timeMatch) return null;

    const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = timeMatch;

    const startTime = (
      (parseInt(startHour) % 12 + (startPeriod.toLowerCase() === 'pm' ? 12 : 0)) * 60 +
      parseInt(startMin)
    );
    const endTime = (
      (parseInt(endHour) % 12 + (endPeriod.toLowerCase() === 'pm' ? 12 : 0)) * 60 +
      parseInt(endMin)
    );

    const isOpen = currentTime >= startTime && currentTime <= endTime;

    if (isOpen) {
      // Calculate closing time
      const minsUntilClose = endTime - currentTime;
      if (minsUntilClose <= 60) {
        return { isOpen: true, message: `Closes in ${minsUntilClose} minutes` };
      }
      return { isOpen: true, message: 'Open now' };
    } else if (currentTime < startTime) {
      // Not open yet today
      const minsUntilOpen = startTime - currentTime;
      if (minsUntilOpen <= 60) {
        return { isOpen: false, message: `Opens in ${minsUntilOpen} minutes` };
      }
      return { isOpen: false, message: 'Closed now' };
    } else {
      return { isOpen: false, message: 'Closed now' };
    }
  }, [hours]);

  if (!status) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {status.isOpen ? (
        <CheckCircle className="w-4 h-4 text-green-600" />
      ) : (
        <XCircle className="w-4 h-4 text-red-600" />
      )}
      <span className={`text-sm font-medium ${status.isOpen ? 'text-green-700' : 'text-red-700'}`}>
        {status.message}
      </span>
      <Clock className="w-3 h-3 text-neutral-500 ml-1" />
    </div>
  );
}
