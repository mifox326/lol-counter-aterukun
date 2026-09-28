# 試合データ収集バッチの手動実行方法

`package.json`に定義済みのスクリプトで実行できます。

## 基本(デフォルト目標 1,000試合、20〜25分)

**PowerShell**
```powershell
npm run collect-data
```

**Git Bash**
```bash
npm run collect-data
```

## 今回の追加目標試合数を指定したい場合

環境変数 `MAX_MATCHES` で「今回の実行で追加する新規試合数」を指定できます(既存データには累積で積み増されます)。

**PowerShell**
```powershell
$env:MAX_MATCHES = '5000'; npm run collect-data
```

**Git Bash**
```bash
MAX_MATCHES=5000 npm run collect-data
```

## 前提

- `.env` に `RIOT_API_KEY=RGAPI-...` が設定済みであること
- 対象は日本サーバー(`RIOT_PLATFORM=jp1`)のチャレンジャー/グランドマスター/マスター帯、ランクソロキュー
- 50試合ごとに`src/data/counterStats.generated.json`へ自動保存されるので、途中で止めても既存データは失われない
- 他の任意設定: `MATCHES_PER_SUMMONER`(1人あたり取得するマッチ数、デフォルト100)、`RIOT_PLATFORM`/`RIOT_REGION`

## 注意

バックグラウンドで別の収集プロセスが既に実行中の場合、並行して手動実行するとレート制限を共有し衝突する可能性がある。手動で別途実行したい場合は、先に既存の実行を止めてから行うこと。
