'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface MapFilterOptions {
  statuses: string[];
  boothTypes: string[];
  machineModels: string[];
}

interface MapFiltersProps {
  filters: MapFilterOptions;
  onFiltersChange: (filters: MapFilterOptions) => void;
  availableStatuses?: string[];
  availableBoothTypes?: string[];
  availableMachineModels?: string[];
}

export function MapFilters({
  filters,
  onFiltersChange,
  availableStatuses = ['active', 'unverified', 'inactive'],
  availableBoothTypes = ['analog', 'digital', 'hybrid'],
  availableMachineModels = [],
}: MapFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const toggleBoothType = (type: string) => {
    const newTypes = filters.boothTypes.includes(type)
      ? filters.boothTypes.filter((t) => t !== type)
      : [...filters.boothTypes, type];
    onFiltersChange({ ...filters, boothTypes: newTypes });
  };

  const toggleMachineModel = (model: string) => {
    const newModels = filters.machineModels.includes(model)
      ? filters.machineModels.filter((m) => m !== model)
      : [...filters.machineModels, model];
    onFiltersChange({ ...filters, machineModels: newModels });
  };

  const clearFilters = () => {
    onFiltersChange({
      statuses: [],
      boothTypes: [],
      machineModels: [],
    });
  };

  const activeFilterCount =
    filters.statuses.length + filters.boothTypes.length + filters.machineModels.length;

  return (
    <div className="absolute top-4 left-4 z-10">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="default" className="shadow-lg">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-white text-primary">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <div className="flex items-center justify-between px-2 py-1.5">
            <DropdownMenuLabel className="p-0">Filter Booths</DropdownMenuLabel>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-auto p-1 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />

          {/* Status Filters */}
          <DropdownMenuLabel className="text-xs text-neutral-500 uppercase">
            Status
          </DropdownMenuLabel>
          {availableStatuses.map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={filters.statuses.includes(status)}
              onCheckedChange={() => toggleStatus(status)}
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      status === 'active'
                        ? '#22C55E'
                        : status === 'inactive'
                        ? '#EF4444'
                        : '#F59E0B',
                  }}
                />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />

          {/* Booth Type Filters */}
          <DropdownMenuLabel className="text-xs text-neutral-500 uppercase">
            Booth Type
          </DropdownMenuLabel>
          {availableBoothTypes.map((type) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={filters.boothTypes.includes(type)}
              onCheckedChange={() => toggleBoothType(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </DropdownMenuCheckboxItem>
          ))}

          {/* Machine Model Filters (if available) */}
          {availableMachineModels.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-neutral-500 uppercase">
                Machine Model
              </DropdownMenuLabel>
              {availableMachineModels.slice(0, 5).map((model) => (
                <DropdownMenuCheckboxItem
                  key={model}
                  checked={filters.machineModels.includes(model)}
                  onCheckedChange={() => toggleMachineModel(model)}
                >
                  {model}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
