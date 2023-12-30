# VSSS 用 Greasemonkey スクリプト v1.2

## 概要

flickr の写真ページから VSSS のスライドデータの素を収集するための
Greasemonkey スクリプトです。撮影日時、ラベル、画像URLを取得する他、
astrometry, wikipedia と連携して天体の座標も取得できます。

## 使い方

スクリプトを Greasemonkey に追加してから flickr の写真ページ
(https://www.flickr.com/photos/ で始まるURLのページ)を表示すると、右上
に以下のボタンが表示されます。

- [VSSS] : 表示中の写真のデータを JSON 形式でクリップボードにコピーし
  ます。
- [astrometry] : 表示中の写真を astrometry.net に送信してプレートソル
  ビングを行います。成功すると flickr の [VSSS] ボタンで取得するデータ
  に写野の中心座標が追加されます。
- [wikipedia] : 表示中の写真のタイトルを Wikipedia で検索します。検索
  結果をたどって天体のページを開いてページ内の [VSSS] ボタンを押すと
  flickr の [VSSS] ボタンで取得するデータに写野の中心座標が追加されま
  す。

## 設定

flickr.js の以下の変数の値を必要に応じて書き換えてください。

```javascript
  const TARGET_SIZE = 2048;
  const DEFAULT_TZ = "+09:00";
```

- TARGET_SIZE : 取得される画像URLの画像サイズ(長辺のピクセル数)。この
  値を越えない一番サイズの近い画像のURLが取得されます。
- DEFAULT_TZ : 写真のExifデータにタイムゾーン情報がない場合に適用され
  るデフォルトのタイムゾーンの値です。GMTからの時差を文字列で記述しま
  す。先頭の + または - は必須です。

## データの取得

flickr のページ内の [VSSS] ボタンを押すと、クリップボードに以下のよう
なテキストがコピーされます。

```json
{
  "date": "2018-12-30T21:09:23+09:00",
  "image": "https://live.staticflickr.com/7894/46535901151_69acc8511b_k.jpg",
  "label": "馬頭星雲 (2018/12/30 21:09)",
}
```

astrometry 連携または wikipedia 連携で天体の座標を取得済みの場合は、以
下のように座標データを含むようになります。

```json
{
  "date": "2018-12-30T21:09:23+09:00",
  "image": "https://live.staticflickr.com/7894/46535901151_69acc8511b_k.jpg",
  "label": "馬頭星雲 (2018/12/30 21:09)",
  "ra": "05h 40m 59s",
  "dec": "-02° 27' 30\""
}
```

写真ページの読み込み中でデータが取得できない場合は [VSSS] ボタンが
[wait...] という表示になります。自動的に再取得するので、ボタン表示が
[VSSS] に戻るまで待ってください。

## astrometry 連携

flickr のページ内の [astrometry] ボタンを押すと、astrometry.net のアッ
プロードページのタブが開き、メッセージ「[VSSS] Upload image?」を表示す
る確認ダイアログが開きます。

確認ダイアログの [OK] ボタンを押すと写真が astrometry.net に送信され、
プレートソルビングを開始します。

確認ダイアログの [キャンセル] ボタンを押すと写真をアップロードせず、写
真ページのボタンの表示は [astrometry] に戻ります。

プレートソルビングの完了には数分かかります。その間はボタンの表示が
[astrometry: wait...] になります。成功するとボタンの表示が
[astrometry] に戻ります。失敗するとボタンの表示が [astrometry: failed]
になります。

## wikipedia 連携

flickr のページ内の [wikipedia] ボタンを押すと、Wikipeda 日本語版の検
索ページのタブが開き、写真のタイトルが検索語入力欄に自動的に入力されま
す(検索は実行しません)。

必要に応じて検索語を編集して手動で検索し、検索結果から天体のページを開
くとそのページの見出しの横に [VSSS] ボタンが表示されます。このボタンを
押すと flickr のページの [VSSS] ボタンで取得される情報に天体の座標の情
報が追加されます。

Wikipedia のページの [VSSS] ボタンを押すまで flickr のページの
[wikipedia] ボタンの表示は [wikipedia: wait...] になっています。

制限: 日本語版と英語版の Wikipedia のページにのみ対応しています。他の
言語の Wikipedia のページを開いても [VSSS] ボタンは表示されません。

