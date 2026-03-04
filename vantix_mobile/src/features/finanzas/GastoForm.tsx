import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import * as z from 'zod';
import { authService } from '../../api/auth';
import { finanzasService, GastoData } from '../../api/finanzas';
import { Plan, planService } from '../../api/plan';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { BorderRadius, Colors, Shadow, Spacing } from '../../constants/theme';

const gastoSchema = z.object({
    id_plan: z.number().min(1, 'El plan es requerido'),
    id_ciente: z.string().min(1, 'La selección de la visita es requerida'),
    fecha_gasto: z.string().min(1, 'Fecha es requerida'),
    lugar_origen: z.string().min(1, 'Origen es requerido'),
    lugar_destino: z.string().min(1, 'Destino es requerido'),
    institucion_visitada: z.string().min(1, 'Institución es requerida'),
    motivo_visita: z.string().min(1, 'Motivo es requerido'),
    monto_gastado: z.string().min(1, 'El monto es requerido').regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un número válido'),
});

type FormData = z.infer<typeof gastoSchema>;

export const GastoForm = () => {
    const router = useRouter();
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [pendingVisits, setPendingVisits] = useState<any[]>([]);

    const { control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(gastoSchema),
        defaultValues: {
            id_plan: 0,
            id_ciente: '',
            fecha_gasto: new Date().toISOString().split('T')[0],
            lugar_origen: '',
            lugar_destino: '',
            institucion_visitada: '',
            motivo_visita: '',
            monto_gastado: '',
        }
    });

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const user = await authService.getMe();
                if (user && user.id_empleado) {
                    const planesData = await planService.getMisPlanes(user.id_empleado);
                    setPlanes(planesData);

                    if (planesData && planesData.length > 0) {
                        const plan = planesData[0];
                        setValue('id_plan', plan.id_plan);

                        try {
                            // Cargar gastos ya registrados para este plan
                            const gastos = await finanzasService.getGastosByPlan(plan.id_plan);
                            const daysInSpanish = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
                            const currentDayIndex = new Date().getDay();

                            // Filtrar visitas de hoy O anteriores en la semana
                            const visitasValidas = plan.detalles_agenda
                                .filter(d => {
                                    const isVisita = d.tipo_actividad === 'Visita' || d.tipo_actividad === 'Visita asistida';
                                    const visitDayIndex = daysInSpanish.indexOf(d.dia_semana);
                                    return isVisita && visitDayIndex !== -1 && visitDayIndex <= currentDayIndex;
                                })
                                .sort((a, b) => {
                                    const dayA = daysInSpanish.indexOf(a.dia_semana);
                                    const dayB = daysInSpanish.indexOf(b.dia_semana);
                                    if (dayA !== dayB) return dayA - dayB;
                                    return a.hora_programada.localeCompare(b.hora_programada);
                                });

                            // Encontrar las visitas que NO tengan un gasto asociado por id_cliente
                            const unexpensedVisits = visitasValidas.filter(d => !gastos.some((g: any) => g.id_ciente === d.id_cliente));
                            setPendingVisits(unexpensedVisits);

                        } catch (error) {
                            console.error('Error cargando gastos para el plan:', error);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading form data:', error);
                Alert.alert('Error', 'No se pudo cargar la información de tu plan.');
            } finally {
                setLoadingData(false);
            }
        };
        loadFormData();
    }, []);

    const selectedVisitId = watch('id_ciente');

    useEffect(() => {
        if (selectedVisitId && pendingVisits.length > 0) {
            const idCienteStr = selectedVisitId.split('-')[1] || selectedVisitId;
            const visit = pendingVisits.find(v => v.id_cliente.toString() === idCienteStr);
            if (visit) {
                setValue('lugar_destino', visit.cliente?.nombre_cliente || '');
                setValue('institucion_visitada', visit.cliente?.nombre_cliente || '');
            }
        }
    }, [selectedVisitId, pendingVisits, setValue]);

    const onSubmit = async (data: FormData) => {
        try {
            // value is formatted as "id_detalle-id_cliente", so we split to get the actual cliente integer
            const idCienteStr = data.id_ciente.split('-')[1] || data.id_ciente;

            const gastoData: GastoData = {
                id_plan: data.id_plan,
                id_ciente: parseInt(idCienteStr),
                fecha_gasto: data.fecha_gasto,
                lugar_origen: data.lugar_origen,
                lugar_destino: data.lugar_destino,
                institucion_visitada: data.institucion_visitada,
                motivo_visita: data.motivo_visita,
                monto_gastado: parseFloat(data.monto_gastado),
            };

            await finanzasService.registrarGasto(gastoData);
            Alert.alert("Éxito", "Planilla registrada correctamente", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Error al registrar:', error);
            let message = "Ocurrió un error al procesar el registro.";
            if (error.response?.data?.detail) {
                if (Array.isArray(error.response.data.detail)) {
                    message = error.response.data.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join('\n');
                } else if (typeof error.response.data.detail === 'string') {
                    message = error.response.data.detail;
                }
            }
            Alert.alert("Error de Validación", message);
        }
    };

    if (loadingData) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Cargando datos...</Text>
            </View>
        );
    }

    if (planes.length === 0) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Text style={styles.emptyText}>No tienes planes de trabajo asignados o vigentes para la semana. No puedes registrar gastos.</Text>
                <Button title="Regresar al inicio" onPress={() => router.back()} style={{ marginTop: Spacing.xl }} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Gastos de Movilidad</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Detalles del Ticket</Text>

                    <Controller
                        control={control}
                        name="id_ciente"
                        render={({ field: { onChange, value } }) => (
                            <Select
                                label="Visita Programada"
                                placeholder="Selecciona una visita pendiente"
                                value={value}
                                onValueChange={onChange}
                                options={pendingVisits.map(v => ({
                                    label: `${v.dia_semana.substring(0, 3)} ${v.hora_programada.substring(0, 5)} - ${v.cliente?.nombre_cliente || 'Sin Cliente'}`,
                                    value: `${v.id_detalle}-${v.id_cliente}` // Guaranteed unique composite key
                                }))}
                                error={errors.id_ciente?.message as string}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="fecha_gasto"
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Fecha (YYYY-MM-DD)"
                                placeholder="2026-03-04"
                                value={value}
                                onChangeText={onChange}
                                error={errors.fecha_gasto?.message as string}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="lugar_origen"
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Lugar de Origen"
                                placeholder="Ej: Oficina central"
                                value={value}
                                onChangeText={onChange}
                                error={errors.lugar_origen?.message as string}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="lugar_destino"
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Lugar de Destino"
                                placeholder="Ej: Miraflores"
                                value={value}
                                onChangeText={onChange}
                                error={errors.lugar_destino?.message as string}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="institucion_visitada"
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Institución Visitada"
                                placeholder="Colegio, Empresa, etc."
                                value={value}
                                onChangeText={onChange}
                                error={errors.institucion_visitada?.message as string}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="motivo_visita"
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Motivo de Visita"
                                placeholder="Venta, Soporte, etc."
                                value={value}
                                onChangeText={onChange}
                                error={errors.motivo_visita?.message as string}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="monto_gastado"
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Monto Gastado (S/)"
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={value}
                                onChangeText={onChange}
                                error={errors.monto_gastado?.message as string}
                            />
                        )}
                    />
                </View>

                {/* Submit button */}
                <View style={styles.footer}>
                    <Button
                        title="Registrar Planilla"
                        onPress={handleSubmit(onSubmit)}
                        loading={isSubmitting}
                        icon={<Save size={20} color="white" />}
                    />
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    loadingText: {
        marginTop: Spacing.md,
        color: Colors.text.secondary,
        fontSize: 16,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.text.secondary,
        textAlign: 'center',
    },
    scrollContent: {
        padding: Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.OS === 'android' ? 60 : Spacing.xl,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
        ...Shadow.soft,
    },
    backButton: {
        marginRight: Spacing.md,
        padding: Spacing.xs,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        ...Shadow.soft,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: Spacing.lg,
    },
    footer: {
        marginTop: Spacing.xl,
    },
});
