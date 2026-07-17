import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ChevronDown from '../../../assets/icons/chevron_down.svg';
import Colors from '../../styles/color';

const SelectInputField = ({
  label,
  value,
  placeholder = 'Select an option',
  onPress,
  Icon,
  iconProps = { width: 20, height: 20 },
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={onPress} style={styles.selector}>
        <View style={styles.selectorLeft}>
          {Icon && <Icon {...iconProps} />}
          <Text style={[styles.selectorText, !value && styles.placeholderText]}>
            {value || placeholder}
          </Text>
        </View>
        <ChevronDown width={20} height={20} />
      </Pressable>
    </View>
  );
};

export default SelectInputField;

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