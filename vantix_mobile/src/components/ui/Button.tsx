import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle
} from 'react-native';
import { BorderRadius, Colors, Shadow, Spacing } from '../../constants/theme';

interface ButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    onPress,
    title,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon,
}) => {
    const getVariantStyle = () => {
        switch (variant) {
            case 'secondary': return styles.secondary;
            case 'outline': return styles.outline;
            case 'ghost': return styles.ghost;
            default: return styles.primary;
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'outline': return styles.textOutline;
            case 'ghost': return styles.textGhost;
            default: return styles.textPrimary;
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[styles.base, getVariantStyle(), style, (disabled || loading) && styles.disabled]}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.text.inverse} />
            ) : (
                <>
                    {icon && <React.Fragment>{icon}</React.Fragment>}
                    <Text style={[getTextStyle(), textStyle, icon ? { marginLeft: Spacing.sm } : {}]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        height: 56,
        borderRadius: BorderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
        ...Shadow.soft,
    },
    primary: {
        backgroundColor: Colors.primary,
    },
    secondary: {
        backgroundColor: Colors.secondary,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: Colors.primary,
        shadowOpacity: 0,
    },
    ghost: {
        backgroundColor: 'transparent',
        shadowOpacity: 0,
    },
    textPrimary: {
        color: Colors.text.inverse,
        fontSize: 16,
        fontWeight: '700',
    },
    textOutline: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: '700',
    },
    textGhost: {
        color: Colors.text.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    disabled: {
        opacity: 0.6,
    },
});
