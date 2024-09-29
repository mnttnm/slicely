interface SingleValueProps {
  content: {
    value: number;
    unit?: string;
  };
}

export function SingleValueDisplay({ content }: SingleValueProps) {
  const { value, unit } = content;
  return (
    <div className="text-2xl font-bold">
      {value} {unit}
    </div>
  );
}