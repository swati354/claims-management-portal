import { useMemo, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePolling } from '@/hooks/usePolling';
import { ProcessInstances } from '@uipath/uipath-typescript/maestro-processes';
import { CaseInstances } from '@uipath/uipath-typescript/cases';
import type { CaseInstanceGetResponse, CaseGetStageResponse } from '@uipath/uipath-typescript/cases';
import type { GlobalVariableMetaData } from '@uipath/uipath-typescript/maestro-processes';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { CaseTimeline } from '@/components/CaseTimeline';
import { CaseDataTable } from '@/components/CaseDataTable';
import { DocumentsTab } from '@/components/DocumentsTab';
import { TasksTab } from '@/components/TasksTab';
import { AuditTab } from '@/components/AuditTab';
const STATUS_BADGE_COLORS: Record<string, string> = {
  Running: 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  Faulted: 'bg-red-100 text-red-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-gray-100 text-gray-700',
};
interface ClaimDetailData {
  instance: CaseInstanceGetResponse;
  stages: CaseGetStageResponse[];
  variables: {
    globalVariables: GlobalVariableMetaData[];
    elements: any[];
    instanceId: string;
    parentElementId?: string;
  };
}
export function ClaimDetailPage() {
  const { sdk, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { instanceId } = useParams<{ instanceId: string }>();
  const [searchParams] = useSearchParams();
  const folderKey = searchParams.get('folderKey');
  const caseInstances = useMemo(() => sdk ? new CaseInstances(sdk) : null, [sdk]);
  const processInstances = useMemo(() => sdk ? new ProcessInstances(sdk) : null, [sdk]);
  const [activeTab, setActiveTab] = useState('data');
  const fetchClaimDetail = useCallback(async (): Promise<ClaimDetailData> => {
    if (!caseInstances || !instanceId || !folderKey) throw new Error('Missing required parameters');
    const instance = await caseInstances.getById(instanceId, folderKey);
    const stages = await instance.getStages();
    let variables: any;
    let retries = 3;
    while (retries > 0) {
      try {
        variables = await processInstances!.getVariables(instanceId, folderKey);
        break;
      } catch (err) {
        retries--;
        if (retries === 0) {
          console.error('Failed to fetch variables after retries:', err);
          variables = { globalVariables: [], elements: [], instanceId };
        } else {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
    }
    return { instance, stages, variables };
  }, [caseInstances, processInstances, instanceId, folderKey]);
  const { data, isLoading, error, isActive } = usePolling<ClaimDetailData>({
    fetchFn: fetchClaimDetail,
    interval: 5000,
    enabled: isAuthenticated && !!caseInstances && !!instanceId && !!folderKey,
    immediate: true,
    deps: [instanceId],
  });
  const lastDataRef = useRef<ClaimDetailData | null>(null);
  const lastInstanceIdRef = useRef(instanceId);
  const accumulatedVarsRef = useRef<Map<string, GlobalVariableMetaData>>(new Map());
  if (instanceId !== lastInstanceIdRef.current) {
    lastInstanceIdRef.current = instanceId;
    lastDataRef.current = null;
    accumulatedVarsRef.current = new Map();
  }
  if (data) lastDataRef.current = data;
  const displayData = lastDataRef.current;
  if (displayData?.variables?.globalVariables) {
    for (const v of displayData.variables.globalVariables) {
      accumulatedVarsRef.current.set(v.id, v);
    }
  }
  const displayVars = [...accumulatedVarsRef.current.values()].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Authentication Required</h2>
            <p className="text-gray-600">Please log in to access the Claims Portal</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  if (!instanceId || !folderKey) {
    return (
      <AppLayout container>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Invalid Request</h3>
              <p className="text-sm text-red-700 mt-1">Missing instance ID or folder key</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }
  if (isLoading && !displayData) {
    return (
      <AppLayout container>
        <div className="space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </AppLayout>
    );
  }
  if (error && !displayData) {
    return (
      <AppLayout container>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Claim</h3>
              <p className="text-sm text-red-700 mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }
  if (!displayData) return null;
  const { instance, stages } = displayData;
  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => navigate('/')} className="hover:text-gray-700 transition-colors">Dashboard</button>
          <span>/</span>
          <button onClick={() => navigate('/claims')} className="hover:text-gray-700 transition-colors">Claims</button>
          <span>/</span>
          <span className="text-gray-900 font-medium">{instanceId.slice(0, 8)}</span>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {instance.caseTitle || instance.instanceDisplayName || 'Claim Details'}
                </h1>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    STATUS_BADGE_COLORS[instance.latestRunStatus] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {instance.latestRunStatus}
                </span>
                {isActive && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Claim #: {instanceId.slice(0, 8)}</span>
                <span>•</span>
                <span>Started: {format(new Date(instance.startedTime), 'MMM d, yyyy h:mm a')}</span>
                {instance.completedTime && (
                  <>
                    <span>•</span>
                    <span>Completed: {format(new Date(instance.completedTime), 'MMM d, yyyy h:mm a')}</span>
                  </>
                )}
              </div>
            </div>
            <Button onClick={() => navigate('/claims')} variant="outline">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to List
            </Button>
          </div>
        </div>
        <CaseTimeline stages={stages} currentStatus={instance.latestRunStatus} />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="data">Case Data</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>
          <TabsContent value="data" className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Process Variables</h3>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
                    {error.message}
                  </div>
                )}
              </div>
              <CaseDataTable variables={displayVars} />
            </div>
          </TabsContent>
          <TabsContent value="documents">
            <DocumentsTab instanceId={instanceId} folderKey={folderKey} />
          </TabsContent>
          <TabsContent value="tasks">
            <TasksTab instanceId={instanceId} folderKey={folderKey} />
          </TabsContent>
          <TabsContent value="audit">
            <AuditTab instanceId={instanceId} folderKey={folderKey} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}