import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, User, Users } from 'lucide-react';
import PremiumCard from '../Common/PremiumCard';

const AsesorCard = ({ v, onClick, idx }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            style={{ height: '100%' }}
        >
            <PremiumCard className="asesor-pro-card" onClick={onClick}>
                <div className="card-inner">
                    <div className="card-top">
                        <div className="asesor-profile">
                            <div className="avatar-pro">
                                <span>{v.nombre_completo.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                                <div className="online-dot"></div>
                            </div>
                            <div className="asesor-details">
                                <h4>{v.nombre_completo}</h4>
                                <span className="cargo-tag">{v.cargo}</span>
                            </div>
                        </div>
                        <div className="client-stat">
                            <span className="count">{v.total_clientes}</span>
                            <span className="label">Clientes</span>
                        </div>
                    </div>

                    <div className="card-bottom">
                        <div className="progress-bar-container">
                            <div
                                className="progress-fill"
                                style={{ width: `${Math.min((v.total_clientes / 150) * 100, 100)}%` }}
                            ></div>
                        </div>
                        <div className="card-action-text">
                            <span>Explorar Cartera</span>
                            <ChevronRight size={14} />
                        </div>
                    </div>
                </div>
            </PremiumCard>

            <style jsx>{`
        :global(.asesor-pro-card) { 
            height: 100% !important;
            padding: 0 !important;
            background: var(--bg-panel) !important;
            border: 1px solid var(--border-subtle) !important;
            border-radius: 20px !important;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03) !important;
            overflow: hidden;
        }
        
        :global(.asesor-pro-card:hover) { 
            transform: translateY(-5px); 
            border-color: var(--primary) !important;
            box-shadow: 0 12px 24px rgba(59, 130, 246, 0.1) !important;
            background: white !important;
        }

        .card-inner {
            padding: 1.5rem;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 1.25rem;
        }

        .card-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 1rem;
        }

        .asesor-profile {
            display: flex;
            gap: 1rem;
            align-items: center;
            min-width: 0; /* Important for text truncation */
        }

        .avatar-pro {
            width: 52px;
            height: 52px;
            border-radius: 14px;
            background: var(--primary-glow);
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 1rem;
            position: relative;
            flex-shrink: 0;
        }

        .online-dot {
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 12px;
            height: 12px;
            background: #10b981;
            border: 2px solid white;
            border-radius: 50%;
        }

        .asesor-details {
            min-width: 0;
        }

        .asesor-details h4 {
            font-size: 1rem;
            font-weight: 800;
            color: var(--text-heading);
            margin: 0;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .cargo-tag {
            font-size: 0.7rem;
            font-weight: 700;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.02em;
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .client-stat {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            background: rgba(59, 130, 246, 0.05);
            padding: 6px 12px;
            border-radius: 12px;
            border: 1px solid rgba(59, 130, 246, 0.1);
            flex-shrink: 0;
            min-width: 70px;
        }

        .client-stat .count {
            font-size: 1.4rem;
            font-weight: 900;
            color: var(--primary);
            line-height: 1;
        }

        .client-stat .label {
            font-size: 0.55rem;
            font-weight: 800;
            color: var(--text-muted);
            text-transform: uppercase;
            margin-top: 2px;
        }

        .card-bottom {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .progress-bar-container {
            width: 100%;
            height: 6px;
            background: var(--bg-app);
            border-radius: 10px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
            border-radius: 10px;
            transition: width 1s ease-out;
        }

        .card-action-text {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 6px;
            font-size: 0.75rem;
            font-weight: 800;
            color: var(--primary);
            transition: all 0.2s;
        }

        :global(.asesor-pro-card:hover) .card-action-text {
            gap: 10px;
        }
      `}</style>
        </motion.div>
    );
};

export default AsesorCard;
