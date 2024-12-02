interface UploadProgressProps {
  progress: number;
}

export const UploadProgress = ({ progress }: UploadProgressProps) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
      <div 
        className="bg-primary h-2.5 rounded-full transition-all duration-300" 
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};