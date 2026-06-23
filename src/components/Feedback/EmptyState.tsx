import React from 'react';
import { Plus, Database } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ElementType;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Database,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="empty-state-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 40px',
        textAlign: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      <div
        className="icon-circle active"
        style={{ width: '80px', height: '80px', marginBottom: '24px' }}
      >
        <Icon size={40} />
      </div>

      <h2 className="page-title" style={{ fontSize: '1.75rem', marginBottom: '12px' }}>
        {title}
      </h2>
      <p className="page-subtitle" style={{ maxWidth: '400px', margin: '0 auto 32px' }}>
        {description}
      </p>

      {actionLabel && onAction && (
        <button className="primary-btn" onClick={onAction}>
          <Plus size={18} />
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
};
