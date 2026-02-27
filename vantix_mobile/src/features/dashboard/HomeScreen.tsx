import { useRouter } from 'expo-router';
import {
    ChevronRight,
    LogOut,
    Mail,
    MapPin,
    Phone,
    Users
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { authService } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { BorderRadius, Colors, Shadow, Spacing } from '../../constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.xl * 2 - Spacing.md) / 2;

export const HomeScreen = () => {
    const router = useRouter();
    const [employeeName, setEmployeeName] = useState("Cargando...");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await authService.getMe();
                if (user && user.nombre_completo) {
                    const nameParts = user.nombre_completo.trim().split(/\s+/);
                    if (nameParts.length >= 2) {
                        const firstName = nameParts[0];
                        const lastSurname = nameParts[nameParts.length - 1];
                        setEmployeeName(`${firstName} ${lastSurname}`);
                    } else {
                        setEmployeeName(user.nombre_completo);
                    }
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                setEmployeeName("Usuario");
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás seguro de que deseas salir?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Salir",
                    style: "destructive",
                    onPress: async () => {
                        await authService.logout();
                        router.replace('/(auth)/login');
                    }
                }
            ]
        );
    };

    const actions = [
        {
            id: 'visita',
            title: 'Visita',
            icon: <MapPin size={32} color={Colors.primary} />,
            color: '#EEF2FF',
            description: 'Registrar visita a institución'
        },
        {
            id: 'visita_asistida',
            title: 'V. Asistida',
            icon: <Users size={32} color={Colors.secondary} />,
            color: '#ECFEFF',
            description: 'Visita con consultor'
        },
        {
            id: 'llamada',
            title: 'Llamada',
            icon: <Phone size={32} color={Colors.success} />,
            color: '#ECFDF5',
            description: 'Registro de contacto'
        },
        {
            id: 'correo',
            title: 'Correo',
            icon: <Mail size={32} color={Colors.accent} />,
            color: '#FFFBEB',
            description: 'Envío de información'
        },
    ];

    const handleAction = (id: string) => {
        router.push(`/actions/${id}`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greetingText}>Hola, {employeeName} 👋</Text>
                        <Text style={styles.welcomeText}>¡Que tengas un excelente día!</Text>
                    </View>
                </View>


                {/* Actions Grid */}
                <Text style={styles.sectionTitle}>Acciones rápidas</Text>
                <View style={styles.grid}>
                    {actions.map((action) => (
                        <TouchableOpacity
                            key={action.id}
                            style={[styles.actionCard, { backgroundColor: action.color }]}
                            onPress={() => handleAction(action.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.iconCircle}>{action.icon}</View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>{action.title}</Text>
                                <Text style={styles.actionDescription} numberOfLines={1}>{action.description}</Text>
                            </View>
                            <View style={styles.actionArrow}>
                                <ChevronRight size={20} color={Colors.text.muted} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <Button
                    title="Cerrar Sesión"
                    onPress={handleLogout}
                    variant="ghost"
                    icon={<LogOut size={20} color={Colors.error} />}
                    textStyle={{ color: Colors.error }}
                    style={styles.bottomLogoutButton}
                />

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: Spacing.xl,
        paddingTop: Platform.OS === 'android' ? 60 : Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    greetingText: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text.primary,
    },
    welcomeText: {
        fontSize: 16,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    bottomLogoutButton: {
        marginTop: Spacing.xl,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: Spacing.md,
    },
    grid: {
        marginBottom: Spacing.xl,
    },
    actionCard: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.sm,
        ...Shadow.soft,
    },
    actionContent: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.soft,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    actionDescription: {
        fontSize: 12,
        color: Colors.text.secondary,
        lineHeight: 16,
    },
    actionArrow: {
        marginLeft: Spacing.sm,
    },

});
