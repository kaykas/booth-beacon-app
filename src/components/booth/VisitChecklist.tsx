'use client';

import { CheckSquare, Clock, DollarSign, AlertCircle, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useState } from 'react';

interface VisitChecklistProps {
  boothName: string;
  hasHours: boolean;
  acceptsCash: boolean;
  acceptsCard: boolean;
  cost?: string;
}

export function VisitChecklist({
  boothName: _boothName,
  hasHours,
  acceptsCash,
  acceptsCard,
  cost,
}: VisitChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Build dynamic checklist items based on booth data
  const checklistItems = [
    {
      id: 'hours',
      text: hasHours ? 'Check hours before visiting' : 'Call ahead to confirm venue hours',
      icon: Clock,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'cash',
      text: acceptsCash && !acceptsCard
        ? `Bring ${cost || '$5-10'} in cash (exact change helps!)`
        : acceptsCash
        ? 'Bring cash or card for payment'
        : 'Check payment options before visiting',
      icon: DollarSign,
      color: acceptsCash && !acceptsCard ? 'text-green-700' : 'text-amber-700',
      bgColor: acceptsCash && !acceptsCard ? 'bg-green-50' : 'bg-amber-50',
    },
    {
      id: 'patience',
      text: 'Analog booths take 2-5 minutes to develop - be patient!',
      icon: Clock,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
    },
    {
      id: 'status',
      text: 'Call ahead if traveling far - booths can break unexpectedly',
      icon: AlertCircle,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
    },
    {
      id: 'phone',
      text: 'Save location to your phone before you go',
      icon: Smartphone,
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <Card className="p-6 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-2 border-orange-200 shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-orange-600" />
          Before You Visit
        </h3>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-orange-600 group-hover:text-orange-800 transition-colors" />
        ) : (
          <ChevronDown className="w-5 h-5 text-orange-600 group-hover:text-orange-800 transition-colors" />
        )}
      </button>

      {isExpanded && (
        <>
          <p className="text-sm text-orange-800 mb-4 font-medium">
            Maximize your visit with these helpful tips:
          </p>

          <ul className="space-y-2">
            {checklistItems.map((item) => {
              const Icon = item.icon;

              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/60 border border-orange-100 hover:bg-white/80 transition-colors"
                >
                  <div className={`p-1.5 rounded-full ${item.bgColor} flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                  </div>
                  <span className="text-sm text-neutral-800 leading-relaxed">
                    {item.text}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 p-3 bg-orange-100 border border-orange-200 rounded-lg">
            <p className="text-xs text-orange-900 font-medium text-center">
              Pro tip: Vintage booths have character and quirks - that&apos;s part of the charm!
            </p>
          </div>
        </>
      )}
    </Card>
  );
}
