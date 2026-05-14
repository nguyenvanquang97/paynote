import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {CATEGORY_ICONS, KEYWORD_CATEGORIES} from '../../shared/constants';
import {useAppStore, type CustomCategory} from '../../app/store';
import AddCategoryModal from './AddCategoryModal';
import SwipeableRow from '../../shared/components/SwipeableRow';

const COLORS = {
  bg: '#0f0f1a',
  card: '#1a1a2e',
  cardBorder: '#2a2a4a',
  primary: '#6c5ce7',
  text: '#ffffff',
  textSecondary: '#a0a0b8',
  accent: '#a29bfe',
  income: '#00b894',
  expense: '#e17055',
};

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  keywords: string[];
  isCustom: boolean;
}

const CategoriesScreen: React.FC = () => {
  const {customCategories, deleteCustomCategory} = useAppStore();
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    bottomSheetRef.current?.present();
  };

  const handleOpenEdit = (cat: CustomCategory) => {
    setEditingCategory(cat);
    bottomSheetRef.current?.present();
  };

  const handleDelete = (cat: CategoryItem) => {
    Alert.alert(
      'Xóa danh mục',
      `Bạn có chắc muốn xóa danh mục "${cat.name}"?`,
      [
        {text: 'Hủy', style: 'cancel'},
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => deleteCustomCategory(cat.id),
        },
      ],
    );
  };

  // Build keyword map for built-in categories
  const categoryMap: Record<string, string[]> = {};
  for (const [keyword, category] of Object.entries(KEYWORD_CATEGORIES)) {
    if (!categoryMap[category]) {categoryMap[category] = [];}
    categoryMap[category].push(keyword);
  }

  const builtinCategories: CategoryItem[] = Object.entries(CATEGORY_ICONS).map(([id, icon]) => ({
    id,
    name: id,
    icon,
    keywords: categoryMap[id] || [],
    isCustom: false,
  }));

  const customCategoriesList: CategoryItem[] = Object.values(customCategories || {}).map(c => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    keywords: c.keywords || [],
    isCustom: true,
  }));

  const sections = [
    {
      title: `Danh mục tùy chỉnh (${customCategoriesList.length})`,
      data: customCategoriesList,
      isCustomSection: true,
    },
    {
      title: `Danh mục hệ thống (${builtinCategories.length})`,
      data: builtinCategories,
      isCustomSection: false,
    },
  ].filter(s => s.data.length > 0 || s.isCustomSection);

  const renderCategory = ({item, section}: {item: CategoryItem; section: any}) => {
    const content = (
      <View style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryIcon}>{item.icon}</Text>
          <View style={{flex: 1}}>
            <Text style={styles.categoryName}>{item.name}</Text>
            {item.isCustom && (
              <View style={styles.customBadge}>
                <Text style={styles.customBadgeText}>Tùy chỉnh</Text>
              </View>
            )}
          </View>
        </View>
        {item.keywords.length > 0 && (
          <View style={styles.keywordsContainer}>
            {item.keywords.map(keyword => (
              <View key={keyword} style={styles.keywordBadge}>
                <Text style={styles.keywordText}>{keyword}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );

    if (item.isCustom) {
      const customCat = customCategories[item.id];
      return (
        <SwipeableRow
          onEdit={customCat ? () => handleOpenEdit(customCat) : undefined}
          onDelete={() => handleDelete(item)}>
          {content}
        </SwipeableRow>
      );
    }

    return content;
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderCategory}
        renderSectionHeader={({section}) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
        )}
        ListHeaderComponent={
          <Text style={styles.headerText}>
            Giao dịch sẽ được tự động phân loại dựa trên từ khóa trong mô tả.
            Vuốt trái danh mục tùy chỉnh để sửa hoặc xóa.
          </Text>
        }
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />

      <TouchableOpacity style={styles.fab} onPress={handleOpenAdd}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <AddCategoryModal
        bottomSheetRef={bottomSheetRef}
        editCategory={editingCategory}
        onClose={() => setEditingCategory(null)}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.bg},
  listContent: {padding: 16, paddingBottom: 100},
  headerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 20,
  },
  sectionHeader: {
    paddingVertical: 8,
    marginBottom: 4,
  },
  sectionHeaderText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  categoryHeader: {flexDirection: 'row', alignItems: 'center', gap: 12},
  categoryIcon: {fontSize: 28},
  categoryName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  customBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  customBadgeText: {color: COLORS.accent, fontSize: 11, fontWeight: '600'},
  keywordsContainer: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12},
  keywordBadge: {
    backgroundColor: '#2a2a4a',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  keywordText: {color: COLORS.accent, fontSize: 12},
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabIcon: {color: COLORS.text, fontSize: 32, fontWeight: '300', marginTop: -2},
});

export default CategoriesScreen;
