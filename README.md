# Obsidian 干支纪年插件 (Ganzhi Date Plugin)

这是一个为 [Obsidian](https://obsidian.md) 开发的插件，可以将公历日期转换为中国传统的干支纪年（四柱八字）格式。

## 功能特点

- 将选定的日期转换为干支纪年格式（年、月、日、时四柱）
- 支持自定义显示格式
- 简单易用的用户界面
- 支持命令面板操作

## 安装方法

### 从Obsidian插件市场安装

1. 打开Obsidian软件
2. 进入设置 > 第三方插件
3. 禁用安全模式
4. 点击"浏览"按钮
5. 搜索"干支纪年"或"Ganzhi Calendar"
6. 点击安装

### 手动安装

1. 下载最新版本的发布包
2. 解压下载的文件
3. 将解压后的文件夹复制到你的Obsidian库的插件文件夹中：`<库文件夹>/.obsidian/plugins/`
4. 重新启动Obsidian
5. 进入设置 > 第三方插件，启用"Ganzhi Calendar"插件

## 使用方法

1. 在编辑模式下，右键有两个选项：
·Insert Current GanZhi Calendar 插入当前时间的干支历
·Insert Specific Date GanZhi Calendar 插入指定日期的干支历

2.使用命令面板（Ctrl+P）并搜索"GanZhi Calendar",也可看到上面所说的两个选项；
3. 选择命令后，选中的日期将被转换为相应的干支纪年格式

4.在模板文件中使用{{ganzhi}}标签，可以在每次调用这个模板后，插入当前时间的干支历；

## 设置选项

- **Show in Status Bar**：是否显示在Obsidian底部状态栏；
- **Color By WuXing**：选择是否需要根据五行颜色化文本；
- **WuXing Color Setting**：五行颜色设置，可以自定义五行的颜色；

## 开发

这个插件使用Claude Sonnet 3.7开发，并使用Lunar-Script进行干支转换。

### 本地开发

1. 克隆这个仓库
2. 运行 `npm install` 安装依赖
3. 运行 `npm run dev` 启动开发服务器

## 许可证

本项目采用 [MIT许可证](LICENSE) 授权。

## 支持

如果你遇到任何问题或有改进建议，请在GitHub上[提交issue](https://github.com/ArtemisLin/ganzhi-date-plugin/issues)。

## 致谢

感谢Claude Sonnet 3.7,让我一个编程小白实现了这个功能，以及为插件开发提供支持的Obsidian社区。

Written By Claude Sonnet 3.7；