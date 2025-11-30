'use client';

import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CopyAddressButtonProps {
  address: string;
}

export function CopyAddressButton({ address }: CopyAddressButtonProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(address);
  };

  return (
    <Button variant="outline" size="sm" className="w-full" onClick={handleCopy}>
      <Copy className="w-4 h-4 mr-2" />
      Copy Address
    </Button>
  );
}
