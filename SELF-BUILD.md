# Orange Cloud 自编译（解锁全部 Pro 功能）

仓库已克隆到本地，`OPENSOURCE_UNLOCKED` 的作用已在代码里核实：
`EntitlementStore.isPro` 在该编译条件下恒为 `true`，且 `start()` /
`loadProducts()` 不发起任何 StoreKit 调用——即全部 Pro 功能直接可用，
不需要订阅或买断。

## 需要改的三处（缺一不可）

### 1. 编译条件：加 `OPENSOURCE_UNLOCKED`
- Xcode 工程里：主 target 的 `SWIFT_ACTIVE_COMPILATION_CONDITIONS` 加上
  `OPENSOURCE_UNLOCKED`（Release 和 Debug 都加）。
- 或命令行：`xcodebuild ... SWIFT_ACTIVE_COMPILATION_CONDITIONS='$(inherited) OPENSOURCE_UNLOCKED'`
  （本仓库的 `.github/workflows/ios-build.yml` 就是这么做的）。

### 2. 身份：Bundle ID、App Group、签名团队改成自己的
- Bundle ID（共 6 个 target）：`jiamin.chen.orange-cloud`、
  `...widgets`、`...watchkitapp`、`...watchkitapp.wdigets`、
  `...Orange-Cloud-File`、`...notification`，把 `jiamin.chen` 前缀换成
  自己的反向域名（如 `me.zzuu`）。
- App Group：`group.jiamin.chen.Orange-Cloud`（各 `.entitlements` 文件）
  同步改前缀。
- 签名团队：工程里是作者的 `6G78MMY657`，改成自己的 Team ID
  （免费 Apple ID 个人签名不需要填，Xcode 自动处理）。

### 3. OAuth：自建 Cloudflare OAuth Client + 回调中转
官方 Client ID 与 `o-c.do` 中转不向第三方构建开放，必须自建：
1. Cloudflare Dashboard → 创建 OAuth Client（OAuth PKCE 公开客户端，
   无需 client secret）。
2. 部署回调中转：
   - **如果账号没开 R2**：部署时会报 `No R2 binding "NEXT_INC_CACHE_R2_BUCKET"`。不用去开 R2——把
     `apps/web/open-next.config.ts` 里的 `r2IncrementalCache` 换成
     `staticAssetsIncrementalCache`（从 `@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache`
     引入），ISR 缓存改走 Workers 静态资源里的预渲染产物（只读，不影响 `/oauth/callback`
     这个动态路由）。本仓库已按这个改法部署验证通过。
`apps/web/` 是 Next.js on Cloudflare Workers，
   用本仓库的 `apps/web/wrangler.selfbuild.jsonc`（已去掉官方的 D1 /
   R2 / 邮件 / IAP / 榜单 cron，只剩回调本身）覆盖
   `wrangler.jsonc`，把 `name` 和 `routes` 改成自己的域名，
   `pnpm deploy`。
3. 把 `https://<你的域名>/oauth/callback` 登记为该 OAuth Client 的
   Redirect URI。
4. 把 Client ID 和 Redirect URI 填进
   `apps/ios/Orange Cloud/Orange Cloud/Core/Auth/OAuthConfig.swift`
   的 `clientID` 与 `redirectURI` 两行（当前是官方值
   `102240eb9095a1965ee11813ef4788cd` 与 `https://o-c.do/oauth/callback`）。

## 两条编译路线

### A. 有 Mac：Xcode 直接编
- 要求：macOS + Xcode 26+（iOS 26 SDK），App 面向 iOS 17 / watchOS 10.6。
- 打开 `apps/ios/Orange Cloud/Orange Cloud.xcodeproj`，按上面三处改完，
  选真机 Archive 或直接 Run 到手机。免费 Apple ID 签名可用（7 天有效期，
  到期重签）；付费开发者账号（$99/年）则无此限制。
- Watch App、小组件、文件扩展、通知扩展会随主 App 一起编。

### B. 没 Mac：GitHub Actions 云端编
- 本仓库已带 `.github/workflows/ios-build.yml`：macOS runner + Xcode 26，
  自动做第 1、2 步的替换（从仓库 Variables/Secrets 取值），Archive
  时不签名，打出**未签名 IPA**，作为 Artifact 下载（保留 7 天）。
- 需在 fork 的仓库里设好：
  - Variables：`BUNDLE_PREFIX`（如 `me.zzuu`）、
    `OAUTH_REDIRECT_URI`（如 `https://orange.example.com/oauth/callback`）
  - Secrets：`OAUTH_CLIENT_ID`（自建的 Cloudflare OAuth Client ID）
- 拿到未签名 IPA 后，用 AltStore / Sideloadly / ESign 在电脑上重签后
  装到 iPhone（免费 Apple ID，7 天有效期；或用自己的开发者证书）。

## 先后顺序建议
1. 先把中转（relay）部署好 + OAuth Client 建好（这两步不依赖编译，
   且决定了 App 里要填的值）。
2. 再编 App（Mac 或 Actions）。
3. 装到手机后用 Cloudflare 账号 OAuth 登录验证。
