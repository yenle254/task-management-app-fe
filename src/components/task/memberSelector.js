import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const MemberSelector = ({
  visible,
  onClose,
  onConfirm,
  members = [],
  selectedMembers = [],
  loading = false,
  multiSelect = true,
}) => {
  const [tempSelected, setTempSelected] = useState(selectedMembers);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = members.filter(member => {
    const fullName = member.profile?.fullName || member.email || '';
    return fullName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleMember = (member) => {
    if (!multiSelect) {
      setTempSelected([member]);
      return;
    }

    const exists = tempSelected.find(m => m._id === member._id);
    if (exists) {
      setTempSelected(prev => prev.filter(m => m._id !== member._id));
    } else {
      setTempSelected(prev => [...prev, member]);
    }
  };

  const isSelected = (member) => {
    return tempSelected.some(m => m._id === member._id);
  };

  const handleConfirm = () => {
    onConfirm(tempSelected);
    setSearchQuery('');
  };

  const handleClose = () => {
    setTempSelected(selectedMembers);
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Members</Text>
            {multiSelect && tempSelected.length > 0 && (
              <Text style={styles.subtitle}>{tempSelected.length} selected</Text>
            )}
            <View style={styles.divider} />
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search members..."
              placeholderTextColor="#999999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6C5CE7" />
            </View>
          ) : (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {filteredMembers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No members found</Text>
                </View>
              ) : (
                filteredMembers.map((member) => (
                  <TouchableOpacity
                    key={member._id}
                    style={[styles.item, isSelected(member) && styles.itemSelected]}
                    onPress={() => toggleMember(member)}
                  >
                    <View style={styles.itemContent}>
                      <View>
                        <Text style={[styles.itemName, isSelected(member) && styles.itemNameSelected]}>
                          {member.profile?.fullName || member.email}
                        </Text>
                        <Text style={styles.itemSubtext}>
                          {member.role} • {member.department || 'No department'}
                        </Text>
                      </View>
                      {isSelected(member) && (
                        <View style={styles.selectedIndicator}>
                          <Text style={styles.checkmark}>✓</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={handleClose}
            >
              <Text style={styles.buttonTextClose}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonConfirm]}
              onPress={handleConfirm}
              disabled={loading}
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
    maxHeight: '80%',
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
  subtitle: {
    fontSize: 14,
    color: '#6C5CE7',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginTop: 16,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000000',
  },
  scroll: {
    maxHeight: 400,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999999',
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
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  itemNameSelected: {
    color: '#6C5CE7',
    fontWeight: '600',
  },
  itemSubtext: {
    fontSize: 14,
    color: '#666666',
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

export default MemberSelector;