import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PRIORITIES = [
  { id: 'high', name: 'High', color: '#FF3B30' },
  { id: 'medium', name: 'Medium', color: '#FF9500' },
  { id: 'low', name: 'Low', color: '#34C759' },
];

const PrioritySelector = ({
  visible,
  onClose,
  onConfirm,
  selectedPriority,
}) => {
  const [tempPriority, setTempPriority] = React.useState(selectedPriority);

  const handleConfirm = () => {
    onConfirm(tempPriority);
  };

  const handleClose = () => {
    setTempPriority(selectedPriority);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Priority</Text>
            <View style={styles.divider} />
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {PRIORITIES.map((priority) => {
              const isSelected = tempPriority?.id === priority.id;
              return (
                <TouchableOpacity
                  key={priority.id}
                  style={[styles.item, isSelected && styles.itemSelected]}
                  onPress={() => setTempPriority(priority)}
                >
                  <View style={styles.itemContent}>
                    <View style={styles.priorityRow}>
                      <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
                      <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>
                        {priority.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.button, styles.buttonClose]} onPress={handleClose}>
              <Text style={styles.buttonTextClose}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonConfirm]} onPress={handleConfirm}>
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
    maxHeight: '60%',
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
  scroll: {
    maxHeight: 300,
  },
  item: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemSelected: {
    backgroundColor: '#F4F3FF',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  itemNameSelected: {
    color: '#6C5CE7',
    fontWeight: '600',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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

export default PrioritySelector;