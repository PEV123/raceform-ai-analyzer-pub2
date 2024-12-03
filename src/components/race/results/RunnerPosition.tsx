import { motion } from "framer-motion";
import { HorseHead } from "@/components/icons/HorseHead";

interface RunnerPositionProps {
  position: string;
  horse: string;
  cumulativeDistance: number;
  xPosition: number;
  index: number;
  isWinner: boolean;
}

export const RunnerPosition = ({
  position,
  horse,
  cumulativeDistance,
  xPosition,
  index,
  isWinner
}: RunnerPositionProps) => {
  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ 
        x: xPosition,
        opacity: 1 
      }}
      transition={{ 
        duration: 1,
        delay: index * 0.2,
        type: "spring",
        stiffness: 50
      }}
      className="absolute flex items-center gap-2"
      style={{ 
        top: `${index * 60 + 20}px`,
        left: 20
      }}
    >
      <div className="relative">
        <motion.div
          animate={{
            y: [0, -5, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: "reverse",
            delay: index * 0.1,
          }}
          className="w-12 h-12"
        >
          <HorseHead 
            className="w-full h-full text-accent transform scale-x-[-1]"
          />
        </motion.div>
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-sm">
          {position}
        </div>
      </div>
      <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-2 min-w-[200px]">
        <div className="font-medium text-primary">{horse}</div>
        <div className="text-xs text-muted-foreground">
          {cumulativeDistance > 0 
            ? `${cumulativeDistance.toFixed(1)}L behind winner` 
            : 'Winner'}
        </div>
      </div>
    </motion.div>
  );
};