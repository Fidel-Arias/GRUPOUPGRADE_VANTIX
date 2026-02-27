import { ChevronDown, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { BorderRadius, Colors, Spacing } from '../../constants/theme';

interface Option {
    label: string;
    value: string;
}

interface SelectProps {
    label: string;
    options: Option[];
    value: string;
    onValueChange: (value: string) => void;
    error?: string;
    placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
    label,
    options,
    value,
    onValueChange,
    error,
    placeholder = 'Seleccionar opción'
}) => {
    const [visible, setVisible] = useState(false);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TouchableOpacity
                style={[styles.inputContainer, error ? styles.inputError : {}]}
                onPress={() => setVisible(true)}
                activeOpacity={0.7}
            >
                <Text style={[styles.valueText, !selectedOption && styles.placeholderText]}>
                    {selectedOption ? selectedOption.label : placeholder}
                </Text>
                <ChevronDown size={20} color={Colors.text.muted} />
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}

            <Modal visible={visible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            <TouchableOpacity onPress={() => setVisible(false)} p-1>
                                <X size={24} color={Colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.optionItem,
                                        item.value === value && styles.optionItemSelected
                                    ]}
                                    onPress={() => {
                                        onValueChange(item.value);
                                        setVisible(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.optionLabel,
                                        item.value === value && styles.optionLabelSelected
                                    ]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.listContent}
                        />
                    </SafeAreaView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: Spacing.xs,
        marginLeft: Spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: BorderRadius.md,
        height: 56,
        paddingHorizontal: Spacing.md,
    },
    inputError: {
        borderColor: Colors.error,
    },
    valueText: {
        fontSize: 16,
        color: Colors.text.primary,
    },
    placeholderText: {
        color: Colors.text.muted,
    },
    errorText: {
        color: Colors.error,
        fontSize: 12,
        marginTop: Spacing.xs,
        marginLeft: Spacing.xs,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    optionItem: {
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    optionItemSelected: {
        backgroundColor: '#EEF2FF',
    },
    optionLabel: {
        fontSize: 16,
        color: Colors.text.primary,
    },
    optionLabelSelected: {
        color: Colors.primary,
        fontWeight: '700',
    },
    listContent: {
        paddingBottom: Spacing.xxl,
    },
});
