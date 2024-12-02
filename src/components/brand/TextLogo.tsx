import { cn } from "@/lib/utils";

interface TextLogoProps {
  className?: string;
}

export const TextLogo = ({ className }: TextLogoProps) => {
  return (
    <h1 
      className={cn(
        "text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent",
        className
      )}
    >
      OddsOracle
    </h1>
  );
};