'use client';

import { CheckCircle2, Circle, Clock, DollarSign, MapPin, Camera } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';

interface VisitChecklistProps {
  boothName: string;
  hasHours: boolean;
  hasCost: boolean;
  hasLocation: boolean;
  acceptsCash: boolean;
  acceptsCard: boolean;
}

export function VisitChecklist({
  boothName,
  hasHours,
  hasCost,
  hasLocation,
  acceptsCash,
  acceptsCard,
}: VisitChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Load checked items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`checklist-${boothName}`);
    if (saved) {
      setCheckedItems(new Set(JSON.parse(saved)));
    }
  }, [boothName]);

  const toggleItem = (item: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(item)) {
      newChecked.delete(item);
    } else {
      newChecked.add(item);
    }
    setCheckedItems(newChecked);
    localStorage.setItem(`checklist-${boothName}`, JSON.stringify([...newChecked]));
  };

  const checklistItems = [
    {
      id: 'hours',
      label: hasHours ? 'Check hours before visiting' : 'Check venue hours before visiting',
      icon: Clock,
      important: true,
    },
    {
      id: 'cash',
      label: acceptsCash && !acceptsCard ? 'Bring cash (card not accepted)' : 'Bring payment method',
      icon: DollarSign,
      important: !acceptsCard,
    },
    {
      id: 'location',
      label: 'Save location to your maps',
      icon: MapPin,
      important: true,
    },
    {
      id: 'camera',
      label: 'Bring camera to capture the moment',
      icon: Camera,
      important: false,
    },
  ];

  const completedCount = checklistItems.filter((item) => checkedItems.has(item.id)).length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Visit Checklist</h3>
        <span className="text-sm text-neutral-600">
          {completedCount}/{checklistItems.length}
        </span>
      </div>

      <div className="space-y-3">
        {checklistItems.map((item) => {
          const Icon = item.icon;
          const isChecked = checkedItems.has(item.id);

          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors text-left group"
            >
              {isChecked ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-neutral-300 group-hover:text-neutral-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className={`flex items-center gap-2 ${isChecked ? 'line-through text-neutral-500' : 'text-neutral-900'}`}>
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.important && !isChecked && (
                  <span className="text-xs text-amber-600 mt-1 block">Important</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {completedCount === checklistItems.length && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-sm font-medium text-green-800">You're all set to visit!</p>
        </div>
      )}
    </Card>
  );
}
