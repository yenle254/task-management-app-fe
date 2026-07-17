import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ChevronLeft from '../../../assets/icons/chevron_left.svg';
import ChevronRight from '../../../assets/icons/chevron_right.svg';

const CalendarModal = ({ 
  visible, 
  onClose, 
  onSelectDate,
  initialDate = null,
  minDate = null,
  maxDate = null,
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (initialDate) return new Date(initialDate);
    return new Date();
  });
  
  const [selectedDate, setSelectedDate] = useState(() => {
    if (initialDate) return new Date(initialDate);
    return new Date();
  });

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.toDateString() === d2.toDateString();
  };

  const isDateDisabled = (date) => {
    if (!date) return false;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleConfirm = () => {
    if (selectedDate) {
      const formatted = selectedDate.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
      onSelectDate(formatted);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Date</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={prevMonth}>
              <ChevronLeft width={24} height={24} />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={nextMonth}>
              <ChevronRight width={24} height={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          <ScrollView style={styles.scrollView}>
            <View style={styles.calendarGrid}>
              {getDaysInMonth(currentMonth).map((day, idx) => {
                const disabled = isDateDisabled(day);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.calendarDay, !day && styles.emptyDay]}
                    onPress={() => day && !disabled && setSelectedDate(day)}
                    disabled={!day || disabled}
                  >
                    {day && (
                      <View style={[
                        styles.dayCircle,
                        isSameDay(day, selectedDate) && styles.selectedDay,
                        disabled && styles.disabledDay,
                      ]}>
                        <Text style={[
                          styles.calendarDayText,
                          isSameDay(day, selectedDate) && styles.selectedDayText,
                          disabled && styles.disabledDayText,
                        ]}>
                          {day.getDate()}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity 
              style={[styles.button, styles.buttonClose]} 
              onPress={onClose}
            >
              <Text style={styles.buttonTextClose}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.buttonConfirm]} 
              onPress={handleConfirm}
            >
              <Text style={styles.buttonTextConfirm}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginTop: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  weekDays: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  scrollView: {
    maxHeight: 350,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  emptyDay: {
    backgroundColor: 'transparent',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDay: {
    backgroundColor: '#6C5CE7',
  },
  disabledDay: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  disabledDayText: {
    color: '#999999',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonClose: {
    backgroundColor: '#F5F5F5',
  },
  buttonConfirm: {
    backgroundColor: '#6C5CE7',
  },
  buttonTextClose: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  buttonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CalendarModal;