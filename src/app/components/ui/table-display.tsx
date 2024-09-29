interface TableProps {
  content: {
    headers: string[];
    rows: (string | number)[][];
  };
}

export function TableDisplay({ content }: TableProps) {
  const { headers, rows } = content;

  if (!headers || !rows || headers.length === 0 || rows.length === 0) {
    return <p>No table data available</p>;
  }

  return (
    <table className="min-w-full bg-white border border-gray-300">
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={index} className="py-2 px-4 border-b">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="py-2 px-4 border-b">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}