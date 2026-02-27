import { zodResolver } from '@hookform/resolvers/zod';
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
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Alert,
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
import { BorderRadius, Colors, Shadow, Spacing } from '../../constants/theme';

// --- SCHEMAS ---

const baseSchema = {
    id_plan: z.string().min(1, 'ID Plan es requerido'),
};

const visitaSchema = z.object({
    ...baseSchema,
    id_cliente: z.string().min(1, 'ID Cliente es requerido'),
    resultado: z.enum(['Cliente interesado', 'En evaluacion', 'Venta Cerrada', 'No interesado']),
    nombre_tecnico: z.string().optional(),
    observaciones: z.string().optional(),
    lat: z.string().optional(),
    lon: z.string().optional(),
    foto_lugar: z.any().optional(),
    foto_sello: z.any().optional(),
});

const llamadaSchema = z.object({
    ...baseSchema,
    numero_destino: z.string().min(7, 'Número de destino es requerido'),
    nombre_destinatario: z.string().min(1, 'Nombre es requerido'),
    duracion_segundos: z.string().default('0'),
    resultado: z.enum(['Cliente interesado', 'En evaluacion', 'Venta Cerrada', 'No interesado']),
    url_foto_prueba: z.any().optional(),
    notas_llamada: z.string().optional(),
});

const emailSchema = z.object({
    ...baseSchema,
    email_destino: z.string().email('Email inválido'),
    asunto: z.string().min(1, 'Asunto es requerido'),
    estado_envio: z.enum(['Borrador', 'Enviado', 'No enviado']),
    url_foto_prueba: z.any().optional(),
});

type ActionType = 'visita' | 'visita_asistida' | 'llamada' | 'correo';

export const ActionForm = () => {
    const { type } = useLocalSearchParams<{ type: ActionType }>();
    const router = useRouter();
    const [locating, setLocating] = useState(false);
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loadingData, setLoadingData] = useState(true);

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

    const getSchema = () => {
        if (type === 'visita' || type === 'visita_asistida') return visitaSchema;
        if (type === 'llamada') return llamadaSchema;
        if (type === 'correo') return emailSchema;
        return visitaSchema; // fallback
    };

    const { control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(getSchema()),
        defaultValues: {
            id_plan: '0',
            id_cliente: '0',
            resultado: 'Cliente interesado',
            nombre_tecnico: '',
            observaciones: '',
            lat: '',
            lon: '',
            numero_destino: '',
            nombre_destinatario: '',
            duracion_segundos: '0',
            notas_llamada: '',
            email_destino: '',
            asunto: '',
            estado_envio: 'Enviado',
        }
    });

    // --- REFINED DATA LOGIC (Post-useForm) ---

    // Flatten matching agenda items
    const matchingAgendaItems = planes.flatMap(p =>
        p.detalles_agenda
            .filter(d => d.tipo_actividad === currentBackendType)
            .map(d => ({
                ...d,
                plan_info: p
            }))
    );

    const activeIdPlan = watch('id_plan');

    // Filter clients based on selected plan or show all plan clients
    const getFilteredClients = () => {
        if (!activeIdPlan || activeIdPlan === '0') return [];

        // Find the selected plan
        const selectedPlan = planes.find(p => p.id_plan.toString() === activeIdPlan);
        if (!selectedPlan) return [];

        // Identify which clients are in that specific plan for the current activity type
        const clientsInPlan = selectedPlan.detalles_agenda
            .filter(d => d.tipo_actividad === currentBackendType && d.cliente)
            .map(d => d.cliente!);

        // Deduplicate
        return Array.from(new Map(clientsInPlan.map(c => [c.id_cliente, c])).values());
    };

    const filteredClients = getFilteredClients();

    const title = type?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Acción';

    const onSubmit = async (data: any) => {
        try {
            if (type === 'visita' || type === 'visita_asistida') {
                await visitaService.registrar({
                    id_plan: data.id_plan,
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
                await crmService.registrarLlamada({
                    id_plan: data.id_plan,
                    numero_destino: data.numero_destino,
                    nombre_destinatario: data.nombre_destinatario,
                    duracion_segundos: data.duracion_segundos,
                    resultado: data.resultado,
                    notas_llamada: data.notas_llamada,
                    foto_prueba: data.url_foto_prueba,
                });
            } else if (type === 'correo') {
                await crmService.registrarEmail({
                    id_plan: data.id_plan,
                    email_destino: data.email_destino,
                    asunto: data.asunto,
                    estado_envio: data.estado_envio,
                    foto_prueba: data.url_foto_prueba,
                });
            }

            Alert.alert(
                "Registro Exitoso",
                `Se ha registrado la ${title} correctamente.`,
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (error: any) {
            console.error('Error al registrar:', error);
            const message = error.response?.data?.detail || "Ocurrió un error al procesar el registro.";
            Alert.alert("Error", message);
        }
    };

    const getLocation = async () => {
        setLocating(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Permite el acceso al GPS para obtener la ubicación.');
            setLocating(false);
            return;
        }

        try {
            let location = await Location.getCurrentPositionAsync({});
            setValue('lat', location.coords.latitude.toString());
            setValue('lon', location.coords.longitude.toString());
        } catch (e) {
            Alert.alert('Error', 'No se pudo obtener la ubicación.');
        } finally {
            setLocating(false);
        }
    };

    const pickImage = async (fieldName: any, useCamera: boolean = true) => {
        if (useCamera) {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Se requiere permiso de cámara.');
                return;
            }

            let result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
            });

            if (!result.canceled) {
                setValue(fieldName, result.assets[0].uri);
            }
        } else {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Se requiere permiso de galería.');
                return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
            });

            if (!result.canceled) {
                setValue(fieldName, result.assets[0].uri);
            }
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
                        name="id_plan"
                        render={({ field: { onChange, value } }) => (
                            <Select
                                label="Ficha de Plan de Trabajo"
                                placeholder={loadingData ? "Cargando planes..." : "Selecciona una cita programada"}
                                options={matchingAgendaItems.map(item => ({
                                    label: `${item.dia_semana} - ${item.hora_programada.substring(0, 5)}`,
                                    value: item.id_plan.toString()
                                }))}
                                value={value}
                                onValueChange={(val) => {
                                    onChange(val);
                                    // Auto-select client if there's only one for this slot? 
                                    // Or let user choose from filtered list.
                                    const item = matchingAgendaItems.find(i => i.id_plan.toString() === val);
                                    if (item && item.id_cliente) {
                                        setValue('id_cliente', item.id_cliente.toString());
                                    }
                                }}
                                error={errors.id_plan?.message as string}
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
                                            { label: 'En evaluación', value: 'En evaluacion' },
                                            { label: 'Venta Cerrada', value: 'Venta Cerrada' },
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
                                        value={value}
                                        onChangeText={onChange}
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

                            <Controller
                                control={control}
                                name="duracion_segundos"
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        label="Duración (Segundos)"
                                        placeholder="60"
                                        keyboardType="numeric"
                                        value={value}
                                        onChangeText={onChange}
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
                                            { label: 'En evaluación', value: 'En evaluacion' },
                                            { label: 'Venta Cerrada', value: 'Venta Cerrada' },
                                            { label: 'No interesado', value: 'No interesado' },
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
                        onPress={handleSubmit(onSubmit)}
                        loading={isSubmitting}
                        style={styles.submitButton}
                        icon={<Save size={20} color={Colors.text.inverse} />}
                    />
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
