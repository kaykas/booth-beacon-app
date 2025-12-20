'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReportIssueDialog } from './ReportIssueDialog';
import { Flag } from 'lucide-react';

interface ReportIssueButtonProps {
  boothId: string;
  boothName: string;
}

export function ReportIssueButton({ boothId, boothName }: ReportIssueButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Card className="p-6 bg-neutral-50 border-neutral-200">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Flag className="w-4 h-4" />
          Report an Issue
        </h3>
        <p className="text-sm text-neutral-600 mb-3">
          Help us keep information accurate. Report closed booths, incorrect details, or inappropriate content.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setDialogOpen(true)}
        >
          Report Issue
        </Button>
      </Card>

      <ReportIssueDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        boothId={boothId}
        boothName={boothName}
      />
    </>
  );
}
