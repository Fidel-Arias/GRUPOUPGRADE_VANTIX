import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, Check } from 'lucide-react';

const WeekPicker = ({ plans, selectedPlanId, onChange, isAdmin, headerText = 'Semanas con Actividad' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Cerrar al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const parseDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const getWeekDetails = (dateString) => {
        const date = parseDate(dateString.split('T')[0]);
        const day = date.getDay() || 7;
        const monday = new Date(date);
        monday.setDate(date.getDate() - day + 1);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        // Standard ISO Week Number
        const d = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

        return { monday, sunday, weekNum };
    };

    const localDateStr = (date) => {
        if (!date) return '';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = today.getDay() || 7;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - day + 1);
    const currentMondayStr = localDateStr(currentMonday);

    const selectedPlan = plans.find(p => p.id_plan === selectedPlanId);
    const selectedDetails = selectedPlan ? getWeekDetails(selectedPlan.fecha_inicio_semana) : null;

    // Ordenar planes por fecha descendente
    const sortedPlans = [...plans].sort((a, b) =>
        new Date(b.fecha_inicio_semana) - new Date(a.fecha_inicio_semana)
    );

    return (
        <div className="week-picker-container" ref={containerRef}>
            <button
                type="button"
                className={`picker-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="trigger-content">
                    <Calendar size={18} className="calendar-icon" />
                    <div className="selected-info">
                        {selectedDetails ? (
                            <>
                                <span className="main-text">
                                    Semana {selectedDetails.weekNum}
                                </span>
                                <span className="sub-text">
                                    {selectedDetails.monday.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} - {selectedDetails.sunday.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                </span>
                            </>
                        ) : (
                            <span className="placeholder">
                                {plans.length === 0 ? 'Sin actividad registrada' : 'Seleccionar semana...'}
                            </span>
                        )}
                    </div>
                </div>
                <ChevronDown size={18} className={`arrow-icon ${isOpen ? 'rotated' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="picker-dropdown"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <div className="dropdown-header">{headerText}</div>
                        <div className="dropdown-list">
                            {sortedPlans.map((plan) => {
                                const details = getWeekDetails(plan.fecha_inicio_semana);
                                const isSelected = selectedPlanId === plan.id_plan;
                                const isCurrent = localDateStr(details.monday) === currentMondayStr;

                                return (
                                    <div
                                        key={plan.id_plan}
                                        className={`picker-item ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}`}
                                        onClick={() => {
                                            onChange(plan.id_plan);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <div className="item-label">
                                            <div className="label-top">
                                                <span className="week-name">Semana {details.weekNum}</span>
                                                {isCurrent && <span className="current-indicator">ACTUAL</span>}
                                            </div>
                                            <div className="label-bottom">
                                                {details.monday.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} al {details.sunday.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                            </div>
                                            {isAdmin && (
                                                <div className="agent-badge">
                                                    {plan.empleado?.nombre_completo || 'Agente'}
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && <Check size={16} className="check-icon" />}
                                    </div>
                                );
                            })}
                            {sortedPlans.length === 0 && (
                                <div className="no-data-lux">
                                    <div className="no-data-icon">!</div>
                                    <p>Este asesor no tiene semanas registradas aún.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .week-picker-container {
                    position: relative;
                    width: 100%;
                    max-width: 340px;
                }

                .picker-trigger {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.75rem 1.25rem;
                    background: white;
                    border: 1px solid var(--border-subtle);
                    border-radius: 16px;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }

                :global(.dark) .picker-trigger {
                    background: var(--bg-panel);
                    border-color: var(--border-light);
                }

                .picker-trigger:hover {
                    border-color: var(--primary);
                    background: var(--bg-app);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px var(--primary-glow);
                }

                .picker-trigger.active {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 4px var(--primary-glow);
                }

                .trigger-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .calendar-icon {
                    color: var(--primary);
                    background: var(--primary-glow);
                    padding: 8px;
                    border-radius: 10px;
                    box-sizing: content-box;
                }

                .selected-info {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 1px;
                }

                .main-text {
                    font-weight: 800;
                    color: var(--text-heading);
                    font-size: 0.95rem;
                }

                .sub-text {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    font-weight: 600;
                }

                .placeholder {
                    color: var(--text-muted);
                    font-weight: 600;
                }

                .arrow-icon {
                    color: var(--text-muted);
                    transition: transform 0.3s ease;
                }

                .arrow-icon.rotated {
                    transform: rotate(180deg);
                }

                .picker-dropdown {
                    position: absolute;
                    top: calc(100% + 12px);
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid var(--border-subtle);
                    border-radius: 20px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.12);
                    z-index: 1000;
                    overflow: hidden;
                }

                :global(.dark) .picker-dropdown {
                    background: var(--bg-panel);
                    border-color: var(--border-light);
                    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
                }

                .dropdown-header {
                    padding: 1rem 1.25rem;
                    font-size: 0.75rem;
                    font-weight: 900;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    background: #f8fafc;
                    border-bottom: 1px solid var(--border-light);
                }

                :global(.dark) .dropdown-header {
                    background: rgba(255,255,255,0.02);
                }

                .dropdown-list {
                    max-height: 380px;
                    overflow-y: auto;
                    padding: 8px;
                }

                /* Scrollbar styling */
                .dropdown-list::-webkit-scrollbar { width: 6px; }
                .dropdown-list::-webkit-scrollbar-track { background: transparent; }
                .dropdown-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                :global(.dark) .dropdown-list::-webkit-scrollbar-thumb { background: #334155; }

                .picker-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem;
                    margin-bottom: 4px;
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .picker-item:hover {
                    background: var(--bg-app);
                }

                .picker-item.selected {
                    background: var(--primary-glow);
                }

                .picker-item.current {
                    border-left: 4px solid var(--primary);
                }

                .item-label {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }

                .label-top {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .week-name {
                    font-weight: 800;
                    font-size: 0.9rem;
                    color: var(--text-heading);
                }

                .current-indicator {
                    background: var(--primary);
                    color: white;
                    font-size: 0.6rem;
                    padding: 2px 6px;
                    border-radius: 50px;
                    font-weight: 900;
                }

                .label-bottom {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    font-weight: 600;
                }

                .agent-badge {
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: var(--primary);
                    margin-top: 4px;
                }

                .check-icon {
                    color: var(--primary);
                }

                .no-data-lux {
                    padding: 3rem 1.5rem;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                }
                .no-data-icon {
                    width: 32px; height: 32px; border-radius: 50%;
                    background: #f1f5f9; color: var(--text-muted);
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 900; font-size: 0.8rem;
                }
                .no-data-lux p { 
                    font-size: 0.85rem; color: var(--text-muted); 
                    font-weight: 700; margin: 0; line-height: 1.4;
                    max-width: 200px;
                }
            `}</style>
        </div>
    );
};

export default WeekPicker;
