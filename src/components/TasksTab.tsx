import { useMemo, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tasks } from '@uipath/uipath-typescript/tasks';
import { TaskType } from '@uipath/uipath-typescript/tasks';
import type { TaskGetResponse } from '@uipath/uipath-typescript/tasks';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
interface TasksTabProps {
  instanceId: string;
  folderKey: string;
}
const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-gray-100 text-gray-700',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
};
export function TasksTab({ instanceId, folderKey }: TasksTabProps) {
  const { sdk } = useAuth();
  const tasks = useMemo(() => sdk ? new Tasks(sdk) : null, [sdk]);
  const [taskList, setTaskList] = useState<TaskGetResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const loadTasks = useCallback(async () => {
    if (!tasks) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = await tasks.getAll({
        filter: `CreatorJobKey eq ${instanceId}`,
        pageSize: 50,
      });
      setTaskList(result.items || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [tasks, instanceId]);
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);
  const handleCompleteTask = async (task: TaskGetResponse, action: 'approve' | 'reject') => {
    try {
      setCompletingTaskId(task.id);
      const actionLabel = action === 'approve' ? 'Approve' : 'Reject';
      if (task.type === TaskType.External) {
        await task.complete({ type: TaskType.External, action: actionLabel });
      } else {
        await task.complete({ type: task.type, action: actionLabel, data: {} });
      }
      await loadTasks();
    } catch (err) {
      console.error('Failed to complete task:', err);
      alert(`Failed to ${action} task: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCompletingTaskId(null);
    }
  };
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
  const pendingTasks = taskList.filter(t => !t.isCompleted);
  const completedTasks = taskList.filter(t => t.isCompleted);
  if (taskList.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">No tasks found for this claim</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {pendingTasks.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Pending Tasks</h3>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          PRIORITY_COLORS[task.priority] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>Created: {format(new Date(task.createdTime), 'MMM d, yyyy h:mm a')}</span>
                      {task.assignedToUser && (
                        <>
                          <span>•</span>
                          <span>Assigned to: {task.assignedToUser.displayName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleCompleteTask(task, 'approve')}
                    disabled={completingTaskId === task.id}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {completingTaskId === task.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCompleteTask(task, 'reject')}
                    disabled={completingTaskId === task.id}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {completingTaskId === task.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-1" />
                    )}
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {completedTasks.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Completed Tasks</h3>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{task.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Completed: {format(new Date(task.createdTime), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}