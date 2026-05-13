import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {CATEGORY_ICONS, KEYWORD_CATEGORIES} from '../../shared/constants';
import {useAppStore} from '../../app/store';
import AddCategoryModal from './AddCategoryModal';

const COLORS = {
  bg: '#0f0f1a',
  card: '#1a1a2e',
  cardBorder: '#2a2a4a',
  primary: '#6c5ce7',
  text: '#ffffff',
  textSecondary: '#a0a0b8',
  accent: '#a29bfe',
};

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  keywords: string[];
}

const CategoriesScreen: React.FC = () => {
  const [isAddModalVisible, setIsAddModalVisible] = React.useState(false);
  const customCategories = useAppStore(s => s.customCategories);

  // Build categories from keyword map
  const categoryMap: Record<string, string[]> = {};

  for (const [keyword, category] of Object.entries(KEYWORD_CATEGORIES)) {
    if (!categoryMap[category]) {
      categoryMap[category] = [];
    }
    categoryMap[category].push(keyword);
  }

  const builtinCategories: CategoryItem[] = Object.entries(CATEGORY_ICONS).map(
    ([id, icon]) => ({
      id,
      name: id,
      icon,
      keywords: categoryMap[id] || [],
    }),
  );

  const customCategoriesList: CategoryItem[] = Object.values(customCategories || {}).map(
    c => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      keywords: c.keywords || [],
    }),
  );

  const categories = [...builtinCategories, ...customCategoriesList];

  const renderCategory = ({item}: {item: CategoryItem}) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryIcon}>{item.icon}</Text>
        <Text style={styles.categoryName}>{item.name}</Text>
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

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={item => item.id}
        renderItem={renderCategory}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.headerText}>
            Giao dịch sẽ được tự động phân loại dựa trên từ khóa trong mô tả
          </Text>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsAddModalVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <AddCategoryModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  listContent: {
    padding: 16,
  },
  headerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  categoryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  keywordBadge: {
    backgroundColor: '#2a2a4a',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  keywordText: {
    color: COLORS.accent,
    fontSize: 12,
  },
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
  fabIcon: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
});

export default CategoriesScreen;
