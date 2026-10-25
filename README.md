<div align="center">

# 一页纸简历 · 一页纸简历修改器

**把重要的经历，写到一页里。**

面向5年以上中高阶求职者。梳理定位、整理经历、按JD定制，让事实和个人贡献更清楚。

[项目介绍](https://bxfzzti.github.io/one-page-resume-editor-skill/) · [个人项目集](https://bxfzzti.github.io/) · [完整技术说明](README.technical.md)

</div>

## 可以做什么

- **先诊断再改写**：找出定位、结构、时间线和证据中最值得修改的问题。
- **围绕岗位组织**：同一份事实底稿可分别适配多个JD，明确真实缺口。
- **保留事实边界**：不改数字、公司和岗位，不把协作写成主导。

## 怎么开始

1. 把安装说明交给支持Skill的Agent，读取根目录SKILL.md。
2. 提供自己的简历，选择诊断、整理、JD定制或面试检查。
3. 确认内容后，再明确要求生成Word/PDF。

把下面的说明交给支持读取仓库的 Agent：

```text
请安装或加载 https://github.com/bxfzzti/one-page-resume-editor-skill 的一页纸简历 Skill，入口是根目录 SKILL.md。先说明是否持久安装。请先诊断我的简历，列出最重要的三个问题和待补信息，暂时不要重写；不要编造经历、数字或个人贡献。
```

## 当前范围

本页提供Skill介绍和安装入口，不接收简历、不在线调用模型。仓库web/为开发原型，包含积分和测试支付等历史设计，未在此部署。缺少JD时不能完成岗位匹配；一页会损害内容时应保留两页。

## 数据与隐私

简历在你选择的Agent环境中处理；上传前请自行决定是否去除姓名、联系方式和敏感业务信息。

## 开发与进一步说明

Skill入口为根目录[SKILL.md](SKILL.md)，具体规则在references/。网站介绍在site/；web/开发原型的依赖和数据库要求见[Web说明](web/README.md)。本次公开部署仅包含site/，不接收或处理简历文件。

原版详细使用方法、目录和技术说明完整保存在 [README.technical.md](README.technical.md)。
