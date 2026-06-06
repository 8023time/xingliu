import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiderStore } from '@/stores/sider-store';

const AUTO_COLLAPSE_ZOOM = 2;
const ZOOM_PRECISION = 100;

function getBrowserZoom() {
  return Math.round((window.devicePixelRatio || 1) * ZOOM_PRECISION) / ZOOM_PRECISION;
}

function shouldAutoCollapse(pathname: string, zoom: number) {
  return pathname === '/content/create' || zoom >= AUTO_COLLAPSE_ZOOM;
}

export function useSiderCollapseStrategy() {
  const location = useLocation();
  const collapsed = useSiderStore((state) => state.collapsed);
  const applyAutoCollapsed = useSiderStore((state) => state.applyAutoCollapsed);
  const setManualCollapsed = useSiderStore((state) => state.setManualCollapsed);
  const clearManualCollapsed = useSiderStore((state) => state.clearManualCollapsed);
  const zoomRef = useRef(getBrowserZoom());
  const manualReleasePendingRef = useRef(false);

  useEffect(() => {
    if (manualReleasePendingRef.current) return;

    applyAutoCollapsed(shouldAutoCollapse(location.pathname, zoomRef.current));
  }, [applyAutoCollapsed, location.pathname]);

  useEffect(() => {
    const handleZoomChange = () => {
      const nextZoom = getBrowserZoom();
      if (nextZoom === zoomRef.current) return;

      zoomRef.current = nextZoom;

      if (useSiderStore.getState().manualCollapsed !== null) {
        clearManualCollapsed();
        manualReleasePendingRef.current = true;
        return;
      }

      if (manualReleasePendingRef.current) {
        manualReleasePendingRef.current = false;
      }

      applyAutoCollapsed(shouldAutoCollapse(location.pathname, nextZoom));
    };

    window.addEventListener('resize', handleZoomChange);
    window.visualViewport?.addEventListener('resize', handleZoomChange);

    return () => {
      window.removeEventListener('resize', handleZoomChange);
      window.visualViewport?.removeEventListener('resize', handleZoomChange);
    };
  }, [applyAutoCollapsed, clearManualCollapsed, location.pathname]);

  const setCollapsedByUser = useCallback(
    (value: boolean) => {
      manualReleasePendingRef.current = false;
      setManualCollapsed(value);
    },
    [setManualCollapsed],
  );

  const toggleCollapsedByUser = useCallback(() => {
    manualReleasePendingRef.current = false;
    setManualCollapsed(!useSiderStore.getState().collapsed);
  }, [setManualCollapsed]);

  return {
    collapsed,
    setCollapsedByUser,
    toggleCollapsedByUser,
  };
}
