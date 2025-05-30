import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  maxLength?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  className,
  id,
  disabled,
  maxLength,
}: RichTextEditorProps) {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <Textarea
      id={id}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      className={cn(
        'min-h-[150px] resize-y focus-visible:ring-1 focus-visible:ring-ring', // Default styling
        className
      )}
    />
  );
}
