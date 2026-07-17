import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Colors from '../../styles/color';

const LabeledTextInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  Icon,
  iconProps = { width: 20, height: 20 },
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  ...rest
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        {Icon && <Icon {...iconProps} style={styles.icon} />}
        <TextInput
          style={[
            styles.textInput,
            multiline && styles.multiline,
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#999999ae"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...rest}
        />
      </View>
    </View>
  );
};

export default LabeledTextInput;

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 16,
    minHeight: 50,
  },
  icon: {
    marginRight: 12,
    tintColor: Colors.primary || '#6B4EFF',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
    paddingVertical: 14,
  },
  multiline: {
    paddingTop: 16,
    paddingBottom: 16,
    minHeight: 100,
  },
});