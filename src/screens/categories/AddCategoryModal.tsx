import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {BottomSheetModal, BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import {useAppStore, type CustomCategory} from '../../app/store';

const COLORS = {
  bg: '#0f0f1a',
  card: '#1a1a2e',
  cardBorder: '#2a2a4a',
  primary: '#6c5ce7',
  text: '#ffffff',
  textSecondary: '#a0a0b8',
  handle: '#3a3a5a',
};

interface Props {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  onClose?: () => void;
  editCategory?: CustomCategory | null;
}

const SNAP_POINTS = ['60%'];

const AddCategoryModal: React.FC<Props> = ({bottomSheetRef, onClose, editCategory}) => {
  const isEditing = !!editCategory;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [keywords, setKeywords] = useState('');

  const {addCustomCategory, updateCustomCategory} = useAppStore();

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
      Alert.alert('Lỗi', 'Vui lòng nhập Tên và Biểu tượng (Emoji)');
      return;
    }

    const keywordList = keywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0);

    const id = isEditing
      ? editCategory!.id
      : trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '_');

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
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
      onDismiss={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>{isEditing ? 'Sửa danh mục' : 'Thêm danh mục mới'}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên danh mục</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Du lịch"
            placeholderTextColor={COLORS.textSecondary}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Biểu tượng (Emoji)</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: ✈️"
            placeholderTextColor={COLORS.textSecondary}
            value={icon}
            onChangeText={setIcon}
            maxLength={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Từ khóa tự động (Cách nhau bởi dấu phẩy)</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: traveloka, agoda, ve may bay"
            placeholderTextColor={COLORS.textSecondary}
            value={keywords}
            onChangeText={setKeywords}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{isEditing ? 'Cập nhật' : 'Lưu danh mục'}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
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
  form: {padding: 20},
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
    marginTop: 10,
  },
  saveButtonText: {color: COLORS.text, fontSize: 16, fontWeight: '700'},
});

export default AddCategoryModal;
