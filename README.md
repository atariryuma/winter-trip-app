# TripPlanner — 家族の旅のしおり

家族旅行の「予定・予約・持ち物・お金」をみんなで共有する PWA です。
データは Google スプレッドシートに保存され、Google Apps Script (GAS) が API になります。

公開先: https://atariryuma.github.io/winter-trip-app/

## 画面

| タブ | できること |
| --- | --- |
| 旅程 | 日ごとのタイムライン。旅行中は今日を自動表示し「いまの予定 / 次の予定」と現在時刻ラインを表示。予定間の移動時間と余裕、前泊ホテルの出発目安、今夜の宿 |
| 予約 | まだ予約していない交通・宿の一覧と、予約番号のワンタップコピー |
| 持ち物 | 家族で共有する持ち物チェック（スプレッドシート保存）と、端末内の買い物・お土産リスト |
| お金 | 予算に対する支出、内訳、均等割りの精算（誰が誰にいくら） |

予定の追加は右下の「＋」、予定と予定の間の「＋」、日付バーの「＋」（新しい日）から。
予定をタップすると詳細（地図・予約番号・ルート案内・編集・削除）が開きます。削除は5秒間「元に戻す」ができます。

## 開発

```bash
npm ci
npm run dev --workspace=frontend      # http://localhost:3000/winter-trip-app/
npm run lint --workspace=frontend
npm run build --workspace=frontend    # frontend/dist/index.html（1ファイル）
```

## デプロイ

- **フロントエンド**: `main` に push すると GitHub Actions が lint → build → GitHub Pages へ公開します（Settings → Pages → Source: GitHub Actions）。
- **バックエンド (GAS)**: `backend/` で `clasp push` → `clasp deploy -i <deploymentId>`。手順は `.agent/workflows/deploy.md`。
  スクリプトプロパティ `SPREADSHEET_ID` と `APP_PASSCODE` を設定してください。

## スプレッドシート

`events` シートの列: `date(M/D), type, category, name, time, endTime, from, to, status, bookingRef, memo, budget(金額/支払者)`

- category: `flight` `train` `bus` `transfer` `hotel` `meal` `sightseeing` `shopping` `activity`
- status: `planned`（計画中） `confirmed`（予約済） `suggested`（候補）

設定の「CSVに書き出す」は同じ列順なので、そのまま「CSVから取り込む」で戻せます。
