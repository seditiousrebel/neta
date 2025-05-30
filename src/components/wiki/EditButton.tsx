import { Pencil } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface EditButtonProps {
  onClick: () => void;
  className?: string;
}

export function EditButton({ onClick, className }: EditButtonProps) {
  const isMobile = useMobile();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            aria-label="Edit this field"
            className={cn(
              'absolute top-0 right-0 p-1 text-gray-500 hover:text-gray-700 transition-opacity',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md', // Basic focus styling
              isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
              className,
            )}
          >
            <Pencil size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit this field</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
