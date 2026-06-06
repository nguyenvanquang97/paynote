import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Keyboard,
} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import {CATEGORY_ICONS, CATEGORY_EMOJI, getCategoryLabel} from '../../shared/constants';
import {insertTransaction, updateTransaction} from '../../database';
import {useAppStore} from '../../app/store';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import type {Transaction} from '../../shared/types';
import {useThemeColors} from '../../shared/theme';
import AppIcon from '../../shared/components/AppIcon';
import {toast} from '../../shared/components/Toast';
import {triggerBudgetAlertsForTransaction} from '../../services/budgetAlerts';
import {SuccessCheck, AnimatedPressable} from '../../animations';

interface Props {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  onClose?: () => void;
  editTransaction?: Transaction | null;
}

const SNAP_POINTS = ['80%', '100%'];
const INCOME_CATEGORY_IDS = new Set(['salary', 'transfer', 'other']);
const toDigits = (raw: string): string => raw.replace(/[^\d]/g, '');
const formatAmountInput = (digits: string): string => {
  if (!digits) {return '';}
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

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
  const [keyboardBottomInset, setKeyboardBottomInset] = useState(0);
  const formFieldsStyle = useMemo(
    () => [
      styles.formFields,
      keyboardBottomInset > 0 ? {paddingBottom: keyboardBottomInset + 40} : null,
    ],
    [keyboardBottomInset, styles.formFields],
  );

  const {loadTransactions, loadStats, customCategories} = useAppStore();
  const [showSuccess, setShowSuccess] = useState(false);

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

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, event => {
      setKeyboardBottomInset(event.endCoordinates?.height || 0);
      if (Platform.OS === 'android') {
        bottomSheetRef.current?.snapToIndex(1);
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardBottomInset(0);
      if (Platform.OS === 'android') {
        bottomSheetRef.current?.snapToIndex(0);
      }
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [bottomSheetRef]);

  const handleClose = () => {
    setShowDatePicker(false);
    bottomSheetRef.current?.dismiss();
    resetForm();
    onClose?.();
  };

  const openAndroidDateTimePicker = () => {
    DateTimePickerAndroid.open({
      value: date,
      mode: 'date',
      is24Hour: true,
      onChange: (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type !== 'set' || !selectedDate) {
          return;
        }
        const next = new Date(date);
        next.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        DateTimePickerAndroid.open({
          value: next,
          mode: 'time',
          is24Hour: true,
          onChange: (timeEvent: DateTimePickerEvent, selectedTime?: Date) => {
            if (timeEvent.type !== 'set' || !selectedTime) {
              return;
            }
            const finalDate = new Date(next);
            finalDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
            setDate(finalDate);
          },
        });
      },
    });
  };

  const handleSave = async () => {
    const amount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10);

    if (isNaN(amount) || amount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    try {
      const payload: Transaction = {
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
      };

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

      // Close immediately to avoid UX lag; heavy work continues in background.
      handleClose();
      toast.success(isEditing ? 'Đã cập nhật giao dịch' : 'Đã tạo giao dịch');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 350);

      void (async () => {
        try {
          await loadTransactions();
          await loadStats();
          await triggerBudgetAlertsForTransaction(payload);
        } catch (error) {
          console.warn('Post-save notification pipeline failed', error);
        }
      })();
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
      keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'fillParent'}
      keyboardBlurBehavior="restore"
      enableBlurKeyboardOnGesture
      android_keyboardInputMode="adjustPan"
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

      <BottomSheetScrollView
        style={styles.form}
        contentContainerStyle={formFieldsStyle}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive">
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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số tiền (₫)</Text>
          <BottomSheetTextInput
            style={[styles.input, styles.amountInput, {color: type === 'income' ? COLORS.income : COLORS.expense}]}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={COLORS.textSecondary}
            value={formatAmountInput(amountStr)}
            onChangeText={text => setAmountStr(toDigits(text))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ngày giao dịch</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              if (Platform.OS === 'android') {
                openAndroidDateTimePicker();
                return;
              }
              setShowDatePicker(true);
            }}>
            <Text style={styles.dateText}>{dayjs(date).format('DD/MM/YYYY HH:mm')}</Text>
          </TouchableOpacity>
          {Platform.OS === 'ios' && showDatePicker && (
            <DateTimePicker
              value={date}
              mode="datetime"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (event.type === 'dismissed') {
                  setShowDatePicker(false);
                  return;
                }
                setShowDatePicker(true);
                if (selectedDate) {setDate(selectedDate);}
              }}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Danh mục</Text>
          <ScrollView
            horizontal
            nestedScrollEnabled
            directionalLockEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}>
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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mô tả (Tuỳ chọn)</Text>
          <BottomSheetTextInput
            style={styles.input}
            placeholder="Nhập mô tả..."
            placeholderTextColor={COLORS.textSecondary}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <AnimatedPressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{isEditing ? 'Cập nhật' : 'Lưu giao dịch'}</Text>
        </AnimatedPressable>
      </BottomSheetScrollView>
      <SuccessCheck
        visible={showSuccess}
        color={type === 'income' ? COLORS.income : COLORS.expense}
      />
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
  form: {flex: 1},
  formFields: {padding: 20, paddingBottom: 40},
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
  categoryScrollContent: {paddingRight: 8},
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
    marginTop: 4,
  },
  saveButtonText: {color: COLORS.onDark, fontSize: 16, fontWeight: '700'},
});

export default AddTransactionModal;
