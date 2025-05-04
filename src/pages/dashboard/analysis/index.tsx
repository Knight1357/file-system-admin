import { useEffect } from 'react';

function Analysis() {
  useEffect(() => {
    // 直接跳转（会离开当前应用）
    window.location.href = "http://152.32.131.180:3000/dashboards";
  }, []);

  return (
    <div className="p-2">
      <p>正在跳转到 Grafana 仪表盘...</p>
    </div>
  );
}

export default Analysis;