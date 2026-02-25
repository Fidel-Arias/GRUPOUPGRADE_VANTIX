import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { authService } from '../../services/api';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authService.login(email, password);
            window.location.href = '/';
        } catch (err) {
            setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="background-ornament"></div>

            <motion.div
                className="login-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="login-header">
                    <div className="logo-box">
                        <ShieldCheck size={32} color="#0ea5e9" />
                    </div>
                    <h1>VANTIX<span>Elite</span></h1>
                    <p>Gestión Comercial de Alto Rendimiento</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <motion.div
                            className="error-message"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <div className="input-group">
                        <label>Correo Corporativo</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                placeholder="ejemplo@vantix.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Contraseña</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-login"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="spinner" size={18} />
                        ) : (
                            <>
                                Entrar al Sistema
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    <div className="login-footer">
                        <p>© 2026 GRUPO UPGRADE. Todos los derechos reservados.</p>
                    </div>
                </form>
            </motion.div>

            <style jsx>{`
                .login-wrapper {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #020617;
                    position: relative;
                    overflow: hidden;
                    font-family: 'Outfit', sans-serif;
                }

                .background-ornament {
                    position: absolute;
                    width: 600px;
                    height: 600px;
                    background: radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%);
                    top: -100px;
                    right: -100px;
                    border-radius: 50%;
                }

                .login-card {
                    width: 100%;
                    max-width: 420px;
                    background: rgba(15, 23, 42, 0.8);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 32px;
                    padding: 3rem;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    z-index: 10;
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 2.5rem;
                }

                .logo-box {
                    width: 64px;
                    height: 64px;
                    background: rgba(14, 165, 233, 0.1);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    border: 1px solid rgba(14, 165, 233, 0.2);
                }

                .login-header h1 {
                    color: white;
                    font-size: 1.85rem;
                    font-weight: 800;
                    margin: 0;
                    letter-spacing: -0.02em;
                }

                .login-header h1 span {
                    color: #0ea5e9;
                    font-weight: 400;
                    margin-left: 2px;
                }

                .login-header p {
                    color: #94a3b8;
                    font-size: 0.9rem;
                    margin-top: 0.5rem;
                }

                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .error-message {
                    background: rgba(239, 68, 68, 0.1);
                    color: #f87171;
                    padding: 0.85rem 1rem;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    text-align: center;
                }

                .input-group label {
                    display: block;
                    color: #cbd5e1;
                    font-size: 0.85rem;
                    font-weight: 700;
                    margin-bottom: 0.65rem;
                    margin-left: 4px;
                }

                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-icon {
                    position: absolute;
                    left: 1rem;
                    color: #64748b;
                }

                .input-wrapper input {
                    width: 100%;
                    background: #0f172a;
                    border: 1px solid #1e293b;
                    border-radius: 16px;
                    padding: 0.85rem 1rem 0.85rem 3rem;
                    color: white;
                    font-size: 0.95rem;
                    outline: none;
                    transition: all 0.2s;
                }

                .input-wrapper input:focus {
                    border-color: #0ea5e9;
                    box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
                }

                .btn-login {
                    background: #0ea5e9;
                    color: white;
                    border: none;
                    padding: 1rem;
                    border-radius: 16px;
                    font-weight: 800;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.3s;
                    margin-top: 0.5rem;
                }

                .btn-login:hover {
                    background: #0284c7;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px -5px rgba(14, 165, 233, 0.4);
                }

                .btn-login:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .spinner {
                    animation: rotate 2s linear infinite;
                }

                .login-footer {
                    margin-top: 1rem;
                    text-align: center;
                }

                .login-footer p {
                    color: #475569;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LoginPage;
