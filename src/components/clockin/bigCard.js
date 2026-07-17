import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Colors from '../../styles/color'
import SmallCard from './smallCard'

const BigCard = ({day, totalHours, inOutTime, status, autoClockOut, isIncomplete}) => {
    const isAbsent = status === 'absent';
    
    return (
        <View style={[styles.container, isAbsent && styles.absentContainer]}>
            <View style={styles.header}>
                <Text style={styles.dayText}>{day}</Text>
                <View style={styles.badges}>
                    {autoClockOut && (
                        <View style={styles.warningBadge}>
                            <Text style={styles.warningText}>Auto</Text>
                        </View>
                    )}
                    {isIncomplete && (
                        <View style={styles.incompleteBadge}>
                            <Text style={styles.incompleteText}>Incomplete</Text>
                        </View>
                    )}
                    {status && (
                        <View style={[
                            styles.statusBadge,
                            status === 'present' && styles.presentBadge,
                            status === 'late' && styles.lateBadge,
                            status === 'absent' && styles.absentBadge
                        ]}>
                            <Text style={[
                                styles.statusText,
                                status === 'present' && styles.presentText,
                                status === 'late' && styles.lateText,
                                status === 'absent' && styles.absentText
                            ]}>
                                {status === 'present' ? 'On Time' : status === 'late' ? 'Late' : 'Absent'}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
            <SmallCard totalHours={totalHours} inOutTime={inOutTime} isAbsent={isAbsent}/>            
        </View>
    )
}

export default BigCard

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
    },
    absentContainer: {
        backgroundColor: '#F5F5F5',
        opacity: 0.85,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dayText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        flex: 1,
    },
    badges: {
        flexDirection: 'row',
        gap: 6,
    },
    warningBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#FFF9C4',
    },
    warningText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#F57C00',
    },
    incompleteBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#FFE0B2',
    },
    incompleteText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#E65100',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    presentBadge: {
        backgroundColor: '#E8F5E9',
    },
    lateBadge: {
        backgroundColor: '#FFF3E0',
    },
    absentBadge: {
        backgroundColor: '#FFEBEE',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    presentText: {
        color: '#4CAF50',
    },
    lateText: {
        color: '#FF9800',
    },
    absentText: {
        color: '#F44336',
    },
})
