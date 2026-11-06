# LOOP ストアページ素材

Steamworks のストアページ編集画面にそのまま貼り付けられる文章と、画像の一覧です。
英語と中国語は発売前にネイティブの方に確認してもらってください。

## 画像（`store/out/`、`node store/render.cjs` で再生成）

| ファイル | 用途 | サイズ |
|---|---|---|
| header_capsule_920x430.png | ヘッダーカプセル（ストア上部・検索結果） | 920×430 |
| small_capsule_462x174.png | 小カプセル（一覧） | 462×174 |
| main_capsule_1232x706.png | メインカプセル（トップページの特集枠） | 1232×706 |
| vertical_capsule_748x896.png | 縦カプセル（セール・特集） | 748×896 |
| library_capsule_600x900.png | ライブラリカプセル | 600×900 |
| library_hero_3840x1240.png | ライブラリヒーロー（ロゴなし） | 3840×1240 |
| library_logo_1280x720.png | ライブラリロゴ（透過PNG） | 1280×720 |
| screenshot_1〜5 | スクリーンショット（タイトル、戦闘とフィーバー、ボス、ルート選択、スタジオ） | 1920×1080 |

- サイズは 2024 年に改定された現行の規定に合わせています。アップロード前に Steamworks の「グラフィックアセット」の説明で最新の規定を確認してください。
- カプセルは仮の下書きです。Steam は「ゲーム名がはっきり読めること」「スクリーンショットの流用でないこと」を求めます。本番ではデザイナーに仕上げてもらうのがおすすめです。

## 基本情報

- ゲーム名：LOOP
- ジャンル：ストラテジー、インディー
- 対応言語：日本語、英語、簡体字中国語（インターフェース・字幕。音声なし）
- 想定価格：1,000〜1,200円（5〜8ドル）
- プレイ人数：シングルプレイ
- 対応：Steam 実績、Steam クラウド、コントローラー（完全対応を目標）

## タグ案（優先度順）

ローグライト / タワーディフェンス / 音楽 / ストラテジー / ミニマリスト / リズム / プロシージャル生成 / シングルプレイヤー / インディー / 2D / リプレイ性 / カジュアル

---

## 短い紹介文（300字以内）

### 日本語
盤面に音のタイルを並べると、それがそのまま武器になる。ループする8拍の演奏で迫る敵を迎え撃つ、音楽ローグライトの防衛ゲーム。戦い方を工夫するほど、あなただけの曲が生まれる。

### English
Place sound tiles on an 8-beat loop and every note becomes an attack. Defend your speaker against waves of enemies in a minimalist music roguelite, and the way you fight turns into a song that is yours alone.

### 简体中文
把音块排上盘面，每一个音符都会变成攻击。在循环的8拍演奏中迎击来袭的敌人——这是一款极简风格的音乐肉鸽塔防游戏。你的战斗方式，将谱写出只属于你的乐曲。

---

## 詳しい説明

### 日本語

**あなたの曲が、あなたを守る。**

LOOP は、4レーン×8拍のループする盤面にタイルを置いて戦う、ミニマルな音楽ローグライトです。キック、スネア、和音、リード……再生位置がタイルを通るたびに音が鳴り、同じレーンの敵に攻撃が飛びます。強い配置を探すうちに、盤面はいつの間にか一曲の音楽になっています。

**遊びのポイント**
- **拍で考えるパズル**：奇数拍しか効かない敵、スネアを跳ね返す敵、ハットでしか見つけられない敵。敵に合わせてリズムを組み替える
- **ノイズとグルーヴ**：強い音ほどノイズがたまり、限界を超えると演奏が止まる。攻撃を当て続ければフィーバーで一気に押し返せる
- **毎回ちがうラン**：通常戦・強敵・ショップ・休憩・イベントから行き先を選び、タイルと装置を集めて自分だけの組み合わせを作る
- **6つの楽器セット、6体のボス、10段階のランク、エンドレス、今日のチャレンジ**

**音楽は自由に**
- 音程、調、音階は戦いの強さに影響しません。好きなように変えて、自分の曲に仕上げられます
- BGM はあなたの曲に合わせてその場で演奏され、盤面と同じ調・テンポで鳴ります
- 敵の出ないスタジオで自由に作曲し、WAV ファイルとして書き出せます

### English

**Your song is your defense.**

LOOP is a minimalist music roguelite played on a 4-lane, 8-beat loop. Kicks, snares, chords, leads: each time the playhead passes a tile it plays a note and strikes the enemies in its lane. Search for the strongest layout and, before you know it, your board has become a piece of music.

**How it plays**
- **Think in beats**: enemies that only take hits on odd beats, enemies that reflect your snares, enemies only a hi-hat can reveal. Rework your rhythm to beat them
- **Noise and groove**: louder tiles build noise, and too much stops the music for a bar. Keep landing hits to trigger Fever and push back hard
- **A different run every time**: choose your route through battles, elites, shops, rests and events, and collect tiles and pedals into combos of your own
- **6 instrument sets, 6 bosses, 10 ranks, endless mode and a daily challenge**

**Music without limits**
- Pitch, key and scale never change your power. Shape your board into the song you want
- The BGM is generated live around your song, in the same key and tempo as your board
- Compose freely in the enemy-free Studio and export your songs as WAV files

### 简体中文

**你的乐曲，就是你的防线。**

LOOP 是一款在4轨×8拍循环盘面上作战的极简音乐肉鸽游戏。底鼓、军鼓、和弦、主旋律……播放头每经过一个音块就会发声，并攻击同一轨道上的敌人。在寻找最强配置的过程中，你的盘面会不知不觉地变成一首乐曲。

**玩法特色**
- **以节拍思考**：只受奇数拍攻击的敌人、反弹军鼓的敌人、只有踩镲才能发现的敌人。根据敌人重新编排节奏
- **噪音与律动**：越强的音块噪音越高，超过上限就会停奏。持续命中即可进入狂热，一举反击
- **每局都不同**：在普通战、强敌、商店、休息和事件中选择路线，收集音块与效果器，打造自己的组合
- **6种乐器组、6个首领、10级难度、无尽模式和每日挑战**

**自由的音乐**
- 音高、调和音阶不会影响强度，可以随心调整成你想要的乐曲
- BGM 会配合你的乐曲实时演奏，与盘面保持相同的调和速度
- 在没有敌人的工作室中自由作曲，并导出为 WAV 文件

---

## 動作環境（案。実機で確認してから記載）

| 項目 | 最低 |
|---|---|
| OS | Windows 10 64bit / macOS 12 / SteamOS・Linux |
| CPU | 2GHz デュアルコア |
| メモリ | 4 GB |
| グラフィック | WebGL 不要。内蔵 GPU で可 |
| ストレージ | 300 MB |
