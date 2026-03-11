import type { CaseGetStageResponse } from '@uipath/uipath-typescript/cases';
import { CheckCircle, Circle, Clock } from 'lucide-react';
interface CaseTimelineProps {
  stages: CaseGetStageResponse[];
  currentStatus: string;
}
export function CaseTimeline({ stages, currentStatus }: CaseTimelineProps) {
  if (stages.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-sm text-gray-500">No stage information available</p>
      </div>
    );
  }
  const getStageStatus = (stage: CaseGetStageResponse) => {
    if (stage.status === 'Completed') return 'completed';
    if (stage.status === 'Running' || stage.status === 'InProgress') return 'active';
    return 'pending';
  };
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-6">Case Timeline</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div className="space-y-6">
          {stages.map((stage) => {
            const status = getStageStatus(stage);
            const isCompleted = status === 'completed';
            const isActive = status === 'active';
            const isPending = status === 'pending';
            return (
              <div key={stage.id} className="relative flex gap-4">
                <div className="relative z-10 flex-shrink-0">
                  {isCompleted && (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                  {isActive && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
                    </div>
                  )}
                  {isPending && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Circle className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`text-sm font-medium ${
                      isCompleted ? 'text-gray-900' : isActive ? 'text-blue-900' : 'text-gray-500'
                    }`}>
                      {stage.name}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isCompleted ? 'bg-green-100 text-green-700' :
                      isActive ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {stage.status}
                    </span>
                  </div>
                  {stage.tasks && stage.tasks.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {stage.tasks.flat().map((task, taskIndex) => (
                        <div key={taskIndex} className="flex items-center gap-2 text-xs text-gray-500">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            task.status === 'Completed' ? 'bg-green-500' :
                            task.status === 'Running' ? 'bg-blue-500' :
                            'bg-gray-300'
                          }`} />
                          <span>{task.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {stage.sla && (
                    <div className="mt-2 text-xs text-gray-500">
                      SLA: {stage.sla.duration} {stage.sla.durationUnit}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}