import { useMemo, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePolling } from '@/hooks/usePolling';
import { Cases, CaseInstances } from '@uipath/uipath-typescript/cases';
import type { CaseGetAllResponse, CaseInstanceGetResponse } from '@uipath/uipath-typescript/cases';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
const STATUS_BADGE_COLORS: Record<string, string> = {
  Running: 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  Faulted: 'bg-red-100 text-red-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-gray-100 text-gray-700',
};
interface ClaimsData {
  caseProcess: CaseGetAllResponse;
  instances: CaseInstanceGetResponse[];
}
export function ClaimsListPage() {
  const { sdk, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const cases = useMemo(() => sdk ? new Cases(sdk) : null, [sdk]);
  const caseInstances = useMemo(() => sdk ? new CaseInstances(sdk) : null, [sdk]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const fetchClaims = useCallback(async (): Promise<ClaimsData> => {
    if (!cases || !caseInstances) throw new Error('SDK not initialized');
    const allCases = await cases.getAll();
    const ho5Case = allCases.find(c => c.name.toLowerCase().includes('ho-5') || c.name.toLowerCase().includes('home'));
    if (!ho5Case) throw new Error('HO-5 Case Management process not found');
    const result = await caseInstances.getAll({
      processKey: ho5Case.processKey,
      pageSize: 200,
    });
    return { caseProcess: ho5Case, instances: result.items };
  }, [cases, caseInstances]);
  const { data, isLoading, error, isActive } = usePolling<ClaimsData>({
    fetchFn: fetchClaims,
    interval: 5000,
    enabled: isAuthenticated && !!cases && !!caseInstances,
    immediate: true,
  });
  const filteredInstances = useMemo(() => {
    if (!data) return [];
    let filtered = data.instances;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inst => inst.latestRunStatus === statusFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(inst => {
        const displayName = inst.instanceDisplayName?.toLowerCase() || '';
        const instanceId = inst.instanceId.toLowerCase();
        return displayName.includes(term) || instanceId.includes(term);
      });
    }
    return filtered;
  }, [data, statusFilter, searchTerm]);
  const totalPages = Math.ceil(filteredInstances.length / pageSize);
  const paginatedInstances = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInstances.slice(start, start + pageSize);
  }, [filteredInstances, currentPage]);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);
  const handleRowClick = (instanceId: string, folderKey: string) => {
    navigate(`/claims/${instanceId}?folderKey=${folderKey}`);
  };
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
  if (isLoading && !data) {
    return (
      <AppLayout container>
        <div className="space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }
  if (error) {
    return (
      <AppLayout container>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="font-semibold text-red-900">Error Loading Claims</h3>
          <p className="text-sm text-red-700 mt-1">{error.message}</p>
        </div>
      </AppLayout>
    );
  }
  const uniqueStatuses = Array.from(new Set(data?.instances.map(i => i.latestRunStatus) || []));
  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Active Claims</h1>
            <p className="text-sm text-gray-500 mt-1">
              {filteredInstances.length} claim{filteredInstances.length !== 1 ? 's' : ''} found
              {isActive && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-gray-400">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Live
                </span>
              )}
            </p>
          </div>
          <Button onClick={() => navigate('/')} variant="outline">
            Back to Dashboard
          </Button>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by claim number or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className={statusFilter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                All
              </Button>
              {uniqueStatuses.map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Case Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedInstances.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      No claims found matching your filters
                    </td>
                  </tr>
                ) : (
                  paginatedInstances.map((instance) => (
                    <tr
                      key={instance.instanceId}
                      onClick={() => handleRowClick(instance.instanceId, instance.folderKey)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {instance.instanceId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {instance.caseTitle || instance.instanceDisplayName || 'Untitled Claim'}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            STATUS_BADGE_COLORS[instance.latestRunStatus] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {instance.latestRunStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {format(new Date(instance.startedTime), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {format(new Date(instance.updatedTime || instance.startedTime), 'MMM d, yyyy h:mm a')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredInstances.length)} of {filteredInstances.length} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}