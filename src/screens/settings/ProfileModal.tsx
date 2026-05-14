import React, {useState, useEffect, useMemo} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import {useAppStore} from '../../app/store';
import {launchImageLibrary} from 'react-native-image-picker';
import {useThemeColors} from '../../shared/theme';
import AppIcon from '../../shared/components/AppIcon';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<Props> = ({visible, onClose}) => {
  const t = useThemeColors();
  const C = useMemo(() => ({
    bg: t.surface,
    card: t.surfaceMuted,
    cardBorder: t.border,
    primary: t.primary,
    text: t.textPrimary,
    textSecondary: t.textSecondary,
    onDark: t.textOnDark,
    overlay: 'rgba(0, 0, 0, 0.45)',
  }), [t]);
  const styles = useMemo(() => createStyles(C), [C]);

  const {profile, setProfile} = useAppStore();
  const [name, setName] = useState(profile.name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);

  useEffect(() => {
    if (visible) {
      setName(profile.name);
      setAvatarUrl(profile.avatarUrl);
    }
  }, [visible, profile]);

  const handleSelectImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
    });
    if (result.assets && result.assets.length > 0) {
      setAvatarUrl(result.assets[0].uri || '');
    }
  };

  const handleSave = () => {
    setProfile({
      name: name.trim() || 'Người dùng',
      avatarUrl,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Cập nhật hồ sơ</Text>
            <TouchableOpacity onPress={onClose}>
              <AppIcon name="close" size={20} color={C.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarPlaceholder}
                onPress={handleSelectImage}>
                {avatarUrl ? (
                  <Image source={{uri: avatarUrl}} style={styles.avatarImage} />
                ) : (
                  <AppIcon name="user" size={38} color={C.textSecondary} />
                )}
                <View style={styles.editBadge}>
                  <AppIcon name="edit" size={14} color={C.onDark} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên hiển thị</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên của bạn"
                placeholderTextColor={C.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (C: {
  bg: string;
  card: string;
  cardBorder: string;
  primary: string;
  text: string;
  textSecondary: string;
  onDark: string;
  overlay: string;
}) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  title: {
    color: C.text,
    fontSize: 18,
    fontWeight: '700',
  },
  form: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: C.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.bg,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: C.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    color: C.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  saveButton: {
    backgroundColor: C.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  saveButtonText: {
    color: C.onDark,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProfileModal;
