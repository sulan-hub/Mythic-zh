<p align="center">
<a href="https://github.com/its-a-feature/Mythic/pulse">
        <img src="https://img.shields.io/github/commit-activity/m/its-a-feature/Mythic/master" 
          alt="Activity"/></a>
<img src="https://img.shields.io/github/v/tag/its-a-feature/Mythic?include_prereleases&label=Latest GitHub Tag"/>
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

## Updating

Use the `./mythic-cli update` command to check for available updates across `mythic-cli`, `mythic_server`, and `mythic_react`'s UI. 
This will _NOT_ do the update for you, but let you know if an update exists. To check for updates against a specific branch, use `./mythic-cli update -b [branch name]`.


## Mythic Docker Containers
<p align="left">
  <img src="https://img.shields.io/docker/v/itsafeaturemythic/mythic_go_base?color=green&label=Latest DockerHub Release&sort=semver" alt="latest docker versions"/> 
  <img src="https://img.shields.io/github/v/tag/MythicMeta/Mythic_Docker_Templates?include_prereleases&label=Latest GitHub Tag"/>
</p>

Mythic uses Docker and Docker-compose for all of its components, which allows Mythic to provide a wide range of components and features without having requirements exist on the host. However, it can be helpful to have insight into how the containers are configured. All of Mythic's docker containers are hosted on DockerHub under [itsafeaturemythic](https://hub.docker.com/search?q=itsafeaturemythic&type=image).

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

Additionally, Mythic uses a custom PyPi package (mythic_container) and a custom Golang package (https://github.com/MythicMeta/MythicContainer) to help control and sync information between all the containers as well as providing an easy way to script access to the server.

Dockerfiles for each of these Docker images can be found on [MythicMeta](https://github.com/MythicMeta/Mythic_Docker_Templates).

### mythic-container PyPi
<p align="left">
  <img src="https://img.shields.io/pypi/dm/mythic-container" alt="mythic-container downloads" />
  <img src="https://img.shields.io/pypi/pyversions/mythic-container" alt="mythic-container python version" />
  <img src="https://img.shields.io/pypi/v/mythic-container?color=green&label=Latest%20stable%20PyPi" alt="mythic-container version" />
  <img src="https://img.shields.io/github/v/tag/MythicMeta/MythicContainerPypi?include_prereleases&label=Latest GitHub Tag&color=orange" alt="latest tags" />
</p>

The `mythic-container` PyPi package source code is available on [MythicMeta](https://github.com/MythicMeta/MythicContainerPyPi) and is automatically installed on all of the `mythic_python_*` Docker images.

This PyPi package is responsible for connecting to RabbitMQ, syncing your data to Mythic, and responding to things like Tasking, Webhooks, and configuration updates.

### github.com/MythicMeta/MythicContainer
<p align="left">
  <img src="https://img.shields.io/github/go-mod/go-version/MythicMeta/MythicContainer" alt="MythicContainer go version"/>
  <img src="https://img.shields.io/github/v/tag/MythicMeta/MythicContainer?label=Latest%20GitHub%20Tag&color=green" alt="MythicContainer latest stable version" />
</p>

The `github.com/MythicMeta/MythicContainer` Golang package source code is available on [MythicMeta](https://github.com/MythicMeta/MythicContainer).

This Golang package is responsible for connecting to RabbitMQ, syncing your data to Mythic, and responding to things like Tasking, Webhooks, and configuration updates.

## Mythic Scripting
<p align="left">
  <img src="https://img.shields.io/pypi/dm/mythic" alt="mythic scripting downloads" />
  <img src="https://img.shields.io/pypi/pyversions/mythic" alt="mythic scripting python version" />
  <img src="https://img.shields.io/pypi/v/mythic?color=green&label=Latest%20Stable%20PyPi" alt="mythic scripting latest pypi version" />
<img src="https://img.shields.io/github/v/tag/MythicMeta/Mythic_Scripting?include_prereleases&label=Latest GitHub Tag&color=orange" alt="latest release" />
</p>


* Scripting source code (https://github.com/MythicMeta/Mythic_Scripting)

## Documentation

All documentation for the Mythic project is being maintained on the [docs.mythic-c2.net](https://docs.mythic-c2.net) website.


## Contributions

A bunch of people have suffered through bug reports, changes, and fixes to help make this project better. Thank you!

The following people have contributed a lot to the project. As you see their handles throughout the project on Payload Types and C2 Profiles, be sure to reach out to them for help and contributions:
- [@djhohnstein](https://twitter.com/djhohnstein)
- [@xorrior](https://twitter.com/xorrior)
- [@Airzero24](https://twitter.com/airzero24)
- [@SpecterOps](https://twitter.com/specterops)

## Sponsors

- [w33ts](https://github.com/w33ts) / [@w33t_io](https://twitter.com/w33t_io)
- [DonnieMarco](https://github.com/DonnieMarco)

## Liability

This is an open source project meant to be used with authorization to assess the security posture and for research purposes.

## Historic References
* Check out a [series of YouTube videos](https://www.youtube.com/playlist?list=PLHVFedjbv6sNLB1QqnGJxRBMukPRGYa-H) showing how Mythic looks/works and highlighting a few key features
* Check out the [blog post](https://posts.specterops.io/a-change-of-mythic-proportions-21debeb03617) on the rebranding.
* BSides Seattle 2019 Slides: [Ready Player 2: Multiplayer Red Teaming against macOS](https://www.slideshare.net/CodyThomas6/ready-player-2-multiplayer-red-teaming-against-macos)
* BSides Seattle 2019 Demo Videos: [Available on my Youtube](https://www.youtube.com/playlist?list=PLHVFedjbv6sOz8OGuLdomdkr6-7VdMRQ9)
* Objective By the Sea 2019 talk on JXA: https://objectivebythesea.com/v2/talks/OBTS_v2_Thomas.pdf
* Objective By the sea 2019 Video: https://www.youtube.com/watch?v=E-QEsGsq3uI&list=PLliknDIoYszvTDaWyTh6SYiTccmwOsws8&index=17
