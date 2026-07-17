import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DIFFICULTIES = [
  { id: 1, name: 'Easy', level: '⭐' },
  { id: 2, name: 'Medium', level: '⭐⭐' },
  { id: 3, name: 'Hard', level: '⭐⭐⭐' },
  { id: 4, name: 'Very Hard', level: '⭐⭐⭐⭐' },
];

const DifficultySelector = ({
  visible,
  onClose,
  onConfirm,
  selectedDifficulty,
}) => {
  const [tempDifficulty, setTempDifficulty] = React.useState(selectedDifficulty);

  const handleConfirm = () => {
    onConfirm(tempDifficulty);
  };

  const handleClose = () => {
    setTempDifficulty(selectedDifficulty);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Difficulty</Text>
            <View style={styles.divider} />
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {DIFFICULTIES.map((difficulty) => {
              const isSelected = tempDifficulty?.id === difficulty.id;
              return (
                <TouchableOpacity
                  key={difficulty.id}
                  style={[styles.item, isSelected && styles.itemSelected]}
                  onPress={() => setTempDifficulty(difficulty)}
                >
                  <View style={styles.itemContent}>
                    <View style={styles.difficultyRow}>
                      <Text style={styles.difficultyLevel}>{difficulty.level}</Text>
                      <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>
                        {difficulty.name}
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
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  difficultyLevel: {
    fontSize: 16,
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

export default DifficultySelector;