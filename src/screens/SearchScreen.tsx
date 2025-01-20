import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';
import { RoomFilters } from '../components/RoomFilters';
import { getRooms, Room } from '../services/FirestoreService';

export const SearchScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedMinPrice, setSelectedMinPrice] = useState(0);
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(1000);
  const [selectedCapacity, setSelectedCapacity] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Find Your Perfect Stay</Text>
          <Text style={styles.subtitle}>
            {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''} available at Indiana Hotels
          </Text>
        </View>
      </View>

      <RoomFilters
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedMinPrice={selectedMinPrice}
        selectedMaxPrice={selectedMaxPrice}
        selectedCapacity={selectedCapacity}
        onPriceChange={(min, max) => {
          setSelectedMinPrice(Math.round(min));
          setSelectedMaxPrice(Math.round(max));
        }}
        onCapacityChange={setSelectedCapacity}
      />

      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.roomCard}
            onPress={() => handleRoomPress(item)}
          >
            <Image source={{ uri: item.images[0] }} style={styles.roomImage} />
            <View style={styles.roomInfo}>
              <Text style={styles.roomName}>{item.name}</Text>
              <Text style={styles.roomType}>{item.type.toUpperCase()}</Text>
              <Text style={styles.roomPrice}>£{item.price}/night</Text>
              <View style={styles.roomDetails}>
                <Text style={styles.roomCapacity}>Up to {item.capacity} guests</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'available' ? COLORS.success : COLORS.gray }]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.roomsList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    padding: SPACING.large,
  },
  header: {
    marginBottom: SPACING.medium,
  },
  title: {
    fontSize: TYPOGRAPHY.title,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.subtitle,
    color: COLORS.text,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  roomImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: SPACING.medium,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  roomType: {
    fontSize: TYPOGRAPHY.body,
    color: COLORS.text,
  },
  roomPrice: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  roomDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.small,
  },
  roomCapacity: {
    fontSize: TYPOGRAPHY.body,
    color: COLORS.text,
  },
  statusBadge: {
    padding: SPACING.small,
    borderRadius: 4,
    marginLeft: SPACING.small,
  },
  statusText: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  roomsList: {
    padding: SPACING.medium,
  },
}); 