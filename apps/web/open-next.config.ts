import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

// 自编译部署（无 R2）：ISR 缓存改用 Workers 静态资源里的预渲染产物（只读，
// 不做后台重新生成）。本站未用 revalidateTag/revalidatePath，tagCache 保持
// 默认 dummy。官方配置用的是 r2IncrementalCache（需 R2 桶 orange-cloud-web-cache）。
// 见 https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig({
	incrementalCache: staticAssetsIncrementalCache,
	queue: memoryQueue,
});
