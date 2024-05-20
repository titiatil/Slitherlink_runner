# Slitherlink_runner（スリザーリンクランナー）

[パズル通信ニコリ](https://www.nikoli.co.jp/)の[スリザーリンク](https://www.nikoli.co.jp/ja/puzzles/slitherlink/)を題材にした横スクロールの（アクション？）パズルゲームです。javascriptのみを使っています。

## ルール

- 矢印キーで自分をタテヨコに動かします。通った辺・頂点は赤くなります。一度通った辺・頂点にもう一度行くことはできません。
- マスの中にある数字は、そのマスの四つの辺のうち自分が通るべき辺の数を表しています。通った辺の個数と数字が一致していないマスが左端まで来るとライフが一つ減り、ライフがなくなるとゲームオーバーです。
- 自分が左端に行ってもゲームオーバーです。
- z, x, cいずれかのキーを押すと、Lifeの1/10を消費して、一手戻すことができます。
- 進めない方向のキーを押すと、スクロール速度が増します。序盤、スクロールが遅いと感じたときは利用して下さい。
- q, w, eいずれかのキーを押すと、さらに高速にスクロールします。矢印キーの高速スクロールより速くスクロールします。

## モード
- Normalモードは、経過時間によって数字配置のパターンが変化するモードです。
- Randomonlyモードは、ずっとrandomな配置（Normalモードの一番最初と同じ）のモードです。

　どちらも、少しずつスクロール速度や数字配置の密度が上がっていきます。
