interface TextProps {
  content: {
    text: string;
  };
}

export function TextDisplay({ content }: TextProps) {
  return <p>{content.text}</p>;
}