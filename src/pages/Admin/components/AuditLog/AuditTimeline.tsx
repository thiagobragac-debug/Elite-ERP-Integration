/**
 * Timeline component for displaying audit log entries
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import React from 'react';
import { Shield, FileText } from 'lucide-react';
import { AuditTimelineItem } from './AuditTimelineItem';
import { EmptyState } from '../../../../components/Feedback/EmptyState';
import { MODULE_ICONS, MODULE_LABELS, ACTION_CONFIG } from './constants';
import type { LogEntry } from './types';

interface AuditTimelineProps {
  logs: LogEntry[];
  loading: boolean;
  onLogClick: (log: LogEntry) => void;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs, loading, onLogClick }) => {
  if (loading) {
    return (
      <div className="premium-card audit-card" style={{ padding: '8px' }}>
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="audit-entry"
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                padding: '10px 14px',
              }}
            >
              <div
                className="skeleton-base"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div className="skeleton-base" style={{ width: '220px', height: '12px' }} />
                <div className="skeleton-base" style={{ width: '340px', height: '10px' }} />
              </div>
              <div className="skeleton-base" style={{ width: '80px', height: '10px' }} />
            </div>
          ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="premium-card audit-card" style={{ padding: '8px' }}>
        <div
          style={{
            padding: '60px 20px',
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <EmptyState
            title="Histórico de Auditoria Limpo"
            description="Nenhum evento registrado nesta base de dados."
            icon={Shield}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="premium-card audit-card" style={{ padding: '8px' }}>
      {logs.map((log, i) => {
        const actionConfig = ACTION_CONFIG[log.action];
        const ModuleIcon = (MODULE_ICONS as Record<string, typeof FileText>)[log.table_name] || FileText;
        const moduleLabel = MODULE_LABELS[log.table_name] || log.table_name;

        return (
          <AuditTimelineItem
            key={log.id + i}
            log={log}
            moduleIcon={ModuleIcon}
            moduleLabel={moduleLabel}
            actionConfig={actionConfig}
            onClick={() => onLogClick(log)}
          />
        );
      })}
    </div>
  );
};
