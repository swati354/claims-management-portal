import { useMemo, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Buckets } from '@uipath/uipath-typescript/buckets';
import type { BlobItem } from '@uipath/uipath-typescript/buckets';
import { Button } from '@/components/ui/button';
import { FileText, Download, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
interface DocumentsTabProps {
  instanceId: string;
  folderKey: string;
}
export function DocumentsTab({ instanceId, folderKey }: DocumentsTabProps) {
  const { sdk } = useAuth();
  const buckets = useMemo(() => sdk ? new Buckets(sdk) : null, [sdk]);
  const [documents, setDocuments] = useState<BlobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [bucketId, setBucketId] = useState<number | null>(null);
  const loadDocuments = useCallback(async () => {
    if (!buckets) return;
    try {
      setIsLoading(true);
      setError(null);
      const bucketsResult = await buckets.getAll({ folderId: 0 });
      if (bucketsResult.items.length === 0) {
        setDocuments([]);
        setIsLoading(false);
        return;
      }
      const bucket = bucketsResult.items[0];
      setBucketId(bucket.id);
      const filesResult = await buckets.getFileMetaData(bucket.id, 0, {
        prefix: instanceId,
        pageSize: 100,
      });
      setDocuments(filesResult.items || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [buckets, instanceId]);
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);
  const handleDownload = async (doc: BlobItem) => {
    if (!buckets || bucketId === null) return;
    try {
      setDownloadingId(doc.path);
      const uriResponse = await buckets.getReadUri({
        bucketId,
        folderId: 0,
        path: doc.path,
        expiryInMinutes: 5,
      });
      const response = await fetch(uriResponse.uri);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.path.split('/').pop() || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download document');
    } finally {
      setDownloadingId(null);
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
  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">No documents found for this claim</p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Case Documents</h3>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.path}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {doc.path.split('/').pop()}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span>{doc.contentType}</span>
                  <span>•</span>
                  <span>{(doc.size / 1024).toFixed(2)} KB</span>
                  {doc.lastModified && (
                    <>
                      <span>•</span>
                      <span>{format(new Date(doc.lastModified), 'MMM d, yyyy')}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload(doc)}
              disabled={downloadingId === doc.path}
              className="ml-4"
            >
              {downloadingId === doc.path ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}