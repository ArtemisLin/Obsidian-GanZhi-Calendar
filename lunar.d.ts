declare module 'lunar-javascript' {
    export class Solar {
        static fromYmd(year: number, month: number, day: number): Solar;
        static fromDate(date: Date): Solar;
        getLunar(): Lunar;
    }

    export class Lunar {
        static fromDate(date: Date): Lunar;
        getMonth(): number;
        getYearInGanZhi(): string;
        getDayInGanZhi(): string;
        getTimeInGanZhi(hour: number): string;
        getYearInChinese(): string;
        getMonthInChinese(): string;
        getDayInChinese(): string;
        getJieQi?(): string;
        getTerm?(): number;
        getPrevJieQi?(): string;
        getNextJieQi?(): string;
        getMonthInGanZhi(): string;
    }

    export class JieQi {
        // 如果需要使用 JieQi 类，添加相关方法
    }
}