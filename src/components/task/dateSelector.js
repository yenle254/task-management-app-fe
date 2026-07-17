import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import CalendarIcon from '../../../assets/icons/calendar-2.svg';
import ChevronDown from '../../../assets/icons/chevron_down.svg';

const DateSelector = ({ 
  label, 
  value, 
  onPress, 
  placeholder = 'Select date',
  disabled = false,
  error = null,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity 
        style={[
          styles.selector,
          error && styles.selectorError,
          disabled && styles.selectorDisabled,
        ]} 
        onPress={onPress}
        disabled={disabled}
      >
        <View style={styles.selectorLeft}>
          <CalendarIcon width={20} height={20} />
          <Text style={[styles.selectorText, !value && styles.placeholderText]}>
            {value || placeholder}
          </Text>
        </View>
        <ChevronDown width={20} height={20} />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    marginBottom: 20 
  },
  label: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#000000', 
    marginBottom: 8 
  },
  selector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  selectorError: {
    borderColor: '#FF3B30',
  },
  selectorDisabled: {
    opacity: 0.5,
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
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    marginLeft: 4,
  },
});

export default DateSelector;