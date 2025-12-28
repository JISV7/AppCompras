import React, { useRef, useState, useEffect } from 'react';
import { Animated, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';

interface SwipeableRowProps {
    children: React.ReactNode;
    onDelete: () => void;
    onUndo?: () => void; // Optional callback if parent needs to know undo happened
    height?: number; // Estimated height for animation
}

export function SwipeableRow({ children, onDelete, onUndo, height = 80, bottomMargin = 0 }: SwipeableRowProps & { bottomMargin?: number }) {
    const [isDeleted, setIsDeleted] = useState(false);
    const [timerLeft, setTimerLeft] = useState(5);
    const swipeableRef = useRef<Swipeable>(null);
    const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Theme colors
    const deleteColor = '#EF5350'; // Red
    const undoColor = '#424242'; // Dark Grey for undo bar

    useEffect(() => {
        return () => {
            // Cleanup timer on unmount
            if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const renderRightActions = (
        progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const scale = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        });

        return (
            <View style={[styles.rightAction, { marginBottom: bottomMargin }]}>
                <Animated.View style={[styles.actionIcon, { transform: [{ scale }] }]}>
                    <Ionicons name="trash" size={30} color="white" />
                    <Text style={styles.actionText}>Delete</Text>
                </Animated.View>
            </View>
        );
    };

    const handleDelete = () => {
        setIsDeleted(true);
        swipeableRef.current?.close();

        // Start Undo Timer
        setTimerLeft(5);

        // Clear any existing interval just in case
        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            setTimerLeft((prev) => prev - 1);
        }, 1000);

        deleteTimerRef.current = setTimeout(() => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            // Actually execute delete
            onDelete();
        }, 5000);
    };

    const handleUndo = () => {
        if (deleteTimerRef.current) {
            clearTimeout(deleteTimerRef.current);
            deleteTimerRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsDeleted(false);
        if (onUndo) onUndo();
    };

    if (isDeleted) {
        return (
            <View style={[styles.undoContainer, { height, marginBottom: bottomMargin > 0 ? bottomMargin : 10 }]}>
                <Text style={styles.undoText}>Deleted. Undo in {timerLeft}s</Text>
                <TouchableOpacity onPress={handleUndo} style={styles.undoBtn}>
                    <Text style={styles.undoBtnText}>UNDO</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <Swipeable
            ref={swipeableRef}
            friction={2}
            enableTrackpadTwoFingerGesture
            rightThreshold={40}
            renderRightActions={renderRightActions}
            onSwipeableRightOpen={handleDelete}
        >
            {children}
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    rightAction: {
        backgroundColor: '#EF5350',
        justifyContent: 'center',
        alignItems: 'flex-end',
        flex: 1,
        borderRadius: 12,
        marginTop: 0,
        // marginBottom is handled via style prop
    },
    actionIcon: {
        width: 80, // Width of the delete area
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 4,
    },

    // Undo State
    undoContainer: {
        backgroundColor: '#333',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        // marginBottom is handled via style prop (defaults to 10 if not provided or provided as 0, logic above handles it)
        width: '100%',
    },
    undoText: {
        color: 'white',
        fontWeight: '500',
    },
    undoBtn: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    undoBtnText: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 12
    }
});
