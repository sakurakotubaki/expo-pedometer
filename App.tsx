import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, EventSubscription } from 'react-native';
import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DailySteps {
  date: string;
  steps: number;
}

export default function App() {
  const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');
  const [pastStepCount, setPastStepCount] = useState(0);
  const [currentStepCount, setCurrentStepCount] = useState(0);
  const [subscription, setSubscription] = useState<EventSubscription | null>(null);
  const [stepHistory, setStepHistory] = useState<DailySteps[]>([]);

  const saveStepsToStorage = async (steps: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existingData = await AsyncStorage.getItem('stepHistory');
      let history: DailySteps[] = existingData ? JSON.parse(existingData) : [];
      
      // 今日のデータがあれば更新、なければ追加
      const todayIndex = history.findIndex(item => item.date === today);
      if (todayIndex !== -1) {
        history[todayIndex].steps = steps;
      } else {
        history.push({ date: today, steps });
      }
      
      // 最新7日分のみ保持
      history = history.slice(-7);
      
      await AsyncStorage.setItem('stepHistory', JSON.stringify(history));
      setStepHistory(history);
    } catch (error) {
      console.error('Failed to save steps:', error);
    }
  };

  const loadStepHistory = async () => {
    try {
      const data = await AsyncStorage.getItem('stepHistory');
      if (data) {
        setStepHistory(JSON.parse(data));
      }
    } catch (error) {
      console.error('Failed to load step history:', error);
    }
  };

  const subscribe = async () => {
    const isAvailable = await Pedometer.isAvailableAsync();
    setIsPedometerAvailable(String(isAvailable));

    if (isAvailable) {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 1);

      const pastSteps = await Pedometer.getStepCountAsync(start, end);
      setPastStepCount(pastSteps.steps);

      let lastUpdate = Date.now();
      const newSubscription = Pedometer.watchStepCount(result => {
        const now = Date.now();
        // 100ms以上経過していて、かつ歩数が更新されている場合のみ更新
        if (now - lastUpdate > 100 && result.steps !== currentStepCount) {
          setCurrentStepCount(result.steps);
          saveStepsToStorage(result.steps);
          lastUpdate = now;
        }
      });
      setSubscription(newSubscription as EventSubscription | null);
    }
  };

  const unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  useEffect(() => {
    subscribe();
    loadStepHistory();
    return () => unsubscribe();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>歩数計アプリ</Text>

      <View style={styles.card}>
        <Text style={styles.text}>
          Pedometer: {isPedometerAvailable}
        </Text>
        <Text style={styles.text}>
          現在の歩数: {currentStepCount}
        </Text>
        <Text style={styles.text}>
          過去24時間の歩数: {pastStepCount}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>過去7日間の記録</Text>
        {stepHistory.slice().reverse().map((day) => (
          <View key={day.date} style={styles.historyItem}>
            <Text style={styles.text}>{day.date}</Text>
            <Text style={styles.text}>{day.steps} 歩</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={subscription ? unsubscribe : subscribe}
      >
        <Text style={styles.buttonText}>
          {subscription ? '停止' : '開始'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    fontSize: 16,
    marginVertical: 5,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});