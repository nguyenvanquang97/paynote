import React, {useState, useEffect} from 'react';
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
import {theme} from '../../shared/theme';
import AppIcon from '../../shared/components/AppIcon';

const COLORS = {
  bg: theme.colors.surface,
  card: theme.colors.surfaceMuted,
  cardBorder: theme.colors.border,
  primary: theme.colors.primary,
  text: theme.colors.textPrimary,
  textSecondary: theme.colors.textSecondary,
  overlay: 'rgba(0, 0, 0, 0.45)',
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<Props> = ({visible, onClose}) => {
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
      transparent={true}
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Cập nhật hồ sơ</Text>
            <TouchableOpacity onPress={onClose}>
              <AppIcon name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarPlaceholder}
                onPress={handleSelectImage}>
                {avatarUrl ? (
                  <Image source={{uri: avatarUrl}} style={styles.avatarImage} />
                ) : (
                  <AppIcon name="user" size={38} color={COLORS.textSecondary} />
                )}
                <View style={styles.editBadge}>
                  <AppIcon name="edit" size={14} color={theme.colors.textOnDark} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên hiển thị</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên của bạn"
                placeholderTextColor={COLORS.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  editBadgeText: {
    fontSize: 14,
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

export default ProfileModal;
