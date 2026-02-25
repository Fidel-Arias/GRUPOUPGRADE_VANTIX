import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const PageHeader = ({
    title,
    description,
    icon: Icon,
    actions,
    breadcrumb = []
}) => {
    return (
        <div className="page-header-elite">
            <div className="header-main-content">
                <div className="header-info-group">
                    {/* Breadcrumb / Context */}
                    <div className="header-context">
                        <span className="context-root">VANTIX</span>
                        <ChevronRight size={12} className="context-sep" />
                        {breadcrumb.map((item, index) => (
                            <React.Fragment key={index}>
                                <span className="context-item">{item}</span>
                                {index < breadcrumb.length - 1 && (
                                    <ChevronRight size={12} className="context-sep" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="header-title-row">
                        {Icon && (
                            <div className="header-icon-box">
                                <Icon size={24} strokeWidth={2.5} />
                            </div>
                        )}
                        <div className="header-text">
                            <h1>{title}</h1>
                            {description && <p>{description}</p>}
                        </div>
                    </div>
                </div>

                {actions && (
                    <div className="header-actions">
                        {actions}
                    </div>
                )}
            </div>

            <style jsx>{`
                .page-header-elite {
                    margin-bottom: 2.5rem;
                    position: relative;
                }

                .header-main-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    gap: 2rem;
                }

                .header-info-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .header-context {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--text-muted);
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }

                .context-root {
                    color: var(--primary);
                }

                .context-sep {
                    opacity: 0.5;
                }

                .header-title-row {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                }

                .header-icon-box {
                    width: 52px;
                    height: 52px;
                    background: white;
                    border: 1px solid var(--border-subtle);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary);
                    box-shadow: var(--shadow-sm);
                }

                :global(.dark) .header-icon-box {
                    background: var(--bg-panel);
                    border-color: var(--border-light);
                }

                .header-text h1 {
                    font-size: 2.4rem;
                    font-weight: 800;
                    color: var(--text-heading);
                    letter-spacing: -0.03em;
                    margin: 0;
                    line-height: 1.1;
                }

                .header-text p {
                    color: var(--text-body);
                    font-size: 1.05rem;
                    margin: 0.25rem 0 0 0;
                    opacity: 0.8;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding-bottom: 0.25rem;
                }

                @media (max-width: 1024px) {
                    .header-main-content {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1.5rem;
                    }
                    
                    .header-actions {
                        width: 100%;
                    }
                }

                @media (max-width: 640px) {
                    .header-text h1 {
                        font-size: 1.8rem;
                    }
                    .header-icon-box {
                        width: 44px;
                        height: 44px;
                        min-width: 44px;
                    }
                }
            `}</style>
        </div>
    );
};

export default PageHeader;
