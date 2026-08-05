# shelter-bed-counter

避難所で、床面寝床、段ボールベッド、テントを直接観察により迅速にカウントし、避難所ごとに横持ちCSVとして出力するWebアプリです。

## 主な機能

- 八代市の令和8年度指定避難所を選択可能
- 施設名の自由入力
- 床、段ボールベッド、テントの大型タップカウンター
- `+1`、`+5`、`+10`、`-1`、直前操作の取り消し、数値直接修正
- 調査日時、天気、気温、湿度、WBGT、調査者ID、観察範囲、備考の記録
- 操作ごとの自動保存と途中再開
- 1避難所1行のUTF-8 BOM付きCSV
- オフライン対応PWA
- サーバーへ送信せず、端末のブラウザ内だけに保存

## 計数単位

- 床：床面に直接設置された1人分の寝床スペース1つ
- 段ボールベッド：組み立て済みの段ボールベッド1台
- テント：避難者の生活または就寝に用いられるテント1張

人数を数えるアプリではありません。

## GitHub Pagesでの公開

1. GitHubでこのリポジトリの `Settings` を開く
2. `Pages` を選択
3. `Build and deployment` の Source を `Deploy from a branch` にする
4. Branch を `main`、フォルダーを `/(root)` に設定して保存
5. 数分後に表示される公開URLへアクセス

## CSV列

```text
survey_id,shelter_id,shelter_name,observation_date,start_time,end_time,weather,temperature_c,humidity_percent,wbgt_c,observer_id,floor_count,cardboard_bed_count,tent_count,observation_coverage,notes,status,created_at,updated_at,app_version
```

## データ管理上の注意

データはブラウザの `localStorage` に保存されます。ブラウザの閲覧データを消去すると削除されるため、調査終了後はCSVを別の安全な場所へ保存してください。本アプリは氏名、写真、年齢、性別等の個人情報を収集しません。

## 避難所一覧の出典

八代市「令和8年度八代市避難所（指定緊急避難場所・指定一般避難所）一覧表」（2026年6月10日更新、CC BY 4.0）を初期候補に使用しています。施設名の自由入力も可能です。

## ライセンス

MIT License
