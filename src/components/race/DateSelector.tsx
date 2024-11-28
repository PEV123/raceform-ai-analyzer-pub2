import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from 'date-fns-tz';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateSelectorProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export const DateSelector = ({ selectedDate, onDateSelect }: DateSelectorProps) => {
  // Fetch all available dates from races
  const { data: raceDates } = useQuery({
    queryKey: ["race-dates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("races")
        .select("off_time")
        .order("off_time");

      if (error) throw error;

      // Get unique dates in UK timezone
      const uniqueDates = Array.from(new Set(
        data.map((race) => formatInTimeZone(new Date(race.off_time), 'Europe/London', 'yyyy-MM-dd'))
      )).sort();

      console.log('Available race dates:', uniqueDates);
      return uniqueDates;
    },
  });

  return (
    <Select value={selectedDate} onValueChange={onDateSelect}>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Select date" />
      </SelectTrigger>
      <SelectContent>
        {raceDates?.map((date) => (
          <SelectItem key={date} value={date}>
            {formatInTimeZone(new Date(date), 'Europe/London', 'MMMM do, yyyy')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};