import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {CATEGORY_ICONS} from '../../shared/constants';
import {insertTransaction} from '../../database';
import {useAppStore} from '../../app/store';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

const COLORS = {
  bg: '#0f0f1a',
  card: '#1a1a2e',
  cardBorder: '#2a2a4a',
  primary: '#6c5ce7',
  income: '#00b894',
  expense: '#e17055',
  text: '#ffffff',
  textSecondary: '#a0a0b8',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

const AddTransactionModal: React.FC<Props> = ({visible, onClose}) => {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {loadTransactions, loadStats, customCategories} = useAppStore();

  const categories = [
    ...Object.keys(CATEGORY_ICONS).map(id => ({
      id,
      name: id,
      icon: CATEGORY_ICONS[id],
    })),
    ...Object.values(customCategories || {}).map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
    })),
  ];

  const resetForm = () => {
    setType('expense');
    setAmountStr('');
    setDescription('');
    setCategory('other');
    setDate(new Date());
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    const amount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10);
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    try {
      await insertTransaction(
        'cash', // Gán cứng là tiền mặt
        {
          amount,
          transactionType: type,
          timestamp: date.getTime(),
          rawText: `Manual entry: ${description || category}`,
          description: description.trim() || undefined,
        },
        category,
      );

      loadTransactions();
      loadStats();
      handleClose();
    } catch (error) {
      console.error('Error saving manual transaction:', error);
      Alert.alert('Lỗi', 'Không thể lưu giao dịch');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Thêm giao dịch</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
            {/* Type Switcher */}
            <View style={styles.typeSwitcher}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'expense' && {backgroundColor: COLORS.expense},
                ]}
                onPress={() => setType('expense')}>
                <Text
                  style={[
                    styles.typeText,
                    type === 'expense' && styles.typeTextActive,
                  ]}>
                  Chi tiêu
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'income' && {backgroundColor: COLORS.income},
                ]}
                onPress={() => setType('income')}>
                <Text
                  style={[
                    styles.typeText,
                    type === 'income' && styles.typeTextActive,
                  ]}>
                  Thu nhập
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số tiền (₫)</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.amountInput,
                  {color: type === 'income' ? COLORS.income : COLORS.expense},
                ]}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.textSecondary}
                value={amountStr}
                onChangeText={setAmountStr}
              />
            </View>

            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ngày giao dịch</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateText}>
                  {dayjs(date).format('DD/MM/YYYY HH:mm')}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Danh mục</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryList}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryItem,
                        category === cat.id && styles.categoryItemActive,
                      ]}
                      onPress={() => setCategory(cat.id)}>
                      <Text style={styles.categoryIcon}>
                        {cat.icon}
                      </Text>
                      <Text
                        style={[
                          styles.categoryText,
                          category === cat.id && styles.categoryTextActive,
                        ]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mô tả (Tuỳ chọn)</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập mô tả..."
                placeholderTextColor={COLORS.textSecondary}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Lưu giao dịch</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  closeText: {
    color: COLORS.textSecondary,
    fontSize: 24,
  },
  form: {
    padding: 20,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  typeTextActive: {
    color: COLORS.text,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: '700',
  },
  dateButton: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  dateText: {
    color: COLORS.text,
    fontSize: 16,
  },
  categoryList: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryItem: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    minWidth: 80,
  },
  categoryItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  categoryText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  categoryTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  saveButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AddTransactionModal;
