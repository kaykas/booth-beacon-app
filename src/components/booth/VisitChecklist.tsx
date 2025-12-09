'use client';

import { CheckCircle2, Circle, Clock, DollarSign, MapPin, Camera } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';

interface VisitChecklistProps {
  boothName: string;
  hasHours: boolean;
  acceptsCash: boolean;
  acceptsCard: boolean;
}

export function VisitChecklist({
  boothName,
  hasHours,
  acceptsCash,
  acceptsCard,
}: VisitChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Load checked items from localStorage
  useEffect(() => {
    const loadCheckedItems = () => {
      const saved = localStorage.getItem(`checklist-${boothName}`);
      if (saved) {
        setCheckedItems(new Set(JSON.parse(saved)));
      }
    };

    loadCheckedItems();
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
        <span className="text-sm font-semibold text-neutral-700">
          {completedCount}/{checklistItems.length}
        </span>
      </div>

      <div className="space-y-2">
        {checklistItems.map((item) => {
          const Icon = item.icon;
          const isChecked = checkedItems.has(item.id);

          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left border-2 ${
                isChecked
                  ? 'bg-green-50 border-green-200 hover:bg-green-100'
                  : 'bg-white border-neutral-200 hover:border-primary hover:bg-primary/5'
              }`}
            >
              {isChecked ? (
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-6 h-6 text-neutral-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className={`flex items-center gap-2 flex-wrap ${isChecked ? 'text-neutral-600' : 'text-neutral-900'}`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className={`text-sm font-medium ${isChecked ? 'line-through' : ''}`}>
                    {item.label}
                  </span>
                </div>
                {item.important && !isChecked && (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">
                    Important
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {completedCount === checklistItems.length && (
        <div className="mt-4 p-3 bg-green-50 border-2 border-green-300 rounded-lg text-center">
          <p className="text-sm font-semibold text-green-800">✓ You&apos;re all set to visit!</p>
        </div>
      )}
    </Card>
  );
}
