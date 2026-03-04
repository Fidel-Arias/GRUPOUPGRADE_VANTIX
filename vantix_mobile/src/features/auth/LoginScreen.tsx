import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Eye, EyeOff, Lock, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text, TouchableOpacity, View
} from 'react-native';
import { authService } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusModal } from '../../components/ui/StatusModal';
import { Colors, Spacing } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

export const LoginScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        type: 'error' | 'warning';
        title: string;
        message: string;
    }>({
        visible: false,
        type: 'error',
        title: '',
        message: '',
    });

    const handleLogin = async () => {
        if (!email || !password) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setModalConfig({
                visible: true,
                type: 'warning',
                title: 'Campos Vacíos',
                message: "Por favor ingresa tu correo y contraseña.",
            });
            return;
        }

        setLoading(true);
        try {
            await authService.login(email, password);
            router.replace('/(main)');
        } catch (error: any) {
            console.error('Login error:', error);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const message = error.response?.data?.detail || "Correo o contraseña incorrectos.";

            setModalConfig({
                visible: true,
                type: 'error',
                title: 'Error de Acceso',
                message: message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                <View style={styles.header}>
                    <LinearGradient
                        colors={[Colors.primary, Colors.secondary]}
                        style={styles.headerGradient}
                    >
                        <View style={styles.logoContainer}>
                            <View style={styles.logoWrapper}>
                                <Image
                                    source={require('../../../assets/images/icon.png')}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.appName}>VANTIX</Text>
                            <Text style={styles.appTagline}>Gestión de Ventas Inteligente</Text>
                        </View>
                    </LinearGradient>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.welcomeTitle}>¡Bienvenido!</Text>
                    <Text style={styles.welcomeSubtitle}>Ingresa tus credenciales para continuar</Text>

                    <Input
                        label="Correo Electrónico"
                        placeholder="ejemplo@vantix.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        icon={<User size={20} color={Colors.text.muted} />}
                    />

                    <Input
                        label="Contraseña"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        icon={<Lock size={20} color={Colors.text.muted} />}
                        rightIcon={
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                {showPassword ? (
                                    <EyeOff size={20} color={Colors.text.muted} />
                                ) : (
                                    <Eye size={20} color={Colors.text.muted} />
                                )}
                            </TouchableOpacity>
                        }
                    />

                    <Button
                        title="Iniciar Sesión"
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.loginButton}
                        icon={<ArrowRight size={20} color={Colors.text.inverse} />}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.versionText}>v1.0.0 — Grupo Upgrade</Text>
                    </View>
                </View>
            </ScrollView>

            <StatusModal
                visible={modalConfig.visible}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                actionLabel={modalConfig.type === 'error' ? 'Reintentar' : 'Entendido'}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        height: height > 700 ? 300 : 250,
        width: '100%',
    },
    headerGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: 60,
    },
    logoContainer: {
        alignItems: 'center',
    },
    logoWrapper: {
        width: 90,
        height: 90,
        marginBottom: Spacing.sm,
    },
    logoImage: {
        width: 90,
        height: 90,
        borderRadius: 24,
    },
    appName: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text.inverse,
        letterSpacing: 2,
    },
    appTagline: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: Spacing.xs,
    },
    formContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        marginTop: -30,
        borderTopRightRadius: 40,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: Colors.text.secondary,
        marginBottom: Spacing.lg,
    },
    loginButton: {
        marginTop: Spacing.md,
    },
    footer: {
        marginTop: 'auto',
        paddingVertical: Spacing.lg,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 12,
        color: Colors.text.muted,
    },
});
