# VirtualSkySlideShow v0.5.1

## 概要

VirtualSkySlideShow (VSSS) は、Stuart Lowe さんの VirtualSky (https://github.com/slowe/VirtualSky) と worka さんの vanilla-js-wheel-zoom (https://github.com/worka/vanilla-js-wheel-zoom) を利用した「星図がグリグリ動くスライドショー」です。スライド表示中は「マウスホイールでグリグリズームイン・ズームアウト」もできます。

## 動作環境

- [VirtualSky: v0.7.4](https://github.com/slowe/VirtualSky/releases/tag/v0.7.4)
- [vanilla-js-wheel-zoom: v9.0.0](https://github.com/worka/vanilla-js-wheel-zoom/releases/tag/v9.0.0)
- ブラウザ: Firefox, Chrome, Safari

## 操作

| 操作                           | 動作                      |
|--------------------------------|---------------------------|
| クリック			 | スライドショーの開始/停止 |
| ダブルクリック 		 | 全画面表示/全画面解除     |
| ホイール上 		 	 | ズームモードON	     |
| <kbd>p</kbd>, <kbd>←</kbd> 	 | 前のスライド              |
| <kbd>n</kbd>, <kbd>→</kbd> 	 | 次のスライド 	     |
| <kbd>,</kbd>, <kbd>HOME</kbd>  | 先頭に移動 		     |
| <kbd>.</kbd>, <kbd>END</kbd> 	 | 最後に移動  		     |
| <kbd>z</kbd>	 	 	 | ズームモードON	     |

動画のスライドが表示されると、自動的にその動画の再生が始まります。再生が終わると自動的に次のスライドに移動します。ただし、スライドショーの停止中は再生が終わっても現在のスライドに留まります。

ズームモードは画像のスライドでのみ使用できます。動画のスライドでは使用できません。

ズームモードの操作方法は以下の通りです。

| 操作                           | 動作                      |
|--------------------------------|---------------------------|
| クリック			 | 最大ズームイン または 最小ズームアウト |
| ホイール上 		 	 | ズームイン	     	     |
| ホイール下 		 	 | ズームアウト または ズームモードOFF |
| <kbd>z</kbd>	 	 	 | ズームモードOFF	     |

## デモ

https://rna.sakura.ne.jp/share/vsss-2023.html

## スクリプトのインストール方法

1. サーバー上にインストール先ディレクトリを作成します。
2. 1 のディレクトリに https://github.com/rnanba/VirtualSky の内容を全てアップロードします(ディレクトリ構造も元のまま再現してください)。
3. 1 のディレクトリに https://github.com/worka/vanilla-js-wheel-zoom/releases/tag/v9.0.0 からダウンロードした zip ファイル内の dist/wheel-zoom.min.js をアップロードします。
4. 1 のディレクトリに `vsss.js` をアップロードします。
4. 必要に応じてサーバーに CORS 設定を行います。

### CORS 設定

VSSS および VirtualSky にはユーザーの作成したスライドデータやスクリプトに同梱された星図のデータを外部ファイルから読み込む処理があります。この種の JavaScript は、スクリプトを使用するページが置いてあるサーバーと、データの置いてあるサーバーが異なる場合、セキュリティ上の理由でデータの読み込みに失敗して正常に動作しなくなります。

これを回避するためには、データ(あるいはデータを含んだスクリプト一式)を設置するサーバーにCORS(Cross-Origin Resource Sharing: オリジン間リソース共有)設定が必要です。ただし、レンタルサーバーの場合、この設定ができない環境もあります。

サーバーの Web サーバーが Apache の場合、VSSS のスクリプト一式およびJSON形式のスライドデータファイルが設置されたディレクトリ(またはその親ディレクトリ)の .htaccess ファイルに以下の設定を追加します。

```
Header set Access-Control-Allow-Origin: "*"
```

特定のサーバー上のページからのみ読み込みを許可したい場合は以下のように設定します。

```
Header set Access-Control-Allow-Origin: "https://your-blog-site.example.com"
```

レンタルサーバーでは .htaccess で Header 設定が使用が許可されていないためにCORS設定ができない場合があります。

CORS設定はスクリプトを設置する前に済ませておくことをおすすめします。設定前にブラウザがスクリプトが読み込んでしまうと、ブラウザのキャッシュを消さないとCORS設定が反映されないため面倒なことになります。

## スクリプトの使用方法

### ブログ等で使用する場合

まず、ブログ等のWebサービス上で VSSS を利用する場合は、まずそのサービスで任意の JavaScript が実行が可能かどうか確認してください。

ブログ等で使用する場合は、スクリプトをインストールしたサーバーとスクリプトを使用するサーバー(スクリプトを読み込むページのあるサーバー＝ブログサービスのサーバー)が異なるため、スクリプトをインストールするサーバーにはCORS設定が必要になります。

JSON形式のスライドデータファイルを使用する場合は、やはりCORS設定したサーバーにアップロードしておく必要があります。JavaScript 形式のスライドデータファイルを使用する場合は、CORS設定は必要ありません。

### 自分のサーバー上のページで使用する場合

自分のサーバー上のページで VSSS を使用する場合は、同じサーバーにスクリプトをインストールしていればCORS設定なしで動作します。

### スクリプトの読み込み方

スクリプトのインストール先が https://your-server.example.com/vsss/ である場合、スクリプトを読み込む HTML コードは以下のようになります。

```html
<script src="scripts/wheel-zoom.min.js" type="text/javascript"></script>
<script src="https://your-server.example.com/vsss/stuquery.min.js" type="text/javascript"></script>
<script src="https://your-server.example.com/vsss/virtualsky.min.js" type="text/javascript"></script>
<script src="https://your-server.example.com/vsss/vsss.min.js" type="text/javascript"></script>
```

### スクリプト実行コードの書き方

スライドショーを実行するコードはスライドデータの形式によって異なります。

#### JSON形式のスライドデータを使用する場合

以下は 800x800 の表示領域に、https://your-server.example.com/data/your-slide.json に置いたJSON形式のスライドデータを表示するコードです。

```html
<div id="starmap" style="width:800px;height:800px;"></div>
<script type="text/javascript">
  var ss;
  S(document).ready(function() {
    ss = new VirtualSkySlideShow({
      id: 'starmap',
      url: 'https://your-server.example.com/data/your-slide.json',
      datelocale: 'ja-JP',
      quick_with_key: true
    });
  });
</script>
```

- 表示領域用の div 要素に id を振ります(ここでは starmap)。
- 表示領域のサイズは div 要素の style 属性で指定します。
- VirtualSkySlideShow() の引数のオブジェクトに以下のプロパティを指定します。
  - `id`: 表示領域用の div 要素の id を指定します。
  - `url`: JSON形式のスライドデータのURLを指定します。
  - `datelocale`: 日時表示のロケール(言語・地域名)を指定します。
  - `quick_with_key`: true を指定するとキー操作でスライドを進める/戻る際に素早く移動します。

VirtualSkySlideShow() の引数のオブジェクトには他にも VirtualSky() の引数と共通するプロパティを指定できます。詳細は https://github.com/rnanba/VirtualSky/blob/gh-pages/virtualsky.js の冒頭のコメントの OPTIONS を参照してください。ただし `projection` プロパティは指定しないでください。また、`clock`, `latitude`, `longitude`, `az` はスライドデータファイルの `config` の内容が優先されます。

#### JavaScript形式のスライドデータを使用する場合

https://your-server.example.com/data/your-slide.js に置いたJavaScript形式のスライドデータを表示するコードは以下のようになります。

```html
<div id="starmap" style="width:800px;height:800px;"></div>
<script type="text/javascript">
  var ss;
  var data;
  function callback(obj) {
    data = obj;
  }
  S(document).ready(function() {
    ss = new VirtualSkySlideShow({
      id: 'starmap',
      data: data,
      datelocale: 'ja-JP'
    });
  });
</script>
<script src="https://your-server.example.com/data/your-slide.js" type="text/javascript"></script>
```

スクリプトに callback 関数が追加され、コードの最後でスライドデータをJavaScriptとして読み込んでいます。`VirtualSkySlideShow()` の引数のオブジェクトのプロパティは、`url` がなくなってかわりに `data` が指定されています。他はJSON形式と同様です。

##### 注意: 他人のスライドデータを利用する場合

自分の作ったスライドデータではなく他人の作ったスライドデータを他人の管理するサーバーから読み込んで利用する場合は JavaScript 形式のスライドデータは使用しないでください。

JavaScript 形式のスライドデータはスライドショーを表示するサイト上で JavaScript として実行されるため、後からスライドデータが悪意のあるコードに書き換えられると危険です。

#### スライドデータをページ内に埋め込む場合

スクリプトやスライドデータを置くサーバーがない場合は、信頼できる運営者がホスティングしたスクリプトを読み込むことになりますが、スライドデータはページ内のコードに埋め込む必要があります。その場合のスライド表示コードは以下のようになります

```html
<div id="starmap" style="width:800px;height:800px;"></div>
<script type="text/javascript">
  var ss;
  var data = {
    "config" : {
      "date": "2017-10-01T00:00:00+09:00",
      "latitude": 35.4943963,
      "longitude": 139.525167,
      "az": 180,
      "spin_duration" : 1500,
      "move_duration" : 1500,
      "pan_duration" : 500,
      "stop_duration" : 1000,
      "image_duration" : 5000
    },
    "slides" : [
      {
        "date": "2017-10-26T01:40:00+09:00",
        "ra": "05h 35m 17.3s",
        "dec": "-05° 23′ 28″",
        "image": "https://live.staticflickr.com/4505/24115433588_a9612b9b3c_c.jpg",
        "label": "M42"
      },
      {
      	"date": "2021-07-17T01:42:24+09:00",
        "planet": "Jupiter",
      	"video": "https://www.flickr.com/photos/rnanba/51330176946/play/720p/367d0115fd/",
        "poster": "https://live.staticflickr.com/31337/51330176946_367d0115fd_z.jpg",
      	"label": "木星 (2021/7/17 1:42:24-2:57:36)"
      },
      {
        "date": "2017-11-01T18:24:00+09:00",
        "planet": "Moon",
        "image": "https://live.staticflickr.com/4493/37379606344_25889b7a72_c.jpg",
        "label": "月齢12.6"
      }
    ]
  };
  S(document).ready(function() {
    ss = new VirtualSkySlideShow({
      id: 'starmap',
      data: data,
      latitude: 35.4943963,
      longitude: 139.525167,
      datelocale: 'ja-JP'
    });
  });
</script>
```

変数 `data` に JavaScript のオブジェクトとしてデータを記述しています。データの書式はJSON形式と同様です。

## スライドデータの書き方

### JSON 形式

以下はJSON形式のスライドデータの例です。

```json
{
  "config" : {
    "date": "2017-10-01T00:00:00+09:00",
    "latitude": 35.4943963,
    "longitude": 139.525167,
    "az": 180,
    "spin_duration" : 1500,
    "move_duration" : 1500,
    "pan_duration" : 500,
    "stop_duration" : 1000,
    "image_duration" : 5000
  },
  "slides" : [
    {
      "date": "2017-10-26T01:40:00+09:00",
      "ra": "05h 35m 17.3s",
      "dec": "-05° 23′ 28″",
      "image": "https://live.staticflickr.com/4505/24115433588_a9612b9b3c_c.jpg",
      "label": "M42"
    },
    {
      "date": "2021-07-17T01:42:24+09:00",
      "planet": "Jupiter",
      "video": "https://www.flickr.com/photos/rnanba/51330176946/play/720p/367d0115fd/",
      "poster": "https://live.staticflickr.com/31337/51330176946_367d0115fd_z.jpg",
      "label": "木星 (2021/7/17 1:42:24-2:57:36)"
    },
    {
      "date": "2017-11-01T18:24:00+09:00",
      "planet": "Moon",
      "image": "https://live.staticflickr.com/4493/37379606344_25889b7a72_c.jpg",
      "label": "月齢12.6"
    }
  ]
}
```

### JavaScript 形式

以下はJavaScript形式のスライドデータの例です。

```
callback({
  "config" : {
    "date": "2017-10-01T00:00:00+09:00",
    "latitude: 35.4943963,
    "longitude": 139.525167,
    "az": 180,
    "spin_duration" : 1500,
    "move_duration" : 1500,
    "pan_duration" : 500,
    "stop_duration" : 1000,
    "image_duration" : 5000
  },
  "slides" : [
    {
      "date": "2017-10-26T01:40:00+09:00",
      "ra": "05h 35m 17.3s",
      "dec": "-05° 23′ 28″",
      "image": "https://live.staticflickr.com/4505/24115433588_a9612b9b3c_c.jpg",
      "label": "M42"
    },
    {
      "date": "2021-07-17T01:42:24+09:00",
      "planet": "Jupiter",
      "label": "木星 (2021/7/17 1:42:24-2:57:36)",
      "video": "https://www.flickr.com/photos/rnanba/51330176946/play/720p/367d0115fd/",
      "poster": "https://live.staticflickr.com/31337/51330176946_367d0115fd_z.jpg"
    },
    {
      "date": "2017-11-01T18:24:00+09:00",
      "planet": "Moon",
      "image": "https://live.staticflickr.com/4493/37379606344_25889b7a72_c.jpg",
      "label": "月齢12.6"
    }
  ]
})
```

全体を "callback(" と ")" で括る以外はJSON形式と同じです。

### スライドデータの書式

n 個のスライドを含むスライドデータの全体構造は以下のようになっています。

```
{
  "config" : {
    (スライドショーの設定)
  },
  "slides" : [
    {
      (スライド1の設定)
    },
    {
      (スライド2の設定)
    },
    ...
    {
      (スライドnの設定)
    }
  ]
}
```

#### スライドショーの設定

`config` オブジェクトにはスライドショー全体の設定を記述します。

例:
```
"config" : {
  "date": "2017-10-01T00:00:00+09:00",
  "latitude: 35.4943963,
  "longitude": 139.525167,
  "az": 180,
  "spin_duration" : 1500,
  "move_duration" : 1500,
  "pan_duration" : 500,
  "stop_duration" : 1000,
  "image_duration" : 5000
}
```

各設定値の意味と書式は以下の通りです。

- `date` : スライド開始時に最初にプラネタリウムに表示する星空の日付時刻です。ISO形式で指定します。例: 2017-10-01T00:00:00+09:00 は日本時間(標準時から+9時間差)の2017年10月1日0時0分0秒。
- `latitude` : 観測地の緯度です。数値で指定します。
- `longitude` : 観測地の経度です。数値で指定します。
- `az` : スライド開始時に最初にプラネタリウムに表示する星空の方位です。数値で指定します。0 は北、90 が東、180 が南、270 が西です。
- `spin_duration` : 次のスライドを表示する前にプラネタリウムの表示時刻を変化させるのにかかる時間(星空が日周運動で回転する時間)です。ミリ秒単位の数値を指定します。
- `move_duration` : 次のスライドを表示する前にプラネタリウムの観測地を変化させるのにかかる時間です。ミリ秒単位の数値を指定します。観測地が変化しない場合は適用されません。
- `pan_duration` : 次のスライドを表示する前にプラネタリウムに表示する星空の方位を変化させるのにかかる時間です。ミリ秒単位の数値を指定します。
- `stop_duration` : spin と pan が終わった後スライドを表示するまでの待ち時間です。ミリ秒単位の数値を指定します。
- `image_duration` : スライド画像を表示する時間です。ミリ秒単位の数値を指定します。

#### スライドの設定

スライドオブジェクト(`slides` 配列の要素)には各スライドの設定を記述します。

以下は被写体が月、太陽、惑星の場合の記述例です。

```json
{
  "date": "2017-11-01T18:24:00+09:00",
  "latitude": 35.4943963,
  "longitude": 139.525167,
  "planet": "Moon",
  "image": "https://live.staticflickr.com/4493/37379606344_25889b7a72_c.jpg",
  "label": "月齢12.6"
}
```

各設定値の意味と書式は以下の通りです。

- `date` : 撮影日時です。書式は `config` の `date` と共通です。
- `latitude` : 観測地の経度です。数値で指定します。省略すると `config` の `latitude` の値が適用されます。
- `longitude` : 観測地の緯度です。数値で指定します。省略すると `config` の `longitude` の値が適用されます。
- `planet` : 太陽系の天体の名前です。太陽は "Sun"、月は "Moon"、水星は "Mercury"、金星は "Venus"、火星は "Mars"、木星は "Jupiter"、土星は "Saturn"、天王星は "Uranus"、海王星は "Neptune" を指定します(大文字小文字を区別します)。
- `image` : 写真の画像ファイルのURLです。文字列で指定します。
- `label` : プラネタリウム上のマークに表示するラベル文字列です。

以下は被写体が月、太陽、惑星以外の天体の場合の記述例です。

```json
{
  "date": "2017-10-26T01:40:00+09:00",
  "ra": "05h 35m 17.3s",
  "dec": "-05° 23′ 28″",
  "image": "https://live.staticflickr.com/4505/24115433588_a9612b9b3c_c.jpg",
  "label": "M42"
}
```

各設定値の意味と書式は以下の通りです。

- `ra` : 対象天体の赤経です。時分秒形式の文字列または数値で指定します。例: "05h 35m 17.3s" は赤経5時35分17.3秒。例: 187.461 は赤経187.461度。
- `dec` : 対象天体の赤緯です。度分秒形式の文字列または数値で指定します。例: "-05° 23′ 28″" は赤緯マイナス5度23分28秒(「°」は「º」でもOK。「′」は半角の「'」でもOK。「″」は半角の「"」でもOKですが、JSONの文字列なのでエスケープして「\"」と書く必要があります)。例: -60.517 は赤緯-60.517度。

その他は月、太陽、惑星の場合と同様です。

動画を表示する場合は以下のように `image` のかわりに `video` に動画ファイルのURLを記述します。

```json
{
  "date": "2021-07-17T01:42:24+09:00",
  "planet": "Jupiter",
  "video": "https://www.flickr.com/photos/rnanba/51330176946/play/720p/367d0115fd/",
  "poster": "https://live.staticflickr.com/31337/51330176946_367d0115fd_z.jpg",
  "label": "木星 (2021/7/17 1:42:24-2:57:36)"
}
```

各設定値の意味と書式は以下の通りです。

- `video` : 動画ファイルのURLです。表示するブラウザの `<video>` タグがサポートする動画のみ表示可能です。`image` とは排他で、`video` の設定が優先になります。
- `poster` : 動画のロード中に表示する画像(いわゆるサムネイル)のURLです。省略すると動画の最初のフレームがロードされるまで何も表示されません。

その他は画像の場合と同様です。

`video` に指定するURLは、mp4 等の動画ファイルそのもののURLです。YouTube 等の動画配信サービスの動画ページのURLではないことに注意してください。

## Q&amp;A

- Q: 全画面表示でズームができません
  - v0.5.0 でそうなるのはバグです。お手数ですが v0.5.1 にアップデートしてください。
- Q: 星座線が表示されません。
  - A: 星座線データが読み込めていません。スクリプトの設置サーバーにCORS設定が必要です。
- Q: スライドショーが始まりません。
  - A: 以下を確認してください。
    - JSON形式のスライドデータの場合、スライドデータの設置サーバーにCORS設定が必要です。
    - スライドデータの書式がJSONまたはJavaScriptの文法を違反している場合はスライドショーは実行されません。カンマの抜けや余分なカンマ等でエラーになりやすいので注意してください。
- Q: プラネタリウム上に被写体のマークが表示されません。
  - A: スライドの時刻("date")または座標("ra", "dec")が間違っていると被写体の天体が地平線以下に位置してしまい画面上にマークが表示されない場合があります。

## 告知、開発状況等

VSSS に関する告知や開発状況については https://rna.hatenablog.com/archive/category/vsss を参照してください。

## ライセンス

MIT ライセンスです。
