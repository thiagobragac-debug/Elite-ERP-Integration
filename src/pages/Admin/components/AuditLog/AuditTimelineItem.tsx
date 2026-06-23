/**
 * Timeline item component for displaying individual audit log entries
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import React from 'react';
import { User, Clock, History } from 'lucide-react';
import type { TimelineItemProps } from './types';

export const AuditTimelineItem: React.FC<TimelineItemProps> = ({
  log,
  moduleIcon: ModuleIcon,
  moduleLabel,
  actionConfig,
  onClick,
}) => {
  const ActionIcon = actionConfig.Icon;

  return (
    <div className="audit-entry interactive" onClick={onClick}>
      {/* Module Icon */}
      <div
        className="audit-entry-icon"
        style={{
          background: `${actionConfig.color}12`,
          border: `1.5px solid ${actionConfig.color}30`,
        }}
        title={`Módulo: ${moduleLabel}`}
      >
        <ModuleIcon size={15} style={{ color: actionConfig.color }} />
      </div>

      {/* Content */}
      <div className="audit-entry-body">
        {/* Row 1: module · pill · timestamp */}
        <div className="audit-entry-row">
          <span className="audit-module-name">{moduleLabel}</span>
          <span
            className="audit-action-pill"
            style={{
              background: `${actionConfig.color}18`,
              color: actionConfig.color,
            }}
          >
            <ActionIcon size={10} />
            {actionConfig.label}
          </span>
          <span className="audit-dot">·</span>
          <span className="audit-user-tag">
            <User size={10} />
            {log.user_name}
          </span>
          <span className="audit-timestamp">
            <Clock size={10} />
            {new Date(log.timestamp).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Row 2: description and sublabel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <p className="audit-desc">{log.description}</p>
          {log.sublabel && (
            <>
              <span className="audit-dot">·</span>
              <span className="audit-sublabel">{log.sublabel}</span>
            </>
          )}
          {(log.old_data || log.new_data) && (
            <div className="audit-details-indicator">
              <History size={11} />
              <span>Dossiê</span>
            </div>
          )}
        </div>
      </div>

      {/* Explicit Dossier Button */}
      <div className="audit-jump-action">
        <History size={11} />
        <span>Dossiê</span>
      </div>
    </div>
  );
};
