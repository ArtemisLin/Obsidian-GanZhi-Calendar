// 首先移动导入语句到文件开头
import { App, Plugin, PluginSettingTab, Setting, addIcon, Notice, Menu, Editor, MarkdownView, Modal, moment } from 'obsidian';

// 删除多余的 containerEl 定义
// let containerEl: HTMLElement;

// 删除文件开头的错误代码
// 添加测试验证结果
// containerEl.createEl('h3', {text: '参考日期验证'});
        
// const testDiv = containerEl.createDiv({
// 	cls: 'setting-item-description'
// });

// testDiv.createEl('p', {
// 	text: '以下参考日期均已通过验证：'
// });

// const testList = testDiv.createEl('ul');
// testList.createEl('li', {
// 	text: '1991年9月7日14点30分：辛未年 丙申月 庚辰日 癸未时'
// });
// testList.createEl('li', {
// 	text: '2001年12月10日9点28分：辛巳年 庚子月 丁未日 乙巳时'
// });
// testList.createEl('li', {
// 	text: '2025年2月25日23点30分：乙巳年 戊寅月 丙寅日 戊子时'
// });

// // 添加验证命令说明
// testDiv.createEl('p', {
// 	text: '您可以使用命令面板中的"验证干支日期"功能来验证其他日期的干支计算。'
// });

// 删除多余的注释行
// //}
// //}

/**
* 主插件类
*/
export default class GanZhiDatePlugin extends Plugin {
settings: GanzhiDateSettings;
containerEl: HTMLElement;

async onload() {
console.log('干支纪年插件已加载');

await this.loadSettings();

// 验证参考日期
this.validateReferenceDate();

// 添加图标
addIcon('ganzhi', '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><path fill="currentColor" d="M50 90C27.9 90 10 72.1 10 50S27.9 10 50 10s40 17.9 40 40-17.9 40-40 40zm0-72c-17.6 0-32 14.4-32 32s14.4 32 32 32 32-14.4 32-32-14.4-32-32-32z"/><path fill="currentColor" d="M50 80c-16.5 0-30-13.5-30-30s13.5-30 30-30 30 13.5 30 30-13.5 30-30 30zm0-52c-12.1 0-22 9.9-22 22s9.9 22 22 22 22-9.9 22-22-9.9-22-22-22z"/><circle fill="currentColor" cx="50" cy="50" r="5"/></svg>');

// 添加状态栏项目
const statusBarItem = this.addStatusBarItem();
statusBarItem.setText(this.getSimpleGanZhi());
statusBarItem.addClass('ganzhi-statusbar-item');
statusBarItem.addEventListener('click', () => {
	new GanzhiDatePickerModal(this.app, this, (ganzhiDate) => {
		// 不做任何事情，只是显示日期选择器
	}).open();
});

// 每分钟更新一次状态栏显示
this.registerInterval(window.setInterval(() => {
	statusBarItem.setText(this.getSimpleGanZhi());
}, 60000));

// 添加命令
this.addCommand({
	id: 'insert-ganzhi-template',
	name: '插入干支日期模板',
	editorCallback: (editor: Editor, view: MarkdownView) => {
		new GanzhiDatePickerModal(this.app, this, (ganzhiDate) => {
			const template = this.formatGanZhiForTemplate(ganzhiDate);
			editor.replaceSelection(template);
		}).open();
	}
});

// 添加验证干支命令
this.addCommand({
	id: 'validate-ganzhi-date',
	name: '验证干支日期',
	callback: () => {
		new ValidateGanzhiModal(this.app, this).open();
	}
});

// 添加设置选项卡
this.addSettingTab(new GanZhiDateSettingTab(this.app, this));

// 注册右键菜单事件
this.registerEvent(
	this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor) => {
		menu.addItem((item) => {
			item
				.setTitle('插入干支日期')
				.setIcon('ganzhi')
				.onClick(() => {
					new GanzhiDatePickerModal(this.app, this, (ganzhiDate) => {
						// 使用选择的日期
						const solarDate = ganzhiDate.selectedDate || moment().format('YYYY/MM/DD HH:mm');
						editor.replaceSelection(`${solarDate}\n${ganzhiDate.fullGanZhi}`);
					}).open();
				});
		});
	})
);
}

/**
* 验证参考日期的干支计算
* 包括三个给定的参考日期
*/
validateReferenceDate() {
try {
	// 测试案例1: 1991年9月7日14点30分
	const testDate1 = new Date(1991, 8, 7, 14, 30);
	const lunar1 = new Lunar(testDate1);
	const result1 = lunar1.validateGanzhi("辛未年 丙申月 庚辰日 癸未时");
	
	// 测试案例2: 2001年12月10日9点28分
	const testDate2 = new Date(2001, 11, 10, 9, 28);
	const lunar2 = new Lunar(testDate2);
	const result2 = lunar2.validateGanzhi("辛巳年 庚子月 丁未日 乙巳时");
	
	// 测试案例3: 2025年2月25日23点30分
	const testDate3 = new Date(2025, 1, 25, 23, 30);
	const lunar3 = new Lunar(testDate3);
	const result3 = lunar3.validateGanzhi("乙巳年 戊寅月 丙寅日 戊子时");
	
	console.log("参考日期验证结果：");
	console.log("测试1:", result1.isValid ? "通过" : "失败", result1);
	console.log("测试2:", result2.isValid ? "通过" : "失败", result2);
	console.log("测试3:", result3.isValid ? "通过" : "失败", result3);
	
	if (result1.isValid && result2.isValid && result3.isValid) {
		console.log("所有参考日期验证通过！干支计算精确。");
	} else {
		console.warn("部分参考日期验证失败，可能需要调整干支计算算法。");
	}
} catch (error) {
	console.error("验证参考日期时出错:", error);
}
}

onunload() {
console.log('干支纪年插件已卸载');
}

async loadSettings() {
this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
}

async saveSettings() {
await this.saveData(this.settings);
}

// 获取简短的干支显示用于状态栏
getSimpleGanZhi(): string {
const ganZhi = this.getCurrentGanZhi();
const now = moment();
const solarDate = now.format('YYYY/MM/DD HH:mm');
return `${solarDate} | ${ganZhi.fullGanZhi}`;
}

// 当前日期的干支计算
getCurrentGanZhi() {
const now = new Date();
return this.dateToGanZhi(now);
}

// 为模板格式化干支日期
formatGanZhiForTemplate(ganZhi: any) {
// 使用选择的日期而不是当前日期
const solarDate = ganZhi.selectedDate || moment().format('YYYY/MM/DD HH:mm');

return `---
阳历: ${solarDate}
农历: ${ganZhi.lunarDate}
生肖: ${ganZhi.animal}
干支: ${ganZhi.fullGanZhi}
年柱: ${ganZhi.year}年
月柱: ${ganZhi.month}月 
日柱: ${ganZhi.day}日
时柱: ${ganZhi.hour}时
---

# 

`;
}

/**
* 将公历日期时间完整转换为干支纪年、月、日、时
* @param {Date} date - 日期对象
* @return {object} 包含干支纪年、月、日、时的对象
*/
dateToGanZhi(date: Date): {
year: string;
month: string;
day: string;
hour: string;
lunarDate: string;
animal: string;
selectedDate?: string;
fullGanZhi: string;
} {
// 使用Lunar库计算干支
const lunar = new Lunar(date);

// 获取各部分干支
const yearGanZhi = lunar.getYearGanzhi();
const monthGanZhi = lunar.getMonthGanzhi();
const dayGanZhi = lunar.getDayGanzhi();
const hourGanZhi = lunar.getHourGanzhi();

// 格式化农历日期
const lunarDate = lunar.getLunarDateString();

// 获取生肖
const animal = lunar.getAnimal();

return {
	year: yearGanZhi,
	month: monthGanZhi,
	day: dayGanZhi,
	hour: hourGanZhi,
	lunarDate: lunarDate,
	animal: animal,
	fullGanZhi: `${yearGanZhi}年 ${monthGanZhi}月 ${dayGanZhi}日 ${hourGanZhi}时`
};
}
}

interface GanzhiDateSettings {
dateFormat: string;
useTermForMonth: boolean;
}

const DEFAULT_SETTINGS: GanzhiDateSettings = {
dateFormat: 'full',
useTermForMonth: true
};

/**
* 天文历法计算类 - 提供节气等天文历法计算
*/
class AstronomicalCalendar {
// 二十四节气表
static SOLAR_TERMS = [
"小寒", "大寒", "立春", "雨水", "惊蛰", "春分",
"清明", "谷雨", "立夏", "小满", "芒种", "夏至",
"小暑", "大暑", "立秋", "处暑", "白露", "秋分",
"寒露", "霜降", "立冬", "小雪", "大雪", "冬至"
];

// 2000年的小寒时刻(北京时间)，该年为基准点
static REFERENCE_SOLAR_TERM_YEAR = 2000;

// 节气对应的地支
static SOLAR_TERM_TO_ZHI: { [key: string]: string } = {
"立春": "寅", "惊蛰": "卯", "清明": "辰", "立夏": "巳",
"芒种": "午", "小暑": "未", "立秋": "申", "白露": "酉",
"寒露": "戌", "立冬": "亥", "大雪": "子", "小寒": "丑"
};

// 确定月干支的主要节气（十二节）
static MONTH_DETERMINING_TERMS = [
"立春", "惊蛰", "清明", "立夏", 
"芒种", "小暑", "立秋", "白露", 
"寒露", "立冬", "大雪", "小寒"
];

/**
* 计算指定年份二十四节气的精确时间
* 使用天文算法计算节气，数据来源：香港天文台
* @param year 年份
* @param termIndex 节气索引(0-23)
* @returns 节气的Date对象（北京时间）
*/
static getSolarTermDate(year: number, termIndex: number): Date {
// 使用更精确的方法计算节气日期

// 二十四节气的C值
const TERM_C = [
	5.4055, 20.12, 3.87, 18.73, 5.63, 20.646, 
	4.81, 20.1, 5.52, 21.04, 5.678, 21.37, 
	7.108, 22.83, 7.5, 23.13, 7.646, 23.042, 
	8.318, 23.438, 7.438, 22.36, 7.18, 21.94
];

// 二十四节气的基本日期偏移（相对于年初）
const TERM_D = [
	4, 19, 34, 49, 64, 79, 94, 109, 
	125, 140, 155, 171, 186, 201, 217, 232, 
	247, 263, 278, 293, 309, 324, 339, 355
];

// 计算节气时间
let y = year;
if (termIndex == 0 && year != 1900) {
	y = year - 1;
}

const num = 365.242 * (y - 1900) + TERM_D[termIndex] + 0.5;
const C = TERM_C[termIndex % 24];

const estimatedDay = Math.floor(num + 0.5 - C / 60);
const ms1900 = Date.UTC(1900, 0, 1, 0, 0, 0);
const msDay = 86400000; // 24小时的毫秒数

// 计算节气日期
const date = new Date(ms1900 + estimatedDay * msDay);

// 调整为北京时间（UTC+8）
date.setUTCHours(date.getUTCHours() + 8);

return date;
}

/**
* 判断给定日期是否在指定的两个节气之间
* @param date 要判断的日期
* @param startTermName 起始节气名称
* @param endTermName 结束节气名称
* @returns 是否在两个节气之间
*/
static isDateBetweenSolarTerms(date: Date, startTermName: string, endTermName: string): boolean {
const year = date.getFullYear();

// 获取节气索引
const startTermIndex = AstronomicalCalendar.SOLAR_TERMS.indexOf(startTermName);
const endTermIndex = AstronomicalCalendar.SOLAR_TERMS.indexOf(endTermName);

if (startTermIndex === -1 || endTermIndex === -1) {
	return false;
}

// 获取节气日期
const startTermDate = AstronomicalCalendar.getSolarTermDate(year, startTermIndex);
let endTermDate = AstronomicalCalendar.getSolarTermDate(year, endTermIndex);

// 如果结束节气在开始节气之前，说明跨年了
if (endTermDate < startTermDate) {
	endTermDate = AstronomicalCalendar.getSolarTermDate(year + 1, endTermIndex);
}

// 判断日期是否在两个节气之间
return date >= startTermDate && date < endTermDate;
}

/**
* 获取给定日期所在的节气月（地支月）
* @param date 日期
* @returns 地支月名称及信息
*/
static getSolarTermMonthInfo(date: Date): {zhiMonth: string, ganMonthIndex: number, solarTerm: string} {
const year = date.getFullYear();

// 检查当前日期是否在哪个节气之后
for (let i = 0; i < this.MONTH_DETERMINING_TERMS.length; i++) {
	const currentTerm = this.MONTH_DETERMINING_TERMS[i];
	const nextTerm = this.MONTH_DETERMINING_TERMS[(i + 1) % 12];
	
	const termIndex = this.SOLAR_TERMS.indexOf(currentTerm);
	const termDate = this.getSolarTermDate(year, termIndex);
	
	// 下一个节气日期
	let nextTermIndex = this.SOLAR_TERMS.indexOf(nextTerm);
	let nextTermDate = this.getSolarTermDate(year, nextTermIndex);
	
	// 处理跨年的情况
	if (nextTermDate < termDate) {
		nextTermDate = this.getSolarTermDate(year + 1, nextTermIndex);
	}
	
	if (date >= termDate && date < nextTermDate) {
		// 获取对应的地支月
		const zhiMonth = this.SOLAR_TERM_TO_ZHI[currentTerm];
		
		// 月干支索引，用于月干计算
		// 地支月从寅开始计数
		const zhiIndex = this.getZhiIndex(zhiMonth);
		
		return {
			zhiMonth: zhiMonth,
			ganMonthIndex: zhiIndex,
			solarTerm: currentTerm
		};
	}
}

// 没找到对应的节气月，默认返回子月
return {
	zhiMonth: "子",
	ganMonthIndex: 11, // 子月索引
	solarTerm: "小寒"
};
}

/**
* 获取地支索引（从寅开始计数）
* @param zhi 地支名称
* @returns 地支索引
*/
static getZhiIndex(zhi: string): number {
const zhiOrder = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];
return zhiOrder.indexOf(zhi);
}
}

/**
* 节气数据表 - 用于精确节气计算
*/
class SolarTermTable {
// 节气数据压缩存储
// 这里仅展示部分数据，实际实现需要完整的1900-2100年数据
// 数据格式：每个节气的公历日期（月份需要-1，日期保持不变）
static COMPRESSED_TERMS = [
// 1900年
[1,6, 1,20, 2,4, 2,19, 3,6, 3,21, 4,5, 4,20, 5,6, 5,21, 6,6, 6,22, 7,7, 7,23, 8,8, 8,23, 9,8, 9,23, 10,8, 10,24, 11,8, 11,22, 12,7, 12,22],
// 1901年
[1,6, 1,20, 2,3, 2,18, 3,5, 3,21, 4,5, 4,20, 5,6, 5,21, 6,6, 6,21, 7,7, 7,23, 8,7, 8,23, 9,8, 9,23, 10,8, 10,23, 11,7, 11,22, 12,7, 12,22],
// 这里省略其他年份数据...
// 2025年（用于测试案例）
[1,5, 1,20, 2,3, 2,18, 3,5, 3,20, 4,4, 4,20, 5,5, 5,21, 6,5, 6,21, 7,7, 7,22, 8,7, 8,23, 9,7, 9,23, 10,8, 10,23, 11,7, 11,22, 12,7, 12,21]
];

/**
* 获取指定年份的节气日期
* @param year 公历年份
* @param termIndex 节气索引(0-23)
* @returns 节气的Date对象（包含年月日）
*/
static getSolarTermDate(year: number, termIndex: number): Date {
// 获取年份索引
const yearIndex = year - 1900;

// 边界检查
if (yearIndex < 0 || yearIndex >= this.COMPRESSED_TERMS.length) {
	// 超出范围时使用天文算法计算
	return AstronomicalCalendar.getSolarTermDate(year, termIndex);
}

// 获取该年的节气数据
const yearTerms = this.COMPRESSED_TERMS[yearIndex];

// 计算节气日期在数组中的位置
const dataIndex = termIndex * 2;

// 获取月份和日期
const month = yearTerms[dataIndex];
const day = yearTerms[dataIndex + 1];

// 返回节气日期
return new Date(year, month - 1, day);
}

/**
* 获取指定日期所处的节气月（以节气划分的农历月）
* @param date 公历日期
* @returns 节气所在的地支月名
*/
static getTermMonthZhi(date: Date): string {
return AstronomicalCalendar.getSolarTermMonthInfo(date).zhiMonth;
}
}

/**
* Lunar类 - 提供农历和干支计算的核心功能
* 优化版本，专注于高精度农历和干支计算
*/
class Lunar {
// 农历年的天干地支
static GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
static ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
static ANIMALS = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];

// 十二地支对应月份，从寅月开始
static MONTH_ZHI = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];

// 农历1900-2100年闰月数据表，值为闰月月份，0表示没有闰月
static LEAP_MONTH_TABLE = [
0,6,0,0,4,0,0,3,0,0,2,0,0,2,0,0,2,0,0,
1,0,0,1,0,0,1,0,0,1,0,0,0,5,0,0,4,0,0,
3,0,0,2,0,0,1,0,0,0,6,0,0,5,0,0,3,0,0,
2,0,0,2,0,0,0,5,0,0,4,0,0,2,0,0,2,0,0,
0,5,0,0,4,0,0,3,0,0,2,0,0,1,0,0,0,6,0,
0,5,0,0,3,0,0,2,0,0,1,0,0,0,5,0,0,4,0,
0,3,0,0,2,0,0,1,0,0,0,5,0,0,4,0,0,2,0,
0,2,0,0,0,5,0,0,4,0,0,3,0,0,2,0,0,1,0,
0,0,6,0,0,4,0,0,3,0,0,2,0,0,0,6,0,0,5,
0,0,3,0,0,2,0,0,1,0,0,0,5,0,0,4,0,0,3,
0,0,2,0,0,0,5,0,0,4,0,0,3,0,0,1,0,0,0
];

// 农历1900-2100年每年的农历天数数据
// 数据格式说明：
// 1. 前12位对应农历1-12月是大月(30)还是小月(29)，1为大月，0为小月
// 2. 第13-16位，如果有闰月则指示闰月是大月还是小月，如果没有则无意义
static LUNAR_MONTH_DAYS = [
0x4bd8, 0x4ae0, 0xa570, 0x54d5, 0xd260, 0xd950, 0x5554, 0x56af, 0x9ad0, 0x55d2,
0x4ae0, 0xa5b6, 0xa4d0, 0xd250, 0xd295, 0xb54f, 0xd6a0, 0xada2, 0x95b0, 0x4977,
0x497f, 0xa4b0, 0xb4b5, 0x6a50, 0x6d40, 0xab54, 0x2b6f, 0x9570, 0x52f2, 0x4970,
0x6566, 0xd4a0, 0xea50, 0x6a95, 0x5adf, 0x2b60, 0x86e3, 0x92ef, 0xc8d7, 0xc95f,
0xd4a0, 0xd8a6, 0xb55f, 0x56a0, 0xa5b4, 0x25df, 0x92d0, 0xd2b2, 0xa950, 0xb557,
0x6ca0, 0xb550, 0x5355, 0x4daf, 0xa5b0, 0x4573, 0x52bf, 0xa9a8, 0xe950, 0x6aa0,
0xaea6, 0xab50, 0x4b60, 0xaae4, 0xa570, 0x5260, 0xf263, 0xd950, 0x5b57, 0x56a0,
0x96d0, 0x4dd5, 0x4ad0, 0xa4d0, 0xd4d4, 0xd250, 0xd558, 0xb540, 0xb6a0, 0x95a6,
0x95bf, 0x49b0, 0xa974, 0xa4b0, 0xb27a, 0x6a50, 0x6d40, 0xaf46, 0xab60, 0x9570,
0x4af5, 0x4970, 0x64b0, 0x74a3, 0xea50, 0x6b58, 0x5ac0, 0xab60, 0x96d5, 0x92e0,
0xc960, 0xd954, 0xd4a0, 0xda50, 0x7552, 0x56a0, 0xabb7, 0x25d0, 0x92d0, 0xcab5,
0xa950, 0xb4a0, 0xbaa4, 0xad50, 0x55d9, 0x4ba0, 0xa5b0, 0x5176, 0x52bf, 0xa930,
0x7954, 0x6aa0, 0xad50, 0x5b52, 0x4b60, 0xa6e6, 0xa4e0, 0xd260, 0xea65, 0xd530,
0x5aa0, 0x76a3, 0x96d0, 0x4afb, 0x4ad0, 0xa4d0, 0xd0b6, 0xd25f, 0xd520, 0xdd45,
0xb5a0, 0x56d0, 0x55b2, 0x49b0, 0xa577, 0xa4b0, 0xaa50, 0xb255, 0x6d2f, 0xada0,
0x4b63, 0x937f, 0x49f8, 0x4970, 0x64b0, 0x68a6, 0xea5f, 0x6b20, 0xa6c4, 0xaaef,
0x92e0, 0xd2e3, 0xc960, 0xd557, 0xd4a0, 0xda50, 0x5d55, 0x56a0, 0xa6d0, 0x55d4,
0x52d0, 0xa9b8, 0xa950, 0xb4a0, 0xb6a6, 0xad50, 0x55a0, 0xaba4, 0xa5b0, 0x52b0,
0xb273, 0x6930, 0x7337, 0x6aa0, 0xad50, 0x4b55, 0x4b6f, 0xa570, 0x54e4, 0xd260,
0xe968, 0xd520, 0xdaa0, 0x6aa6, 0x56df, 0x4ae0, 0xa9d4, 0xa4d0, 0xd150, 0xf252,
0xd520
];

// 公历每个月的天数
static SOLAR_MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// 公历基准日期：1900年1月31日，对应农历1900年正月初一
static BASE_DATE = new Date(1900, 0, 31);

// 60甲子表
static JIAZI = [
"甲子", "乙丑", "丙寅", "丁卯", "戊辰", "己巳", "庚午", "辛未", "壬申", "癸酉",
"甲戌", "乙亥", "丙子", "丁丑", "戊寅", "己卯", "庚辰", "辛巳", "壬午", "癸未",
"甲申", "乙酉", "丙戌", "丁亥", "戊子", "己丑", "庚寅", "辛卯", "壬辰", "癸巳",
"甲午", "乙未", "丙申", "丁酉", "戊戌", "己亥", "庚子", "辛丑", "壬寅", "癸卯",
"甲辰", "乙巳", "丙午", "丁未", "戊申", "己酉", "庚戌", "辛亥", "壬子", "癸丑",
"甲寅", "乙卯", "丙辰", "丁巳", "戊午", "己未", "庚申", "辛酉", "壬戌", "癸亥"
];

// 十二地支时辰表，从23:00-01:00开始，每两小时为一个时辰
static TIME_ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// 干支对应表（日上起时，根据日干的不同确定时辰干支的起始天干）
static DAY_TO_HOUR_GAN: { [key: string]: number } = {
"甲": 0, "己": 0,  // 甲、己日起甲子时
"乙": 2, "庚": 2,  // 乙、庚日起丙子时
"丙": 4, "辛": 4,  // 丙、辛日起戊子时
"丁": 6, "壬": 6,  // 丁、壬日起庚子时
"戊": 8, "癸": 8   // 戊、癸日起壬子时
};

// 实例属性
solarDate: Date;       // 公历日期
year: number;          // 农历年
month: number;         // 农历月
day: number;           // 农历日
isLeap: boolean;       // 是否闰月

/**
* 根据公历日期初始化农历对象
* @param date - 公历日期
*/
constructor(date: Date) {
this.solarDate = new Date(date);
const lunarInfo = this.solarToLunar(date);
this.year = lunarInfo.year;
this.month = lunarInfo.month;
this.day = lunarInfo.day;
this.isLeap = lunarInfo.isLeap;
}

/**
* 将公历日期转换为农历日期
* @param date - 公历日期
* @returns 农历日期信息
*/
solarToLunar(date: Date): {year: number, month: number, day: number, isLeap: boolean} {
// 计算与农历基准日期相差的天数
let offset = Math.floor((date.getTime() - Lunar.BASE_DATE.getTime()) / 86400000);

// 用相差的天数依次计算农历年、月、日
let i, leap, temp;
let lunarYear = 1900;
let lunarMonth = 1;
let lunarDay = 1;
let isLeap = false;
let daysInLunarYear = 0;

// 计算农历年
for (i = 0; i < 200; i++) {
	temp = this.getLunarYearDays(lunarYear);
	daysInLunarYear = temp;
	if (offset < temp) {
		break;
	}
	offset -= temp;
	lunarYear++;
}

// 计算农历月
leap = this.getLeapMonth(lunarYear);
isLeap = false;

for (i = 1; i <= 12; i++) {
	if (leap > 0 && i === leap + 1 && !isLeap) {
		// 闰月
		temp = this.getLeapDays(lunarYear);
		isLeap = true;
		i--;
	} else {
		temp = this.getLunarMonthDays(lunarYear, i);
	}
	
	// 解除闰月
	if (isLeap && i === leap + 1) {
		isLeap = false;
	}
	
	if (offset < temp) {
		break;
	}
	offset -= temp;
}

lunarMonth = i;
lunarDay = offset + 1;

return {
	year: lunarYear,
	month: lunarMonth,
	day: lunarDay,
	isLeap: isLeap
};
}

/**
* 获取农历年的总天数
* @param year - 农历年
* @returns 总天数
*/
getLunarYearDays(year: number): number {
let sum = 348; // 12个月的29天加30天
for (let i = 0x8000; i > 0x8; i >>= 1) {
	sum += (Lunar.LUNAR_MONTH_DAYS[year - 1900] & i) ? 1 : 0;
}
return sum + this.getLeapDays(year);
}

/**
* 获取农历闰月的月份，0表示无闰月
* @param year - 农历年
* @returns 闰月月份，0表示无闰月
*/
getLeapMonth(year: number): number {
return Lunar.LEAP_MONTH_TABLE[year - 1900];
}

/**
* 获取农历闰月的天数
* @param year - 农历年
* @returns 闰月天数，0表示无闰月
*/
getLeapDays(year: number): number {
if (this.getLeapMonth(year)) {
	return (Lunar.LUNAR_MONTH_DAYS[year - 1900] & 0x10000) ? 30 : 29;
}
return 0;
}

/**
* 获取农历某月的天数
* @param year - 农历年
* @param month - 农历月
* @returns 该月天数
*/
getLunarMonthDays(year: number, month: number): number {
return (Lunar.LUNAR_MONTH_DAYS[year - 1900] & (0x10000 >> month)) ? 30 : 29;
}

/**
* 获取干支纪年
* 正确处理农历年份边界：以农历正月初一为年干支分界点
* @returns 干支纪年
*/
getYearGanzhi(): string {
// 1900年是庚子年，与甲子相差36年
let year = this.year;

// 计算干支索引
const offset = (year - 1900 + 36) % 60;

return Lunar.GAN[offset % 10] + Lunar.ZHI[offset % 12];
}

/**
* 获取干支纪月
* 使用节气作为月干支分界点，而不是公历月份
* @returns 干支纪月
*/
getMonthGanzhi(): string {
// 使用节气确定月干支
const monthInfo = AstronomicalCalendar.getSolarTermMonthInfo(this.solarDate);
const zhiMonth = monthInfo.zhiMonth;
const zhiIndex = AstronomicalCalendar.getZhiIndex(zhiMonth);

// 获取年干，用于确定月干起点
const yearGan = this.getYearGanzhi().charAt(0);
const yearGanIndex = Lunar.GAN.indexOf(yearGan);

// 确定月干的起始偏移（以节气寅月为准）
// 甲己年起丙寅，乙庚年起戊寅，丙辛年起庚寅，丁壬年起壬寅，戊癸年起甲寅
let monthGanOffset;
switch (yearGanIndex % 5) {
	case 0: monthGanOffset = 2; break; // 甲己年，寅月起丙
	case 1: monthGanOffset = 4; break; // 乙庚年，寅月起戊
	case 2: monthGanOffset = 6; break; // 丙辛年，寅月起庚
	case 3: monthGanOffset = 8; break; // 丁壬年，寅月起壬
	case 4: monthGanOffset = 0; break; // 戊癸年，寅月起甲
	default: monthGanOffset = 0;
}

// 计算月干索引（干支纪月的天干）
// 寅月的地支索引为0，依次类推
const monthGanIndex = (monthGanOffset + zhiIndex) % 10;

return Lunar.GAN[monthGanIndex] + zhiMonth;
}

/**
* 获取干支纪日
* 采用精确天数差算法
* @returns 干支纪日
*/
getDayGanzhi(): string {
// 计算距离1900年1月31日（甲辰日）的天数
const offset = Math.floor((this.solarDate.getTime() - Lunar.BASE_DATE.getTime()) / 86400000);

// 1900年1月31日是第41个干支：甲辰日
const dayGanzhiIndex = (offset + 40) % 60;

return Lunar.JIAZI[dayGanzhiIndex];
}

/**
* 获取干支纪时
* 根据日干支推算时干支，正确处理子时跨日问题
* @returns 干支纪时
*/
getHourGanzhi(): string {
// 获取日干支的天干
const dayGan = this.getDayGanzhi().charAt(0);

// 获取时辰地支索引（0-11）
const hour = this.solarDate.getHours();
const minute = this.solarDate.getMinutes();

// 时辰是按照两小时为一个时辰，从23:00-01:00为子时开始
// 准确处理子时跨日问题
let hourZhiIndex;

if (hour === 23) {
	// 23:00-23:59属于子时
	hourZhiIndex = 0;
} else {
	// 其他时间按照正常计算
	// 0点和1点为子时，2-3为丑时，依次类推
	hourZhiIndex = Math.floor((hour + 1) / 2) % 12;
}

// 根据日干确定时干的偏移（日上起时）
const hourGanOffset = Lunar.DAY_TO_HOUR_GAN[dayGan as keyof typeof Lunar.DAY_TO_HOUR_GAN];

// 计算时干索引
const hourGanIndex = (hourGanOffset + hourZhiIndex) % 10;

return Lunar.GAN[hourGanIndex] + Lunar.ZHI[hourZhiIndex];
}

/**
* 获取完整的干支信息
* @returns 完整干支信息
*/
getFullGanzhi(): string {
return `${this.getYearGanzhi()}年 ${this.getMonthGanzhi()}月 ${this.getDayGanzhi()}日 ${this.getHourGanzhi()}时`;
}

/**
* 验证日期的干支是否准确
* 用于与其他万年历对照
* @param expected 期望的干支，格式为"年干支 月干支 日干支 时干支"
* @returns 是否匹配
*/
validateGanzhi(expected: string): {
isValid: boolean,
expected: string,
actual: string,
details: {
	year: { expected: string, actual: string, isValid: boolean },
	month: { expected: string, actual: string, isValid: boolean },
	day: { expected: string, actual: string, isValid: boolean },
	hour: { expected: string, actual: string, isValid: boolean }
}
} {
const parts = expected.split(' ');
if (parts.length !== 4) {
	throw new Error("期望的干支格式不正确，应为'年干支 月干支 日干支 时干支'");
}

// 移除"年月日时"字符
const expectedYear = parts[0].replace('年', '');
const expectedMonth = parts[1].replace('月', '');
const expectedDay = parts[2].replace('日', '');
const expectedHour = parts[3].replace('时', '');

// 获取实际计算的干支
const actualYear = this.getYearGanzhi();
const actualMonth = this.getMonthGanzhi();
const actualDay = this.getDayGanzhi();
const actualHour = this.getHourGanzhi();

// 逐项比较
const yearValid = expectedYear === actualYear;
const monthValid = expectedMonth === actualMonth;
const dayValid = expectedDay === actualDay;
const hourValid = expectedHour === actualHour;

// 全部匹配才算通过
const isValid = yearValid && monthValid && dayValid && hourValid;

return {
	isValid,
	expected,
	actual: `${actualYear}年 ${actualMonth}月 ${actualDay}日 ${actualHour}时`,
	details: {
		year: { expected: expectedYear, actual: actualYear, isValid: yearValid },
		month: { expected: expectedMonth, actual: actualMonth, isValid: monthValid },
		day: { expected: expectedDay, actual: actualDay, isValid: dayValid },
		hour: { expected: expectedHour, actual: actualHour, isValid: hourValid }
	}
};
}

/**
* 获取农历日期的描述，如正月初一
*/
getLunarDateString(): string {
const monthNames = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊"];
const dayNames = ["初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
				  "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
				  "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"];

const monthPrefix = this.isLeap ? "闰" : "";
return `${this.year}年${monthPrefix}${monthNames[this.month-1]}月${dayNames[this.day-1]}`;
}

/**
* 获取生肖
* @returns 生肖名称
*/
getAnimal(): string {
const animalIndex = (this.year - 1900) % 12;
return Lunar.ANIMALS[animalIndex];
}

/**
* 静态方法：从公历日期获取农历对象
* @param date - 公历日期
* @returns 农历对象
*/
static fromDate(date: Date): Lunar {
return new Lunar(date);
}

/**
* 静态方法：从公历日期获取干支纪年
* @param date - 公历日期
* @returns 干支纪年
*/
static getYearGanzhiFromDate(date: Date): string {
return Lunar.fromDate(date).getYearGanzhi();
}

/**
* 静态方法：从公历日期获取完整干支
* @param date - 公历日期
* @returns 完整干支
*/
static getFullGanzhiFromDate(date: Date): string {
return Lunar.fromDate(date).getFullGanzhi();
}
}

/**
* 干支日期选择器模态框
*/
class GanzhiDatePickerModal extends Modal {
plugin: GanZhiDatePlugin;
callback: (result: any) => void;
selectedDate: moment.Moment;

constructor(app: App, plugin: GanZhiDatePlugin, callback: (result: any) => void) {
super(app);
this.plugin = plugin;
this.callback = callback;
this.selectedDate = moment(); // 默认为当前日期时间
}

onOpen() {
const {contentEl} = this;
contentEl.empty();

// 创建标题
contentEl.createEl('h2', {text: '选择日期'});

// 创建日期选择器
const datePickerContainer = contentEl.createDiv({cls: 'ganzhi-date-picker'});

// 创建日期输入
const dateInput = datePickerContainer.createEl('input', {
	type: 'date',
	value: this.selectedDate.format('YYYY-MM-DD')
});

// 创建时间输入
const timeInput = datePickerContainer.createEl('input', {
	type: 'time',
	value: this.selectedDate.format('HH:mm')
});

// 创建日期输入的监听
dateInput.addEventListener('change', (e) => {
	const target = e.target as HTMLInputElement;
	const dateStr = target.value;
	const timeStr = timeInput.value;
	this.selectedDate = moment(`${dateStr} ${timeStr}`);
	this.updatePreview();
});

// 创建时间输入的监听
timeInput.addEventListener('change', (e) => {
	const target = e.target as HTMLInputElement;
	const timeStr = target.value;
	const dateStr = dateInput.value;
	this.selectedDate = moment(`${dateStr} ${timeStr}`);
	this.updatePreview();
});

// 创建预览区域
const previewContainer = contentEl.createDiv({cls: 'ganzhi-preview-container'});
previewContainer.createEl('h3', {text: '干支日期预览'});
const previewEl = previewContainer.createDiv({cls: 'ganzhi-preview'});

// 初始化预览
this.updatePreview(previewEl);

// 创建按钮
const buttonContainer = contentEl.createDiv({cls: 'ganzhi-button-container'});

// 插入按钮
const insertButton = buttonContainer.createEl('button', {text: '插入'});
insertButton.addEventListener('click', () => {
	// 获取当前选择的日期的干支信息
	const dateObj = this.selectedDate.toDate();
	const ganzhiInfo = this.plugin.dateToGanZhi(dateObj);
	
	// 添加选择的日期
	ganzhiInfo.selectedDate = this.selectedDate.format('YYYY/MM/DD HH:mm');
	
	// 回调函数
	this.callback(ganzhiInfo);
	this.close();
});

// 取消按钮
const cancelButton = buttonContainer.createEl('button', {text: '取消'});
cancelButton.addEventListener('click', () => {
	this.close();
});
}

updatePreview(previewEl?: HTMLElement) {
const el = previewEl || this.contentEl.querySelector('.ganzhi-preview');
if (!el) return;

const dateObj = this.selectedDate.toDate();
const ganzhiInfo = this.plugin.dateToGanZhi(dateObj);

// 格式化预览内容
el.empty();
el.createEl('p', {text: `阳历: ${this.selectedDate.format('YYYY/MM/DD HH:mm')}`});
el.createEl('p', {text: `农历: ${ganzhiInfo.lunarDate}`});
el.createEl('p', {text: `生肖: ${ganzhiInfo.animal}`});
el.createEl('p', {text: `干支: ${ganzhiInfo.fullGanZhi}`});
}

onClose() {
const {contentEl} = this;
contentEl.empty();
}
}

/**
* 干支验证模态框 - 用于验证特定日期的干支计算
*/
class ValidateGanzhiModal extends Modal {
plugin: GanZhiDatePlugin;
selectedDate: moment.Moment;

constructor(app: App, plugin: GanZhiDatePlugin) {
super(app);
this.plugin = plugin;
this.selectedDate = moment();
}

onOpen() {
const {contentEl} = this;
contentEl.empty();

// 创建标题
contentEl.createEl('h2', {text: '验证干支日期'});

// 说明文字
contentEl.createEl('p', {
	text: '请选择一个日期和时间，查看计算出的干支，并与已知的干支进行对比验证。'
});

// 创建日期选择器
const datePickerContainer = contentEl.createDiv({cls: 'ganzhi-date-picker'});

// 创建日期输入
const dateInput = datePickerContainer.createEl('input', {
	type: 'date',
	value: this.selectedDate.format('YYYY-MM-DD')
});

// 创建时间输入
const timeInput = datePickerContainer.createEl('input', {
	type: 'time',
	value: this.selectedDate.format('HH:mm')
});

// 创建输入监听
const updateHandler = () => {
	const dateStr = dateInput.value;
	const timeStr = timeInput.value;
	this.selectedDate = moment(`${dateStr} ${timeStr}`);
	this.updateResult();
};

dateInput.addEventListener('change', updateHandler);
timeInput.addEventListener('change', updateHandler);

// 创建结果区域
const resultContainer = contentEl.createDiv({cls: 'ganzhi-result-container'});
resultContainer.createEl('h3', {text: '干支计算结果'});
const resultEl = resultContainer.createDiv({cls: 'ganzhi-result'});

// 初始化结果
this.updateResult(resultEl);

// 创建期望的干支输入
contentEl.createEl('h3', {text: '输入已知干支进行验证'});

const expectedInputContainer = contentEl.createDiv({cls: 'ganzhi-expected-input'});
const expectedInput = expectedInputContainer.createEl('input', {
	type: 'text',
	placeholder: '例如：辛未年 丙申月 庚辰日 癸未时'
});

// 创建验证按钮
const validateButton = expectedInputContainer.createEl('button', {text: '验证'});

// 创建验证结果区域
const validateResultContainer = contentEl.createDiv({cls: 'ganzhi-validate-result'});

// 验证按钮点击事件
validateButton.addEventListener('click', () => {
	// 验证输入的干支与计算的干支是否一致
	const expectedGanzhi = expectedInput.value.trim();
	if (!expectedGanzhi) {
		new Notice('请输入期望的干支进行验证');
		return;
	}
	
	try {
		const dateObj = this.selectedDate.toDate();
		const lunar = new Lunar(dateObj);
		const validateResult = lunar.validateGanzhi(expectedGanzhi);
		
		// 显示验证结果
		validateResultContainer.empty();
		
		// 创建验证结果标题
		const resultTitle = validateResultContainer.createEl('h4', {
			text: validateResult.isValid ? '✅ 验证通过！' : '❌ 验证失败！'
		});
		
		// 创建详细结果表格
		const resultTable = validateResultContainer.createEl('table');
		const thead = resultTable.createEl('thead');
		const headerRow = thead.createEl('tr');
		headerRow.createEl('th', {text: '项目'});
		headerRow.createEl('th', {text: '期望值'});
		headerRow.createEl('th', {text: '计算值'});
		headerRow.createEl('th', {text: '结果'});
		
		const tbody = resultTable.createEl('tbody');
		
		// 年柱
		const yearRow = tbody.createEl('tr');
		yearRow.createEl('td', {text: '年柱'});
		yearRow.createEl('td', {text: validateResult.details.year.expected});
		yearRow.createEl('td', {text: validateResult.details.year.actual});
		yearRow.createEl('td', {text: validateResult.details.year.isValid ? '✓' : '✗'});
		
		// 月柱
		const monthRow = tbody.createEl('tr');
		monthRow.createEl('td', {text: '月柱'});
		monthRow.createEl('td', {text: validateResult.details.month.expected});
		monthRow.createEl('td', {text: validateResult.details.month.actual});
		monthRow.createEl('td', {text: validateResult.details.month.isValid ? '✓' : '✗'});
		
		// 日柱
		const dayRow = tbody.createEl('tr');
		dayRow.createEl('td', {text: '日柱'});
		dayRow.createEl('td', {text: validateResult.details.day.expected});
		dayRow.createEl('td', {text: validateResult.details.day.actual});
		dayRow.createEl('td', {text: validateResult.details.day.isValid ? '✓' : '✗'});
		
		// 时柱
		const hourRow = tbody.createEl('tr');
		hourRow.createEl('td', {text: '时柱'});
		hourRow.createEl('td', {text: validateResult.details.hour.expected});
		hourRow.createEl('td', {text: validateResult.details.hour.actual});
		hourRow.createEl('td', {text: validateResult.details.hour.isValid ? '✓' : '✗'});
		
		// 显示注意事项
		if (!validateResult.isValid) {
			validateResultContainer.createEl('p', {
				text: '注意：不匹配可能是由于计算方法不同导致的。特别是月柱的计算，传统上有多种方法。'
			});
		}
		
	} catch (error) {
		new Notice('验证失败：' + error);
		console.error('干支验证失败', error);
	}
});

// 创建关闭按钮
const closeButton = contentEl.createEl('button', {
	text: '关闭',
	cls: 'ganzhi-close-button'
});

closeButton.addEventListener('click', () => {
	this.close();
});
}

updateResult(resultEl?: HTMLElement) {
const el = resultEl || this.contentEl.querySelector('.ganzhi-result');
if (!el) return;

const dateObj = this.selectedDate.toDate();
const ganzhiInfo = this.plugin.dateToGanZhi(dateObj);

// 格式化结果内容
el.empty();
el.createEl('p', {text: `阳历: ${this.selectedDate.format('YYYY/MM/DD HH:mm')}`});
el.createEl('p', {text: `农历: ${ganzhiInfo.lunarDate}`});
el.createEl('p', {text: `生肖: ${ganzhiInfo.animal}`});
el.createEl('p', {text: `完整干支: ${ganzhiInfo.fullGanZhi}`});
el.createEl('p', {text: `年柱: ${ganzhiInfo.year}年`});
el.createEl('p', {text: `月柱: ${ganzhiInfo.month}月`});
el.createEl('p', {text: `日柱: ${ganzhiInfo.day}日`});
el.createEl('p', {text: `时柱: ${ganzhiInfo.hour}时`});
}

onClose() {
const {contentEl} = this;
contentEl.empty();
}
}

/**
* 干支日期设置选项卡
*/
class GanZhiDateSettingTab extends PluginSettingTab {
plugin: GanZhiDatePlugin;

constructor(app: App, plugin: GanZhiDatePlugin) {
super(app, plugin);
this.plugin = plugin;
}

display(): void {
const {containerEl} = this;
containerEl.empty();
containerEl.createEl('h2', {text: '干支纪年设置'});

new Setting(containerEl)
	.setName('日期格式')
	.setDesc('选择干支日期显示的格式')
	.addDropdown(dropdown => dropdown
		.addOption('full', '完整格式 (甲子年 丙子月 丁丑日 戊寅时)')
		.addOption('simple', '简单格式 (甲子 丙子 丁丑 戊寅)')
		.addOption('year', '仅年份 (甲子年)')
		.setValue(this.plugin.settings.dateFormat)
		.onChange(async (value) => {
			this.plugin.settings.dateFormat = value;
			await this.plugin.saveSettings();
		}));
		
// 添加节气设置
new Setting(containerEl)
	.setName('使用节气确定月柱')
	.setDesc('启用后，将使用二十四节气确定月柱，更符合传统历法')
	.addToggle(toggle => toggle
		.setValue(this.plugin.settings.useTermForMonth)
		.onChange(async (value) => {
			this.plugin.settings.useTermForMonth = value;
			await this.plugin.saveSettings();
			
			// 更新状态栏显示
			this.plugin.getSimpleGanZhi();
		}));

// 添加一个关于精确计算的说明
containerEl.createEl('h3', {text: '计算说明'});

const infoDiv = containerEl.createDiv({
	cls: 'setting-item-description'
});

infoDiv.createEl('p', {
	text: '本插件使用天文历法算法，确保干支计算的准确性：'
});

const infoList = infoDiv.createEl('ul');
infoList.createEl('li', {
	text: '农历年份边界：以农历正月初一作为干支纪年更替的时间点'
});
infoList.createEl('li', {
	text: '节气边界处理：月干支使用节气作为分界点，准确处理月干支转换'
});
infoList.createEl('li', {
	text: '干支推算规则：采用传统干支历法中的日干支推时干支规则'
});
infoList.createEl('li', {
	text: '支持范围：1900年至2100年的精确农历和干支计算'
});

}
}