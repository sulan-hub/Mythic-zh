<p align="center">
<a href="https://github.com/its-a-feature/Mythic/pulse">
        <img src="https://img.shields.io/github/commit-activity/m/its-a-feature/Mythic/master" 
          alt="Activity"/></a>
<img src="https://img.shields.io/github/commits-since/its-a-feature/Mythic/latest?include_prereleases&color=orange" 
  alt="commits since last release"/>
<a href="https://twitter.com/its_a_feature_">
    <img src="https://img.shields.io/twitter/follow/its_a_feature_?style=social" 
      alt="@its_a_feature_ on Twitter"/></a>
<a href="https://slack.specterops.io">
    <img src="https://img.shields.io/badge/BloodHound Slack-4A154B?logo=slack&logoColor=white"
        alt="chat on Bloodhound Slack"></a>
<a href="https://github.com/specterops#mythic">
    <img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fspecterops%2F.github%2Fmain%2Fconfig%2Fshield.json"
      alt="Sponsored by SpecterOps"/>
</a>
</p>

🌐 **Read in:** [English](README-en.md) | [中文](README-zh.md)

## 汉化进度
![汉化进度截图](https://github.com/sulan-hub/Mythic-zh/blob/master/images/162102.png)

开始于：2026/1/13

![汉化进度](https://geps.dev/progress/15) **15% 完成**

# Mythic
一个跨平台的、基于漏洞利用后的红队框架，使用 GoLang、Docker、Docker-Compose 和网页浏览器界面构建。它为操作人员、管理人员和报告人员提供协作性强且用户友好的界面，贯穿整个红队演练过程。

* 查看使用方法的 [YouTube](https://ghst.ly/mythic-op) 视频
* 查看开发者技巧和窍门的 [YouTube](https://www.youtube.com/playlist?list=PLJK0fZNGiFU_iJI2A8S5OdloTDexi5zs8) 视频

## 开始 Mythic

Mythic 是通过 `mythic-cli` 二进制文件控制的。要生成该二进制文件，请在主 Mythic 目录下运行 `sudo make`。然后，您可以运行 `sudo ./mythic-cli start` 来启动所有默认的 Mythic 容器。

更多具体的安装说明、配置、示例、截图等内容可以在 [Mythic 文档](https://docs.mythic-c2.net) 网站上找到。

## 安装代理和 C2 配置文件

Mythic 仓库本身不托管任何 Payload 类型或 C2 配置文件。相反，Mythic 提供了一个命令 `./mythic-cli install github <url> [-b branch name] [-f]`，可以用来将代理安装到当前的 Mythic 实例中。

Payload 类型和 C2 配置文件可以在 [概览](https://mythicmeta.github.io/overview) 页面找到。

要安装代理，只需运行脚本并提供 GitHub 上代理的路径作为参数：
```bash
sudo ./mythic-cli install github https://github.com/MythicAgents/apfell
```

安装 C2 配置文件也是相同的操作：
```bash
sudo ./mythic-cli install github https://github.com/MythicC2Profiles/http
```

这使代理和 C2 配置文件可以更频繁地更新，并将 Mythic 核心组件与其余 Mythic 功能分离开来。

## 更新

使用 `./mythic-cli update` 命令来检查 `mythic-cli`、`mythic_server` 和 `mythic_react` 用户界面是否有可用更新。
这不会为你执行更新，但会让你知道是否存在更新。如需检查特定分支的更新，请使用 `./mythic-cli update -b [分支名称]`.


## Mythic Docker 容器
<p align="left">
  <img src="https://img.shields.io/docker/v/itsafeaturemythic/mythic_go_base?color=green&label=Latest DockerHub Release&sort=semver" alt="latest docker versions"/> 
  <img src="https://img.shields.io/github/v/tag/MythicMeta/Mythic_Docker_Templates?include_prereleases&label=Latest GitHub Tag"/>
</p>

Mythic 对其所有组件都使用 Docker 和 Docker-compose，这使得 Mythic 能够提供广泛的组件和功能，而无需在主机上有任何特定要求。然而，了解容器的配置方式可能会很有帮助。所有 Mythic 的 Docker 容器都托管在 DockerHub 上，链接为 [itsafeaturemythic](https://hub.docker.com/search?q=itsafeaturemythic&type=image)。

- [mythic_go_base](https://hub.docker.com/repository/docker/itsafeaturemythic/mythic_go_base/general) - [Dockerfile](https://github.com/MythicMeta/Mythic_Docker_Templates/tree/master/mythic_go_base)
  - <img src="https://img.shields.io/docker/image-size/itsafeaturemythic/mythic_go_base/latest" alt="image size"/>
  - <img src="https://img.shields.io/docker/pulls/itsafeaturemythic/mythic_go_base" alt="docker pull count" />
- [mythic_go_dotnet](https://hub.docker.com/repository/docker/itsafeaturemythic/mythic_go_dotnet/general) - [Dockerfile](https://github.com/MythicMeta/Mythic_Docker_Templates/tree/master/mythic_go_dotnet)
  - <img src="https://img.shields.io/docker/image-size/itsafeaturemythic/mythic_go_dotnet/latest" alt="image size"/>
  - <img src="https://img.shields.io/docker/pulls/itsafeaturemythic/mythic_go_dotnet" alt="docker pull count"/>
- [mythic_go_macos](https://hub.docker.com/repository/docker/itsafeaturemythic/mythic_go_macos/general) - [Dockerfile](https://github.com/MythicMeta/Mythic_Docker_Templates/tree/master/mythic_go_macos)
  - <img src="https://img.shields.io/docker/image-size/itsafeaturemythic/mythic_go_macos/latest" alt="image size"/>
  - <img src="https://img.shields.io/docker/pulls/itsafeaturemythic/mythic_go_macos" alt="docker pull count"/>
- [mythic_python_base](https://hub.docker.com/repository/docker/itsafeaturemythic/mythic_python_base/general) - [Dockerfile](https://github.com/MythicMeta/Mythic_Docker_Templates/tree/master/mythic_python_base)
  - <img src="https://img.shields.io/docker/image-size/itsafeaturemythic/mythic_python_base/latest" alt="image size"/>
  - <img src="https://img.shields.io/docker/pulls/itsafeaturemythic/mythic_python_base" alt="docker pull count"/>
- [mythic_python_dotnet](https://hub.docker.com/repository/docker/itsafeaturemythic/mythic_python_dotnet/general) - [Dockerfile](https://github.com/MythicMeta/Mythic_Docker_Templates/tree/master/mythic_python_dotnet)
  - <img src="https://img.shields.io/docker/image-size/itsafeaturemythic/mythic_python_dotnet/latest" alt="image size"/>
  - <img src="https://img.shields.io/docker/pulls/itsafeaturemythic/mythic_python_dotnet" alt="docker pull count"/>
- [mythic_python_macos](https://hub.docker.com/repository/docker/itsafeaturemythic/mythic_python_macos/general) - [Dockerfile](https://github.com/MythicMeta/Mythic_Docker_Templates/tree/master/mythic_python_macos)
  - <img src="https://img.shields.io/docker/image-size/itsafeaturemythic/mythic_python_macos/latest" alt="image size"/>
  - <img src="https://img.shields.io/docker/pulls/itsafeaturemythic/mythic_python_macos" alt="docker pull count"/>
- [mythic_python_go](https://hub.docker.com/repository/docker/itsafeaturemythic/mythic_python_go/general) - [Dockerfile](https://github.com/MythicMeta/Mythic_Docker_Templates/tree/master/mythic_python_go)
  - <img src="https://img.shields.io/docker/image-size/itsafeaturemythic/mythic_python_go/latest" alt="image size"/>
  - <img src="https://img.shields.io/docker/pulls/itsafeaturemythic/mythic_python_go" alt="docker pull count"/>

此外，Mythic 使用了一个自定义的 PyPi 包（mythic_container）和一个自定义的 Golang 包（https://github.com/MythicMeta/MythicContainer）来帮助控制和同步所有容器之间的信息，同时提供了一种便捷的方法来编写访问服务器的脚本。

这些 Docker 镜像的 Dockerfile 可以在 [MythicMeta](https://github.com/MythicMeta/Mythic_Docker_Templates) 找到。

### mythic-container PyPi
<p align="left">
  <img src="https://img.shields.io/pypi/dm/mythic-container" alt="mythic-container downloads" />
  <img src="https://img.shields.io/pypi/pyversions/mythic-container" alt="mythic-container python version" />
  <img src="https://img.shields.io/pypi/v/mythic-container?color=green&label=Latest%20stable%20PyPi" alt="mythic-container version" />
  <img src="https://img.shields.io/github/v/tag/MythicMeta/MythicContainerPypi?include_prereleases&label=Latest GitHub Tag&color=orange" alt="latest tags" />
</p>

`mythic-container` PyPi 包的源代码可以在 [MythicMeta](https://github.com/MythicMeta/MythicContainerPyPi) 上获取，并且会自动安装在所有 `mythic_python_*` Docker 镜像中。

这个 PyPi 包负责连接 RabbitMQ、将你的数据同步到 Mythic，以及响应任务、Webhooks 和配置更新等事件。

### github.com/MythicMeta/MythicContainer
<p align="left">
  <img src="https://img.shields.io/github/go-mod/go-version/MythicMeta/MythicContainer" alt="MythicContainer go version"/>
  <img src="https://img.shields.io/github/v/tag/MythicMeta/MythicContainer?label=Latest%20GitHub%20Tag&color=green" alt="MythicContainer latest stable version" />
</p>

`github.com/MythicMeta/MythicContainer` Golang 包的源代码可在 [MythicMeta](https://github.com/MythicMeta/MythicContainer) 获取。

这个 Golang 包负责连接到 RabbitMQ，将你的数据同步到 Mythic，并处理任务、Webhooks 和配置更新等内容。

## Mythic Scripting
<p align="left">
  <img src="https://img.shields.io/pypi/dm/mythic" alt="mythic scripting downloads" />
  <img src="https://img.shields.io/pypi/pyversions/mythic" alt="mythic scripting python version" />
  <img src="https://img.shields.io/pypi/v/mythic?color=green&label=Latest%20Stable%20PyPi" alt="mythic scripting latest pypi version" />
<img src="https://img.shields.io/github/v/tag/MythicMeta/Mythic_Scripting?include_prereleases&label=Latest GitHub Tag&color=orange" alt="latest release" />
</p>


* 脚本源代码 (https://github.com/MythicMeta/Mythic_Scripting)

## 文档

Mythic 项目的所有文档都在 [docs.mythic-c2.net](https://docs.mythic-c2.net) 网站上维护。


## 贡献

许多人经历了错误报告、修改和修复的过程，以帮助改进这个项目。谢谢大家！

以下人员对项目做出了大量贡献。在项目中的有效载荷类型（Payload Types）和 C2 配置文件（C2 Profiles）中，你可以看到他们的昵称，遇到问题或想贡献时，请务必联系他们：
- [@djhohnstein](https://twitter.com/djhohnstein)
- [@xorrior](https://twitter.com/xorrior)
- [@Airzero24](https://twitter.com/airzero24)
- [@SpecterOps](https://twitter.com/specterops)

## 赞助商

- [w33ts](https://github.com/w33ts) / [@w33t_io](https://twitter.com/w33t_io)
- [DonnieMarco](https://github.com/DonnieMarco)

## 免责声明

这是一个开源项目，旨在在获得授权的情况下用于评估安全状况和研究目的。

## 历史参考
* 查看一系列 [YouTube 视频](https://www.youtube.com/playlist?list=PLHVFedjbv6sNLB1QqnGJxRBMukPRGYa-H)，展示 Mythic 的外观/功能并突出几个关键特性
* 查看关于品牌重塑的 [博客文章](https://posts.specterops.io/a-change-of-mythic-proportions-21debeb03617)
* BSides Seattle 2019 幻灯片：[Ready Player 2: 针对 macOS 的多人红队演练](https://www.slideshare.net/CodyThomas6/ready-player-2-multiplayer-red-teaming-against-macos)
* BSides Seattle 2019 演示视频：[可在我的 YouTube 上观看](https://www.youtube.com/playlist?list=PLHVFedjbv6sOz8OGuLdomdkr6-7VdMRQ9)
* Objective By the Sea 2019 关于 JXA 的讲座: https://objectivebythesea.com/v2/talks/OBTS_v2_Thomas.pdf
* Objective By the Sea 2019 视频: https://www.youtube.com/watch?v=E-QEsGsq3uI&list=PLliknDIoYszvTDaWyTh6SYiTccmwOsws8&index=17


---

## 关于此中文版本

这是 Mythic 项目的非官方中文翻译版本。中文翻译由社区贡献。

- **原始项目**: [its-a-feature/Mythic](https://github.com/its-a-feature/Mythic)
- **翻译问题反馈**: [创建 Issue](https://github.com/your-username/Mythic-zh/issues)

**注意**: 此翻译版本仅供参考，如有歧义，请以英文原版为准。
