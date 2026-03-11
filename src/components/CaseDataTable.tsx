import type { GlobalVariableMetaData } from '@uipath/uipath-typescript/maestro-processes';
interface CaseDataTableProps {
  variables: GlobalVariableMetaData[];
}
function formatKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
function FormattedValue({ value, type }: { value: any; type: string }) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">—</span>;
  }
  if (typeof value === 'boolean') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {value ? 'True' : 'False'}
      </span>
    );
  }
  if (typeof value === 'number') {
    return <span className="font-mono text-sm">{value.toLocaleString()}</span>;
  }
  if (typeof value === 'string') {
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        return <KeyValueRenderer data={parsed} />;
      } catch {
        // Not JSON, render as string
      }
    }
    return <span className="text-sm">{value}</span>;
  }
  if (Array.isArray(value)) {
    return <KeyValueRenderer data={value} />;
  }
  if (typeof value === 'object') {
    return <KeyValueRenderer data={value} />;
  }
  return <span className="text-sm">{String(value)}</span>;
}
function KeyValueRenderer({ data }: { data: Record<string, any> | any[] }) {
  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-gray-400 text-sm italic">Empty list</span>;
    return (
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="pl-3 border-l-2 border-gray-200">
            <span className="text-xs text-gray-400 mb-1 block">#{i + 1}</span>
            {typeof item === 'object' && item !== null
              ? <KeyValueRenderer data={item} />
              : <span className="text-sm text-gray-700">{String(item)}</span>
            }
          </div>
        ))}
      </div>
    );
  }
  const entries = Object.entries(data);
  if (entries.length === 0) return <span className="text-gray-400 text-sm italic">Empty</span>;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
      {entries.map(([key, val]) => (
        <div key={key} className="contents">
          <dt className="text-xs text-gray-500 py-1 whitespace-nowrap">{formatKey(key)}</dt>
          <dd className="text-sm text-gray-700 py-1 min-w-0 break-words">
            {val === null || val === undefined ? (
              <span className="text-gray-400 italic">—</span>
            ) : typeof val === 'object' ? (
              <KeyValueRenderer data={val} />
            ) : typeof val === 'boolean' ? (
              <span className={val ? 'text-green-600' : 'text-red-600'}>{String(val)}</span>
            ) : (
              String(val)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
export function CaseDataTable({ variables }: CaseDataTableProps) {
  if (variables.length === 0) {
    return <p className="text-sm text-gray-500 p-4">No data available</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {variables.map((v) => (
            <tr key={v.id}>
              <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{v.name}</td>
              <td className="px-4 py-3 text-sm text-gray-700 max-w-md">
                <FormattedValue value={v.value} type={v.type} />
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">{v.type}</span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{v.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}