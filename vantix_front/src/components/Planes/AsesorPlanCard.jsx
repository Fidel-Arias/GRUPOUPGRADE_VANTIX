import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Calendar, AlertTriangle, CheckCircle2, ListTodo, Clock } from 'lucide-react';
import PremiumCard from '../Common/PremiumCard';
import Badge from '../Common/Badge';

const AsesorPlanCard = ({ asesor, onClick, idx, getStatusVariant }) => {
    const actSum = asesor.plan_actual?.detalles_agenda?.length || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            style={{ height: '100%' }}
        >
            <PremiumCard
                className={`asesor-plan-card ${asesor.tiene_plan_actual ? 'has-plan' : 'no-plan'}`}
                onClick={onClick}
            >
                <div className="card-inner">
                    <div className="asesor-card-header">
                        <div className="asesor-profile">
                            <div className="asesor-avatar">
                                <span>{asesor.nombre_completo.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                            </div>
                            <div className="asesor-info">
                                <h4>{asesor.nombre_completo}</h4>
                                <span className="cargo">{asesor.cargo}</span>
                            </div>
                        </div>
                        <div className={`status-icon-badge ${asesor.tiene_plan_actual ? 'complete' : 'pending'}`}>
                            {asesor.tiene_plan_actual ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
                        </div>
                    </div>

                    <div className="card-divider"></div>

                    <div className="asesor-card-body">
                        <div className="status-container">
                            <div className="status-label-group">
                                <span className="label">Planificación</span>
                                <Badge variant={asesor.tiene_plan_actual ? getStatusVariant(asesor.plan_actual.estado) : 'error'}>
                                    {asesor.tiene_plan_actual ? asesor.plan_actual.estado : 'No Registrado'}
                                </Badge>
                            </div>

                            {asesor.tiene_plan_actual ? (
                                <div className="activity-summary-box">
                                    <div className="mini-stat">
                                        <div className="stat-icon">
                                            <ListTodo size={16} />
                                        </div>
                                        <div className="stat-content">
                                            <span className="stat-value">{actSum}</span>
                                            <span className="stat-desc">Actividades</span>
                                        </div>
                                    </div>
                                    <div className="mini-stat">
                                        <div className="stat-icon">
                                            <Calendar size={14} />
                                        </div>
                                        <div className="stat-content">
                                            <span className="stat-desc">Semana Completa</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="missing-plan-notice">
                                    <Clock size={16} />
                                    <span>Pendiente de registrar agenda</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="asesor-card-footer">
                        <span>{asesor.tiene_plan_actual ? 'Ver Detalles' : 'Gestionar Plan'}</span>
                        <ChevronRight size={18} />
                    </div>
                </div>
            </PremiumCard>

            <style jsx>{`
        :global(.asesor-plan-card) {
            padding: 0 !important;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            height: 100% !important;
            background: var(--bg-panel) !important;
            border: 1px solid var(--border-subtle) !important;
            border-radius: 20px !important;
        }

        :global(.asesor-plan-card:hover) {
            transform: translateY(-6px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.08) !important;
            border-color: var(--primary) !important;
            background: white !important;
        }

        .card-inner {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .asesor-card-header { 
            padding: 1.5rem; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            gap: 12px;
        }

        .asesor-profile { 
            display: flex; 
            gap: 12px; 
            align-items: center; 
            min-width: 0;
        }

        .asesor-avatar { 
            width: 48px; 
            height: 48px; 
            border-radius: 12px; 
            background: var(--primary-glow); 
            color: var(--primary);
            display: flex; 
            align-items: center; 
            justify-content: center;
            font-weight: 800; 
            font-size: 1rem;
            flex-shrink: 0;
        }

        .asesor-info {
            min-width: 0;
        }

        .asesor-info h4 { 
            margin: 0; 
            font-size: 1rem; 
            font-weight: 800; 
            color: var(--text-heading); 
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .asesor-info .cargo { 
            font-size: 0.75rem; 
            color: var(--text-muted); 
            font-weight: 600; 
            text-transform: uppercase; 
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .status-icon-badge {
            width: 40px; 
            height: 40px; 
            border-radius: 50%;
            display: flex; 
            align-items: center; 
            justify-content: center;
            flex-shrink: 0;
        }

        .status-icon-badge.complete { color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .status-icon-badge.pending { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }

        .card-divider { 
            height: 1px; 
            background: var(--border-subtle); 
            margin: 0 1.5rem; 
            opacity: 0.5; 
        }

        .asesor-card-body { 
            padding: 1.25rem 1.5rem; 
            display: flex; 
            flex-direction: column; 
            flex: 1;
        }

        .status-container {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
            height: 100%;
        }

        .status-label-group { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .status-label-group .label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

        .activity-summary-box {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            background: var(--bg-app);
            padding: 1rem;
            border-radius: 16px;
            border: 1px solid var(--border-light);
        }

        .mini-stat { display: flex; align-items: center; gap: 8px; }
        .stat-icon { color: var(--primary); opacity: 0.8; }
        .stat-content { display: flex; flex-direction: column; }
        .stat-value { font-size: 1rem; font-weight: 800; color: var(--text-heading); line-height: 1; }
        .stat-desc { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; }

        .missing-plan-notice {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 1.25rem;
            background: rgba(245, 158, 11, 0.03);
            border: 1.5px dashed var(--border-subtle);
            border-radius: 16px;
            color: var(--text-muted);
            font-size: 0.85rem;
            font-weight: 600;
            text-align: center;
        }

        .asesor-card-footer { 
            padding: 1rem 1.5rem; 
            background: var(--bg-app);
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            font-size: 0.85rem; 
            font-weight: 700; 
            color: var(--primary);
            border-top: 1px solid var(--border-subtle);
            margin-top: auto;
        }
      `}</style>
        </motion.div>
    );
};

export default AsesorPlanCard;
