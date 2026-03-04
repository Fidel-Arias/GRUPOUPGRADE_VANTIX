import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    Camera,
    Image as ImageIcon,
    Navigation,
    Save,
    Trash2
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Image,
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
import { Cliente, carteraService } from '../../api/cartera';
import { crmService } from '../../api/crm';
import { Plan, planService } from '../../api/plan';
import { visitaService } from '../../api/visita';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusModal } from '../../components/ui/StatusModal';
import { SummaryImage, SummaryItem, SummaryModal } from '../../components/ui/SummaryModal';
import { BorderRadius, Colors, Shadow, Spacing } from '../../constants/theme';

// --- SCHEMAS ---

const baseSchema = {
    id_detalle: z.string().min(1, 'Selecciona una cita programada'),
    id_plan: z.string().optional(),
};

const visitaSchema = z.object({
    ...baseSchema,
    id_cliente: z.string().min(1, 'ID Cliente es requerido'),
    resultado: z.string().min(1, 'Selecciona un resultado'),
    nombre_tecnico: z.string().optional(),
    observaciones: z.string().optional(),
    lat: z.string().optional(),
    lon: z.string().optional(),
    foto_lugar: z.any().optional(),
    foto_sello: z.any().optional(),
});

const llamadaSchema = z.object({
    ...baseSchema,
    numero_destino: z.string().regex(/^\d{9}$/, 'El número debe tener exactamente 9 dígitos'),
    nombre_destinatario: z.string().min(1, 'Nombre es requerido'),
    resultado: z.string().min(1, 'Selecciona un resultado'),
    duracion_horas: z.string().min(1, 'Horas requeridas'),
    duracion_minutos: z.string().min(1, 'Minutos requeridos'),
    duracion_segundos_input: z.string().min(1, 'Segundos requeridos'),
    url_foto_prueba: z.any().optional(),
    notas_llamada: z.string().optional(),
});

const emailSchema = z.object({
    ...baseSchema,
    email_destino: z.string().email('Email inválido'),
    asunto: z.string().min(1, 'Asunto es requerido'),
    estado_envio: z.string().min(1, 'Selecciona estado'),
    url_foto_prueba: z.any().optional(),
});

type ActionType = 'visita' | 'visita_asistida' | 'llamada' | 'correo';

export const ActionForm = () => {
    const { type } = useLocalSearchParams<{ type: ActionType }>();
    const router = useRouter();
    const [showSummary, setShowSummary] = useState(false);
    const [summaryData, setSummaryData] = useState<{ items: SummaryItem[], images: SummaryImage[] }>({ items: [], images: [] });
    const [locating, setLocating] = useState(false);
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loadingData, setLoadingData] = useState(true);
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

    // Mapping between mobile type and backend Enum
    const typeMapping: Record<string, string> = {
        'visita': 'Visita',
        'visita_asistida': 'Visita asistida',
        'llamada': 'Llamada',
        'correo': 'Correo'
    };

    const currentBackendType = typeMapping[type as string] || 'Visita';

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const user = await authService.getMe();
                if (user && user.id_empleado) {
                    const [planesData, clientesData] = await Promise.all([
                        planService.getMisPlanes(user.id_empleado),
                        carteraService.getMisClientes(user.id_empleado)
                    ]);
                    // Filter planes that are 'Aprobado' or at least have details
                    setPlanes(planesData);
                    setClientes(clientesData);
                }
            } catch (error) {
                console.error('Error loading form data:', error);
            } finally {
                setLoadingData(false);
            }
        };
        loadFormData();
    }, []);

    const currentSchema = useMemo(() => {
        if (type === 'visita' || type === 'visita_asistida') return visitaSchema;
        if (type === 'llamada') return llamadaSchema;
        if (type === 'correo') return emailSchema;
        return visitaSchema;
    }, [type]);

    const resolver = useMemo(() => zodResolver(currentSchema), [currentSchema]);

    const { control, handleSubmit, setValue, watch, formState: { errors, isSubmitting, isValid } } = useForm({
        resolver,
        mode: 'onChange',
        defaultValues: {
            id_detalle: '',
            id_plan: '',
            id_cliente: '',
            resultado: '',
            nombre_tecnico: '',
            observaciones: '',
            lat: '',
            lon: '',
            numero_destino: '',
            nombre_destinatario: '',
            duracion_segundos: '0',
            duracion_horas: '0',
            duracion_minutos: '0',
            duracion_segundos_input: '0',
            notas_llamada: '',
            email_destino: '',
            asunto: '',
            estado_envio: 'Enviado',
        }
    });

    // --- REFINED DATA LOGIC (Post-useForm) ---

    // Flatten matching agenda items to only show those for CURRENT day
    const daysInSpanish = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    const currentDaySpanish = daysInSpanish[new Date().getDay()];

    const matchingAgendaItems = planes.flatMap(p =>
        p.detalles_agenda
            .filter(d => d.tipo_actividad === currentBackendType && d.dia_semana === currentDaySpanish && d.estado !== 'Realizado')
            .map(d => ({
                ...d,
                plan_info: p
            }))
    );

    const activeIdDetalle = watch('id_detalle');
    const activeIdPlan = watch('id_plan');

    // Filter clients based on selected plan
    const getFilteredClients = () => {
        if (!activeIdPlan || activeIdPlan === '0') return [];

        const selectedPlan = planes.find(p => p.id_plan.toString() === activeIdPlan);
        if (!selectedPlan) return [];

        const clientsInPlan = selectedPlan.detalles_agenda
            .filter(d => d.tipo_actividad === currentBackendType && d.cliente)
            .map(d => d.cliente!);

        return Array.from(new Map(clientsInPlan.map(c => [c.id_cliente, c])).values());
    };

    const filteredClients = getFilteredClients();

    const title = type?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Acción';

    const onSubmit = async (data: any) => {
        try {
            if (type === 'visita' || type === 'visita_asistida') {
                await visitaService.registrar({
                    id_plan: data.id_plan,
                    id_detalle: data.id_detalle,
                    id_cliente: data.id_cliente,
                    resultado: data.resultado,
                    nombre_tecnico: data.nombre_tecnico,
                    observaciones: data.observaciones,
                    lat: data.lat,
                    lon: data.lon,
                    foto_lugar: data.foto_lugar,
                    foto_sello: data.foto_sello,
                });
            } else if (type === 'llamada') {
                const h = parseInt(data.duracion_horas || '0');
                const m = parseInt(data.duracion_minutos || '0');
                const s = parseInt(data.duracion_segundos_input || '0');
                const totalSeconds = (h * 3600) + (m * 60) + s;

                await crmService.registrarLlamada({
                    id_plan: data.id_plan,
                    id_detalle: data.id_detalle,
                    numero_destino: data.numero_destino,
                    nombre_destinatario: data.nombre_destinatario,
                    duracion_segundos: totalSeconds.toString(),
                    resultado: data.resultado,
                    notas_llamada: data.notas_llamada,
                    foto_prueba: data.url_foto_prueba,
                });
            } else if (type === 'correo') {
                await crmService.registrarEmail({
                    id_plan: data.id_plan,
                    id_detalle: data.id_detalle,
                    email_destino: data.email_destino,
                    asunto: data.asunto,
                    estado_envio: data.estado_envio,
                    foto_prueba: data.url_foto_prueba,
                });
            }
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            const getPlanFicha = () => {
                const item = matchingAgendaItems.find(i => (i.id_detalle || 0).toString() === data.id_detalle);
                return item ? `${item.dia_semana || 'Sin día'} - ${(item.hora_programada || '').substring(0, 5)}` : data.id_detalle;
            };

            const getClientName = () => {
                const client = filteredClients.find(c => c.id_cliente.toString() === data.id_cliente);
                return client?.nombre_cliente || data.nombre_destinatario || data.email_destino || 'N/A';
            };

            let sItems: SummaryItem[] = [{ label: 'Ficha de Plan de Trabajo', value: getPlanFicha() }];
            let sImages: SummaryImage[] = [];

            if (type === 'visita' || type === 'visita_asistida') {
                sItems.push(
                    { label: 'Nombre del Cliente', value: getClientName() },
                    { label: 'Resultado', value: data.resultado },
                    { label: 'Latitud', value: data.lat },
                    { label: 'Longitud', value: data.lon },
                    { label: 'Fecha/Hora Check-in', value: new Date().toLocaleString() },
                    { label: 'Observaciones', value: data.observaciones || 'Ninguna' }
                );
                if (data.foto_lugar) sImages.push({ label: 'Foto del lugar', uri: data.foto_lugar });
                if (data.foto_sello) sImages.push({ label: 'Foto del sello', uri: data.foto_sello });
            } else if (type === 'llamada') {
                const h = parseInt(data.duracion_horas || '0');
                const m = parseInt(data.duracion_minutos || '0');
                const s = parseInt(data.duracion_segundos_input || '0');
                sItems.push(
                    { label: 'Número Destino', value: data.numero_destino },
                    { label: 'Nombre Destinatario', value: getClientName() },
                    { label: 'Duración', value: `${h}h ${m}m ${s}s` },
                    { label: 'Resultado', value: data.resultado },
                    { label: 'Fecha/Hora Registro', value: new Date().toLocaleString() },
                    { label: 'Notas', value: data.notas_llamada || 'Ninguna' }
                );
                if (data.url_foto_prueba) sImages.push({ label: 'Foto de prueba', uri: data.url_foto_prueba });
            } else if (type === 'correo') {
                sItems.push(
                    { label: 'Email Destino', value: data.email_destino },
                    { label: 'Asunto', value: data.asunto },
                    { label: 'Estado de Envío', value: data.estado_envio },
                    { label: 'Fecha/Hora Registro', value: new Date().toLocaleString() }
                );
                if (data.url_foto_prueba) sImages.push({ label: 'Foto de prueba (Captura)', uri: data.url_foto_prueba });
            }

            setSummaryData({ items: sItems, images: sImages });

            setModalConfig({
                visible: true,
                type: 'success',
                title: '¡Registro Exitoso!',
                message: `Se ha registrado la ${title} correctamente en el sistema.`,
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
                title: 'Error de Validación',
                message: message,
                onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
        }
    };

    const getLocation = async () => {
        setLocating(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setModalConfig({
                visible: true,
                type: 'warning' as any,
                title: 'Permiso Denegado',
                message: 'Por favor, permite el acceso al GPS en los ajustes de tu celular para registrar la ubicación.',
                onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
            setLocating(false);
            return;
        }

        try {
            let location = await Location.getCurrentPositionAsync({});
            setValue('lat', location.coords.latitude.toString());
            setValue('lon', location.coords.longitude.toString());
        } catch (e) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setModalConfig({
                visible: true,
                type: 'error',
                title: 'Error de GPS',
                message: 'No pudimos obtener tu ubicación actual. Asegúrate de tener el GPS encendido.',
                onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setLocating(false);
        }
    };

    const pickImage = async (fieldName: any, useCamera: boolean = true) => {
        try {
            let result;

            if (useCamera) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    setModalConfig({
                        visible: true,
                        type: 'warning' as any,
                        title: 'Sin Acceso a Cámara',
                        message: 'Debes conceder permisos de cámara para tomar fotos de evidencia.',
                        onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
                    });
                    return;
                }

                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    allowsEditing: false,
                    quality: 0.5,
                });
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    setModalConfig({
                        visible: true,
                        type: 'warning' as any,
                        title: 'Sin Acceso a Galería',
                        message: 'Debes conceder permisos a tu galería para subir archivos.',
                        onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
                    });
                    return;
                }

                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: false,
                    quality: 0.5,
                });
            }

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const manipResult = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [{ resize: { width: 1080 } }],
                    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                );

                setValue(fieldName, manipResult.uri);
            }
        } catch (error) {
            console.error('Error picking/compressing image:', error);
            setModalConfig({
                visible: true,
                type: 'error',
                title: 'Error de Archivo',
                message: 'No se pudo procesar la imagen seleccionada.',
                onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
        }
    };

    const renderImagePicker = (label: string, fieldName: string) => {
        const imageUri = watch(fieldName as any);
        return (
            <View style={styles.imagePickerContainer}>
                <Text style={styles.fieldLabel}>{label}</Text>

                {imageUri ? (
                    <View style={styles.imagePreviewBox}>
                        <Image source={{ uri: imageUri }} style={styles.previewImage} />
                        <TouchableOpacity
                            style={styles.removeImageBtn}
                            onPress={() => setValue(fieldName as any, undefined)}
                        >
                            <Trash2 size={18} color={Colors.text.inverse} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.imageButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.mediaButton, styles.cameraButton]}
                            onPress={() => pickImage(fieldName, true)}
                            activeOpacity={0.7}
                        >
                            <Camera size={20} color={Colors.primary} />
                            <Text style={styles.mediaButtonText}>Tomar Foto</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.mediaButton, styles.galleryButton]}
                            onPress={() => pickImage(fieldName, false)}
                            activeOpacity={0.7}
                        >
                            <ImageIcon size={20} color={Colors.secondary} />
                            <Text style={styles.mediaButtonText}>Subir Archivo</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Registrar {title}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.formCard}>
                    <Text style={styles.formSubtitle}>Completa la información requerida</Text>

                    {/* COMMON FIELDS */}
                    <Controller
                        control={control}
                        name="id_detalle"
                        render={({ field: { onChange, value } }) => (
                            <Select
                                label="Ficha de Plan de Trabajo"
                                placeholder={loadingData ? "Cargando planes..." : "Selecciona una cita programada"}
                                options={matchingAgendaItems.map(item => ({
                                    label: `${item.dia_semana || 'Sin día'} - ${(item.hora_programada || '').substring(0, 5)}`,
                                    value: (item.id_detalle || 0).toString()
                                }))}
                                value={value}
                                onValueChange={(val) => {
                                    onChange(val);
                                    // Identify the specific agenda item to set plan and client
                                    const item = matchingAgendaItems.find(i => (i.id_detalle || 0).toString() === val);
                                    if (item) {
                                        setValue('id_plan', (item.id_plan || 0).toString());
                                        if (item.id_cliente) {
                                            setValue('id_cliente', item.id_cliente.toString());
                                        }
                                    }
                                }}
                                error={errors.id_detalle?.message as string}
                            />
                        )}
                    />

                    {/* VISITA FIELDS */}
                    {(type === 'visita' || type === 'visita_asistida') && (
                        <>
                            <Controller
                                control={control}
                                name="id_cliente"
                                render={({ field: { onChange, value } }) => (
                                    <Select
                                        label="Cliente Programado"
                                        placeholder={!activeIdPlan || activeIdPlan === '0' ? "Selecciona primero un plan" : "Selecciona cliente"}
                                        options={filteredClients.map(c => ({ label: c.nombre_cliente, value: c.id_cliente.toString() }))}
                                        value={value}
                                        onValueChange={onChange}
                                        error={errors.id_cliente?.message as string}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="resultado"
                                render={({ field: { onChange, value } }) => (
                                    <Select
                                        label="Resultado"
                                        options={[
                                            { label: 'Cliente interesado', value: 'Cliente interesado' },
                                            { label: 'En evaluación', value: 'En evaluación' },
                                            { label: 'Venta cerrada', value: 'Venta cerrada' },
                                            { label: 'No interesado', value: 'No interesado' },
                                        ]}
                                        value={value}
                                        onValueChange={onChange}
                                        error={errors.resultado?.message as string}
                                    />
                                )}
                            />

                            {type === 'visita_asistida' && (
                                <Controller
                                    control={control}
                                    name="nombre_tecnico"
                                    render={({ field: { onChange, value } }) => (
                                        <Input
                                            label="Nombre Técnico (Opcional)"
                                            placeholder="Nombre del técnico"
                                            value={value}
                                            onChangeText={onChange}
                                        />
                                    )}
                                />
                            )}

                            <Controller
                                control={control}
                                name="observaciones"
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        label="Observaciones"
                                        placeholder="Detalles de la visita..."
                                        multiline
                                        numberOfLines={3}
                                        style={styles.textArea}
                                        value={value}
                                        onChangeText={onChange}
                                    />
                                )}
                            />

                            <View style={styles.locationSection}>
                                <Text style={styles.fieldLabel}>Ubicación GPS</Text>
                                <Input
                                    label="Latitud"
                                    placeholder="Presiona botón ubicación"
                                    value={watch('lat')}
                                    editable={false}
                                />
                                <Input
                                    label="Longitud"
                                    placeholder="Presiona botón ubicación"
                                    value={watch('lon')}
                                    editable={false}
                                />
                                <Button
                                    title={locating ? "Obteniendo..." : "Obtener Ubicación"}
                                    onPress={getLocation}
                                    variant="outline"
                                    icon={locating ? <ActivityIndicator size="small" color={Colors.primary} /> : <Navigation size={18} color={Colors.primary} />}
                                    style={styles.locButton}
                                    disabled={locating}
                                />
                            </View>

                            {renderImagePicker('Foto del lugar/Fachada', 'foto_lugar')}
                            {renderImagePicker('Foto del sello/Constancia', 'foto_sello')}
                        </>
                    )}

                    {/* LLAMADA FIELDS */}
                    {type === 'llamada' && (
                        <>
                            <Controller
                                control={control}
                                name="numero_destino"
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        label="Número Destino"
                                        placeholder="987654321"
                                        keyboardType="phone-pad"
                                        maxLength={9}
                                        value={value}
                                        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
                                        error={errors.numero_destino?.message as string}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="nombre_destinatario"
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        label="Nombre Destinatario"
                                        placeholder="Ej. Juan Perez"
                                        value={value}
                                        onChangeText={onChange}
                                        error={errors.nombre_destinatario?.message as string}
                                    />
                                )}
                            />

                            <View style={styles.durationSection}>
                                <Text style={styles.fieldLabel}>Duración de la llamada</Text>
                                <View style={styles.durationRow}>
                                    <View style={styles.durationItem}>
                                        <Controller
                                            control={control}
                                            name="duracion_horas"
                                            render={({ field: { onChange, value } }) => (
                                                <Input
                                                    label="HH"
                                                    placeholder="0"
                                                    keyboardType="numeric"
                                                    value={value}
                                                    onChangeText={onChange}
                                                />
                                            )}
                                        />
                                    </View>
                                    <View style={styles.durationItem}>
                                        <Controller
                                            control={control}
                                            name="duracion_minutos"
                                            render={({ field: { onChange, value } }) => (
                                                <Input
                                                    label="MM"
                                                    placeholder="0"
                                                    keyboardType="numeric"
                                                    value={value}
                                                    onChangeText={(text) => {
                                                        const val = parseInt(text || '0');
                                                        if (val < 60) onChange(text);
                                                    }}
                                                />
                                            )}
                                        />
                                    </View>
                                    <View style={styles.durationItem}>
                                        <Controller
                                            control={control}
                                            name="duracion_segundos_input"
                                            render={({ field: { onChange, value } }) => (
                                                <Input
                                                    label="SS"
                                                    placeholder="0"
                                                    keyboardType="numeric"
                                                    value={value}
                                                    onChangeText={(text) => {
                                                        const val = parseInt(text || '0');
                                                        if (val < 60) onChange(text);
                                                    }}
                                                />
                                            )}
                                        />
                                    </View>
                                </View>
                            </View>

                            <Controller
                                control={control}
                                name="resultado"
                                render={({ field: { onChange, value } }) => (
                                    <Select
                                        label="Resultado"
                                        options={[
                                            { label: 'Contestó', value: 'Contestó' },
                                            { label: 'No Contestó', value: 'No Contestó' },
                                            { label: 'Buzón', value: 'Buzón' },
                                            { label: 'Venta Cerrada', value: 'Venta Cerrada' },
                                            { label: 'Interesado', value: 'Interesado' },
                                            { label: 'Rechazado', value: 'Rechazado' },
                                        ]}
                                        value={value}
                                        onValueChange={onChange}
                                        error={errors.resultado?.message as string}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="notas_llamada"
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        label="Notas de Llamada"
                                        placeholder="Detalles de la conversación..."
                                        multiline
                                        numberOfLines={3}
                                        style={styles.textArea}
                                        value={value}
                                        onChangeText={onChange}
                                    />
                                )}
                            />

                            {renderImagePicker('Foto de prueba', 'url_foto_prueba')}
                        </>
                    )}

                    {/* EMAIL FIELDS */}
                    {type === 'correo' && (
                        <>
                            <Controller
                                control={control}
                                name="email_destino"
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        label="Email Destino"
                                        placeholder="cliente@ejemplo.com"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={value}
                                        onChangeText={onChange}
                                        error={errors.email_destino?.message as string}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="asunto"
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        label="Asunto"
                                        placeholder="Propuesta Comercial"
                                        value={value}
                                        onChangeText={onChange}
                                        error={errors.asunto?.message as string}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="estado_envio"
                                render={({ field: { onChange, value } }) => (
                                    <Select
                                        label="Estado Envío"
                                        options={[
                                            { label: 'Borrador', value: 'Borrador' },
                                            { label: 'Enviado', value: 'Enviado' },
                                            { label: 'No enviado', value: 'No enviado' },
                                        ]}
                                        value={value}
                                        onValueChange={onChange}
                                        error={errors.estado_envio?.message as string}
                                    />
                                )}
                            />

                            {renderImagePicker('Foto de prueba (Captura)', 'url_foto_prueba')}
                        </>
                    )}

                    <Button
                        title="Guardar Registro"
                        onPress={() => {
                            if (!isValid) {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                setModalConfig({
                                    visible: true,
                                    type: 'warning',
                                    title: 'Incompleto',
                                    message: 'Por favor, completa todos los campos requeridos antes de guardar.',
                                    onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
                                });
                            } else {
                                handleSubmit(onSubmit)();
                            }
                        }}
                        loading={isSubmitting}
                        style={StyleSheet.flatten([styles.submitButton, !isValid ? styles.disabledBtn : {}])}
                        icon={<Save size={20} color={Colors.text.inverse} />}
                    />
                </View>
            </ScrollView>

            <StatusModal
                visible={modalConfig.visible}
                type={modalConfig.type as any}
                title={modalConfig.title}
                message={modalConfig.message}
                onClose={modalConfig.onClose}
                onAction={modalConfig.onAction}
                actionLabel={modalConfig.type === 'success' ? 'Ver resumen' : 'Intentar de nuevo'}
            />

            <SummaryModal
                visible={showSummary}
                title={`Resumen - ${title}`}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 60,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.surface,
        ...Shadow.soft,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text.primary,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 40,
    },
    formCard: {
        backgroundColor: Colors.surface,
        borderRadius: 24,
        padding: Spacing.xl,
        ...Shadow.soft,
    },
    formSubtitle: {
        fontSize: 14,
        color: Colors.text.secondary,
        marginBottom: Spacing.xl,
    },
    textArea: {
        textAlignVertical: 'top',
    },
    submitButton: {
        marginTop: Spacing.xl,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    locationSection: {
        marginBottom: Spacing.md,
    },
    locationRow: {
        flexDirection: 'row',
        marginBottom: Spacing.sm,
    },
    locField: {
        flex: 1,
        marginRight: Spacing.xs,
    },
    locButton: {
        height: 48,
    },
    imagePickerContainer: {
        marginBottom: Spacing.md,
    },
    imageButtonsContainer: {
        gap: Spacing.sm,
    },
    mediaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 54,
        borderRadius: BorderRadius.md,
        borderWidth: 1.5,
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.md,
    },
    cameraButton: {
        borderColor: Colors.primary,
        backgroundColor: '#EEF2FF',
    },
    galleryButton: {
        borderColor: Colors.secondary,
        backgroundColor: '#ECFEFF',
    },
    durationSection: {
        marginBottom: Spacing.md,
    },
    durationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Spacing.sm,
    },
    durationItem: {
        flex: 1,
    },
    disabledBtn: {
        opacity: 0.6,
        backgroundColor: Colors.text.muted,
    },
    mediaButtonText: {
        marginLeft: Spacing.sm,
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    imagePreviewBox: {
        width: '100%',
        height: 200,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Shadow.soft,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.medium,
    },
});
