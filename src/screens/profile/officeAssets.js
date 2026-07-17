import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../components/appButton';
import HeaderWithBackButton from '../../components/headerWithBackButton';
import Colors from '../../styles/color';
import Calendar from '../../../assets/icons/calendar-2.svg';
import ChevronDown from '../../../assets/icons/chevron_down.svg';
import ChevronLeft from '../../../assets/icons/chevron_left.svg';
import ChevronRight from '../../../assets/icons/chevron_right.svg';
import LaptopIcon from '../../../assets/icons/code.svg';
import WarrantyIcon from '../../../assets/icons/setting.svg';
import BrandIcon from '../../../assets/icons/task-square.svg';
import LaptopImage from '../../../assets/images/icon.png';

const OfficeAssets = () => {
  const navigation = useNavigation();

  const [asset, setAsset] = useState({
    name: 'Laptop MacBook Air M1 2020',
    brand: 'Apple',
    warrantyStatus: 'Off',
    buyingDate: { start: null, end: null },
    receivedOn: { start: null, end: null },
  });

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);

  const mockBrands = [
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Dell' },
    { id: 3, name: 'HP' },
    { id: 4, name: 'Lenovo' },
  ];

  const mockWarranty = [
    { id: 1, name: 'On' },
    { id: 2, name: 'Off' },
  ];

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const isSameDay = (d1, d2) => d1 && d2 && d1.toDateString() === d2.toDateString();
  const isDateInRange = (date, start, end) => {
    if (!date || !start || !end) return false;
    return date >= start && date <= end;
  };
  
  const showDatePicker = (field) => {
    setCurrentField(field);
    const currentDate = asset[field]?.start || null;
    setTempStartDate(currentDate);
    if (currentDate) {
      setCurrentMonth(new Date(currentDate.getFullYear(), currentDate.getMonth()));
    }
    setShowCalendarModal(true);
  };

  const handleConfirmSingleDate = () => {
    if (tempStartDate) {
      setAsset(prev => ({
        ...prev,
        [currentField]: { start: tempStartDate, end: tempStartDate },
      }));
      setShowCalendarModal(false);
      setTempStartDate(null);
    }
  };

  const handleCloseCalendar = () => {
    setShowCalendarModal(false);
    setTempStartDate(null);
    setTempEndDate(null);
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

  const renderSelector = (label, value, placeholder, onPress, Icon) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <TouchableOpacity style={styles.selector} onPress={onPress}>
        <View style={styles.selectorLeft}>
          <Icon width={20} height={20} />
          <Text style={[styles.selectorText, !value && styles.placeholderText]}>
            {value || placeholder}
          </Text>
        </View>
        <ChevronDown width={20} height={20} />
      </TouchableOpacity>
    </View>
  );

  const renderBottomModal = (
    visible,
    onClose,
    onConfirm,
    items,
    selectedItem,
    onSelectItem,
    title,
    renderItem
  ) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <View style={styles.modalDivider} />
          </View>
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {items.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.modalItem, selectedItem?.id === item.id && styles.modalItemSelected]}
                onPress={() => onSelectItem(item)}
              >
                {renderItem(item, selectedItem?.id === item.id)}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonClose]} onPress={onClose}>
              <Text style={styles.modalButtonTextClose}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalButtonConfirm,
                !selectedItem && styles.modalButtonDisabled,
              ]}
              onPress={onConfirm}
              disabled={!selectedItem}
            >
              <Text style={styles.modalButtonTextConfirm}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const renderCalendarModal = () => (
    <Modal visible={showCalendarModal} transparent animationType="slide" onRequestClose={handleCloseCalendar}>
      <Pressable style={styles.modalOverlay} onPress={handleCloseCalendar}>
        <Pressable style={styles.calendarModalContent} onPress={e => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <View style={styles.modalDivider} />
          </View>
  
          <View style={styles.calendarHeader}>
            <Calendar width={20} height={20} />
            <TouchableOpacity onPress={prevMonth} style={styles.monthButton}>
              <ChevronLeft width={24} height={24} />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.monthButton}>
              <ChevronRight width={24} height={24} />
            </TouchableOpacity>
          </View>
  
          <View style={styles.weekDays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>
  
          <View style={styles.calendarGrid}>
            {getDaysInMonth(currentMonth).map((date, index) => {
              const isSelected = date && isSameDay(date, tempStartDate);
  
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    !date && styles.emptyDay,
                    isSelected && styles.selectedDay,
                  ]}
                  onPress={() => date && setTempStartDate(date)} 
                >
                  {date && (
                    <Text style={[styles.calendarDayText, isSelected && styles.selectedDayText]}>
                      {date.getDate()}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
  
          {tempStartDate && (
            <View style={styles.selectedDatesInfo}>
              <Text style={styles.selectedDatesText}>
                {formatDate(tempStartDate)}
              </Text>
            </View>
          )}
  
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonClose]} onPress={handleCloseCalendar}>
              <Text style={styles.modalButtonTextClose}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalButtonConfirm,
                !tempStartDate && styles.modalButtonDisabled,
              ]}
              onPress={handleConfirmSingleDate}
              disabled={!tempStartDate}
            >
              <Text style={styles.modalButtonTextConfirm}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const [tempBrand, setTempBrand] = useState(mockBrands.find(b => b.name === asset.brand));
  const [tempWarranty, setTempWarranty] = useState(mockWarranty.find(w => w.name === asset.warrantyStatus));
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBackButton title="Office Assets" onBackPress={() => navigation.goBack()} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.contentWrapper}>
          <View style={styles.content}>
            <Text style={styles.formTitle}>Assets Information</Text>
            <Text style={styles.formSubtitle}>Your office assets information</Text>

            <View style={styles.imageContainer}>
              <Image source={LaptopImage} style={styles.laptopImage} resizeMode="cover" />
            </View>

            <View style={styles.selectorContainer}>
              <Text style={styles.selectorLabel}>Assets Name</Text>
              <View style={styles.selector}>
                <LaptopIcon width={20} height={20} />
                <Text style={styles.selectorText}>{asset.name}</Text>
              </View>
            </View>

            {renderSelector(
              'Brand',
              tempBrand?.name,
              'Select brand',
              () => {
                setTempBrand(mockBrands.find(b => b.name === asset.brand));
                setShowBrandModal(true);
              },
              BrandIcon
            )}

            {renderSelector(
              'Warranty Status',
              tempWarranty?.name,
              'Select status',
              () => {
                setTempWarranty(mockWarranty.find(w => w.name === asset.warrantyStatus));
                setShowWarrantyModal(true);
              },
              WarrantyIcon
            )}

            {renderSelector(
              'Buying Date',
              asset.buyingDate.start ? formatDate(asset.buyingDate.start) : null,
              'Select date',
              () => showDatePicker('buyingDate'),
              Calendar
            )}

            {renderSelector(
              'Received On',
              asset.receivedOn.start ? formatDate(asset.receivedOn.start) : null,
              'Select date',
              () => showDatePicker('receivedOn'),
              Calendar
            )}

          </View>
        </View>
      </ScrollView>

      <View style={styles.submitButtonContainer}>
        <AppButton
          text="Save Changes"
          onPress={() => {
            console.log('Saved Asset:', asset);
            navigation.goBack();
          }}
          style={styles.submitButton}
          textStyle={styles.submitButtonText}
        />
      </View>

      {renderBottomModal(
        showBrandModal,
        () => setShowBrandModal(false),
        () => {
          setAsset(prev => ({ ...prev, brand: tempBrand.name }));
          setShowBrandModal(false);
        },
        mockBrands,
        tempBrand,
        setTempBrand,
        'Select Brand',
        (item, isSelected) => (
          <View style={styles.categoryItemContent}>
            <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>
              {item.name}
            </Text>
            {isSelected && <View style={styles.selectedIndicator} />}
          </View>
        )
      )}

      {renderBottomModal(
        showWarrantyModal,
        () => setShowWarrantyModal(false),
        () => {
          setAsset(prev => ({ ...prev, warrantyStatus: tempWarranty.name }));
          setShowWarrantyModal(false);
        },
        mockWarranty,
        tempWarranty,
        setTempWarranty,
        'Select Warranty Status',
        (item, isSelected) => (
          <View style={styles.categoryItemContent}>
            <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>
              {item.name}
            </Text>
            {isSelected && <View style={styles.selectedIndicator} />}
          </View>
        )
      )}

      {renderCalendarModal()}
    </SafeAreaView>
  );
};

export default OfficeAssets;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollView: { flex: 1, backgroundColor: Colors.secondary },
  scrollViewContent: { padding: 16 },
  contentWrapper: { backgroundColor: Colors.white, borderRadius: 12, padding: 16 },
  content: { gap: 20 },
  formTitle: { fontSize: 20, fontWeight: '700', color: '#000000' },
  formSubtitle: { fontSize: 16, color: '#475467' },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  laptopImage: { width: '100%', height: 180 },
  selectorContainer: { gap: 8 },
  selectorLabel: { fontSize: 16, fontWeight: '600', color: '#000000' },
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
  selectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  selectorText: { fontSize: 15, color: '#000000', fontWeight: '500', flex: 1 , marginLeft: 4},
  placeholderText: { color: '#999999', fontWeight: '400' },
  submitButtonContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  submitButton: { width: '100%', height: 50, borderRadius: 25 },
  submitButtonText: { fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  calendarModalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { padding: 20, paddingBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#000000', textAlign: 'center' },
  modalDivider: { height: 1, backgroundColor: '#E8E8E8', marginTop: 16 },
  modalScroll: { maxHeight: 400 },
  modalItem: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  modalItemSelected: { backgroundColor: '#F4F3FF' },
  categoryItemContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: '500', color: '#000000' },
  itemNameSelected: { color: Colors.primary, fontWeight: '600' },
  selectedIndicator: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary },
  modalButtons: { flexDirection: 'row', gap: 12, padding: 20, paddingTop: 16 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalButtonClose: { backgroundColor: '#F5F5F5' },
  modalButtonConfirm: { backgroundColor: Colors.primary },
  modalButtonDisabled: { backgroundColor: '#CCCCCC' },
  modalButtonTextClose: { fontSize: 16, fontWeight: '600', color: '#666666' },
  modalButtonTextConfirm: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  monthButton: { padding: 8 },
  monthText: { fontSize: 18, fontWeight: '600', color: '#000000' },
  weekDays: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 12 },
  weekDayText: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#666666' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, paddingBottom: 20 },
  calendarDay: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 4 },
  emptyDay: { backgroundColor: 'transparent' },
  selectedDay: { backgroundColor: Colors.primary, borderRadius: 8 },
  rangeDay: { backgroundColor: '#E8E0FF', borderRadius: 0 },
  calendarDayText: { fontSize: 15, color: '#000000', fontWeight: '500' },
  selectedDayText: { color: '#FFFFFF', fontWeight: '700' },
  selectedDatesInfo: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#F4F3FF', marginHorizontal: 20, borderRadius: 8, marginBottom: 12 },
  selectedDatesText: { fontSize: 15, fontWeight: '600', color: Colors.primary, textAlign: 'center' },
});