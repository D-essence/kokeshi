# Quest Manager - クエスト管理システム

## プロジェクト概要
- **名称**: Quest Manager
- **目的**: 個人の目標（クエスト）、毎日のタスク、KPI、マインドセットを一元管理
- **主要機能**: クエスト管理、KPI追跡、習慣化支援、マインドチェック

## 主な機能

### ✅ 実装済み機能
1. **Google認証によるログイン**
   - Firebaseを使用した安全な認証システム
   - ユーザーごとのデータ管理

2. **クエスト管理**
   - 4つのカテゴリ（誘惑、組織創造、軍事、資金力）
   - ドラッグ&ドロップによるクエストの並び替え
   - クエストごとのKPI設定
   - 毎日やることリストの管理
   - 備考欄でのメモ機能

3. **毎日やること管理**
   - 全クエストのタスク一覧表示
   - チェックボックスによる完了管理
   - 進捗バーによる達成率の可視化

4. **KPI管理**
   - 数値目標の設定と追跡
   - プラス/マイナスボタンによる簡単な更新
   - 達成率の自動計算
   - 完了したKPIの視覚的表示

5. **マインド管理**
   - マインドリストの作成と編集
   - 日次チェック機能
   - できてるリストへの自動移動
   - 毎日0時の自動リセット

6. **レスポンシブデザイン**
   - PC/スマートフォン両対応
   - モダンなマテリアルデザイン
   - スムーズなアニメーション

## 技術スタック
- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **認証・データベース**: Firebase (Authentication, Firestore)
- **デザイン**: Material Design Icons, カスタムCSS
- **レスポンシブ対応**: CSS Grid, Flexbox

## データ構造

### Firestoreコレクション
1. **users**: ユーザープロファイル
2. **quests**: クエストデータ
   - title: クエスト名
   - category: カテゴリ（temptation/organization/military/finance）
   - kpis: KPI配列
   - dailyTasks: 毎日やることの配列
   - notes: 備考
   - userId: ユーザーID

3. **minds**: マインドデータ
   - text: マインドテキスト
   - userId: ユーザーID

4. **dailyChecks**: 日次チェックデータ
   - checks: チェック状態のマップ
   - date: 日付
   - userId: ユーザーID

## セキュリティルール
Firebaseのセキュリティルールにより、ユーザーは自分のデータのみアクセス可能

## 使い方
1. Googleアカウントでログイン
2. 右下の＋ボタンからクエストを追加
3. KPIと毎日やることを設定
4. 各タブで進捗を管理
5. マインドを追加して日々チェック

## ファイル構成
```
quest-manager/
├── index.html      # メインHTML
├── app.js          # JavaScriptロジック
├── styles.css      # スタイルシート
├── .gitignore      # Git除外設定
└── README.md       # このファイル
```

## デプロイ情報
- **プラットフォーム**: Firebase Hosting対応
- **認証**: Firebase Authentication (Google)
- **データベース**: Cloud Firestore

## 今後の開発予定
- 統計・分析機能の追加
- データのエクスポート機能
- 通知・リマインダー機能
- チーム機能（グループでのクエスト共有）

## ライセンス
Private Project

## 作成日
2024年