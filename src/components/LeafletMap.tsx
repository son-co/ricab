import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

/**
 * Bản đồ Leaflet (OpenStreetMap) chạy trong WebView — không cần API key,
 * hoạt động cả trong Expo Go (Google Maps đã bị Expo Go gỡ key từ SDK 53+).
 */

export interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
}

export interface LeafletMapHandle {
  /** Bay tới vị trí với zoom nhất định (dùng khi chọn kết quả tìm kiếm). */
  setView: (lat: number, lng: number, zoom: number) => void;
}

interface LeafletMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  /** Điểm thứ hai đã chọn (hiển thị marker màu cam + popup). */
  other?: MapMarker | null;
  /** Khi người dùng dừng di chuyển bản đồ — tọa độ tâm mới. */
  onMoveEnd?: (lat: number, lng: number) => void;
}

interface IncomingMessage {
  type: 'move' | 'ready';
  lat?: number;
  lng?: number;
}

const escapeJson = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c');

function buildHtml(init: {
  center: { lat: number; lng: number };
  zoom: number;
  other: MapMarker | null | undefined;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #E9E7DB; }
  .leaflet-container { font-family: -apple-system, system-ui, sans-serif; }
</style>
</head>
<body>
<div id="map"></div>
<script>
(function () {
  var init = ${escapeJson(init)};
  function post(message) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(message)); } catch (e) {}
  }
  var map = L.map('map', { zoomControl: true, attributionControl: true }).setView(
    [init.center.lat, init.center.lng],
    init.zoom
  );
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  var otherMarker = null;
  function setOther(other) {
    if (otherMarker) { map.removeLayer(otherMarker); otherMarker = null; }
    if (other && isFinite(other.lat) && isFinite(other.lng)) {
      otherMarker = L.marker([other.lat, other.lng]).addTo(map);
      if (other.label) otherMarker.bindPopup(other.label).openPopup();
    }
  }
  if (init.other) setOther(init.other);

  map.on('moveend', function () {
    var c = map.getCenter();
    post({ type: 'move', lat: c.lat, lng: c.lng });
  });

  function handle(data) {
    var msg = data;
    if (typeof msg === 'string') {
      try { msg = JSON.parse(msg); } catch (e) { return; }
    }
    if (!msg || !msg.type) return;
    if (msg.type === 'setView' && isFinite(msg.lat) && isFinite(msg.lng)) {
      map.setView([msg.lat, msg.lng], msg.zoom || 16, { animate: true, duration: 0.4 });
    } else if (msg.type === 'setOther') {
      setOther(msg.other);
    }
  }
  document.addEventListener('message', function (e) { handle(e.data); });
  window.addEventListener('message', function (e) { handle(e.data); });

  post({ type: 'ready' });
})();
<\/script>
</body>
</html>`;
}

export const LeafletMap = forwardRef<LeafletMapHandle, LeafletMapProps>(function LeafletMap(
  { center, zoom, other, onMoveEnd },
  ref,
) {
  const webRef = useRef<WebView>(null);
  const onMoveEndRef = useRef(onMoveEnd);

  // Ghi callback mới nhất vào ref từ effect để không vi phạm quy tắc refs của react-hooks.
  useEffect(() => {
    onMoveEndRef.current = onMoveEnd;
  });

  // HTML chỉ dựng một lần — các thay đổi sau đi qua postMessage để không reload bản đồ.
  const [html] = useState(() => buildHtml({ center, zoom, other }));

  const post = useCallback((message: Record<string, unknown>) => {
    webRef.current?.postMessage(JSON.stringify(message));
  }, []);

  useImperativeHandle(ref, () => ({
    setView: (lat: number, lng: number, viewZoom: number) => {
      post({ type: 'setView', lat, lng, zoom: viewZoom });
    },
  }));

  useEffect(() => {
    post({ type: 'setOther', other: other ?? null });
  }, [other, post]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as IncomingMessage;
      if (msg.type === 'move' && typeof msg.lat === 'number' && typeof msg.lng === 'number') {
        onMoveEndRef.current?.(msg.lat, msg.lng);
      }
    } catch {
      // tin nhắn không hợp lệ — bỏ qua
    }
  };

  return (
    <WebView<object>
      ref={webRef}
      originWhitelist={['*']}
      source={{ html }}
      style={styles.webview}
      javaScriptEnabled
      domStorageEnabled
      onMessage={handleMessage}
      setSupportMultipleWindows={false}
    />
  );
});

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: '#E9E7DB' },
});
