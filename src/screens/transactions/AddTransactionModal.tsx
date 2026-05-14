import React, {useState, useRef, useCallback, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import {BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {CATEGORY_ICONS, CATEGORY_EMOJI, getCategoryLabel} from '../../shared/constants';
import {insertTransaction, updateTransaction} from '../../database';
import {useAppStore} from '../../app/store';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import type {Transaction} from '../../shared/types';
import {useThemeColors} from '../../shared/theme';
import AppIcon, {categoryIconName} from '../../shared/components/AppIcon';
import {toast} from '../../shared/components/Toast';
import NumericInput from '../../shared/components/NumericInput';
import {triggerBudgetAlertsForTransaction} from '../../services/budgetAlerts';

interface Props {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  onClose?: () => void;
  editTransaction?: Transaction | null;
}

const SNAP_POINTS = ['80%'];
const INCOME_CATEGORY_IDS = new Set(['salary', 'transfer', 'other']);

const AddTransactionModal: React.FC<Props> = ({bottomSheetRef, onClose, editTransaction}) => {
  const t = useThemeColors();
  const COLORS = useMemo(() => ({
    bg: t.surface,
    card: t.surfaceMuted,
    cardBorder: t.border,
    primary: t.primary,
    primarySoft: t.primarySoft,
    primaryDeep: t.primaryDeep,
    income: t.income,
    expense: t.expense,
    text: t.textPrimary,
    textSecondary: t.textSecondary,
    handle: t.neutral,
    onDark: t.textOnDark,
  }), [t]);
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const isEditing = !!editTransaction;

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {loadTransactions, loadStats, customCategories} = useAppStore();

  const allCategories = [
    ...Object.keys(CATEGORY_ICONS).map(id => ({id, name: getCategoryLabel(id), icon: CATEGORY_ICONS[id]})),
    ...Object.values(customCategories || {}).map(c => ({id: c.id, name: c.name, icon: c.icon})),
  ];

  const categories = allCategories.filter(cat => {
    if (Object.prototype.hasOwnProperty.call(CATEGORY_ICONS, cat.id)) {
      if (type === 'income') {return INCOME_CATEGORY_IDS.has(cat.id);}
      return cat.id !== 'salary';
    }
    return true;
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.transactionType);
      setAmountStr(String(editTransaction.amount));
      setDescription(editTransaction.description || '');
      setCategory(editTransaction.category || 'other');
      setDate(new Date(editTransaction.timestamp));
    } else {
      resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTransaction]);

  const resetForm = () => {
    setType('expense');
    setAmountStr('');
    setDescription('');
    setCategory('other');
    setDate(new Date());
    setShowDatePicker(false);
  };

  useEffect(() => {
    if (!categories.some(c => c.id === category)) {
      setCategory(type === 'income' ? 'salary' : 'other');
    }
  }, [type, categories, category]);

  const handleClose = () => {
    bottomSheetRef.current?.dismiss();
    resetForm();
    onClose?.();
  };

  const handleSave = async () => {
    const amount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10);

    if (isNaN(amount) || amount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    try {
      if (isEditing && editTransaction) {
        await updateTransaction(editTransaction.id, {
          amount,
          transactionType: type,
          description: description.trim() || undefined,
          category,
          timestamp: date.getTime(),
        });
      } else {
        await insertTransaction('cash', {
          amount,
          transactionType: type,
          timestamp: date.getTime(),
          rawText: `Manual entry: ${description || category}`,
          description: description.trim() || undefined,
        }, category);
      }

      loadTransactions();
      loadStats();
      await triggerBudgetAlertsForTransaction({
        id: editTransaction?.id || `manual_${Date.now()}`,
        bank: 'cash',
        amount,
        transactionType: type,
        timestamp: date.getTime(),
        rawText: `Manual entry: ${description || category}`,
        description: description.trim() || undefined,
        category,
        isSuspectedGap: false,
        createdAt: editTransaction?.createdAt || Date.now(),
      });
      handleClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Không thể lưu giao dịch');
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.7} />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
      onDismiss={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>{isEditing ? 'Sửa giao dịch' : 'Thêm giao dịch'}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <AppIcon name="close" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
      <BottomSheetScrollView contentContainerStyle={styles.formFields} keyboardShouldPersistTaps="handled">
        {/* Type Switcher */}
        <View style={styles.typeSwitcher}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'expense' && {backgroundColor: COLORS.expense}]}
            onPress={() => setType('expense')}>
            <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Chi tiêu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'income' && {backgroundColor: COLORS.income}]}
            onPress={() => setType('income')}>
            <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>Thu nhập</Text>
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số tiền (₫)</Text>
          <NumericInput
            style={[styles.input, styles.amountInput, {color: type === 'income' ? COLORS.income : COLORS.expense}]}
            placeholder="0"
            placeholderTextColor={COLORS.textSecondary}
            value={amountStr}
            onChangeText={setAmountStr}
          />
        </View>

        {/* Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ngày giao dịch</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>{dayjs(date).format('DD/MM/YYYY HH:mm')}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {setDate(selectedDate);}
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
                  style={[styles.categoryItem, category === cat.id && styles.categoryItemActive]}
                  onPress={() => setCategory(cat.id)}>
                  <View style={styles.categoryIconWrap}>
                    <Text style={{fontSize: 24}}>
                      {Object.prototype.hasOwnProperty.call(CATEGORY_ICONS, cat.id)
                        ? CATEGORY_EMOJI[cat.id] || '📌'
                        : cat.icon || '📌'}
                    </Text>
                  </View>
                  <Text style={[styles.categoryText, category === cat.id && styles.categoryTextActive]}>
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

      </BottomSheetScrollView>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{isEditing ? 'Cập nhật' : 'Lưu giao dịch'}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
};

const createStyles = (COLORS: {
  bg: string;
  card: string;
  cardBorder: string;
  primary: string;
  primarySoft: string;
  primaryDeep: string;
  income: string;
  expense: string;
  text: string;
  textSecondary: string;
  handle: string;
  onDark: string;
}) => StyleSheet.create({
  sheetBg: {backgroundColor: COLORS.bg},
  handle: {backgroundColor: COLORS.handle, width: 40},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  title: {color: COLORS.text, fontSize: 18, fontWeight: '700'},
  closeBtn: {padding: 4},
  closeText: {color: COLORS.textSecondary, fontSize: 22},
  form: {padding: 20, paddingBottom: 16, flex: 1},
  formFields: {paddingBottom: 12},
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  typeButton: {flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8},
  typeText: {color: COLORS.textSecondary, fontSize: 15, fontWeight: '600'},
  typeTextActive: {color: COLORS.onDark},
  inputGroup: {marginBottom: 20},
  label: {color: COLORS.textSecondary, fontSize: 14, marginBottom: 8},
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  amountInput: {fontSize: 24, fontWeight: '700'},
  dateButton: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  dateText: {color: COLORS.text, fontSize: 16},
  categoryList: {flexDirection: 'row', gap: 12},
  categoryItem: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    minWidth: 80,
  },
  categoryItemActive: {borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft},
  categoryIcon: {fontSize: 28, marginBottom: 4},
  categoryIconWrap: {marginBottom: 4},
  categoryText: {color: COLORS.textSecondary, fontSize: 12},
  categoryTextActive: {color: COLORS.primaryDeep, fontWeight: '700'},
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },
  saveButtonText: {color: COLORS.onDark, fontSize: 16, fontWeight: '700'},
});

export default AddTransactionModal;
