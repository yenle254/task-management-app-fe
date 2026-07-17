import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Calendar from '../../../assets/icons/calendar-2.svg';
import ChevronDown from '../../../assets/icons/chevron_down.svg';
import Colors from '../../styles/color';

const DateInputField = ({
  label,
  value,
  placeholder = 'Select date',
  onPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={onPress} style={styles.selector}>
        <View style={styles.selectorLeft}>
          <Calendar width={20} height={20} />
          <Text style={[styles.selectorText, !value && styles.placeholderText]}>
            {value || placeholder}
          </Text>
        </View>
        <ChevronDown width={20} height={20} />
      </Pressable>
    </View>
  );
};

export default DateInputField;

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  selector: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  selectorText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
    flex: 1,
  },
  placeholderText: {
    color: '#999999',
    fontWeight: '400',
  },
});