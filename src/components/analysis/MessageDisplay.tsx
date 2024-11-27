interface MessageDisplayProps {
  role: 'user' | 'assistant';
  message: string;
}

export const MessageDisplay = ({ role, message }: MessageDisplayProps) => {
  const formatMessage = (message: string) => {
    return message.split('\n').map((line, i) => (
      <p key={i} className="mb-2">{line}</p>
    ));
  };

  return (
    <div className={`mb-4 ${role === 'user' ? 'text-right' : 'text-left'}`}>
      <div
        className={`inline-block max-w-[80%] rounded-lg px-4 py-2 ${
          role === 'user'
            ? 'bg-primary text-primary-foreground ml-auto'
            : 'bg-muted'
        }`}
      >
        {formatMessage(message)}
      </div>
    </div>
  );
};