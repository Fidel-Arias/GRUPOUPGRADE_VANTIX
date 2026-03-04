import { CheckCircle2, X } from 'lucide-react-native';
import React from 'react';
import {
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, Shadow, Spacing } from '../../constants/theme';

export interface SummaryItem {
    label: string;
    value: string | undefined;
}

export interface SummaryImage {
    label: string;
    uri: string;
}

interface SummaryModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    items: SummaryItem[];
    images?: SummaryImage[];
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
    visible,
    onClose,
    title,
    subtitle = "Resumen de lo enviado",
    items,
    images = []
}) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.subtitle}>{subtitle}</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X size={24} color={Colors.text.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.successHeader}>
                        <CheckCircle2 size={56} color={Colors.success} style={{ marginBottom: Spacing.sm }} />
                        <Text style={styles.successText}>¡Resumen del Envío!</Text>
                    </View>

                    <View style={styles.card}>
                        {items.map((item, idx) => (
                            <View key={idx} style={[styles.itemRow, idx === items.length - 1 && styles.lastItemRow]}>
                                <Text style={styles.itemLabel}>{item.label}</Text>
                                <Text style={styles.itemValue}>{item.value || '-'}</Text>
                            </View>
                        ))}
                    </View>

                    {images.length > 0 && (
                        <View style={styles.imagesContainer}>
                            <Text style={styles.imagesTitle}>Fotos Enviadas</Text>
                            {images.map((img, idx) => (
                                <View key={idx} style={styles.imageCard}>
                                    <View style={styles.imageWrapper}>
                                        <Image source={{ uri: img.uri }} style={styles.image} resizeMode="cover" />
                                    </View>
                                    <Text style={styles.imageLabel}>{img.label}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
                        <Text style={styles.doneBtnText}>Finalizar y Volver</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </Modal>
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
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.OS === 'ios' ? 60 : Spacing.xl,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text.primary,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    closeBtn: {
        padding: Spacing.xs,
        backgroundColor: '#F1F5F9',
        borderRadius: BorderRadius.full,
    },
    content: {
        padding: Spacing.xl,
        paddingBottom: Spacing.xxl * 2,
    },
    successHeader: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    successText: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.success,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        ...Shadow.soft,
        marginBottom: Spacing.xl,
    },
    itemRow: {
        flexDirection: 'column',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    lastItemRow: {
        borderBottomWidth: 0,
    },
    itemLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text.secondary,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    itemValue: {
        fontSize: 16,
        color: Colors.text.primary,
        fontWeight: '500',
    },
    imagesContainer: {
        marginBottom: Spacing.xl,
    },
    imagesTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: Spacing.md,
    },
    imageCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.sm,
        marginBottom: Spacing.md,
        ...Shadow.soft,
    },
    imageWrapper: {
        width: '100%',
        height: 200,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        backgroundColor: '#F1F5F9',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
    doneBtn: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.medium,
        marginTop: Spacing.md,
    },
    doneBtnText: {
        color: Colors.text.inverse,
        fontSize: 16,
        fontWeight: '700',
    },
});
