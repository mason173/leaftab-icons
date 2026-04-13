# LeafTab Icon Library

这个目录现在使用一套单一事实来源的数据结构，不再依赖临时文件夹拼装数据。

## Canonical 结构

```text
leaftab-icons/
  shapes/
    github.com_232128.svg
    zhihu.com_0084FF.svg
  icon-library.json
  scripts/
    build-library.mjs
  package.json
  .github/workflows/pages.yml
```

`shapes/` 是主要数据源，推荐文件名格式：

```text
<domain>_<RRGGBB>.svg
```

例如：

```text
www.wps.cn_FE3E53.svg
github.com_232128.svg
```

文件名里的域名会变成图标 key，色值会自动变成 `defaultColor`。`icon-library.json` 是构建生成物，不需要日常手改。文件名必须使用这个格式；不带色值后缀的 SVG 不会被接受。每个图标条目至少包含：

```json
{
  "mode": "shape-color",
  "shapePath": "shapes/github.com_232128.svg",
  "defaultColor": "#232128"
}
```

`defaultColor` 只是官方图标的默认品牌色来源，不影响应用里用户自己的颜色覆盖。

## 命令

```bash
npm run build:library
```

根据 `shapes/` 自动生成或刷新 `icon-library.json`，并补齐 `sha256`、`updatedAt` 和 `generatedAt`。
