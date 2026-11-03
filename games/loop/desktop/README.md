# LOOP デスクトップ版（Electron）

ブラウザ試作（`../prototype.html` と `../i18n.js`）を、Windows / Mac / Linux（Steam Deck）用のアプリとして動かすための土台です。

## 手元で動かす

Node.js（20 以上）を入れてから、このフォルダで次を実行します。

```bash
npm install     # Electron と steamworks.js を取得（初回のみ）
npm start       # ゲーム画面を app/ に書き出して起動
```

- F11 または Alt+Enter でフルスクリーンを切り替えます。メニューにもボタンがあります。
- Steam Deck では自動でフルスクリーンになります（Steam が設定する `SteamDeck=1` を見ています）。
- Steam を起動していなくても遊べます。その場合は Steam の機能（実績・言語）だけが無効になります。

## 配布用に書き出す

```bash
npm run dist    # dist/ に Windows・Linux・Mac 用のフォルダを作成
```

書き出したフォルダを Steamworks の SteamPipe でアップロードします。

## Steam とのつなぎ込み

| 機能 | 仕組み | Steamworks 側で必要な作業 |
|---|---|---|
| 実績 | ゲーム内で実績を解除すると `steam.achievement.activate(ID)` を呼ぶ。起動時に、以前解除済みの実績もまとめて送る | 下の14個を同じ ID で登録する |
| 言語 | 初回起動時に Steam の言語設定（japanese / schinese / それ以外は英語）を使う | ストアの対応言語に日本語・英語・簡体字中国語を登録 |
| オーバーレイ | `electronEnableSteamOverlay()` を有効化 | なし |
| クラウドセーブ | 保存データはアプリのデータフォルダにある。Steam の「Auto-Cloud」でこのフォルダを同期する | Auto-Cloud に下のパスを登録 |

### App ID
`main.js` は、App ID が決まるまで Valve のテスト用 ID（480）を使います。発行されたら環境変数 `LOOP_STEAM_APP_ID` で指定するか、`main.js` の値を書き換えてください。

### 実績 ID（Steamworks に同じ名前で登録）
`first_win`, `elite`, `upgrade`, `composer`, `big_hit`, `clear`, `clear_rhythm`, `clear_harmony`, `clear_noise`, `cool`, `rank3`, `rank5`, `fever`, `daily_clear`

### Auto-Cloud のパス
| OS | 保存場所 |
|---|---|
| Windows | `%APPDATA%/LOOP/Local Storage/` |
| Mac | `~/Library/Application Support/LOOP/Local Storage/` |
| Linux / Steam Deck | `~/.config/LOOP/Local Storage/` |

## まだ必要なこと

- 実機（Windows・Steam Deck）での起動確認（この環境では Electron を実行していません）
- フォントの同梱（今は Google Fonts を読み込むので、オフラインでは代わりのフォントになる）
- アイコン画像（`build/icon.png` など）
- 曲を音声ファイルとして書き出す機能
- 今日のチャレンジの記録を Steam のランキングに送る
