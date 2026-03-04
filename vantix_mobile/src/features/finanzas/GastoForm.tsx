import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Save } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import * as z from 'zod';
import { authService } from '../../api/auth';
import { finanzasService, GastoData } from '../../api/finanzas';
import { Plan, planService } from '../../api/plan';
import { visitaService } from '../../api/visita';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusModal } from '../../components/ui/StatusModal';
import { SummaryImage, SummaryItem, SummaryModal } from '../../components/ui/SummaryModal';
import { BorderRadius, Colors, Shadow, Spacing } from '../../constants/theme';

const gastoSchema = z.object({
    id_plan: z.coerce.number().min(1, 'El plan es requerido'),
    id_ciente: z.string().min(1, 'La selección de la visita es requerida'),
    fecha_gasto: z.string().min(1, 'Fecha es requerida'),
    lugar_origen: z.string().min(1, 'Origen es requerido'),
    lugar_destino: z.string().min(1, 'Destino es requerido'),
    institucion_visitada: z.string().min(1, 'Institución es requerida'),
    motivo_visita: z.string().min(1, 'Motivo es requerido'),
    monto_gastado: z.string()
        .min(1, 'El monto es requerido')
        .regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un número válido')
        .refine(val => parseFloat(val) > 0, 'El monto debe ser mayor a 0'),
});

type FormData = z.infer<typeof gastoSchema>;

export const GastoForm = () => {
    const router = useRouter();
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [gastosList, setGastosList] = useState<any[]>([]);
    const [visitasRegistradas, setVisitasRegistradas] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [pendingVisits, setPendingVisits] = useState<any[]>([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [summaryData, setSummaryData] = useState<{ items: SummaryItem[], images: SummaryImage[] }>({ items: [], images: [] });
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        type: 'success' | 'error' | 'warning';
        title: string;
        message: string;
        onClose: () => void;
        onAction?: () => void;
    }>({
        visible: false,
        type: 'success',
        title: '',
        message: '',
        onClose: () => { },
    });

    const resolver = useMemo(() => zodResolver(gastoSchema), []);

    const { control, handleSubmit, setValue, watch, getValues, formState: { errors, isSubmitting, isValid } } = useForm<FormData>({
        resolver,
        mode: 'onChange',
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

    const fechaGastoStr = watch('fecha_gasto');
    const selectedVisitId = watch('id_ciente');

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
                            const [gastos, visitas] = await Promise.all([
                                finanzasService.getGastosByPlan(plan.id_plan),
                                visitaService.getVisitasPorPlan(plan.id_plan)
                            ]);
                            setGastosList(gastos || []);
                            setVisitasRegistradas(visitas || []);
                        } catch (error) {
                            console.error('Error cargando datos adicionales:', error);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading form data:', error);
                setModalConfig({
                    visible: true,
                    type: 'error',
                    title: 'Error de Red',
                    message: 'No pudimos sincronizar la información de tu plan. Verifica tu conexión.',
                    onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
                });
            } finally {
                setLoadingData(false);
            }
        };
        loadFormData();
    }, []);

    useEffect(() => {
        if (!loadingData && fechaGastoStr) {
            const normalizedFechaGasto = fechaGastoStr.trim();

            // 1. Gastos ya registrados para esta fecha específica
            const gastosForDate = gastosList.filter((g: any) => {
                const gFecha = g.fecha_gasto?.toString().split('T')[0].trim();
                return gFecha === normalizedFechaGasto;
            });

            // 2. Visitas que fueron registradas (check-in) en esta fecha (Convertido a local)
            const visitasDelDia = visitasRegistradas.filter(v => {
                if (!v.fecha_hora_checkin) return false;

                // Convertir la fecha UTC del servidor a objeto Date local
                const dateObj = new Date(v.fecha_hora_checkin);
                if (isNaN(dateObj.getTime())) return false;

                // Obtener YYYY-MM-DD en hora local
                const localYear = dateObj.getFullYear();
                const localMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
                const localDay = String(dateObj.getDate()).padStart(2, '0');
                const localFecha = `${localYear}-${localMonth}-${localDay}`;

                return localFecha === normalizedFechaGasto;
            });

            // 3. Filtrar las visitas que NO tengan un gasto asociado (comparando IDs numéricamente)
            const unexpensedVisits = visitasDelDia.filter(v => {
                const yaTieneGasto = gastosForDate.some((g: any) =>
                    Number(g.id_ciente) === Number(v.id_cliente)
                );
                return !yaTieneGasto;
            });

            setPendingVisits(unexpensedVisits);

            const currentId = getValues('id_ciente');
            if (currentId) {
                const isValid = unexpensedVisits.some(v => `${v.id_detalle || v.id_visita}-${v.id_cliente}` === currentId);
                if (!isValid) {
                    setValue('id_ciente', '');
                }
            }
        }
    }, [fechaGastoStr, gastosList, visitasRegistradas, loadingData]);

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
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            const selectedVisit = pendingVisits.find(v => `${v.id_detalle || v.id_visita}-${v.id_cliente}` === data.id_ciente);
            let timeLabel = 'Registrada';
            if (selectedVisit?.fecha_hora_checkin) {
                const dateObj = new Date(selectedVisit.fecha_hora_checkin);
                if (!isNaN(dateObj.getTime())) {
                    const hours = String(dateObj.getHours()).padStart(2, '0');
                    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                    timeLabel = `${hours}:${minutes}`;
                }
            }
            const visitaLabel = selectedVisit ? `${timeLabel} - ${selectedVisit.cliente?.nombre_cliente || 'Sin Cliente'}` : data.id_ciente;

            setSummaryData({
                items: [
                    { label: 'Fecha', value: data.fecha_gasto },
                    { label: 'Visita Programada', value: visitaLabel },
                    { label: 'Lugar de Origen', value: data.lugar_origen },
                    { label: 'Lugar de Destino', value: data.lugar_destino },
                    { label: 'Institución Visitada', value: data.institucion_visitada },
                    { label: 'Motivo de Visita', value: data.motivo_visita },
                    { label: 'Monto Gastado (S/)', value: data.monto_gastado },
                ],
                images: []
            });

            setModalConfig({
                visible: true,
                type: 'success',
                title: '¡Registro Exitoso!',
                message: 'Tu planilla de movilidad ha sido registrada correctamente.',
                onClose: () => {
                    setModalConfig(prev => ({ ...prev, visible: false }));
                    router.back();
                },
                onAction: () => {
                    setModalConfig(prev => ({ ...prev, visible: false }));
                    setShowSummary(true);
                }
            });
        } catch (error: any) {
            console.error('Error al registrar:', error);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            let message = "Ocurrió un error al procesar el registro.";
            if (error.response?.data?.detail) {
                if (Array.isArray(error.response.data.detail)) {
                    message = error.response.data.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join('\n');
                } else if (typeof error.response.data.detail === 'string') {
                    message = error.response.data.detail;
                }
            }

            setModalConfig({
                visible: true,
                type: 'error',
                title: 'Error de Envío',
                message: message,
                onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
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
                        name="fecha_gasto"
                        render={({ field: { onChange, value } }) => {
                            const dateValue = new Date(value + 'T12:00:00Z'); // Evitar desfase de zona horaria

                            return (
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Fecha (YYYY-MM-DD)</Text>
                                    <TouchableOpacity
                                        style={styles.datePickerButton}
                                        onPress={() => setShowDatePicker(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.datePickerText}>{value}</Text>
                                        <Calendar size={20} color={Colors.text.secondary} />
                                    </TouchableOpacity>

                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={isNaN(dateValue.getTime()) ? new Date() : dateValue}
                                            mode="date"
                                            display="default"
                                            onChange={(event, selectedDate) => {
                                                setShowDatePicker(Platform.OS === 'ios');
                                                if (selectedDate) {
                                                    const formattedDate = selectedDate.toISOString().split('T')[0];
                                                    onChange(formattedDate);
                                                }
                                            }}
                                        />
                                    )}
                                    {errors.fecha_gasto && (
                                        <Text style={styles.errorText}>{errors.fecha_gasto.message}</Text>
                                    )}
                                </View>
                            );
                        }}
                    />

                    <Controller
                        control={control}
                        name="id_ciente"
                        render={({ field: { onChange, value } }) => (
                            <Select
                                label="Visita Programada"
                                placeholder={pendingVisits.length > 0 ? "Selecciona una visita pendiente" : `No hay visitas para ${value ? 'esta fecha' : 'hoy'}`}
                                value={value}
                                onValueChange={onChange}
                                options={pendingVisits.map(v => {
                                    let timeLabel = 'Registrada';
                                    if (v.fecha_hora_checkin) {
                                        const dateObj = new Date(v.fecha_hora_checkin);
                                        if (!isNaN(dateObj.getTime())) {
                                            const hours = String(dateObj.getHours()).padStart(2, '0');
                                            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                                            timeLabel = `${hours}:${minutes}`;
                                        }
                                    }
                                    return {
                                        label: `${timeLabel} - ${v.cliente?.nombre_cliente || 'Sin Cliente'}`,
                                        value: `${v.id_detalle || v.id_visita}-${v.id_cliente}`
                                    };
                                })}
                                error={errors.id_ciente?.message as string}
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
                        onPress={() => {
                            if (!isValid) {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                setModalConfig({
                                    visible: true,
                                    type: 'warning',
                                    title: 'Datos Incompletos',
                                    message: 'Debes completar todos los campos del ticket antes de registrar la planilla.',
                                    onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
                                });
                            } else {
                                handleSubmit(onSubmit)();
                            }
                        }}
                        loading={isSubmitting}
                        style={StyleSheet.flatten([!isValid ? styles.disabledBtn : {}])}
                        icon={<Save size={20} color="white" />}
                    />
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>

            <StatusModal
                visible={modalConfig.visible}
                type={modalConfig.type as any}
                title={modalConfig.title}
                message={modalConfig.message}
                onClose={modalConfig.onClose}
                onAction={modalConfig.onAction}
                actionLabel={modalConfig.type === 'success' ? 'Ver resumen' : 'Corregir'}
            />

            <SummaryModal
                visible={showSummary}
                title="Resumen de Gasto"
                items={summaryData.items}
                images={summaryData.images}
                onClose={() => {
                    setShowSummary(false);
                    router.back();
                }}
            />
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
    inputContainer: {
        marginBottom: Spacing.md,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
    },
    datePickerText: {
        fontSize: 16,
        color: Colors.text.primary,
    },
    errorText: {
        fontSize: 12,
        color: Colors.error,
        marginTop: 4,
    },
    footer: {
        marginTop: Spacing.xl,
    },
    disabledBtn: {
        opacity: 0.6,
        backgroundColor: Colors.text.muted,
    },
});
