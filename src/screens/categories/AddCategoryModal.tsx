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
  Alert,
} from 'react-native';
import {useAppStore} from '../../app/store';

const COLORS = {
  bg: '#0f0f1a',
  card: '#1a1a2e',
  cardBorder: '#2a2a4a',
  primary: '#6c5ce7',
  text: '#ffffff',
  textSecondary: '#a0a0b8',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

const AddCategoryModal: React.FC<Props> = ({visible, onClose}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [keywords, setKeywords] = useState('');

  const addCustomCategory = useAppStore(s => s.addCustomCategory);

  const handleClose = () => {
    setName('');
    setIcon('');
    setKeywords('');
    onClose();
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

    const id = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    addCustomCategory({
      id,
      name: trimmedName,
      icon: trimmedIcon,
      keywords: keywordList,
    });

    handleClose();
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
            <Text style={styles.title}>Thêm danh mục mới</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {/* Name */}
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

            {/* Icon */}
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

            {/* Keywords */}
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

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Lưu danh mục</Text>
            </TouchableOpacity>
          </View>
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

export default AddCategoryModal;
