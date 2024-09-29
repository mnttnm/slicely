interface TextProps {
  content: {
    text: string;
  };
}

export function TextDisplay({ content }: TextProps) {
  return <p className="text-lg">{content.text}</p>;
}