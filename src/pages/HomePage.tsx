import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Cases, CaseInstances } from '@uipath/uipath-typescript/cases';
import { MaestroProcesses } from '@uipath/uipath-typescript/maestro-processes';
import type { CaseGetAllResponse, CaseInstanceGetResponse } from '@uipath/uipath-typescript/cases';
import type { MaestroProcessGetAllResponse } from '@uipath/uipath-typescript/maestro-processes';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
interface DashboardMetrics {
  totalClaims: number;
  activeClaims: number;
  pendingTasks: number;
  completionRate: number;
  avgProcessingDays: number;
}
interface StatusDistribution {
  status: string;
  count: number;
  color: string;
}
const STATUS_COLORS: Record<string, string> = {
  Running: '#3b82f6',
  Completed: '#10b981',
  Faulted: '#ef4444',
  Pending: '#f59e0b',
  Cancelled: '#6b7280',
};
export function HomePage() {
  const { sdk, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const cases = useMemo(() => sdk ? new Cases(sdk) : null, [sdk]);
  const caseInstances = useMemo(() => sdk ? new CaseInstances(sdk) : null, [sdk]);
  const maestroProcesses = useMemo(() => sdk ? new MaestroProcesses(sdk) : null, [sdk]);
  const [caseProcess, setCaseProcess] = useState<CaseGetAllResponse | null>(null);
  const [instances, setInstances] = useState<CaseInstanceGetResponse[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [statusDist, setStatusDist] = useState<StatusDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!isAuthenticated || !cases || !caseInstances || !maestroProcesses) return;
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const allCases = await cases.getAll();
        const ho5Case = allCases.find(c => c.name.toLowerCase().includes('ho-5') || c.name.toLowerCase().includes('home'));
        if (!ho5Case) {
          setError('HO-5 Case Management process not found. Please ensure the case is deployed.');
          setIsLoading(false);
          return;
        }
        setCaseProcess(ho5Case);
        const instancesResult = await caseInstances.getAll({
          processKey: ho5Case.processKey,
          pageSize: 100,
        });
        const allInstances = instancesResult.items;
        setInstances(allInstances);
        const total = allInstances.length;
        const active = allInstances.filter(i => i.latestRunStatus === 'Running').length;
        const completed = allInstances.filter(i => i.latestRunStatus === 'Completed').length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const completedCases = allInstances.filter(i => i.completedTime);
        const avgDays = completedCases.length > 0
          ? Math.round(
              completedCases.reduce((sum, c) => {
                const start = new Date(c.startedTime).getTime();
                const end = new Date(c.completedTime!).getTime();
                return sum + (end - start) / (1000 * 60 * 60 * 24);
              }, 0) / completedCases.length
            )
          : 0;
        setMetrics({
          totalClaims: total,
          activeClaims: active,
          pendingTasks: 0,
          completionRate,
          avgProcessingDays: avgDays,
        });
        const statusCounts = allInstances.reduce((acc, inst) => {
          const status = inst.latestRunStatus || 'Unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const distribution = Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
          color: STATUS_COLORS[status] || '#6b7280',
        }));
        setStatusDist(distribution);
        setIsLoading(false);
      } catch (err) {
        console.error('Dashboard load error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        setIsLoading(false);
      }
    };
    loadData();
  }, [isAuthenticated, cases, caseInstances, maestroProcesses]);
  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Authentication Required</h2>
            <p className="text-gray-600">Please log in to access the Claims Portal</p>
            <Button 
              onClick={login} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Log In
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }
  if (isLoading) {
    return (
      <AppLayout container>
        <div className="space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="h-80 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </AppLayout>
    );
  }
  if (error) {
    return (
      <AppLayout container>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Dashboard</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Claims Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">HO-5 Home Insurance Claims Overview</p>
          </div>
          <Button onClick={() => navigate('/claims')} className="bg-blue-600 hover:bg-blue-700 text-white">
            View All Claims
          </Button>
        </div>
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Total Claims</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.totalClaims}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Active Claims</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.activeClaims}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Completion Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.completionRate}%</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Avg Processing Time</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.avgProcessingDays}</p>
                  <p className="text-xs text-gray-500 mt-1">days</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusDist}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.status}: ${entry.count}`}
                >
                  {statusDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Claims by Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="status" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-l-4 border-blue-600 pl-4">
              <p className="text-xs text-gray-500 uppercase font-medium">Process Name</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{caseProcess?.name || 'N/A'}</p>
            </div>
            <div className="border-l-4 border-green-600 pl-4">
              <p className="text-xs text-gray-500 uppercase font-medium">Completed Today</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {instances.filter(i => {
                  if (!i.completedTime) return false;
                  const completed = new Date(i.completedTime);
                  const today = new Date();
                  return completed.toDateString() === today.toDateString();
                }).length}
              </p>
            </div>
            <div className="border-l-4 border-yellow-600 pl-4">
              <p className="text-xs text-gray-500 uppercase font-medium">Started This Week</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {instances.filter(i => {
                  const started = new Date(i.startedTime);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return started >= weekAgo;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}