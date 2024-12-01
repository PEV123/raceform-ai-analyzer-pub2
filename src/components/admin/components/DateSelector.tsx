import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";

interface DateSelectorProps {
  date: Date;
  onSelect: (date: Date | undefined) => void;
  disabled?: boolean;
  label?: string;
}

export const DateSelector = ({ date, onSelect, disabled, label }: DateSelectorProps) => {
  const formattedDate = formatInTimeZone(date, 'Europe/London', "MMMM do, yyyy");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label ? `${label}: ${formattedDate}` : formattedDate}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};