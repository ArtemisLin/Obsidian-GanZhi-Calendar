/**
 * 干支历转换 Obsidian 插件
 * 根据公元纪年计算干支纪年、干支纪月、干支纪日和干支纪时
 */

import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
// @ts-ignore
import { Lunar, Solar, JieQi } from 'lunar-javascript';

// 天干与地支数组
const TIAN_GAN: string[] = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const DI_ZHI: string[] = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const SIXTY_JIAZI: string[] = [];

// 初始化六十甲子表
for (let i = 0; i < 60; i++) {
    const tianGanIndex = i % 10;
    const diZhiIndex = i % 12;
    SIXTY_JIAZI.push(TIAN_GAN[tianGanIndex] + DI_ZHI[diZhiIndex]);
}

/**
 * 世纪常数表
 * 索引 0-4 分别对应第 17-21 世纪
 */
const CENTURY_CONSTANTS: number[] = [3, 47, 31, 15, 0];

/**
 * 月基数表
 * 索引 0-11 分别对应 1-12 月
 */
const MONTH_BASE: number[] = [0, 31, -1, 30, 0, 31, 1, 32, 3, 33, 4, 34];

/**
 * 天干纪月表
 * 表格形式:
 * {
 *    年干: [正月干, 二月干, ..., 十二月干]
 * }
 * 地支则固定为 寅、卯、辰、巳、午、未、申、酉、戌、亥、子、丑
 */
const MONTH_GAN_TABLE: Record<string, string[]> = {
    "甲": ["丙", "丁", "戊", "己", "庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁"],
    "乙": ["戊", "己", "庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁", "戊", "己"],
    "丙": ["庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛"],
    "丁": ["壬", "癸", "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"],
    "戊": ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸", "甲", "乙"],
    "己": ["丙", "丁", "戊", "己", "庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁"],
    "庚": ["戊", "己", "庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁", "戊", "己"],
    "辛": ["庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛"],
    "壬": ["壬", "癸", "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"],
    "癸": ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸", "甲", "乙"]
};

// 月支固定序列（正月起寅）
const MONTH_ZHI_SEQ: string[] = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];

// 二十四节气名称
const SOLAR_TERMS: string[] = [
    "小寒", "大寒", "立春", "雨水", "惊蛰", "春分",
    "清明", "谷雨", "立夏", "小满", "芒种", "夏至",
    "小暑", "大暑", "立秋", "处暑", "白露", "秋分",
    "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"
];

// 节气索引到干支月份的映射（从立春开始）
const TERM_TO_MONTH_INDEX: Record<number, number> = {
    2: 0,  // 立春 - 正月（寅月）
    4: 1,  // 惊蛰 - 二月（卯月）
    6: 2,  // 清明 - 三月（辰月）
    8: 3,  // 立夏 - 四月（巳月）
    10: 4, // 芒种 - 五月（午月）
    12: 5, // 小暑 - 六月（未月）
    14: 6, // 立秋 - 七月（申月）
    16: 7, // 白露 - 八月（酉月）
    18: 8, // 寒露 - 九月（戌月）
    20: 9, // 立冬 - 十月（亥月）
    22: 10, // 大雪 - 十一月（子月）
    0: 11  // 小寒 - 十二月（丑月）
};

/**
 * 计算公元年的天干地支（使用传统干支纪年算法）
 * @param year 公元年份
 * @returns 干支纪年
 */
function getYearGanZhi(year: number): string {
    try {
        // 尝试使用lunar-javascript
        const date = new Date(year, 1, 4); // 使用立春附近的日期
        const solar = Solar.fromDate(date);
        const lunar = solar.getLunar();
        
        // 获取当前日期所在年的干支
        return lunar.getYearInGanZhi();
    } catch (e) {
        console.error("使用lunar-javascript获取年干支失败，回退到传统算法", e);
        
        // 回退到传统算法
        // 计算天干
        const tianGanRemainder = year % 10;
        let tianGanIndex = tianGanRemainder - 3;
        if (tianGanIndex <= 0) {
            tianGanIndex += 10;
        }
        const tianGan = TIAN_GAN[tianGanIndex - 1];

        // 计算地支
        const diZhiRemainder = year % 12;
        let diZhiIndex = diZhiRemainder - 3;
        if (diZhiIndex <= 0) {
            diZhiIndex += 12;
        }
        const diZhi = DI_ZHI[diZhiIndex - 1];

        return tianGan + diZhi;
    }
}

/**
 * 获取当前日期所在的节气索引 (0-23)
 * @param year 公历年
 * @param month 公历月
 * @param day 公历日
 * @returns 节气索引，如果获取失败则返回-1
 */
function getSolarTermIndex(year: number, month: number, day: number): number {
    try {
        const solar = Solar.fromYmd(year, month, day);
        const lunar = solar.getLunar();
        
        // 尝试获取当前日期的节气信息
        // 根据lunar-javascript的API文档，我们可以使用以下方法之一：
        
        // 1. 尝试getJieQi方法
        if (typeof lunar.getJieQi === 'function') {
            const jieQi = lunar.getJieQi();
            if (jieQi) {
                // 查找节气在数组中的索引
                return SOLAR_TERMS.indexOf(jieQi);
            }
        }
        
        // 2. 尝试getTerm方法
        if (typeof lunar.getTerm === 'function') {
            const term = lunar.getTerm();
            if (term !== undefined && term >= 0) {
                return term;
            }
        }
        
        // 3. 如果以上方法都不可用，通过获取前一个节气和下一个节气来判断
        // 尝试查询上一个和下一个节气
        if (typeof lunar.getPrevJieQi === 'function' && typeof lunar.getNextJieQi === 'function') {
            const prevTerm = lunar.getPrevJieQi();
            const nextTerm = lunar.getNextJieQi();
            
            // 找到前一个节气的索引
            const prevIndex = SOLAR_TERMS.indexOf(prevTerm);
            // 计算当前所在的节气区间
            return prevIndex;
        }
        
        // 4. 如果以上方法都不可用，回退到基于月份的近似算法
        // 每个月大致对应两个节气，我们取月份*2作为估计
        return ((month - 1) * 2) % 24;
        
    } catch (e) {
        console.error("获取节气信息失败", e);
        return -1;
    }
}

/**
 * 计算公元月的天干地支（基于节气的准确算法）
 * @param year 公元年份
 * @param month 公元月份（1-12）
 * @param day 公元日期
 * @returns 干支纪月
 */
function getMonthGanZhi(year: number, month: number, day: number): string {
    // 确定年柱天干
    const yearGanZhi = getYearGanZhi(year);
    const yearGan = yearGanZhi.charAt(0);
    
    // 获取月干表
    const monthGans = MONTH_GAN_TABLE[yearGan];
    if (!monthGans) {
        console.error(`无法找到年干 ${yearGan} 对应的月干表`);
        return "未知";
    }
    
    // 获取当前日期所在的节气索引
    const termIndex = getSolarTermIndex(year, month, day);
    
    // 根据节气索引确定干支月份
    // 从立春开始，每两个节气对应一个干支月
    // 立春和雨水对应正月（寅月），惊蛰和春分对应二月（卯月），以此类推
    let monthIndex = -1;
    
    if (termIndex >= 0) {
        // 尝试从映射表中获取月份索引
        if (termIndex % 2 === 0) {
            // 如果是双数索引（小寒、立春等），直接查表
            monthIndex = TERM_TO_MONTH_INDEX[termIndex];
        } else {
            // 如果是奇数索引（大寒、雨水等），使用前一个节气的月份
            monthIndex = TERM_TO_MONTH_INDEX[(termIndex - 1 + 24) % 24];
        }
    }
    
    // 如果无法通过节气确定月份，回退到近似算法
    if (monthIndex === -1) {
        // 使用公历月近似推算
        if (month === 1) {
            monthIndex = 11; // 1月大部分时间是丑月
        } else if (month === 2) {
            monthIndex = 0;  // 2月大部分时间是寅月
        } else {
            monthIndex = (month - 2) % 12; // 其他月份
        }
    }
    
    // 获取月干和月支
    const monthGan = monthGans[monthIndex];
    const monthZhi = MONTH_ZHI_SEQ[monthIndex];
    
    return monthGan + monthZhi;
}

/**
 * 计算公元日的天干地支（高氏日柱公式）
 * @param year
 * @param month 
 * @param day 
 * @returns 
 */
function getDayGanZhi(year: number, month: number, day: number): string {
    try {
        // 尝试使用lunar-javascript
        const solar = Solar.fromYmd(year, month, day);
        const lunar = solar.getLunar();
        return lunar.getDayInGanZhi();
    } catch (e) {
        console.error("使用lunar-javascript获取日干支失败，回退到高氏日柱公式", e);
        
        // 回退到高氏日柱公式
        // 计算s：年份后两位数-1
        const s = (year % 100) - 1;
        
        // 计算s/4的整数商和余数
        const sDiv4 = Math.floor(s / 4);
        const u = s % 4;
        
        // 获取月基数
        const m = MONTH_BASE[month - 1];
        
        // 获取世纪常数
        const century = Math.floor(year / 100);
        let x = 0;
        
        if (century >= 16 && century <= 20) {
            x = CENTURY_CONSTANTS[century - 16];
        } else if (century >= 21) {
            x = CENTURY_CONSTANTS[4]; // 21世纪
        }
        
        // 计算日柱的60甲子序号
        let r = sDiv4 * 6 + 5 * (sDiv4 * 3 + u) + m + day + x;
        
        // 闰年2月之后需要加1
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        if (isLeapYear && month > 2) {
            r += 1;
        }
        
        // 计算干支序号（余数为0表示第60个）
        const ganzhiIndex = r % 60;
        const index = ganzhiIndex === 0 ? 59 : ganzhiIndex - 1;
        
        return SIXTY_JIAZI[index];
    }
}

/**
 * 计算时辰的天干地支
 * @param dayGanZhi 当日干支
 * @param hour 小时（0-23）
 * @returns 干支纪时
 */
function getHourGanZhi(dayGanZhi: string, hour: number): string {
    try {
        // 尝试使用lunar-javascript
        // 需要先获取当天的日期
        const date = new Date();
        date.setHours(hour);
        
        const solar = Solar.fromDate(date);
        const lunar = solar.getLunar();
        
        // 计算时辰索引（0-11）
        const timeIndex = Math.floor((hour + 1) / 2) % 12;
        
        return lunar.getTimeInGanZhi(timeIndex);
    } catch (e) {
        console.error("使用lunar-javascript获取时干支失败，回退到传统算法", e);
        
        // 回退到传统算法
        // 将小时转换为时辰（每两小时一个时辰，从23点开始算子时）
        const timeIndex = Math.floor((hour + 1) / 2) % 12;
        const dayGan = dayGanZhi.charAt(0);
        
        // 根据日干确定子时（第一个时辰）的天干起始位置
        let startGanIndex = 0;
        
        if (dayGan === "甲" || dayGan === "己") {
            startGanIndex = TIAN_GAN.indexOf("甲");
        } else if (dayGan === "乙" || dayGan === "庚") {
            startGanIndex = TIAN_GAN.indexOf("丙");
        } else if (dayGan === "丙" || dayGan === "辛") {
            startGanIndex = TIAN_GAN.indexOf("戊");
        } else if (dayGan === "丁" || dayGan === "壬") {
            startGanIndex = TIAN_GAN.indexOf("庚");
        } else if (dayGan === "戊" || dayGan === "癸") {
            startGanIndex = TIAN_GAN.indexOf("壬");
        }
        
        // 计算当前时辰的天干和地支
        const hourGanIndex = (startGanIndex + timeIndex) % 10;
        const hourZhiIndex = timeIndex;
        
        return TIAN_GAN[hourGanIndex] + DI_ZHI[hourZhiIndex];
    }
}

/**
 * 获取完整的公历日期对应的干支历
 * @param year 公元年份
 * @param month 公元月份（1-12）
 * @param day 公元日期
 * @param hour 小时（0-23）
 * @returns 完整的干支历信息
 */
function getFullGanZhi(year: number, month: number, day: number, hour: number = -1): {
    yearGanZhi: string;
    monthGanZhi: string;
    dayGanZhi: string;
    hourGanZhi: string | null;
} {
    const yearGanZhi = getYearGanZhi(year);
    const monthGanZhi = getMonthGanZhi(year, month, day);
    const dayGanZhi = getDayGanZhi(year, month, day);
    
    let hourGanZhi = null;
    if (hour >= 0 && hour <= 23) {
        hourGanZhi = getHourGanZhi(dayGanZhi, hour);
    }
    
    return {
        yearGanZhi,
        monthGanZhi,
        dayGanZhi,
        hourGanZhi
    };
}

/**
 * 获取农历日期信息（仅用于显示）
 * @param year 公历年
 * @param month 公历月
 * @param day 公历日
 * @returns 农历日期字符串
 */
function getLunarDateString(year: number, month: number, day: number): string {
    try {
        const solar = Solar.fromYmd(year, month, day);
        const lunar = solar.getLunar();
        return `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
    } catch (e) {
        console.error("获取农历日期失败:", e);
        return "农历日期获取失败";
    }
}

/**
 * 获取当前日期的节气信息
 * @param year 公历年
 * @param month 公历月
 * @param day 公历日
 * @returns 节气信息字符串
 */
function getSolarTermInfo(year: number, month: number, day: number): string {
    try {
        const termIndex = getSolarTermIndex(year, month, day);
        if (termIndex >= 0) {
            return `当前节气区间: ${SOLAR_TERMS[termIndex]}`;
        } else {
            return "无法获取节气信息";
        }
    } catch (e) {
        console.error("获取节气信息失败:", e);
        return "节气信息获取失败";
    }
}

// 插件设置接口
interface GanZhiCalendarSettings {
    defaultFormat: string;
    showSolarTerm: boolean;
}

// 默认设置
const DEFAULT_SETTINGS: GanZhiCalendarSettings = {
    defaultFormat: 'YYYY年MM月DD日',
    showSolarTerm: true
};

// 日期输入弹窗类
class DateInputModal extends Modal {
    year: number;
    month: number;
    day: number;
    hour: number;
    onSubmit: (year: number, month: number, day: number, hour: number) => void;
    
    constructor(app: App, onSubmit: (year: number, month: number, day: number, hour: number) => void) {
        super(app);
        const now = new Date();
        this.year = now.getFullYear();
        this.month = now.getMonth() + 1;
        this.day = now.getDate();
        this.hour = now.getHours();
        this.onSubmit = onSubmit;
    }
    
    onOpen(): void {
        const {contentEl} = this;
        
        contentEl.createEl('h2', {text: '输入日期'});
        
        // 年份输入
        new Setting(contentEl)
            .setName('年份')
            .addText(text => text
                .setValue(this.year.toString())
                .onChange(value => {
                    this.year = parseInt(value) || this.year;
                }));
        
        // 月份输入
        new Setting(contentEl)
            .setName('月份')
            .addText(text => text
                .setValue(this.month.toString())
                .onChange(value => {
                    const monthValue = parseInt(value) || this.month;
                    this.month = Math.max(1, Math.min(12, monthValue));
                }));
        
        // 日期输入
        new Setting(contentEl)
            .setName('日期')
            .addText(text => text
                .setValue(this.day.toString())
                .onChange(value => {
                    const dayValue = parseInt(value) || this.day;
                    this.day = Math.max(1, Math.min(31, dayValue));
                }));
        
        // 小时输入
        new Setting(contentEl)
            .setName('小时 (可选)')
            .addText(text => text
                .setValue(this.hour.toString())
                .setPlaceholder('0-23')
                .onChange(value => {
                    if (value === '') {
                        this.hour = -1;
                    } else {
                        const hourValue = parseInt(value) || this.hour;
                        this.hour = Math.max(0, Math.min(23, hourValue));
                    }
                }));
        
        // 提交按钮
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('计算干支历')
                .setCta()
                .onClick(() => {
                    this.close();
                    this.onSubmit(this.year, this.month, this.day, this.hour);
                }));
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
        
        containerEl.createEl('h2', {text: '干支历转换设置'});
        
        new Setting(containerEl)
            .setName('默认日期格式')
            .setDesc('设置默认的日期格式')
            .addText(text => text
                .setPlaceholder('YYYY年MM月DD日')
                .setValue(this.plugin.settings.defaultFormat)
                .onChange(async (value) => {
                    this.plugin.settings.defaultFormat = value;
                    await this.plugin.saveSettings();
                }));
        
        new Setting(containerEl)
            .setName('显示节气信息')
            .setDesc('在结果中显示当前日期所处的节气区间')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showSolarTerm)
                .onChange(async (value) => {
                    this.plugin.settings.showSolarTerm = value;
                    await this.plugin.saveSettings();
                }));
    }
}

// 干支历主插件类
export default class GanZhiCalendarPlugin extends Plugin {
    settings: GanZhiCalendarSettings;

    async onload(): Promise<void> {
        console.log('加载干支历转换插件');
        
        // 加载设置
        await this.loadSettings();
        
        // 添加设置选项卡
        this.addSettingTab(new GanZhiCalendarSettingTab(this.app, this));
        
        // 添加命令：计算当前日期的干支历
        this.addCommand({
            id: 'calculate-current-date-ganzhi',
            name: '计算今日干支历',
            callback: () => {
                this.insertCurrentDateGanZhi();
            }
        });
        
        // 添加命令：计算指定日期的干支历
        this.addCommand({
            id: 'calculate-specific-date-ganzhi',
            name: '计算指定日期干支历',
            callback: () => {
                this.openDatePickerModal();
            }
        });
        
        // 添加编辑器右键菜单
        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu, editor, view) => {
                menu.addItem((item) => {
                    item
                        .setTitle("插入今日干支历")
                        .setIcon("calendar")
                        .onClick(() => {
                            this.insertCurrentDateGanZhi();
                        });
                });
                
                menu.addItem((item) => {
                    item
                        .setTitle("插入指定日期干支历")
                        .setIcon("calendar-plus")
                        .onClick(() => {
                            this.openDatePickerModal();
                        });
                });
            })
        );
    }
    
    onunload(): void {
        console.log('卸载干支历转换插件');
    }
    
    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    
    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }
    
    // 插入当前日期的干支历
    insertCurrentDateGanZhi(): void {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const hour = now.getHours();
        
        const ganzhiDate = getFullGanZhi(year, month, day, hour);
        
        // 获取农历信息用于显示
        const lunarDate = getLunarDateString(year, month, day);
        
        // 格式化结果
        let result = `# ${year}年${month}月${day}日 干支历\n\n`;
        result += `- 农历：${lunarDate}\n`;
        
        // 如果设置了显示节气信息，添加节气信息
        if (this.settings.showSolarTerm) {
            const termInfo = getSolarTermInfo(year, month, day);
            result += `- ${termInfo}\n`;
        }
        
        result += `- 年柱：${ganzhiDate.yearGanZhi}年\n`;
        result += `- 月柱：${ganzhiDate.monthGanZhi}月\n`;
        result += `- 日柱：${ganzhiDate.dayGanZhi}日\n`;
        
        if (ganzhiDate.hourGanZhi) {
            result += `- 时柱：${ganzhiDate.hourGanZhi}时\n`;
        }
        
        // 插入编辑器
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            const editor = activeView.editor;
            editor.replaceSelection(result);
        } else {
            new Notice('请先打开一个Markdown文件');
        }
    }
    
    // 打开日期选择模态框
    openDatePickerModal(): void {
        const dateModal = new DateInputModal(this.app, (year, month, day, hour) => {
            const ganzhiDate = getFullGanZhi(year, month, day, hour);
            
            // 获取农历信息用于显示
            const lunarDate = getLunarDateString(year, month, day);
            
            // 格式化结果
            let result = `# ${year}年${month}月${day}日 干支历\n\n`;
            result += `- 农历：${lunarDate}\n`;
            
            // 如果设置了显示节气信息，添加节气信息
            if (this.settings.showSolarTerm) {
                const termInfo = getSolarTermInfo(year, month, day);
                result += `- ${termInfo}\n`;
            }
            
            result += `- 年柱：${ganzhiDate.yearGanZhi}年\n`;
            result += `- 月柱：${ganzhiDate.monthGanZhi}月\n`;
            result += `- 日柱：${ganzhiDate.dayGanZhi}日\n`;
            
            if (ganzhiDate.hourGanZhi) {
                result += `- 时柱：${ganzhiDate.hourGanZhi}时\n`;
            }
            
            // 插入编辑器
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (activeView) {
                const editor = activeView.editor;
                editor.replaceSelection(result);
            } else {
                new Notice('请先打开一个Markdown文件');
            }
        });
        dateModal.open();
    }
}

// 导出函数，方便其他插件或模块使用
export {
    getYearGanZhi,
    getMonthGanZhi,
    getDayGanZhi,
    getHourGanZhi,
    getFullGanZhi
};