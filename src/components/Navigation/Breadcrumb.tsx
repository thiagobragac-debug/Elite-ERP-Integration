import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Breadcrumb.css';

export interface BreadcrumbPath {
  label: string;
  href?: string;
  icon?: React.ElementType;
}

interface BreadcrumbProps {
  paths: BreadcrumbPath[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ paths }) => {
  return (
    <nav className="tauze-breadcrumb" aria-label="Breadcrumb">
      <Link
        to="/painel"
        className="tauze-breadcrumb-item tauze-breadcrumb-link"
        title="Dashboard Inicial"
      >
        <Home size={14} />
      </Link>

      {paths.map((path, index) => {
        const isLast = index === paths.length - 1;
        const Icon = path.icon;

        return (
          <React.Fragment key={index}>
            <div className="tauze-breadcrumb-separator">
              <ChevronRight size={14} />
            </div>

            {isLast ? (
              <div className="tauze-breadcrumb-item tauze-breadcrumb-current" aria-current="page">
                {Icon && <Icon size={14} />}
                <span>{path.label}</span>
              </div>
            ) : path.href ? (
              <Link to={path.href} className="tauze-breadcrumb-item tauze-breadcrumb-link">
                {Icon && <Icon size={14} />}
                <span>{path.label}</span>
              </Link>
            ) : (
              <div
                className="tauze-breadcrumb-item tauze-breadcrumb-link"
                style={{ cursor: 'default' }}
              >
                {Icon && <Icon size={14} />}
                <span>{path.label}</span>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
