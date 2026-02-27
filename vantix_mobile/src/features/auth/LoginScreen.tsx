import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Eye, EyeOff, Lock, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert, Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text, TouchableOpacity, View
} from 'react-native';
import { authService } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors, Spacing } from '../../constants/theme';

const { width } = Dimensions.get('window');

export const LoginScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Por favor ingresa tu correo y contraseña.");
            return;
        }

        setLoading(true);
        try {
            await authService.login(email, password);
            router.replace('/(main)');
        } catch (error: any) {
            console.error('Login error:', error);
            const message = error.response?.data?.detail || "Correo o contraseña incorrectos.";
            Alert.alert("Error de Inicio de Sesión", message);
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
                            <View style={styles.logoPlaceholder}>
                                <Text style={styles.logoText}>VX</Text>
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
        height: 320,
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
    logoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    logoText: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.text.inverse,
    },
    appName: {
        fontSize: 28,
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
        marginTop: -40,
        borderTopRightRadius: 60,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xxl,
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
        marginBottom: Spacing.xl,
    },
    loginButton: {
        marginTop: Spacing.md,
    },
    footer: {
        marginTop: 'auto',
        paddingVertical: Spacing.xl,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 12,
        color: Colors.text.muted,
    },
});
