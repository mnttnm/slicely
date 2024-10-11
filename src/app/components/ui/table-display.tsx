import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";

interface TableProps {
  content: {
    headers: string[];
    rows: (string | number)[][];
  };
}

export function TableDisplay({ content }: TableProps) {
  const { headers, rows } = content;

  if (!headers || !rows || headers.length === 0 || rows.length === 0) {
    return <p className="text-muted-foreground">No table data available</p>;
  }

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <TableHead key={index}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="text-normal">
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}