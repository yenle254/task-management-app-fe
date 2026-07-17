import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import Category from '../../../assets/icons/category.svg';

const FormInput = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder,
  icon: Icon,
  multiline = false,
  numberOfLines = 1,
  error = null,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {multiline ? (
        <TextInput
          style={[
            styles.textArea,
            error && styles.inputError,
            disabled && styles.inputDisabled,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#999999"
          value={value}
          onChangeText={onChangeText}
          multiline
          numberOfLines={numberOfLines}
          textAlignVertical="top"
          editable={!disabled}
        />
      ) : (
        <View style={[
          styles.inputWrapper,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}>
          {Icon && <Icon width={20} height={20} style={styles.icon} />}
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#999999"
            value={value}
            onChangeText={onChangeText}
            editable={!disabled}
          />
        </View>
      )}
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const TaskFormFields = ({ 
  taskTitle,
  taskDescription,
  onTitleChange,
  onDescriptionChange,
  titleError,
  descriptionError,
  disabled = false,
}) => {
  return (
    <>
      <FormInput
        label="Task Title"
        value={taskTitle}
        onChangeText={onTitleChange}
        placeholder="Enter task title"
        icon={Category}
        error={titleError}
        disabled={disabled}
      />
      
      <FormInput
        label="Task Description"
        value={taskDescription}
        onChangeText={onDescriptionChange}
        placeholder="Enter task description"
        multiline
        numberOfLines={5}
        error={descriptionError}
        disabled={disabled}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  inputDisabled: {
    opacity: 0.5,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    marginLeft: 4,
  },
});

export default TaskFormFields;