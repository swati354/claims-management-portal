import { useMemo, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CaseInstances } from '@uipath/uipath-typescript/cases';
import type { CaseInstanceExecutionHistoryResponse } from '@uipath/uipath-typescript/cases';
import { Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
interface AuditTabProps {
  instanceId: string;
  folderKey: string;
}
const STATUS_ICONS: Record<string, any> = {
  Completed: CheckCircle,
  Running: Clock,
  Faulted: XCircle,
  Pending: Clock,
};
const STATUS_COLORS: Record<string, string> = {
  Completed: 'text-green-600 bg-green-50',
  Running: 'text-blue-600 bg-blue-50',
  Faulted: 'text-red-600 bg-red-50',
  Pending: 'text-yellow-600 bg-yellow-50',
};
export function AuditTab({ instanceId, folderKey }: AuditTabProps) {
  const { sdk } = useAuth();
  const caseInstances = useMemo(() => sdk ? new CaseInstances(sdk) : null, [sdk]);
  const [history, setHistory] = useState<CaseInstanceExecutionHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadHistory = useCallback(async () => {
    if (!caseInstances) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = await caseInstances.getExecutionHistory(instanceId, folderKey);
      setHistory(result);
    } catch (err) {
      console.error('Failed to load execution history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load execution history');
    } finally {
      setIsLoading(false);
    }
  }, [caseInstances, instanceId, folderKey]);
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }
  if (!history || !history.elementExecutions || history.elementExecutions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">No execution history available</p>
        </div>
      </div>
    );
  }
  const sortedExecutions = [...history.elementExecutions].sort(
    (a, b) => new Date(b.startedTime).getTime() - new Date(a.startedTime).getTime()
  );
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-6">Execution History</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div className="space-y-6">
          {sortedExecutions.map((execution, index) => {
            const Icon = STATUS_ICONS[execution.status] || Clock;
            const colorClass = STATUS_COLORS[execution.status] || 'text-gray-600 bg-gray-50';
            return (
              <div key={index} className="relative flex gap-4">
                <div className="relative z-10 flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex-1 pb-6">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {execution.elementName || execution.elementId}
                      </h4>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          execution.status === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : execution.status === 'Running'
                            ? 'bg-blue-100 text-blue-700'
                            : execution.status === 'Faulted'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {execution.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Started:</span>
                        <span>{format(new Date(execution.startedTime), 'MMM d, yyyy h:mm:ss a')}</span>
                      </div>
                      {execution.completedTime && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Completed:</span>
                          <span>{format(new Date(execution.completedTime), 'MMM d, yyyy h:mm:ss a')}</span>
                        </div>
                      )}
                      {execution.elementType && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Type:</span>
                          <span>{execution.elementType}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}