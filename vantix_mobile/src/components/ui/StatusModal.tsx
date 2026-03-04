import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react-native';
import React from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, Shadow, Spacing } from '../../constants/theme';

interface StatusModalProps {
    visible: boolean;
    onClose: () => void;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}

const { width } = Dimensions.get('window');

export const StatusModal: React.FC<StatusModalProps> = ({
    visible,
    onClose,
    type,
    title,
    message,
    actionLabel = 'Continuar',
    onAction,
}) => {
    const [animation] = React.useState(new Animated.Value(0));

    React.useEffect(() => {
        if (visible) {
            Animated.spring(animation, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }).start();
        } else {
            animation.setValue(0);
        }
    }, [visible]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle2 size={60} color={Colors.success} />;
            case 'error':
                return <XCircle size={60} color={Colors.error} />;
            case 'warning':
                return <AlertCircle size={60} color={Colors.primary} />;
        }
    };

    const handleAction = () => {
        if (onAction) {
            onAction();
        } else {
            onClose();
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        {
                            transform: [
                                {
                                    scale: animation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.8, 1],
                                    }),
                                },
                            ],
                            opacity: animation,
                        },
                    ]}
                >
                    <View style={styles.content}>
                        <View style={[styles.iconContainer, styles[`${type}Bg`]]}>
                            {getIcon()}
                        </View>

                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>

                        <TouchableOpacity
                            style={[styles.button, styles[`${type}Btn`]]}
                            onPress={handleAction}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>{actionLabel}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    container: {
        width: width * 0.85,
        backgroundColor: Colors.surface,
        borderRadius: 30,
        ...Shadow.medium,
        overflow: 'hidden',
    },
    content: {
        padding: Spacing.xl * 1.5,
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    successBg: {
        backgroundColor: '#ECFDF5',
    },
    errorBg: {
        backgroundColor: '#FEF2F2',
    },
    warningBg: {
        backgroundColor: '#EFF6FF',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text.primary,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginBottom: Spacing.xl * 1.5,
        lineHeight: 22,
    },
    button: {
        width: '100%',
        height: 56,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.medium,
    },
    successBtn: {
        backgroundColor: Colors.success,
    },
    errorBtn: {
        backgroundColor: Colors.error,
    },
    warningBtn: {
        backgroundColor: Colors.primary,
    },
    buttonText: {
        color: Colors.text.inverse,
        fontSize: 16,
        fontWeight: '700',
    },
});
