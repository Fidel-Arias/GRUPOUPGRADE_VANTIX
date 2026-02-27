import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
    ViewStyle
} from 'react-native';
import { BorderRadius, Colors, Spacing } from '../../constants/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    containerStyle,
    icon,
    rightIcon,
    ...props
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[
                styles.inputContainer,
                props.multiline ? styles.inputContainerMultiline : {},
                error ? styles.inputError : {}
            ]}>
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <TextInput
                    style={[
                        styles.input,
                        props.multiline ? styles.inputMultiline : {}
                    ]}
                    placeholderTextColor={Colors.text.muted}
                    textAlignVertical={props.multiline ? 'top' : 'center'}
                    {...props}
                />
                {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
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
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: BorderRadius.md,
        height: 56,
        paddingHorizontal: Spacing.md,
    },
    inputContainerMultiline: {
        height: undefined,
        minHeight: 100,
        alignItems: 'flex-start',
        paddingVertical: Spacing.sm,
    },
    inputError: {
        borderColor: Colors.error,
    },
    iconContainer: {
        marginRight: Spacing.sm,
        marginTop: Spacing.xs,
    },
    input: {
        flex: 1,
        height: '100%',
        color: Colors.text.primary,
        fontSize: 16,
    },
    inputMultiline: {
        height: '100%',
        minHeight: 80,
    },
    rightIconContainer: {
        marginLeft: Spacing.sm,
    },
    errorText: {
        color: Colors.error,
        fontSize: 12,
        marginTop: Spacing.xs,
        marginLeft: Spacing.xs,
    },
});
