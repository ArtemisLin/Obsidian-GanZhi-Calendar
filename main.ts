/**
 * GanZhi Calendar Obsidian Plugin
 * Calculate traditional Chinese GanZhi calendar (Stems and Branches calendar)
 */

import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
// @ts-ignore
import { Lunar, Solar } from 'lunar-javascript';

// 天干与地支数组
const TIAN_GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const DI_ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// 天干五行对应
const GAN_WUXING: Record<string, string> = {
    "甲": "木", "乙": "木",
    "丙": "火", "丁": "火",
    "戊": "土", "己": "土",
    "庚": "金", "辛": "金",
    "壬": "水", "癸": "水"
};

// 地支五行对应
const ZHI_WUXING: Record<string, string> = {
    "寅": "木", "卯": "木",
    "巳": "火", "午": "火",
    "辰": "土", "戌": "土", "丑": "土", "未": "土",
    "申": "金", "酉": "金",
    "亥": "水", "子": "水"
};

// 五行颜色
// 获取字符的五行颜色
function getWuxingColor(char: string, settings: GanZhiCalendarSettings): string {
    if (GAN_WUXING[char]) {
        const wuxing = GAN_WUXING[char];
        switch (wuxing) {
            case "木": return settings.woodColor;
            case "火": return settings.fireColor;
            case "土": return settings.earthColor;
            case "金": return settings.metalColor;
            case "水": return settings.waterColor;
            default: return "black";
        }
    }
    if (ZHI_WUXING[char]) {
        const wuxing = ZHI_WUXING[char];
        switch (wuxing) {
            case "木": return settings.woodColor;
            case "火": return settings.fireColor;
            case "土": return settings.earthColor;
            case "金": return settings.metalColor;
            case "水": return settings.waterColor;
            default: return "black";
        }
    }
    return "black";
}

// 将文字转为彩色HTML
function colorizeText(text: string, settings: GanZhiCalendarSettings): string {
    let result = "";
    for (const char of text) {
        const color = getWuxingColor(char, settings);
        result += `<span style="color: ${color};">${char}</span>`;
    }
    return result;
}

// 时辰对应的时间范围
const HOUR_RANGES = [
    "23:00-00:59", "01:00-02:59", "03:00-04:59", "05:00-06:59",
    "07:00-08:59", "09:00-10:59", "11:00-12:59", "13:00-14:59",
    "15:00-16:59", "17:00-18:59", "19:00-20:59", "21:00-22:59"
];

/**
 * 根据日干和时辰计算时干
 * 
 * @param dayGanIndex 日干索引（0-9）
 * @param hourZhiIndex 时辰索引（0-11）
 * @returns 时干索引（0-9）
 */
function getHourGan(dayGanIndex: number, hourZhiIndex: number): number {
    // 根据日干确定子时（第一个时辰）的天干
    // 甲己日起甲子时，乙庚日起丙子时，丙辛日起戊子时，丁壬日起庚子时，戊癸日起壬子时
    const baseHourGan = [0, 2, 4, 6, 8]; // 对应甲、丙、戊、庚、壬
    const startGan = baseHourGan[dayGanIndex % 5];
    
    // 计算时干（每个时辰天干前进1位）
    return (startGan + hourZhiIndex) % 10;
}

/**
 * 计算干支历
 * 使用lunar-javascript库计算，并修正时辰计算
 * 
 * @param year 公历年
 * @param month 公历月
 * @param day 公历日
 * @param hour 公历小时（可选）
 * @param minute 公历分钟（可选）
 * @returns 干支历信息
 */
function getGanZhi(year: number, month: number, day: number, hour?: number, minute?: number) {
    try {
        console.log(`开始计算干支历: ${year}年${month}月${day}日 ${hour !== undefined ? hour + '时' : ''}`);
        
        // 创建公历日期
        const solar = Solar.fromYmd(year, month, day);
        console.log("创建Solar对象成功");
        
        // 转换为农历
        const lunar = solar.getLunar();
        console.log("获取Lunar对象成功");
        
        // 获取农历信息
        const lunarDate = `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
        console.log(`农历日期: ${lunarDate}`);
        
        // 获取干支信息
        const yearGZ = lunar.getYearInGanZhi();
        const monthGZ = lunar.getMonthInGanZhi();
        const dayGZ = lunar.getDayInGanZhi();
        
        console.log(`年柱: ${yearGZ}, 月柱: ${monthGZ}, 日柱: ${dayGZ}`);
        
        // 计算时柱（如果提供了小时）
        let hourGZ = null;
        let hourRange = null;
        
        if (hour !== undefined) {
            // 计算时辰索引 (子时23:00-00:59, 丑时01:00-02:59, ...)
            const hourZhiIndex = Math.floor((hour + 1) / 2) % 12;
            
            // 获取日干索引
            const dayGanIndex = TIAN_GAN.indexOf(dayGZ.charAt(0));
            
            // 计算时干索引
            const hourGanIndex = getHourGan(dayGanIndex, hourZhiIndex);
            
            // 组合时干支
            hourGZ = TIAN_GAN[hourGanIndex] + DI_ZHI[hourZhiIndex];
            hourRange = HOUR_RANGES[hourZhiIndex];
            
            console.log(`时柱: ${hourGZ}, 时间范围: ${hourRange}`);
        }
        
        // 尝试获取节气信息，但跳过可能不存在的方法
        let jieQiInfo = null;
        try {
            // 检查是否有可获取节气的方法
            if (typeof lunar.getJieQi === 'function') {
                const jieQi = lunar.getJieQi();
                jieQiInfo = jieQi ? `当前节气: ${jieQi}` : null;
            }
        } catch (e) {
            console.error("获取节气信息时出错:", e);
        }
        
        console.log(`节气信息: ${jieQiInfo || '无'}`);
        
        // 格式化公历日期时间
        let solarDateTime = `${year}年${month}月${day}日`;
        if (hour !== undefined) {
            solarDateTime += ` ${hour.toString().padStart(2, '0')}`;
            if (minute !== undefined) {
                solarDateTime += `:${minute.toString().padStart(2, '0')}`;
            }
        }
        
        return {
            lunarDate,
            solarDateTime,
            yearGZ,
            monthGZ,
            dayGZ,
            hourGZ,
            hourRange,
            jieQiInfo
        };
    } catch (error) {
        console.error("计算干支历失败:", error);
        throw new Error(`计算干支历失败: ${error.message}`);
    }
}

/**
 * 生成简洁格式的干支历输出
 * 
 * @param ganzhiInfo 干支历信息
 * @param colorize 是否着色
 * @returns 格式化的文本
 */
function formatSimpleGanZhi(ganzhiInfo: any, colorize: boolean = false, settings: GanZhiCalendarSettings): string {
    let result = `公元纪年：${ganzhiInfo.solarDateTime}\n`;
    
    // 构建干支纪年行
    result += `干支纪年：`;
    
    if (colorize) {
        // 彩色版本
        result += `<span style="color:${getWuxingColor(ganzhiInfo.yearGZ[0], settings)}">${ganzhiInfo.yearGZ[0]}</span><span style="color:${getWuxingColor(ganzhiInfo.yearGZ[1], settings)}">${ganzhiInfo.yearGZ[1]}</span>年 | `;
        result += `<span style="color:${getWuxingColor(ganzhiInfo.monthGZ[0], settings)}">${ganzhiInfo.monthGZ[0]}</span><span style="color:${getWuxingColor(ganzhiInfo.monthGZ[1], settings)}">${ganzhiInfo.monthGZ[1]}</span>月 | `;
        result += `<span style="color:${getWuxingColor(ganzhiInfo.dayGZ[0], settings)}">${ganzhiInfo.dayGZ[0]}</span><span style="color:${getWuxingColor(ganzhiInfo.dayGZ[1], settings)}">${ganzhiInfo.dayGZ[1]}</span>日`;
        
        if (ganzhiInfo.hourGZ) {
            result += ` | <span style="color:${getWuxingColor(ganzhiInfo.hourGZ[0], settings)}">${ganzhiInfo.hourGZ[0]}</span><span style="color:${getWuxingColor(ganzhiInfo.hourGZ[1], settings)}">${ganzhiInfo.hourGZ[1]}</span>时`;
        }
    } else {
        // 纯文本版本
        result += `${ganzhiInfo.yearGZ}年 | ${ganzhiInfo.monthGZ}月 | ${ganzhiInfo.dayGZ}日`;
        
        if (ganzhiInfo.hourGZ) {
            result += ` | ${ganzhiInfo.hourGZ}时`;
        }
    }
    
    return result;
}
/**
 * 格式化状态栏显示的干支历
 * 
 * @param ganzhiInfo 干支历信息
 * @returns 格式化后的状态栏文本
 */
function formatStatusBarGanZhi(ganzhiInfo: any): string {
    // 格式: "1991年9月7日14:30 辛未年 | 丙申月 | 庚辰日 | 癸未时"
    let result = ganzhiInfo.solarDateTime + " ";
    
    result += `${ganzhiInfo.yearGZ}年 | ${ganzhiInfo.monthGZ}月 | ${ganzhiInfo.dayGZ}日`;
    
    if (ganzhiInfo.hourGZ) {
        result += ` | ${ganzhiInfo.hourGZ}时`;
    }
    
    return result;
}

// 插件设置接口
interface GanZhiCalendarSettings {
    colorize: boolean;
    showInStatusBar: boolean;
    templateTag: string;
    woodColor: string;
    fireColor: string;
    earthColor: string;
    metalColor: string;
    waterColor: string;
}

// 默认设置
const DEFAULT_SETTINGS: GanZhiCalendarSettings = {
    colorize: true,
    showInStatusBar: true,
    templateTag: "{{ganzhi}}",
    woodColor: "green",
    fireColor: "red",
    earthColor: "brown",
    metalColor: "goldenrod",
    waterColor: "blue"
};

// 日期选择模态框
class DatePickerModal extends Modal {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    previewEl: HTMLElement;
    ganzhiInfo: any = null;
    onSubmit: (year: number, month: number, day: number, hour: number, minute: number) => void;
    
    constructor(app: App, onSubmit: (year: number, month: number, day: number, hour: number, minute: number) => void) {
        super(app);
        const now = new Date();
        this.year = now.getFullYear();
        this.month = now.getMonth() + 1;
        this.day = now.getDate();
        this.hour = now.getHours();
        this.minute = now.getMinutes();
        this.onSubmit = onSubmit;
        this.previewEl = createDiv();
    }
    
    onOpen(): void {
        const {contentEl} = this;
        
        contentEl.createEl('h2', {text: '选择日期'});
        
        // 创建日期选择界面
        const datePickerContainer = contentEl.createDiv('ganzhi-date-picker');
        
        // 日期输入（年月日）
        const dateInput = datePickerContainer.createEl('input', {
            type: 'date',
            value: `${this.year}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')}`
        });
        
        // 时间输入
        const timeInput = datePickerContainer.createEl('input', {
            type: 'time',
            value: `${String(this.hour).padStart(2, '0')}:${String(this.minute).padStart(2, '0')}`
        });
        
        // 日期变化事件
        dateInput.addEventListener('change', () => {
            const dateValue = dateInput.value.split('-');
            this.year = parseInt(dateValue[0]);
            this.month = parseInt(dateValue[1]);
            this.day = parseInt(dateValue[2]);
            this.updatePreview();
        });
        
        // 时间变化事件
        timeInput.addEventListener('change', () => {
            const timeValue = timeInput.value.split(':');
            this.hour = parseInt(timeValue[0]);
            this.minute = parseInt(timeValue[1]);
            this.updatePreview();
        });
        
        // 预览区域
        contentEl.createEl('h3', {text: '干支日期预览'});
        this.previewEl.addClass('ganzhi-preview');
        contentEl.appendChild(this.previewEl);
        
        // 更新预览
        this.updatePreview();
        
        // 按钮区域
        const buttonContainer = contentEl.createDiv('button-container');
        
        // 取消按钮
        const cancelButton = buttonContainer.createEl('button', {text: '取消'});
        cancelButton.addEventListener('click', () => {
            this.close();
        });
        
        // 确认按钮
        const confirmButton = buttonContainer.createEl('button', {text: '确认', cls: 'mod-cta'});
        confirmButton.addEventListener('click', () => {
            this.close();
            this.onSubmit(this.year, this.month, this.day, this.hour, this.minute);
        });
    }
    
    // 更新预览
    updatePreview(): void {
        try {
            this.ganzhiInfo = getGanZhi(this.year, this.month, this.day, this.hour, this.minute);
            
            this.previewEl.empty();
            this.previewEl.createEl('p', {text: `阳历: ${this.ganzhiInfo.solarDateTime}`});
            
            const ganzhiEl = this.previewEl.createEl('p');
            ganzhiEl.setText(`干支: ${this.ganzhiInfo.yearGZ}年 ${this.ganzhiInfo.monthGZ}月 ${this.ganzhiInfo.dayGZ}日 ${this.ganzhiInfo.hourGZ || ''}时`);
        } catch (error) {
            this.previewEl.empty();
            this.previewEl.createEl('p', {text: `计算干支历失败: ${error.message}`});
        }
    }
    
    onClose(): void {
        const {contentEl} = this;
        contentEl.empty();
    }
}

// 设置选项卡
class GanZhiCalendarSettingTab extends PluginSettingTab {
    plugin: GanZhiCalendarPlugin;
    
    constructor(app: App, plugin: GanZhiCalendarPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    
    display(): void {
        const {containerEl} = this;
        
        containerEl.empty();
        
        containerEl.createEl('h2', {text: 'GanZhi Calendar Settings'});
        
        new Setting(containerEl)
            .setName('Show in Status Bar')
            .setDesc('Show current GanZhi Calendar in the status bar')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showInStatusBar)
                .onChange(async (value) => {
                    this.plugin.settings.showInStatusBar = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateStatusBar();
                }));
        
        new Setting(containerEl)
            .setName('Color by WuXing')
            .setDesc('Apply colors to GanZhi based on their WuXing (Five Elements)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.colorize)
                .onChange(async (value) => {
                    this.plugin.settings.colorize = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateStatusBar();
                }));
        
        new Setting(containerEl)
            .setName('Template Tag')
            .setDesc('Tag to be replaced with GanZhi information in templates. Example: {{ganzhi}}')
            .addText(text => text
                .setValue(this.plugin.settings.templateTag)
                .onChange(async (value) => {
                    this.plugin.settings.templateTag = value;
                    await this.plugin.saveSettings();
                }));
        
        containerEl.createEl('h3', {text: 'How to use with Template Plugin'});
        const usageEl = containerEl.createEl('div', {cls: 'setting-item-description'});
        usageEl.createEl('p', {text: 'To use with Obsidian\'s Templates plugin:'});
        
        const ulEl = usageEl.createEl('ul');
        ulEl.createEl('li', {text: `1. Add the template tag (${this.plugin.settings.templateTag}) to your template file`});
        ulEl.createEl('li', {text: '2. When you create a new note using the template, the tag will be automatically replaced with current GanZhi Calendar information'});
        ulEl.createEl('li', {text: '3. You can also use the "Insert GanZhi Template" command to insert current GanZhi information at cursor position'});

        // 创建五行颜色选择部分的标题
containerEl.createEl('h3', {text: 'WuXing Color Settings'});

// 木色
new Setting(containerEl)
    .setName('Wood (木) Color')
    .setDesc('Color for Wood element (甲, 乙, 寅, 卯)')
    .addText(text => text
        .setValue(this.plugin.settings.woodColor)
        .onChange(async (value) => {
            this.plugin.settings.woodColor = value;
            await this.plugin.saveSettings();
            this.plugin.updateStatusBar();
        })
    )
    .addColorPicker(cp => cp
        .setValue(this.plugin.settings.woodColor)
        .onChange(async (value) => {
            this.plugin.settings.woodColor = value;
            await this.plugin.saveSettings();
            this.plugin.updateStatusBar();
        })
    );

// 火色
new Setting(containerEl)
    .setName('Fire (火) Color')
    .setDesc('Color for Fire element (丙, 丁, 巳, 午)')
    .addText(text => text
        .setValue(this.plugin.settings.fireColor)
        .onChange(async (value) => {
            this.plugin.settings.fireColor = value;
            await this.plugin.saveSettings();
            this.plugin.updateStatusBar();
        })
    )
    .addColorPicker(cp => cp
        .setValue(this.plugin.settings.fireColor)
        .onChange(async (value) => {
            this.plugin.settings.fireColor = value;
            await this.plugin.saveSettings();
            this.plugin.updateStatusBar();
        })
    );

// 土色
new Setting(containerEl)
    .setName('Earth (土) Color')
    .setDesc('Color for Earth element (戊, 己, 辰, 戌, 丑, 未)')
    .addText(text => text
        .setValue(this.plugin.settings.earthColor)
        .onChange(async (value) => {
            this.plugin.settings.earthColor = value;
            await this.plugin.saveSettings();
            this.plugin.updateStatusBar();
        })
    )
    .addColorPicker(cp => cp
        .setValue(this.plugin.settings.earthColor)
        .onChange(async (value) => {
            this.plugin.settings.earthColor = value;
            await this.plugin.saveSettings();
            this.plugin.updateStatusBar();
        })
    );

// 金色
new Setting(containerEl)
    .setName('Metal (金) Color')
    .setDesc('Color for Metal element (庚, 辛, 申, 酉)')
    .addText(text => text
        .setValue(this.plugin.settings.metalColor)
        .onChange(async (value) => {
            this.plugin.settings.metalColor = value;
            await this.plugin.saveSettings();
            this.plugin.updateStatusBar();
        })
    )
    .addColorPicker(cp => cp
        .setValue(this.plugin.settings.metalColor)
        .onChange(async (value) => {
            this.plugin.settings.metalColor = value;
            await this.plugin.saveSettings();
            this.plugin.updateStatusBar();
        })
    );

// 水色
new Setting(containerEl)
    .setName('Water (水) Color')
    .setDesc('Color for Water element (壬, 癸, 亥, 子)')
    .addText(text => text
        .setValue(this.plugin.settings.waterColor)
        .onChange(async (value) => {
            this.plugin.settings.waterColor = value;
            await this.plugin.saveSettings();
            this.plugin.updateStatusBar();
        })
    )
    .addColorPicker(cp => cp
        .setValue(this.plugin.settings.waterColor)
        .onChange(async (value) => {
            this.plugin.settings.waterColor = value;
            await this.plugin.saveSettings();
            this.plugin.updateStatusBar();
        })
    );
    }
}

// GanZhi Calendar Plugin
export default class GanZhiCalendarPlugin extends Plugin {
    settings: GanZhiCalendarSettings;
    statusBarItem: HTMLElement;

    async onload(): Promise<void> {
        console.log('Loading GanZhi Calendar Plugin');
        
        // 加载设置
        await this.loadSettings();
        
        // 添加设置选项卡
        this.addSettingTab(new GanZhiCalendarSettingTab(this.app, this));
        
        // 添加命令：计算当前日期的干支历
        this.addCommand({
            id: 'calculate-current-date-ganzhi',
            name: 'Insert Current GanZhi Calendar',
            callback: () => {
                this.insertCurrentDateGanZhi();
            }
        });
        
        // 添加命令：计算指定日期的干支历
        this.addCommand({
            id: 'calculate-specific-date-ganzhi',
            name: 'Insert Specific Date GanZhi Calendar',
            callback: () => {
                this.openDatePickerModal();
            }
        });
        
        // 添加编辑器右键菜单
        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu, editor, view) => {
                // 插入今日干支历菜单项
                menu.addItem((item) => {
                    item
                        .setTitle("Insert Current GanZhi Calendar")
                        .setIcon("calendar")
                        .onClick(() => {
                            this.insertCurrentDateGanZhi();
                        });
                });
                
                // 插入指定日期干支历菜单项
                menu.addItem((item) => {
                    item
                        .setTitle("Insert Specific Date GanZhi Calendar")
                        .setIcon("calendar-plus")
                        .onClick(() => {
                            this.openDatePickerModal();
                        });
                });
            })
        );
        
        // 添加文件创建钩子，用于模板替换
        this.registerEvent(
            this.app.vault.on('create', async (file) => {
                // 只处理markdown文件，并确保是TFile类型
                if (file.path.endsWith('.md') && file instanceof TFile) {
                    setTimeout(async () => {
                        try {
                            const content = await this.app.vault.read(file);
                            if (content.includes(this.settings.templateTag)) {
                                // 替换模板标记
                                const now = new Date();
                                const ganzhiInfo = getGanZhi(
                                    now.getFullYear(),
                                    now.getMonth() + 1,
                                    now.getDate(),
                                    now.getHours(),
                                    now.getMinutes()
                                );
                                
                                const formattedGanZhi = formatSimpleGanZhi(ganzhiInfo, this.settings.colorize, this.settings);
                                const newContent = content.replace(
                                    this.settings.templateTag,
                                    formattedGanZhi
                                );
                                
                                await this.app.vault.modify(file, newContent);
                            }
                        } catch (error) {
                            console.error("Error processing template:", error);
                        }
                    }, 100); // 小延迟确保文件已完全创建
                }
            })
        );
        
        // 添加状态栏项目
        if (this.settings.showInStatusBar) {
            this.statusBarItem = this.addStatusBarItem();
            this.updateStatusBar();
            
            // 每分钟更新一次状态栏
            this.registerInterval(window.setInterval(() => this.updateStatusBar(), 60000));
        }
    }
    
    onunload(): void {
        console.log('Unloading GanZhi Calendar Plugin');
    }
    
    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    
    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }
    
    // 更新状态栏
    updateStatusBar(): void {
        if (!this.settings.showInStatusBar || !this.statusBarItem) return;
        
        const now = new Date();
        try {
            const ganzhiInfo = getGanZhi(
                now.getFullYear(),
                now.getMonth() + 1,
                now.getDate(),
                now.getHours(),
                now.getMinutes()
            );
            
            // 设置状态栏文本
            const statusText = formatStatusBarGanZhi(ganzhiInfo);
            
            if (this.settings.colorize) {
                // 设置彩色文本
                this.statusBarItem.empty();
                
                // 添加公历部分
                const solarPart = document.createTextNode(ganzhiInfo.solarDateTime + " ");
                this.statusBarItem.appendChild(solarPart);
                
                // 添加年柱
                const yearSpan = document.createElement('span');
                yearSpan.innerHTML = colorizeText(ganzhiInfo.yearGZ, this.settings);
                this.statusBarItem.appendChild(yearSpan);
                this.statusBarItem.appendChild(document.createTextNode('年 | '));
                
                // 添加月柱
                const monthSpan = document.createElement('span');
                monthSpan.innerHTML = colorizeText(ganzhiInfo.monthGZ, this.settings);
                this.statusBarItem.appendChild(monthSpan);
                this.statusBarItem.appendChild(document.createTextNode('月 | '));
                
                // 添加日柱
                const daySpan = document.createElement('span');
                daySpan.innerHTML = colorizeText(ganzhiInfo.dayGZ, this.settings);
                this.statusBarItem.appendChild(daySpan);
                this.statusBarItem.appendChild(document.createTextNode('日'));
                
                // 添加时柱（如果有）
                if (ganzhiInfo.hourGZ) {
                    this.statusBarItem.appendChild(document.createTextNode(' | '));
                    const hourSpan = document.createElement('span');
                    hourSpan.innerHTML = colorizeText(ganzhiInfo.hourGZ, this.settings);
                    this.statusBarItem.appendChild(hourSpan);
                    this.statusBarItem.appendChild(document.createTextNode('时'));
                }
            } else {
                // 设置纯文本
                this.statusBarItem.setText(statusText);
            }
            
            // 添加提示和点击事件
            this.statusBarItem.title = "GanZhi Calendar: Click to insert";
            this.statusBarItem.onclick = () => {
                this.insertCurrentDateGanZhi();
            };
            
            // 添加样式类
            this.statusBarItem.addClass("ganzhi-statusbar-item");
        } catch (error) {
            console.error("Failed to update status bar:", error);
            this.statusBarItem.setText("GanZhi Error");
        }
    }
    
    // 插入当前日期的干支历
    insertCurrentDateGanZhi(): void {
        try {
            const now = new Date();
            const ganzhiInfo = getGanZhi(
                now.getFullYear(),
                now.getMonth() + 1,
                now.getDate(),
                now.getHours(),
                now.getMinutes()
            );
            
            // 使用简洁格式
            const formattedGanZhi = formatSimpleGanZhi(ganzhiInfo, this.settings.colorize, this.settings);
            
            // 插入编辑器
            this.insertTextToEditor(formattedGanZhi);
        } catch (error) {
            console.error("计算干支历失败:", error);
            new Notice(`计算干支历失败: ${error.message}`);
        }
    }
    
    // 打开日期选择模态框
    openDatePickerModal(): void {
        const dateModal = new DatePickerModal(this.app, (year, month, day, hour, minute) => {
            try {
                const ganzhiInfo = getGanZhi(year, month, day, hour, minute);
                
                // 使用简洁格式
                const formattedGanZhi = formatSimpleGanZhi(ganzhiInfo, this.settings.colorize, this.settings);
                
                // 插入编辑器
                this.insertTextToEditor(formattedGanZhi);
            } catch (error) {
                console.error("计算干支历失败:", error);
                new Notice(`计算干支历失败: ${error.message}`);
            }
        });
        dateModal.open();
    }
    
    // 向编辑器插入文本
    insertTextToEditor(text: string) {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            const editor = activeView.editor;
            editor.replaceSelection(text);
        } else {
            new Notice('请先打开一个Markdown文件');
        }
    }
}