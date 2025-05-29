
"use client";
import type { PoliticianPosition } from '@/types/entities';
import { Briefcase } from 'lucide-react';

interface CurrentPositionProps {
  positions?: PoliticianPosition[];
}

export default function CurrentPosition({ positions }: CurrentPositionProps) {
  const currentPosition = positions?.find(p => p.is_current);

  if (!currentPosition) {
    return <p className="text-sm text-muted-foreground">No current position listed.</p>;
  }

  return (
    <div>
      <h3 className="text-md font-semibold text-foreground mb-1">
        {currentPosition.position_titles?.title || 'N/A'}
      </h3>
      <p className="text-sm text-muted-foreground">
        Since: {currentPosition.start_date ? new Date(currentPosition.start_date).toLocaleDateString() : 'N/A'}
        {currentPosition.description && ` - ${currentPosition.description}`}
      </p>
    </div>
  );
}
