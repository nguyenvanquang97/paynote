import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import {useAppStore, type CustomCategory} from '../../app/store';
import {useThemeColors} from '../../shared/theme';
import AppIcon from '../../shared/components/AppIcon';
import {toast} from '../../shared/components/Toast';

interface Props {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  onClose?: () => void;
  editCategory?: CustomCategory | null;
}

const SNAP_POINTS = ['70%'];

const AddCategoryModal: React.FC<Props> = ({bottomSheetRef, onClose, editCategory}) => {
  const t = useThemeColors();
  const COLORS = useMemo(() => ({
    bg: t.surface,
    card: t.surfaceMuted,
    cardBorder: t.border,
    primary: t.primary,
    text: t.textPrimary,
    textSecondary: t.textSecondary,
    handle: t.neutral,
    onDark: t.textOnDark,
  }), [t]);
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const isEditing = !!editCategory;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [keywords, setKeywords] = useState('');

  const {addCustomCategory, updateCustomCategory, customCategories} = useAppStore();

  useEffect(() => {
    if (editCategory) {
      setName(editCategory.name);
      setIcon(editCategory.icon);
      setKeywords(editCategory.keywords.join(', '));
    } else {
      resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editCategory]);

  const resetForm = () => {
    setName('');
    setIcon('');
    setKeywords('');
  };

  const handleClose = () => {
    bottomSheetRef.current?.dismiss();
    resetForm();
    onClose?.();
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedIcon = icon.trim();

    if (!trimmedName || !trimmedIcon) {
      toast.error('Vui lòng nhập Tên và Biểu tượng (Emoji)');
      return;
    }

    const keywordList = keywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0);

    const normalizedName = trimmedName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const candidateId = normalizedName || `custom_${Date.now()}`;
    const id = isEditing
      ? editCategory!.id
      : (customCategories[candidateId] ? `${candidateId}_${Date.now()}` : candidateId);

    const category: CustomCategory = {id, name: trimmedName, icon: trimmedIcon, keywords: keywordList};

    if (isEditing) {
      updateCustomCategory(category);
    } else {
      addCustomCategory(category);
    }

    handleClose();
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
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
      onDismiss={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>{isEditing ? 'Sửa danh mục' : 'Thêm danh mục mới'}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <AppIcon name="close" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <BottomSheetScrollView
          contentContainerStyle={styles.formFields}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive">
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên danh mục</Text>
            <BottomSheetTextInput
              style={styles.input}
              placeholder="VD: Du lịch"
              placeholderTextColor={COLORS.textSecondary}
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Biểu tượng (Emoji)</Text>
            <BottomSheetTextInput
              style={styles.input}
              placeholder="VD: ✈️"
              placeholderTextColor={COLORS.textSecondary}
              value={icon}
              onChangeText={setIcon}
              maxLength={4}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Từ khóa tự động (Cách nhau bởi dấu phẩy)</Text>
            <BottomSheetTextInput
              style={styles.input}
              placeholder="VD: traveloka, agoda, ve may bay"
              placeholderTextColor={COLORS.textSecondary}
              value={keywords}
              onChangeText={setKeywords}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{isEditing ? 'Cập nhật' : 'Lưu danh mục'}</Text>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </View>
    </BottomSheetModal>
  );
};

const createStyles = (COLORS: {
  bg: string;
  card: string;
  cardBorder: string;
  primary: string;
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
  closeBtn: {padding: 8, zIndex: 10},
  form: {padding: 20, paddingBottom: 16, flex: 1},
  formFields: {paddingBottom: 24},
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
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {color: COLORS.onDark, fontSize: 16, fontWeight: '700'},
});

export default AddCategoryModal;
