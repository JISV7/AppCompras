import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, interpolate, Extrapolation, SharedValue, LinearTransition } from 'react-native-reanimated';

interface SwipeableRowProps {
    children: React.ReactNode;
    onDelete: () => void;
    onUndo?: () => void;
    height?: number;
    bottomMargin?: number;
}

export function SwipeableRow({ children, onDelete, onUndo, height = 80, bottomMargin = 0 }: SwipeableRowProps) {
    const [isDeleted, setIsDeleted] = useState(false);
    const [timerLeft, setTimerLeft] = useState(5);
    // The ref type for ReanimatedSwipeable matches the old one mostly in terms of close()
    const swipeableRef = useRef<any>(null);
    const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        return () => {
            // Cleanup timer on unmount
            if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const renderRightActions = (
        progress: SharedValue<number>,
        drag: SharedValue<number>
    ) => {
        const style = useAnimatedStyle(() => {
            const scale = interpolate(
                drag.value,
                [-100, 0],
                [1, 0],
                Extrapolation.CLAMP
            );
            return {
                transform: [{ scale }],
            };
        });

        return (
            <View style={[styles.rightAction, { marginBottom: bottomMargin }]}>
                <Animated.View style={[styles.actionIcon, style]}>
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
            <Animated.View
                layout={LinearTransition}
                style={[styles.undoContainer, { height, marginBottom: bottomMargin > 0 ? bottomMargin : 10 }]}
            >
                <Text style={styles.undoText}>Deleted. Undo in {timerLeft}s</Text>
                <TouchableOpacity onPress={handleUndo} style={styles.undoBtn}>
                    <Text style={styles.undoBtnText}>UNDO</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        <ReanimatedSwipeable
            ref={swipeableRef}
            friction={2}
            enableTrackpadTwoFingerGesture
            rightThreshold={40}
            overshootRight={false}
            renderRightActions={renderRightActions}
            onSwipeableOpen={() => handleDelete()}
        >
            {children}
        </ReanimatedSwipeable>
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
