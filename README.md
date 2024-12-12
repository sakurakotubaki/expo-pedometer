# Expo Pedometer App

このアプリは、Expoのセンサー機能を使用して歩数をカウントし、記録する歩数計アプリです。

## 機能

- リアルタイムの歩数カウント
- 過去24時間の歩数表示
- 過去7日間の歩数履歴
- データの永続化（アプリを閉じても記録は保持）

## 技術仕様

### 使用技術

- React Native / Expo
- expo-sensors (歩数計機能)
- @react-native-async-storage/async-storage (データ永続化)

### アプリの仕組み

#### 1. 歩数計測の仕組み

- `Pedometer.watchStepCount()` を使用してリアルタイムで歩数を監視
- パフォーマンス最適化のため、100ミリ秒以上の間隔で更新を制限
- バックグラウンドでも歩数をカウント可能

```typescript
Pedometer.watchStepCount(result => {
  if (now - lastUpdate > 100) {
    setCurrentStepCount(result.steps);
    saveStepsToStorage(result.steps);
  }
});
```

#### 2. データ保存の仕組み

- AsyncStorageを使用してデータを永続化
- 日付ごとの歩数を記録
- 最新7日分のデータのみを保持
- データ形式：
  ```typescript
  interface DailySteps {
    date: string;    // YYYY-MM-DD形式
    steps: number;   // その日の歩数
  }
  ```

#### 3. パーミッション管理

- iOSの場合：
  - モーションセンサーへのアクセス許可が必要
  - `app.json`でパーミッションメッセージをカスタマイズ可能

## セットアップ方法

1. 依存パッケージのインストール:
```bash
bun add
```

2. アプリの起動:
```bash
bun run start
```

## 注意事項

- デバイスのモーションセンサーへのアクセス許可が必要です
- バッテリー消費を最適化するため、歩数の更新頻度を制限しています
- 歩数データは端末のローカルストレージに保存されます

## トラブルシューティング

1. 歩数が計測されない場合:
   - デバイスのモーションセンサーへのアクセスが許可されているか確認
   - アプリを再起動して再度試してみる

2. 履歴が表示されない場合:
   - アプリを一度終了し、再度起動してみる
   - AsyncStorageのデータをクリアして再度試してみる
