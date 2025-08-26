import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SQLite from 'expo-sqlite';

const ShopContext = createContext();

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};

export const ShopProvider = ({ children }) => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    rating: 0,
    distance: 10,
    services: [],
    isOpen: false,
  });

  // Initialize database
  const db = SQLite.openDatabase('mechlocator.db');

  const initDatabase = () => {
    db.transaction(tx => {
      // Create shops table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS shops (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          rating REAL DEFAULT 0,
          reviewCount INTEGER DEFAULT 0,
          services TEXT,
          workingHours TEXT,
          isOpen INTEGER DEFAULT 1,
          image TEXT,
          description TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // Create reviews table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS reviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shopId INTEGER,
          userId TEXT,
          rating INTEGER NOT NULL,
          comment TEXT,
          images TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (shopId) REFERENCES shops (id)
        );`
      );

      // Create bookings table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS bookings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shopId INTEGER,
          userId TEXT,
          service TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          notes TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (shopId) REFERENCES shops (id)
        );`
      );

      // Insert sample data if table is empty
      tx.executeSql(
        'SELECT COUNT(*) as count FROM shops',
        [],
        (_, result) => {
          if (result.rows._array[0].count === 0) {
            insertSampleData(tx);
          }
        }
      );
    });
  };

  const insertSampleData = (tx) => {
    const sampleShops = [
      {
        name: 'AutoCare Pro',
        address: '123 Main Street, Downtown',
        phone: '+1-555-0123',
        email: 'info@autocarepro.com',
        latitude: 40.7128,
        longitude: -74.0060,
        rating: 4.5,
        reviewCount: 127,
        services: JSON.stringify(['Oil Change', 'Brake Repair', 'Engine Diagnostic']),
        workingHours: JSON.stringify({
          monday: { open: '08:00', close: '18:00' },
          tuesday: { open: '08:00', close: '18:00' },
          wednesday: { open: '08:00', close: '18:00' },
          thursday: { open: '08:00', close: '18:00' },
          friday: { open: '08:00', close: '18:00' },
          saturday: { open: '09:00', close: '16:00' },
          sunday: { open: '10:00', close: '14:00' },
        }),
        isOpen: 1,
        description: 'Professional auto repair and maintenance services',
      },
      {
        name: 'Quick Fix Garage',
        address: '456 Oak Avenue, Midtown',
        phone: '+1-555-0456',
        email: 'service@quickfixgarage.com',
        latitude: 40.7589,
        longitude: -73.9851,
        rating: 4.2,
        reviewCount: 89,
        services: JSON.stringify(['Tire Change', 'AC Repair', 'Battery Replacement']),
        workingHours: JSON.stringify({
          monday: { open: '07:00', close: '19:00' },
          tuesday: { open: '07:00', close: '19:00' },
          wednesday: { open: '07:00', close: '19:00' },
          thursday: { open: '07:00', close: '19:00' },
          friday: { open: '07:00', close: '19:00' },
          saturday: { open: '08:00', close: '17:00' },
          sunday: { open: '09:00', close: '15:00' },
        }),
        isOpen: 1,
        description: 'Fast and reliable automotive services',
      },
      {
        name: 'Elite Motors',
        address: '789 Park Boulevard, Uptown',
        phone: '+1-555-0789',
        email: 'contact@elitemotors.com',
        latitude: 40.7505,
        longitude: -73.9934,
        rating: 4.8,
        reviewCount: 203,
        services: JSON.stringify(['Luxury Car Service', 'Performance Tuning', 'Body Work']),
        workingHours: JSON.stringify({
          monday: { open: '09:00', close: '17:00' },
          tuesday: { open: '09:00', close: '17:00' },
          wednesday: { open: '09:00', close: '17:00' },
          thursday: { open: '09:00', close: '17:00' },
          friday: { open: '09:00', close: '17:00' },
          saturday: { open: '10:00', close: '16:00' },
          sunday: { open: 'closed', close: 'closed' },
        }),
        isOpen: 1,
        description: 'Premium automotive services for luxury vehicles',
      },
    ];

    sampleShops.forEach(shop => {
      tx.executeSql(
        `INSERT INTO shops (name, address, phone, email, latitude, longitude, rating, reviewCount, services, workingHours, isOpen, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shop.name,
          shop.address,
          shop.phone,
          shop.email,
          shop.latitude,
          shop.longitude,
          shop.rating,
          shop.reviewCount,
          shop.services,
          shop.workingHours,
          shop.isOpen,
          shop.description,
        ]
      );
    });
  };

  const loadShops = () => {
    setLoading(true);
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM shops ORDER BY rating DESC',
        [],
        (_, result) => {
          const shopsData = result.rows._array.map(shop => ({
            ...shop,
            services: JSON.parse(shop.services || '[]'),
            workingHours: JSON.parse(shop.workingHours || '{}'),
          }));
          setShops(shopsData);
          setLoading(false);
        },
        (_, error) => {
          setError('Failed to load shops');
          setLoading(false);
        }
      );
    });
  };

  const addShop = (shopData) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO shops (name, address, phone, email, latitude, longitude, services, workingHours, description) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            shopData.name,
            shopData.address,
            shopData.phone,
            shopData.email,
            shopData.latitude,
            shopData.longitude,
            JSON.stringify(shopData.services || []),
            JSON.stringify(shopData.workingHours || {}),
            shopData.description,
          ],
          (_, result) => {
            loadShops();
            resolve(result.insertId);
          },
          (_, error) => {
            reject(error);
          }
        );
      });
    });
  };

  const updateShop = (id, shopData) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE shops SET 
           name = ?, address = ?, phone = ?, email = ?, 
           services = ?, workingHours = ?, description = ?
           WHERE id = ?`,
          [
            shopData.name,
            shopData.address,
            shopData.phone,
            shopData.email,
            JSON.stringify(shopData.services || []),
            JSON.stringify(shopData.workingHours || {}),
            shopData.description,
            id,
          ],
          (_, result) => {
            loadShops();
            resolve(result);
          },
          (_, error) => {
            reject(error);
          }
        );
      });
    });
  };

  const deleteShop = (id) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM shops WHERE id = ?',
          [id],
          (_, result) => {
            loadShops();
            resolve(result);
          },
          (_, error) => {
            reject(error);
          }
        );
      });
    });
  };

  const getShopById = (id) => {
    return shops.find(shop => shop.id === id);
  };

  const addReview = (shopId, reviewData) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO reviews (shopId, userId, rating, comment, images) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            shopId,
            reviewData.userId,
            reviewData.rating,
            reviewData.comment,
            JSON.stringify(reviewData.images || []),
          ],
          (_, result) => {
            updateShopRating(shopId);
            resolve(result.insertId);
          },
          (_, error) => {
            reject(error);
          }
        );
      });
    });
  };

  const updateShopRating = (shopId) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT AVG(rating) as avgRating, COUNT(*) as reviewCount 
         FROM reviews WHERE shopId = ?`,
        [shopId],
        (_, result) => {
          const { avgRating, reviewCount } = result.rows._array[0];
          tx.executeSql(
            'UPDATE shops SET rating = ?, reviewCount = ? WHERE id = ?',
            [avgRating || 0, reviewCount || 0, shopId]
          );
        }
      );
    });
  };

  const getReviews = (shopId) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM reviews WHERE shopId = ? ORDER BY createdAt DESC',
          [shopId],
          (_, result) => {
            const reviews = result.rows._array.map(review => ({
              ...review,
              images: JSON.parse(review.images || '[]'),
            }));
            resolve(reviews);
          },
          (_, error) => {
            reject(error);
          }
        );
      });
    });
  };

  const addBooking = (bookingData) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO bookings (shopId, userId, service, date, time, notes) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            bookingData.shopId,
            bookingData.userId,
            bookingData.service,
            bookingData.date,
            bookingData.time,
            bookingData.notes,
          ],
          (_, result) => {
            resolve(result.insertId);
          },
          (_, error) => {
            reject(error);
          }
        );
      });
    });
  };

  const getBookings = (userId) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT b.*, s.name as shopName, s.address as shopAddress 
           FROM bookings b 
           JOIN shops s ON b.shopId = s.id 
           WHERE b.userId = ? 
           ORDER BY b.date DESC, b.time DESC`,
          [userId],
          (_, result) => {
            resolve(result.rows._array);
          },
          (_, error) => {
            reject(error);
          }
        );
      });
    });
  };

  const updateFilters = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  const filterShops = (shopsToFilter) => {
    return shopsToFilter.filter(shop => {
      // Rating filter
      if (filters.rating > 0 && shop.rating < filters.rating) {
        return false;
      }

      // Services filter
      if (filters.services.length > 0) {
        const hasService = filters.services.some(service => 
          shop.services.includes(service)
        );
        if (!hasService) return false;
      }

      // Open/closed filter
      if (filters.isOpen && !shop.isOpen) {
        return false;
      }

      return true;
    });
  };

  useEffect(() => {
    initDatabase();
    loadShops();
  }, []);

  const value = {
    shops,
    loading,
    error,
    filters,
    loadShops,
    addShop,
    updateShop,
    deleteShop,
    getShopById,
    addReview,
    getReviews,
    addBooking,
    getBookings,
    updateFilters,
    filterShops,
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};