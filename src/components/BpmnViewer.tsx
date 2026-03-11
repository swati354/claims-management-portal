import { useEffect, useRef } from 'react';
import Viewer from 'bpmn-js/lib/NavigatedViewer';
interface BpmnViewerProps {
  bpmnXml: string;
}
export function BpmnViewer({ bpmnXml }: BpmnViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  useEffect(() => {
    if (!containerRef.current || !bpmnXml) return;
    const viewer = new Viewer({
      container: containerRef.current,
      keyboard: {
        bindTo: document,
      },
    });
    viewerRef.current = viewer;
    (async () => {
      try {
        await viewer.importXML(bpmnXml);
        const canvas = viewer.get('canvas');
        canvas.zoom('fit-viewport');
      } catch (err) {
        console.error('Error rendering BPMN:', err);
      }
    })();
    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [bpmnXml]);
  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '500px',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
      }}
    />
  );
}