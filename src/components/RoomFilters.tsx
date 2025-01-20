import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';
import { RoomType } from '../types/room';

interface RoomFiltersProps {
  selectedType: RoomType | null;
  onTypeChange: (type: RoomType | null) => void;
  onPriceChange: (min: number, max: number) => void;
  onCapacityChange: (capacity: number | null) => void;
  selectedMinPrice: number;
  selectedMaxPrice: number;
  selectedCapacity: number | null;
}

const ROOM_TYPES: RoomType[] = ['standard', 'deluxe', 'suite'];

export const RoomFilters: React.FC<RoomFiltersProps> = ({
  selectedType,
  onTypeChange,
  selectedMinPrice,
  selectedMaxPrice,
  selectedCapacity,
  onPriceChange,
  onCapacityChange,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersList}
      >
        {ROOM_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              selectedType === type && styles.filterButtonActive,
            ]}
            onPress={() => onTypeChange(selectedType === type ? null : type)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedType === type && styles.filterButtonTextActive,
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  filtersList: {
    paddingHorizontal: SPACING.xl,
  },
  filterButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.gray,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
}); 