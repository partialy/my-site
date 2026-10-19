import React from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface PageLoadingProps {
  tip?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ tip = '正在连接并检测系统状态...' }) => {
  return (
    <div className="page-loading-container">
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
          marginBottom: 8,
        }}
      >
        <ShieldCheck size={28} />
      </div>
      <Loader2
        size={26}
        style={{ color: '#2563eb', animation: 'spin 1s linear infinite' }}
      />
      <div style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }}>
        {tip}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
