const SIGNIFICANCE_LEVEL = 0.05;
const DEFAULT_POINT_COLOR = 'blue';
const NUMERIC_COLOR_THRESHOLD = 0.7;
const MIN_POINTS_FOR_CORR_REG = 3;
const MIN_POINTS_FOR_NONLINEAR_REG = 4;
const MIN_POINTS_FOR_TTEST = 2;
const MIN_POINTS_FOR_KDE = 2;
const MIN_POINTS_FOR_PERMUTATION = 5;
const MIN_POINTS_FOR_KMEANS = 2;
const STD_DEV_ZERO_THRESHOLD = 1e-9;
const POSITIVE_VALUE_THRESHOLD = 1e-9;
const KDE_PLOT_POINTS = 200;

const plotDiv = document.getElementById('plotDiv');
const plotDiv2 = document.getElementById('plotDiv2');
const statsContentDiv = document.getElementById('statsContent');
const inputErrorDiv = document.getElementById('inputError');
const chartErrorDiv = document.getElementById('chartError');
const dataInput = document.getElementById('dataInput');
const fileInput = document.getElementById('fileInput');
const fileNameSpan = document.getElementById('fileName');
const headerCheckbox = document.getElementById('headerCheckbox');
const chartTypeSelect = document.getElementById('chartType');
const fullscreenBtn = document.getElementById('fullscreenBtn');

const selectCol1Div = document.getElementById('selectCol1Div');
const selectCol2Div = document.getElementById('selectCol2Div');
const selectCol3Div = document.getElementById('selectCol3Div');
const selectCategoricalDiv = document.getElementById('selectCategoricalDiv');
const parcoordsColorDiv = document.getElementById('parcoordsColorDiv');
const splomColorDiv = document.getElementById('splomColorDiv');
const selectCol1 = document.getElementById('selectCol1');
const selectColX = document.getElementById('selectColX');
const selectColY = document.getElementById('selectColY');
const selectCol3DX = document.getElementById('selectCol3DX');
const selectCol3DY = document.getElementById('selectCol3DY');
const selectCol3DZ = document.getElementById('selectCol3DZ');
const selectCol4DColor = document.getElementById('selectCol4DColor');
const selectLabelsCol = document.getElementById('selectLabelsCol');
const selectValuesCol = document.getElementById('selectValuesCol');
const selectColorVar = document.getElementById('selectColorVar');
const selectSplomColorVar = document.getElementById('selectSplomColorVar');

const oneSampleInputDiv = document.getElementById('oneSampleInputDiv');
const hypothesizedMeanInput = document.getElementById('hypothesizedMean');
const kmeansParamsDiv = document.getElementById('kmeansParamsDiv');
const kmeansKInput = document.getElementById('kmeansKInput');
const permutationParamsDiv = document.getElementById('permutationParamsDiv');
const permutationIterationsInput = document.getElementById('permutationIterationsInput');

const drawChartBtn = document.getElementById('drawChartBtn');
const swapXYBtn = document.getElementById('swapXYBtn');
const exportSvgBtn = document.getElementById('exportSvgBtn');
const exportTxtBtn = document.getElementById('exportTxtBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');

let currentParsedData = null;
let currentStatsData = null;

fileInput.addEventListener('change', handleFileSelect, false);
chartTypeSelect.addEventListener('change', handleChartTypeChange);
drawChartBtn.addEventListener('click', drawChart);
document.querySelectorAll('#swapXYBtn').forEach(btn => btn.addEventListener('click', swapXYAxes));
exportSvgBtn.addEventListener('click', () => exportChart('svg'));
exportTxtBtn.addEventListener('click', () => exportStats('txt'));
exportCsvBtn.addEventListener('click', () => exportStats('csv'));
fullscreenBtn.addEventListener('click', toggleFullscreen);

function reparseAndRepopulate() {
    inputErrorDiv.textContent = '';
    chartErrorDiv.textContent = '';
    currentParsedData = parseData();
    populateColumnSelectors();
    handleChartTypeChange();
}

dataInput.addEventListener('input', () => {
    clearTimeout(dataInput.parseTimeout);
    dataInput.parseTimeout = setTimeout(reparseAndRepopulate, 300);
});
headerCheckbox.addEventListener('change', reparseAndRepopulate);


function handleChartTypeChange() {
    const selectedType = chartTypeSelect.value;
    const allOptionalDivs = [
        selectCol1Div, selectCol2Div, selectCol3Div, selectCategoricalDiv,
        parcoordsColorDiv, splomColorDiv,
        oneSampleInputDiv, kmeansParamsDiv, permutationParamsDiv
    ];
    allOptionalDivs.forEach(div => div.style.display = 'none');

    if (['histogram', 'boxplot', 'violin', 'density', 'gaussian', 'cdf'].includes(selectedType)) {
        selectCol1Div.style.display = 'block';
    } else if (['scatter', 'line_trend', 'area', 'contour_density',
        'scatter_linear_regression', 'scatter_poly2_regression', 'scatter_poly3_regression',
        'scatter_exp_regression', 'scatter_log_regression', 'scatter_power_regression',
        'residual_plot_linear', 'kmeans', 't_test_paired',
        't_test_two_sample', 'permutation_test'
    ].includes(selectedType)) {
        selectCol2Div.style.display = 'block';
        if (selectedType === 'permutation_test') {
            permutationParamsDiv.style.display = 'block';
        }
        if (selectedType === 'kmeans') {
            kmeansParamsDiv.style.display = 'block';
        }
    } else if (['scatter_3d', 'contour', 'bubble_color'].includes(selectedType)) {
        selectCol3Div.style.display = 'block';
    } else if (['bar', 'pie', 'pareto'].includes(selectedType)) {
        selectCategoricalDiv.style.display = 'block';
    } else if (selectedType === 'parallel_coordinates') {
        parcoordsColorDiv.style.display = 'block';
    } else if (selectedType === 'scatter_matrix') {
        splomColorDiv.style.display = 'block';
    } else if (selectedType === 't_test_one_sample') {
        selectCol1Div.style.display = 'block';
        oneSampleInputDiv.style.display = 'block';
    }

    document.getElementById('selectCol4DColorDiv').style.display = (selectedType === 'scatter_3d') ? 'inline-block' : 'none';
    
    const zAxisLabel = document.getElementById('zAxisLabel');
    if (selectedType === 'bubble_color') {
        zAxisLabel.textContent = '颜色轴 (C):';
    } else if (selectedType === 'contour') {
        zAxisLabel.textContent = 'Z 轴 (值):';
    } else {
        zAxisLabel.textContent = 'Z 轴:';
    }
}


function swapXYAxes() {
    if (selectCol2Div.style.display === 'block') {
        if (!selectColX || !selectColY) return;
        const currentX = selectColX.value;
        const currentY = selectColY.value;
        if (currentX === "" || currentY === "") return;
        selectColX.value = currentY;
        selectColY.value = currentX;
    } else if (selectCategoricalDiv.style.display === 'block') {
        if (!selectLabelsCol || !selectValuesCol) return;
        const currentLabels = selectLabelsCol.value;
        const currentValues = selectValuesCol.value;
        if (currentLabels === "" || currentValues === "") return;
        selectLabelsCol.value = currentValues;
        selectValuesCol.value = currentLabels;
    } else {
        return;
    }
    drawChart();
}


function handleFileSelect(event) {
    inputErrorDiv.textContent = '';
    chartErrorDiv.textContent = '';

    const file = event.target.files[0];
    if (!file) {
        fileNameSpan.textContent = '未选择文件';
        return;
    }
    fileNameSpan.textContent = `已选择: ${file.name}`;
    const reader = new FileReader();
    reader.onload = function(e) {
        dataInput.value = e.target.result;
        reparseAndRepopulate();
    };
    reader.onerror = function(e) {
        inputErrorDiv.textContent = `错误：读取文件失败: ${e.target.error}`;
        fileNameSpan.textContent = '文件读取错误';
        clearColumnSelectors();
        currentParsedData = null;
    };
    reader.readAsText(file);
}

const ordinalDetectors = {
    month: {
        map: {
            'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6, 
            'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12,
            'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'jun': 6,
            'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
            '一月': 1, '二月': 2, '三月': 3, '四月': 4, '五月': 5, '六月': 6,
            '七月': 7, '八月': 8, '九月': 9, '十月': 10, '十一月': 11, '十二月': 12,
        },
        test: (v) => ordinalDetectors.month.map[v] !== undefined
    },
    weekday: {
        map: {
            'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 7,
            'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6, 'sun': 7,
            '星期一': 1, '星期二': 2, '星期三': 3, '星期四': 4, '星期五': 5, '星期六': 6, '星期日': 7, '星期天': 7,
        },
        test: (v) => ordinalDetectors.weekday.map[v] !== undefined
    },
    quarter: {
        map: {
            'q1': 1, '1st quarter': 1, '第一季度': 1,
            'q2': 2, '2nd quarter': 2, '第二季度': 2,
            'q3': 3, '3rd quarter': 3, '第三季度': 3,
            'q4': 4, '4th quarter': 4, '第四季度': 4,
        },
        test: (v) => ordinalDetectors.quarter.map[v] !== undefined
    },
    letter: {
        test: (v) => /^[a-zA-Z]$/.test(v),
        postTest: (uniqueVals) => {
            const isAllUpper = uniqueVals.every(l => l === l.toUpperCase());
            const isAllLower = uniqueVals.every(l => l === l.toLowerCase());
            if (!isAllUpper && !isAllLower) return false;
            const codes = uniqueVals.map(l => l.charCodeAt(0));
            return (codes[codes.length - 1] - codes[0]) <= (uniqueVals.length - 1) * 2;
        },
        mapValue: (v, uniqueVals) => {
            const baseCode = uniqueVals[0].toLowerCase().charCodeAt(0);
            return v.toLowerCase().charCodeAt(0) - baseCode + 1;
        }
    }
};

function parseData() {
    inputErrorDiv.textContent = '';
    const rawData = dataInput.value.trim();
    if (!rawData) return null;

    const hasHeader = headerCheckbox.checked;
    const results = Papa.parse(rawData, {
        header: hasHeader,
        skipEmptyLines: true,
        dynamicTyping: false,
        transformHeader: header => header.trim()
    });

    if (results.errors.length > 0) {
        const errorMsg = results.errors.slice(0, 3).map(e => `行 ${e.row}: ${e.message}`).join('\n');
        inputErrorDiv.textContent = `CSV 解析错误:\n${errorMsg}`;
        return null;
    }
    
    const data = results.data;
    if (data.length === 0) {
        inputErrorDiv.textContent = '错误：未能从输入中解析出任何有效的数据行。';
        return null;
    }

    let headers;
    if (hasHeader) {
        headers = results.meta.fields;
    } else {
        const numCols = data.length > 0 ? data[0].length : 0;
        if (numCols === 0) {
             inputErrorDiv.textContent = '错误：未能解析出任何数据。';
             return null;
        }
        headers = Array.from({ length: numCols }, (_, i) => `列 ${i + 1}`);
    }
    
    const numCols = headers.length;
    const numRows = data.length;
    
    const originalDataColumns = Array.from({ length: numCols }, () => new Array(numRows));
    const numericDataColumns = Array.from({ length: numCols }, () => new Array(numRows));

    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numCols; j++) {
            const header = headers[j];
            const rawValue = hasHeader ? (data[i][header] ?? '') : (data[i][j] ?? '');
            const valueStr = String(rawValue).trim();
            originalDataColumns[j][i] = valueStr;
            
            if (valueStr === '') {
                numericDataColumns[j][i] = null;
            } else {
                const num = parseFloat(valueStr);
                numericDataColumns[j][i] = isNaN(num) ? NaN : num;
            }
        }
    }
    
    const ordinalMaps = {};
    for (let j = 0; j < numCols; j++) {
        const numericCol = numericDataColumns[j];
        const originalCol = originalDataColumns[j];
        const nonNullCount = originalCol.filter(v => v !== null && v !== '').length;
        const numericCount = numericCol.filter(v => !isNaN(v)).length;

        if (nonNullCount > 2 && (numericCount / nonNullCount) < 0.5) {
            for (const type in ordinalDetectors) {
                const detector = ordinalDetectors[type];
                const cleanOriginal = originalCol.filter(v => v !== '');
                const matchCount = cleanOriginal.filter(v => detector.test(String(v).toLowerCase())).length;

                if (matchCount / nonNullCount > 0.8) {
                    let isSequence = true;
                    const uniqueVals = [...new Set(cleanOriginal.filter(v => detector.test(String(v).toLowerCase())))].sort();
                    if (detector.postTest) {
                        isSequence = detector.postTest(uniqueVals);
                    }
                    
                    if (isSequence && uniqueVals.length > 1) {
                        const numericMap = {};
                        const newNumericCol = originalCol.map(v => {
                            const lcVal = String(v).toLowerCase();
                            if (detector.test(lcVal)) {
                                const num = detector.map ? detector.map[lcVal] : detector.mapValue(v, uniqueVals);
                                if (num !== undefined) {
                                    if (!numericMap[num]) { numericMap[num] = v; }
                                    return num;
                                }
                            }
                            return v === '' ? null : NaN;
                        });
                        
                        numericDataColumns[j] = newNumericCol;
                        ordinalMaps[j] = numericMap;
                        break;
                    }
                }
            }
        }
    }
    
    const allColumnsEffectivelyEmpty = numericDataColumns.every(col => col.every(v => v === null || isNaN(v)));
    if (allColumnsEffectivelyEmpty) {
        inputErrorDiv.textContent = '错误：解析到的所有数据列均为空或非数值，请检查数据内容和格式。';
        return null;
    }

    return {
        numericData: numericDataColumns,
        originalData: originalDataColumns,
        headers: headers,
        ordinalMaps: ordinalMaps
    };
}


function clearOutput() {
    Plotly.purge(plotDiv);
    Plotly.purge(plotDiv2);
    plotDiv2.style.display = 'none';
    statsContentDiv.innerHTML = '<p>请先输入有效数据并选择分析类型以查看统计摘要。</p>';
    if (!currentParsedData) {
        Plotly.newPlot(plotDiv, [], {
            title: '请先输入数据并选择图表/分析类型'
        });
    }
    currentStatsData = null;
    if (!inputErrorDiv.textContent.startsWith('错误')) chartErrorDiv.textContent = '';
}

function clearColumnSelectors() {
    const selectors = [
        selectCol1, selectColX, selectColY, selectCol3DX, selectCol3DY, selectCol3DZ,
        selectCol4DColor, selectLabelsCol, selectValuesCol,
        selectColorVar, selectSplomColorVar
    ];
    selectors.forEach(sel => {
        const firstOptionValue = sel.options[0] ? sel.options[0].value : null;
        const isDefaultOption = firstOptionValue === "-1" || firstOptionValue === "";
        const defaultOptionHTML = isDefaultOption ? sel.options[0].outerHTML : '';

        sel.innerHTML = defaultOptionHTML;

        if (!defaultOptionHTML && !['selectColorVar', 'selectSplomColorVar'].includes(sel.id)) {
            sel.innerHTML = '<option value="">-- 选择列 --</option>';
        } else if (!defaultOptionHTML && ['selectColorVar', 'selectSplomColorVar'].includes(sel.id)) {
            sel.innerHTML = '<option value="-1">默认颜色</option>';
        }
        sel.disabled = true;
    });
}

function populateColumnSelectors() {
    clearColumnSelectors();
    if (!currentParsedData || !currentParsedData.headers || currentParsedData.headers.length === 0) {
        return;
    }

    const headers = currentParsedData.headers;
    const numericSelectors = [selectCol1, selectColX, selectColY, selectCol3DX, selectCol3DY, selectCol3DZ,
        selectCol4DColor
    ];
    const allColSelectors = [selectColorVar, selectSplomColorVar, selectLabelsCol, selectValuesCol];

    const numericIndices = [];
    const allIndices = [];

    headers.forEach((header, index) => {
        allIndices.push(index);
        const hasNumericData = currentParsedData.numericData[index]?.some(v => v !== null && !isNaN(v));
        const optionText = `${index + 1}: ${header}`;

        if (hasNumericData) {
            numericIndices.push(index);
            numericSelectors.forEach(sel => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = optionText;
                sel.appendChild(option);
            });
        }
        
        allColSelectors.forEach(sel => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = optionText;
            sel.appendChild(option);
        });
    });
    
    if (allIndices.length > 0) {
        selectLabelsCol.value = allIndices[0];
    }
    if (numericIndices.length > 0) {
        selectValuesCol.value = numericIndices[numericIndices.length - 1]; 
    }
    
    if (numericIndices.length > 0) {
        selectCol1.value = numericIndices[0];
        selectColX.value = numericIndices[0];
        selectCol3DX.value = numericIndices[0];
    }
    if (numericIndices.length > 1) {
        selectColY.value = numericIndices[1];
        selectCol3DY.value = numericIndices[1];
    }
    if (numericIndices.length > 2) {
        selectCol3DZ.value = numericIndices[2];
    }
    if (numericIndices.length > 3) {
        selectCol4DColor.value = numericIndices[3]; 
    }

    [...numericSelectors, ...allColSelectors].forEach(sel => {
        const hasValidOptions = Array.from(sel.options).some(opt => opt.value !== "" && opt.value !== "-1");
        sel.disabled = !hasValidOptions;
    });
}


function formatStat(value, precision = 3) {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    if (typeof value === 'string') return value;
    if (value === Infinity) return '∞';
    if (value === -Infinity) return '-∞';
    if (Math.abs(value) > 1e6 || (Math.abs(value) < 1e-4 && value !== 0)) {
        return value.toExponential(precision);
    }
    try {
        let effectivePrecision = precision;
        if (Math.abs(value) >= 100) effectivePrecision = Math.max(precision, 4);
        else if (Math.abs(value) < 1) effectivePrecision = Math.max(precision, 2);

        let formatted = parseFloat(value.toPrecision(effectivePrecision));
        return formatted.toString();
    } catch {
        return value.toString();
    }
}

function calculateBasicStats(arr) {
    const cleanArr = arr.filter(v => v !== null && !isNaN(v));
    if (cleanArr.length === 0) return {
        count: 0,
        mean: NaN,
        median: NaN,
        stdDev: NaN,
        variance: NaN,
        min: NaN,
        q1: NaN,
        median_alt: NaN,
        q3: NaN,
        max: NaN,
        sum: 0
    };

    const count = cleanArr.length;
    const sum = ss.sum(cleanArr);
    const mean = ss.mean(cleanArr);
    const median = ss.median(cleanArr);
    const variance = count > 1 ? ss.variance(cleanArr) : 0;
    const stdDev = Math.sqrt(variance);
    const min = ss.min(cleanArr);
    const max = ss.max(cleanArr);
    const q1 = count > 0 ? ss.quantile(cleanArr, 0.25) : NaN;
    const q3 = count > 0 ? ss.quantile(cleanArr, 0.75) : NaN;

    return {
        count: count,
        sum: sum,
        mean: mean,
        median: median,
        stdDev: stdDev,
        variance: variance,
        min: min,
        q1: q1,
        median_alt: median,
        q3: q3,
        max: max
    };
}

function filterCleanPairs(xArr, yArr) {
    const cleanPairs = [];
    const maxLength = Math.min(xArr?.length ?? 0, yArr?.length ?? 0);
    for (let i = 0; i < maxLength; ++i) {
        const xVal = xArr[i];
        const yVal = yArr[i];
        if (xVal !== null && xVal !== undefined && !isNaN(xVal) &&
            yVal !== null && yVal !== undefined && !isNaN(yVal)) {
            cleanPairs.push({
                x: xVal,
                y: yVal
            });
        }
    }
    return cleanPairs;
}

function filterCleanTriplets(xArr, yArr, zArr) {
    const cleanTriplets = [];
    const maxLength = Math.min(xArr?.length ?? 0, yArr?.length ?? 0, zArr?.length ?? 0);
    for (let i = 0; i < maxLength; ++i) {
        const xVal = xArr[i];
        const yVal = yArr[i];
        const zVal = zArr[i];
        if (xVal !== null && xVal !== undefined && !isNaN(xVal) &&
            yVal !== null && yVal !== undefined && !isNaN(yVal) &&
            zVal !== null && zVal !== undefined && !isNaN(zVal)) {
            cleanTriplets.push({
                x: xVal,
                y: yVal,
                z: zVal
            });
        }
    }
    return cleanTriplets;
}

function filterCleanQuads(xArr, yArr, zArr, cArr) {
    const cleanQuads = [];
    const maxLength = Math.min(xArr?.length ?? 0, yArr?.length ?? 0, zArr?.length ?? 0, cArr?.length ?? 0);
    for (let i = 0; i < maxLength; ++i) {
        const xVal = xArr[i];
        const yVal = yArr[i];
        const zVal = zArr[i];
        const cVal = cArr[i];
        if (xVal !== null && !isNaN(xVal) &&
            yVal !== null && !isNaN(yVal) &&
            zVal !== null && !isNaN(zVal) &&
            cVal !== null && !isNaN(cVal)) {
            cleanQuads.push({
                x: xVal,
                y: yVal,
                z: zVal,
                c: cVal
            });
        }
    }
    return cleanQuads;
}


function calculateLinearRegression(xArr, yArr) {
    const cleanPairs = filterCleanPairs(xArr, yArr);
    if (cleanPairs.length < MIN_POINTS_FOR_CORR_REG) return null;

    const dataForRegression = cleanPairs.map(p => [p.x, p.y]);
    const xClean = dataForRegression.map(p => p[0]);
    const yClean = dataForRegression.map(p => p[1]);

    if (ss.variance(xClean) <= STD_DEV_ZERO_THRESHOLD || ss.variance(yClean) <= STD_DEV_ZERO_THRESHOLD) {
        console.warn("Linear regression skipped: Zero variance in X or Y.");
        return null;
    }

    try {
        const model = ss.linearRegression(dataForRegression);
        const line = ss.linearRegressionLine(model);
        const rSquared = ss.rSquared(dataForRegression, line);
        if (!isFinite(model.m) || !isFinite(model.b) || !isFinite(rSquared)) {
            console.warn("Linear regression calculation resulted in non-finite values (NaN/Infinity).");
            return null;
        }
        return {
            type: 'linear',
            slope: model.m,
            intercept: model.b,
            rSquared: rSquared,
            predict: (x) => line(x),
            equationString: `y ≈ ${formatStat(model.m)} * x + ${formatStat(model.b)}`
        };
    } catch (e) {
        console.error("Linear regression calculation error:", e);
        return null;
    }
}

function calculatePolynomialRegression(xArr, yArr, degree) {
    const cleanPairs = filterCleanPairs(xArr, yArr);
    const requiredPoints = Math.max(MIN_POINTS_FOR_NONLINEAR_REG, degree + 1);
    if (cleanPairs.length < requiredPoints) {
        throw new Error(`多项式回归 (阶数 ${degree}) 需要至少 ${requiredPoints} 个有效数据点 (找到 ${cleanPairs.length} 个)。`);
    }
    const dataForRegression = cleanPairs.map(p => [p.x, p.y]);
    const xClean = dataForRegression.map(p => p[0]);
    if (ss.variance(xClean) <= STD_DEV_ZERO_THRESHOLD) {
       throw new Error(`多项式回归失败：X 数据的方差为零或过小。`);
    }
    try {
        const result = regression.polynomial(dataForRegression, {
            order: degree,
            precision: 5
        });
        if (!result || !result.equation || !result.predict || typeof result.r2 !== 'number' || !result.equation.every(isFinite) || !isFinite(result.r2)) {
            throw new Error("多项式回归计算未能返回有效的、有限的数值结果。");
        }
        return {
            type: 'polynomial',
            degree: degree,
            parameters: result.equation,
            rSquared: result.r2,
            predict: (x) => result.predict(x)[1],
            equationString: result.string
        };
    } catch (e) {
        console.error(`多项式回归 (阶数 ${degree}) 计算错误:`, e);
        throw new Error(`多项式回归 (阶数 ${degree}) 计算失败: ${e.message}`);
    }
}

function calculateExponentialRegression(xArr, yArr) {
    const cleanPairs = filterCleanPairs(xArr, yArr);
    const validPairs = cleanPairs.filter(p => p.y > POSITIVE_VALUE_THRESHOLD);
    if (validPairs.length < MIN_POINTS_FOR_NONLINEAR_REG) {
        const reason = cleanPairs.length < MIN_POINTS_FOR_NONLINEAR_REG ? `需要至少 ${MIN_POINTS_FOR_NONLINEAR_REG} 个有效数据点` : `需要 Y > 0 的数据点`;
        throw new Error(`指数回归失败: ${reason} (找到 ${validPairs.length} 个 Y > 0 的点)。`);
    }
    const dataForRegression = validPairs.map(p => [p.x, p.y]);
    const xClean = dataForRegression.map(p => p[0]);
    if (ss.variance(xClean) <= STD_DEV_ZERO_THRESHOLD) {
       throw new Error(`指数回归失败：X 数据的方差为零或过小。`);
    }
    try {
        const result = regression.exponential(dataForRegression, {
            precision: 5
        });
        if (!result || !result.equation || !result.predict || typeof result.r2 !== 'number' || !result.equation.every(isFinite) || !isFinite(result.r2)) {
            throw new Error("指数回归计算未能返回有效的、有限的数值结果。");
        }
        return {
            type: 'exponential',
            parameters: result.equation,
            rSquared: result.r2,
            predict: (x) => result.predict(x)[1],
            equationString: result.string
        };
    } catch (e) {
        console.error("指数回归计算错误:", e);
        if (dataForRegression.some(p => p[1] <= 0)) {
            throw new Error(`指数回归计算失败: 数据包含非正 Y 值，无法进行对数转换。`);
        }
        throw new Error(`指数回归计算失败: ${e.message}`);
    }
}

function calculateLogarithmicRegression(xArr, yArr) {
    const cleanPairs = filterCleanPairs(xArr, yArr);
    const validPairs = cleanPairs.filter(p => p.x > POSITIVE_VALUE_THRESHOLD);
    if (validPairs.length < MIN_POINTS_FOR_NONLINEAR_REG) {
        const reason = cleanPairs.length < MIN_POINTS_FOR_NONLINEAR_REG ? `需要至少 ${MIN_POINTS_FOR_NONLINEAR_REG} 个有效数据点` : `需要 X > 0 的数据点`;
        throw new Error(`对数回归失败: ${reason} (找到 ${validPairs.length} 个 X > 0 的点)。`);
    }
    const dataForRegression = validPairs.map(p => [p.x, p.y]);
    const xClean = dataForRegression.map(p => p[0]);
    if (ss.variance(xClean) <= STD_DEV_ZERO_THRESHOLD) {
       throw new Error(`对数回归失败：X 数据的方差为零或过小。`);
    }
    try {
        const result = regression.logarithmic(dataForRegression, {
            precision: 5
        });
        if (!result || !result.equation || !result.predict || typeof result.r2 !== 'number' || !result.equation.every(isFinite) || !isFinite(result.r2)) {
            throw new Error("对数回归计算未能返回有效的、有限的数值结果。");
        }
        return {
            type: 'logarithmic',
            parameters: result.equation,
            rSquared: result.r2,
            predict: (x) => result.predict(x)[1],
            equationString: result.string
        };
    } catch (e) {
        console.error("对数回归计算错误:", e);
        if (dataForRegression.some(p => p[0] <= 0)) {
            throw new Error(`对数回归计算失败: 数据包含非正 X 值，无法计算 ln(x)。`);
        }
        throw new Error(`对数回归计算失败: ${e.message}`);
    }
}

function calculatePowerRegression(xArr, yArr) {
    const cleanPairs = filterCleanPairs(xArr, yArr);
    const validPairs = cleanPairs.filter(p => p.x > POSITIVE_VALUE_THRESHOLD && p.y > POSITIVE_VALUE_THRESHOLD);
    if (validPairs.length < MIN_POINTS_FOR_NONLINEAR_REG) {
        const reason = cleanPairs.length < MIN_POINTS_FOR_NONLINEAR_REG ? `需要至少 ${MIN_POINTS_FOR_NONLINEAR_REG} 个有效数据点` : `需要 X > 0 且 Y > 0 的数据点`;
        throw new Error(`幂函数回归失败: ${reason} (找到 ${validPairs.length} 个 X>0, Y>0 的点)。`);
    }
    const dataForRegression = validPairs.map(p => [p.x, p.y]);
     const xClean = dataForRegression.map(p => p[0]);
    if (ss.variance(xClean) <= STD_DEV_ZERO_THRESHOLD) {
       throw new Error(`幂函数回归失败：X 数据的方差为零或过小。`);
    }
    try {
        const result = regression.power(dataForRegression, {
            precision: 5
        });
        if (!result || !result.equation || !result.predict || typeof result.r2 !== 'number' || !result.equation.every(isFinite) || !isFinite(result.r2)) {
            throw new Error("幂函数回归计算未能返回有效的、有限的数值结果。");
        }
        return {
            type: 'power',
            parameters: result.equation,
            rSquared: result.r2,
            predict: (x) => result.predict(x)[1],
            equationString: result.string
        };
    } catch (e) {
        console.error("幂函数回归计算错误:", e);
        if (dataForRegression.some(p => p[0] <= 0 || p[1] <= 0)) {
            throw new Error(`幂函数回归计算失败: 数据包含非正 X 或 Y 值，无法进行对数转换。`);
        }
        throw new Error(`幂函数回归计算失败: ${e.message}`);
    }
}

function getRegressionModel(chartType, xClean, yClean) {
    let model = null;
    let minPointsLinear = MIN_POINTS_FOR_CORR_REG;
    let minPointsNonLinear = MIN_POINTS_FOR_NONLINEAR_REG;

    if (chartType.includes('linear') || chartType === 'residual_plot_linear') {
        if (xClean.length < minPointsLinear) throw new Error(`线性回归需要至少 ${minPointsLinear} 个有效数据点。`);
        model = calculateLinearRegression(xClean, yClean);
        if (!model) throw new Error(`无法计算线性回归 (数据不足、方差为零或计算错误)。`);
    } else if (chartType === 'scatter_poly2_regression') {
        const requiredPoints = Math.max(minPointsNonLinear, 3);
        if (xClean.length < requiredPoints) throw new Error(`多项式回归(2)需要至少 ${requiredPoints} 个有效数据点。`);
        model = calculatePolynomialRegression(xClean, yClean, 2);
    } else if (chartType === 'scatter_poly3_regression') {
        const requiredPoints = Math.max(minPointsNonLinear, 4);
        if (xClean.length < requiredPoints) throw new Error(`多项式回归(3)需要至少 ${requiredPoints} 个有效数据点。`);
        model = calculatePolynomialRegression(xClean, yClean, 3);
    } else if (chartType === 'scatter_exp_regression') {
        if (xClean.length < minPointsNonLinear) throw new Error(`指数回归需要至少 ${minPointsNonLinear} 个有效数据点。`);
        model = calculateExponentialRegression(xClean, yClean);
    } else if (chartType === 'scatter_log_regression') {
        if (xClean.length < minPointsNonLinear) throw new Error(`对数回归需要至少 ${minPointsNonLinear} 个有效数据点。`);
        model = calculateLogarithmicRegression(xClean, yClean);
    } else if (chartType === 'scatter_power_regression') {
        if (xClean.length < minPointsNonLinear) throw new Error(`幂函数回归需要至少 ${minPointsNonLinear} 个有效数据点。`);
        model = calculatePowerRegression(xClean, yClean);
    }
    return model;
}


function calculateCorrelationMatrix(dataColumns, headers) {
    if (!dataColumns || dataColumns.length < 2) return null;
    const numCols = dataColumns.length;

    const validColsData = [];
    const validHeaders = [];
    const validIndices = [];
    for (let i = 0; i < numCols; ++i) {
        if (dataColumns[i] && Array.isArray(dataColumns[i])) {
            const cleanCol = dataColumns[i].filter(v => v !== null && !isNaN(v));
            if (cleanCol.length >= MIN_POINTS_FOR_CORR_REG && ss.variance(cleanCol) > STD_DEV_ZERO_THRESHOLD) {
                validColsData.push(dataColumns[i]);
                validHeaders.push(headers[i]);
                validIndices.push(i);
            }
        }
    }
    if (validColsData.length < 2) return null;

    const validNumCols = validColsData.length;
    const correlationMatrix = Array(validNumCols).fill(0).map(() => Array(validNumCols).fill(NaN));
    const spearmanMatrix = Array(validNumCols).fill(0).map(() => Array(validNumCols).fill(NaN));

    for (let i = 0; i < validNumCols; i++) {
        correlationMatrix[i][i] = 1.0;
        spearmanMatrix[i][i] = 1.0;
        for (let j = i + 1; j < validNumCols; j++) {
            const col1 = validColsData[i];
            const col2 = validColsData[j];
            const pairs = filterCleanPairs(col1, col2);

            if (pairs.length < MIN_POINTS_FOR_CORR_REG) {
                correlationMatrix[i][j] = NaN;
                spearmanMatrix[i][j] = NaN;
            } else {
                const x = pairs.map(p => p.x);
                const y = pairs.map(p => p.y);
                if (ss.variance(x) <= STD_DEV_ZERO_THRESHOLD || ss.variance(y) <= STD_DEV_ZERO_THRESHOLD) {
                    correlationMatrix[i][j] = NaN;
                    spearmanMatrix[i][j] = NaN;
                } else {
                    try {
                        correlationMatrix[i][j] = ss.sampleCorrelation(x, y);
                        if (!isFinite(correlationMatrix[i][j])) correlationMatrix[i][j] = NaN;
                    } catch (e) {
                        console.error(`计算 Pearson 相关性时出错 (${validHeaders[i]} vs ${validHeaders[j]}):`, e);
                        correlationMatrix[i][j] = NaN;
                    }
                    try {
                        spearmanMatrix[i][j] = ss.sampleRankCorrelation(x, y);
                        if (!isFinite(spearmanMatrix[i][j])) spearmanMatrix[i][j] = NaN;
                    } catch (e) {
                        console.error(`计算 Spearman 相关性时出错 (${validHeaders[i]} vs ${validHeaders[j]}):`, e);
                        spearmanMatrix[i][j] = NaN;
                    }
                }
            }
            correlationMatrix[j][i] = correlationMatrix[i][j];
            spearmanMatrix[j][i] = spearmanMatrix[i][j];
        }
    }
    return {
        pearson: correlationMatrix,
        spearman: spearmanMatrix,
        headers: validHeaders
    };
}


function calculateTTestOneSample(arr, hypothesizedMean) {
    const cleanArr = arr.filter(v => v !== null && !isNaN(v));
    const n = cleanArr.length;
    if (n < MIN_POINTS_FOR_TTEST) return null;

    const sampleMean = ss.mean(cleanArr);
    const sampleStdDev = ss.standardDeviation(cleanArr);
    const df = n - 1;
    let tStatistic = NaN;
    let pValue = NaN;

    if (sampleStdDev <= STD_DEV_ZERO_THRESHOLD) {
        tStatistic = (Math.abs(sampleMean - hypothesizedMean) < STD_DEV_ZERO_THRESHOLD) ? 0 : (sampleMean > hypothesizedMean ? Infinity : -Infinity);
        pValue = (Math.abs(sampleMean - hypothesizedMean) < STD_DEV_ZERO_THRESHOLD) ? 1.0 : 0.0;
    } else {
        tStatistic = (sampleMean - hypothesizedMean) / (sampleStdDev / Math.sqrt(n));
        try {
            const shiftedArr = cleanArr.map(x => x - hypothesizedMean);
            pValue = ss.tTest(shiftedArr, 0);

            if (typeof pValue !== 'number' || !isFinite(pValue)) {
                console.warn("ss.tTest did not return a valid p-value for one-sample test. Setting pValue to NaN.");
                pValue = NaN;
            }
        } catch (e) {
            console.error("单样本 T 检验 p-value 计算错误:", e);
            pValue = NaN;
        }
    }

    return {
        type: 'one_sample',
        tStatistic: tStatistic,
        pValue: pValue,
        df: df,
        hypothesizedMean: hypothesizedMean,
        sampleMean: sampleMean,
        sampleStdDev: sampleStdDev,
        n: n
    };
}

function calculateTTestPaired(arr1, arr2) {
    const differences = [];
    const nTotal = Math.min(arr1?.length ?? 0, arr2?.length ?? 0);
    for (let i = 0; i < nTotal; i++) {
        const val1 = arr1[i];
        const val2 = arr2[i];
        if (val1 !== null && !isNaN(val1) && val2 !== null && !isNaN(val2)) {
            differences.push(val1 - val2);
        }
    }

    const nPairs = differences.length;
    if (nPairs < MIN_POINTS_FOR_TTEST) return null;

    const diffMean = ss.mean(differences);
    const diffStdDev = ss.standardDeviation(differences);
    const df = nPairs - 1;
    let tStatistic = NaN;
    let pValue = NaN;

    if (diffStdDev <= STD_DEV_ZERO_THRESHOLD) {
        tStatistic = (Math.abs(diffMean) < STD_DEV_ZERO_THRESHOLD) ? 0 : (diffMean > 0 ? Infinity : -Infinity);
        pValue = (Math.abs(diffMean) < STD_DEV_ZERO_THRESHOLD) ? 1.0 : 0.0;
    } else {
        tStatistic = diffMean / (diffStdDev / Math.sqrt(nPairs));
        try {
            pValue = ss.tTest(differences, 0);

            if (typeof pValue !== 'number' || !isFinite(pValue)) {
                console.warn("ss.tTest did not return a valid p-value for paired test. Setting pValue to NaN.");
                pValue = NaN;
            }
        } catch (e) {
            console.error("配对样本 T 检验 p-value 计算错误:", e);
            pValue = NaN;
        }
    }

    return {
        type: 'paired',
        tStatistic: tStatistic,
        pValue: pValue,
        df: df,
        diffMean: diffMean,
        diffStdDev: diffStdDev,
        nPairs: nPairs,
        differences: differences
    };
}

function calculateTTestTwoSample(arr1, arr2) {
    const cleanArr1 = arr1.filter(v => v !== null && !isNaN(v));
    const cleanArr2 = arr2.filter(v => v !== null && !isNaN(v));
    const n1 = cleanArr1.length;
    const n2 = cleanArr2.length;

    if (n1 < MIN_POINTS_FOR_TTEST || n2 < MIN_POINTS_FOR_TTEST) {
        return null;
    }

    const mean1 = ss.mean(cleanArr1),
        mean2 = ss.mean(cleanArr2);
    const var1 = ss.variance(cleanArr1),
        var2 = ss.variance(cleanArr2);

    if (var1 < 0 || var2 < 0) {
        console.error("双样本 T 检验错误: 方差计算为负。");
        return null;
    }

    let tStatistic = NaN;
    let pValue = NaN;
    let df = NaN;

    const stdErr1 = Math.sqrt(var1 / n1);
    const stdErr2 = Math.sqrt(var2 / n2);
    const stdErrDiff = Math.sqrt(stdErr1 ** 2 + stdErr2 ** 2);

    if (stdErrDiff <= STD_DEV_ZERO_THRESHOLD) {
        tStatistic = (Math.abs(mean1 - mean2) < STD_DEV_ZERO_THRESHOLD) ? 0 : (mean1 > mean2 ? Infinity : -Infinity);
        pValue = (Math.abs(mean1 - mean2) < STD_DEV_ZERO_THRESHOLD) ? 1.0 : 0.0;
        df = n1 + n2 - 2;
    } else {
        tStatistic = (mean1 - mean2) / stdErrDiff;

        if (n1 > 1 && n2 > 1) {
            const term1 = (stdErr1 ** 4) / (n1 - 1);
            const term2 = (stdErr2 ** 4) / (n2 - 1);
            if (term1 >= 0 && term2 >= 0 && (term1 + term2) > STD_DEV_ZERO_THRESHOLD) {
                df = (stdErrDiff ** 4) / (term1 + term2);
                if (!isFinite(df) || df < 1) df = NaN;
            } else {
                df = NaN;
            }
        } else {
            df = NaN;
        }

        try {
            pValue = ss.tTestTwoSample(cleanArr1, cleanArr2);

            if (typeof pValue !== 'number' || !isFinite(pValue)) {
                console.warn("ss.tTestTwoSample did not return a valid p-value. Setting pValue to NaN.");
                pValue = NaN;
            }
        } catch (e) {
            console.error("双样本 T 检验 p-value 计算错误:", e);
            pValue = NaN;
        }
    }

    return {
        type: 'two_sample',
        tStatistic: tStatistic,
        pValue: pValue,
        df: df,
        mean1: mean1,
        mean2: mean2,
        var1: var1,
        var2: var2,
        n1: n1,
        n2: n2
    };
}

function calculatePermutationTest(arr1, arr2, iterations = 10000) {
    const cleanArr1 = arr1.filter(v => v !== null && !isNaN(v));
    const cleanArr2 = arr2.filter(v => v !== null && !isNaN(v));
    const n1 = cleanArr1.length;
    const n2 = cleanArr2.length;

    if (n1 < MIN_POINTS_FOR_PERMUTATION || n2 < MIN_POINTS_FOR_PERMUTATION) {
        throw new Error(`置换检验需要每组至少 ${MIN_POINTS_FOR_PERMUTATION} 个有效数据点 (找到 ${n1} 和 ${n2} 个)。`);
    }

    try {
        const pValue = ss.permutationTest(cleanArr1, cleanArr2); 

        if (typeof pValue !== 'number' || !isFinite(pValue)) {
            console.warn("ss.permutationTest did not return a valid p-value.");
            throw new Error("置换检验未能计算出有效的 p 值。");
        }

        const observedDiff = ss.mean(cleanArr1) - ss.mean(cleanArr2);
        const median1 = ss.median(cleanArr1);
        const median2 = ss.median(cleanArr2);

        return {
            type: 'permutation',
            pValue: pValue,
            iterations: iterations,
            observedMeanDifference: observedDiff,
            median1: median1,
            median2: median2,
            n1: n1,
            n2: n2
        };
    } catch (e) {
        console.error("置换检验计算错误:", e);
        if (e.message && e.message.includes('alternative')) {
            throw new Error(`置换检验计算失败: 库参数错误 - ${e.message}。请检查 'alternative' 参数是否为 'two_side', 'greater', 或 'less'。`);
        }
        throw new Error(`置换检验计算失败: ${e.message}`);
    }
}


function calculateKMeans(dataColumns, headers, k) {
    if (k < 2) throw new Error("K-均值聚类需要 K ≥ 2。");
    if (!dataColumns || dataColumns.length !== 2) {
        throw new Error("K-均值聚类当前配置需要正好两列数据 (X 和 Y)。");
    }

    const numDimensions = dataColumns.length;
    const numPoints = dataColumns[0].length;

    const dataPoints = [];
    const originalIndices = [];
    for (let i = 0; i < numPoints; i++) {
        const point = [];
        let hasNaN = false;
        for (let j = 0; j < numDimensions; j++) {
            const val = dataColumns[j][i];
            if (val === null || isNaN(val)) {
                hasNaN = true;
                break;
            }
            point.push(val);
        }
        if (!hasNaN) {
            dataPoints.push(point);
            originalIndices.push(i);
        }
    }

    if (dataPoints.length < k) {
        throw new Error(`K-均值聚类失败：有效数据点 (${dataPoints.length}) 少于聚类数 K (${k})。`);
    }
    if (dataPoints.length === 0) {
        throw new Error(`K-均值聚类失败：没有找到任何包含完整数值的行用于聚类。`);
    }

    try {
        const result = ss.kMeansCluster(dataPoints, k);
        if (!result || !result.labels || !result.centroids) {
            throw new Error("K-均值聚类未能返回有效结果。");
        }

        let silhouetteResult = {
            scores: [],
            mean: NaN
        };
        if (dataPoints.length > 1 && new Set(result.labels).size > 1) {
            try {
                const scores = ss.silhouette(dataPoints, result.labels);
                const validScores = scores.filter(s => !isNaN(s));
                silhouetteResult.scores = scores;
                silhouetteResult.mean = validScores.length > 0 ? ss.mean(validScores) : NaN;
            } catch (silhouetteError) {
                console.warn("计算 Silhouette 分数时出错:", silhouetteError);
            }
        } else {
            console.warn("无法计算 Silhouette 分数：需要至少 2 个聚类和多个数据点。");
        }

        return {
            type: 'kmeans',
            k: k,
            labels: result.labels,
            centroids: result.centroids,
            silhouette: silhouetteResult,
            clusteredDataPoints: dataPoints,
            originalIndices: originalIndices,
            dimensionsUsed: headers
        };
    } catch (e) {
        console.error("K-均值聚类计算错误:", e);
        throw new Error(`K-均值聚类计算失败: ${e.message}`);
    }
}

function displayStats(statsData, chartType) {
    currentStatsData = statsData;
    let statsHTML = '';
    if (!statsData) {
        statsHTML = '<p>无法计算统计摘要。</p>';
        statsContentDiv.innerHTML = statsHTML;
        return;
    }

    let generalStatsHTML = '<h4>数据列概览</h4>';
    let specificStatsHTML = '<h4>特定分析结果</h4>';
    let generalStatsFound = false;
    let specificStatsFound = false;

    let headersToShow = [];
    if (statsData.involvedHeaders && statsData.involvedHeaders.length > 0) {
        headersToShow = statsData.involvedHeaders;
    } else if (statsData.kmeans && statsData.kmeans.dimensionsUsed) {
        headersToShow = statsData.kmeans.dimensionsUsed;
    } else if (statsData.correlationMatrix && statsData.correlationMatrix.headers) {
        headersToShow = statsData.correlationMatrix.headers;
    } else if (Object.keys(statsData.basicStats).length > 0) {
        headersToShow = Object.keys(statsData.basicStats);
    }

    if (chartType === 't_test_paired' && statsData.tTest && statsData.involvedHeaders?.length === 2) {
        const diffHeader = `配对差值 (${statsData.involvedHeaders[0]} - ${statsData.involvedHeaders[1]})`;
        if (statsData.basicStats[diffHeader] && !headersToShow.includes(diffHeader)) {
            headersToShow.push(diffHeader);
        }
    }

    if (statsData.basicStats && headersToShow.length > 0) {
        let listHTML = '<ul>';
        headersToShow.forEach(header => {
            const bs = statsData.basicStats[header];
            if (bs && bs.count !== undefined) {
                listHTML += `<li><b>${header}:</b>
                                <ul>
                                    <li><span>计数 (N):</span> ${bs.count}</li>
                                    <li><span>合计:</span> ${formatStat(bs.sum)}</li>
                                    <li><span>均值:</span> ${formatStat(bs.mean)}</li>
                                    <li><span>中位数:</span> ${formatStat(bs.median)}</li>
                                    <li><span>标准差 (SD):</span> ${formatStat(bs.stdDev)}</li>
                                    <li><span>方差:</span> ${formatStat(bs.variance)}</li>
                                    <li><span>最小值:</span> ${formatStat(bs.min)}</li>
                                    <li><span>最大值:</span> ${formatStat(bs.max)}</li>
                                    <li><span>Q1 (25%):</span> ${formatStat(bs.q1)}</li>
                                    <li><span>Q3 (75%):</span> ${formatStat(bs.q3)}</li>
                                </ul>
                            </li>`;
                generalStatsFound = true;
            } else if (header.startsWith('配对差值') && bs && bs.count === 0) {
                listHTML += `<li><b>${header}:</b> <ul><li><span>计数:</span> 0 (无有效配对数据)</li></ul></li>`;
                generalStatsFound = true;
            }
        });
        listHTML += '</ul>';
        if (generalStatsFound) {
            generalStatsHTML += listHTML;
        } else {
            generalStatsHTML += '<p>未能计算所选列的基本统计信息。</p>';
        }
    } else {
        generalStatsHTML += '<p>无相关数据列可供统计。</p>';
    }

    let specificListHTML = '<ul>';
    const xHeader = statsData.involvedHeaders ? (statsData.involvedHeaders[0] || 'X') : 'X';
    const yHeader = statsData.involvedHeaders ? (statsData.involvedHeaders[1] || 'Y') : 'Y';
    const zHeader = statsData.involvedHeaders ? (statsData.involvedHeaders[2] || 'Z') : 'Z';
    const cHeader = statsData.involvedHeaders ? (statsData.involvedHeaders[3] || 'Color') : 'Color';


    if (statsData.tTest || statsData.permutationTest) {
        const test = statsData.tTest || statsData.permutationTest;
        let testTitle = '';
        let hypothesis = '';
        let comparison = '';
        let pValueText = 'N/A';
        let interpretation = '无法解释 (P 值无效)。';

        if (test.type === 'one_sample') {
            testTitle = `单样本 T 检验 (${xHeader})`;
            hypothesis = `H₀: 总体均值 = ${test.hypothesizedMean}`;
            comparison = `样本 (N=${test.n}, Mean=${formatStat(test.sampleMean)}, SD=${formatStat(test.sampleStdDev)}) vs μ₀=${test.hypothesizedMean}`;
            pValueText = formatStat(test.pValue, 5);
            specificListHTML += `<li><b>${testTitle}:</b>
                                <ul>
                                    <li><span>原假设 (H₀):</span> ${hypothesis}</li>
                                    <li><span>比较:</span> ${comparison}</li>
                                    <li><span>T 统计量:</span> ${formatStat(test.tStatistic)}</li>
                                    <li><span>自由度 (df):</span> ${formatStat(test.df, 1)}</li>
                                    <li><span>P 值 (双尾):</span> ${pValueText}</li>`;
        } else if (test.type === 'paired') {
            testTitle = `配对样本 T 检验 (${xHeader} vs ${yHeader})`;
            hypothesis = `H₀: 总体配对差值均值 = 0`;
            comparison = `配对差值 (N=${test.nPairs}, Mean=${formatStat(test.diffMean)}, SD=${formatStat(test.diffStdDev)})`;
            pValueText = formatStat(test.pValue, 5);
            specificListHTML += `<li><b>${testTitle}:</b>
                                <ul>
                                    <li><span>原假设 (H₀):</span> ${hypothesis}</li>
                                    <li><span>比较:</span> ${comparison}</li>
                                    <li><span>T 统计量:</span> ${formatStat(test.tStatistic)}</li>
                                    <li><span>自由度 (df):</span> ${formatStat(test.df, 1)}</li>
                                    <li><span>P 值 (双尾):</span> ${pValueText}</li>`;
        } else if (test.type === 'two_sample') {
            testTitle = `双独立样本 T 检验 (${xHeader} vs ${yHeader})`;
            hypothesis = `H₀: 两个总体均值相等`;
            comparison = `组1 (${xHeader}: N=${test.n1}, Mean=${formatStat(test.mean1)}, Var=${formatStat(test.var1)}) vs 组2 (${yHeader}: N=${test.n2}, Mean=${formatStat(test.mean2)}, Var=${formatStat(test.var2)})`;
            pValueText = formatStat(test.pValue, 5);
            specificListHTML += `<li><b>${testTitle} (Welch's):</b>
                                <ul>
                                    <li><span>原假设 (H₀):</span> ${hypothesis}</li>
                                    <li><span>比较:</span> ${comparison}</li>
                                    <li><span>T 统计量:</span> ${formatStat(test.tStatistic)}</li>
                                    <li><span>自由度 (df):</span> ${formatStat(test.df, 1)} (Welch-Satterthwaite approx.)</li>
                                    <li><span>P 值 (双尾):</span> ${pValueText}</li>`;
        } else if (test.type === 'permutation') {
            testTitle = `置换检验 (${xHeader} vs ${yHeader})`;
            hypothesis = `H₀: 两组数据来自同一分布 (或均值/中位数无差异)`;
            comparison = `组1 (N=${test.n1}, Median=${formatStat(test.median1)}) vs 组2 (N=${test.n2}, Median=${formatStat(test.median2)})`;
            pValueText = formatStat(test.pValue, 5);
            specificListHTML += `<li><b>${testTitle}:</b>
                                <ul>
                                    <li><span>原假设 (H₀):</span> ${hypothesis}</li>
                                    <li><span>比较:</span> ${comparison}</li>
                                    <li><span>观测均值差:</span> ${formatStat(test.observedMeanDifference)}</li>
                                    <li><span>置换次数:</span> ${test.iterations}</li>
                                    <li><span>P 值 (双尾):</span> ${pValueText}</li>`;
        }

        if (pValueText !== 'N/A') {
            const pNum = parseFloat(test.pValue);
            const significant = !isNaN(pNum) && pNum < SIGNIFICANCE_LEVEL;
            interpretation = significant ?
                `P 值 < ${SIGNIFICANCE_LEVEL}，拒绝 H₀，观察到的差异在统计上显著。` :
                `P 值 ≥ ${SIGNIFICANCE_LEVEL}，未能拒绝 H₀，未发现统计上的显著差异。`;
        }
        specificListHTML += `<li><span>解释 (α=${SIGNIFICANCE_LEVEL}):</span> ${interpretation}</li>`;
        if (test.type === 'permutation') {
            specificListHTML += `<li><span>注意:</span> 此为非参数检验，不假设数据正态分布。</li>`;
        }
        specificListHTML += `</ul></li>`;
        specificStatsFound = true;
    } else {
        switch (chartType) {
            case 'pareto':
                if (statsData.pareto) {
                    specificListHTML += `<li><span>注意:</span> 帕累托图显示了各类别的值（降序）及其累积百分比。</li>`;
                    specificStatsFound = true;
                }
                break;
            case 'pie':
                specificListHTML += `<li><span>注意:</span> 饼图显示了各类别的值占总和的比例。</li>`;
                specificStatsFound = true;
                break;
            case 'gaussian':
                if (statsData.gaussian) {
                    specificListHTML += `<li><span>高斯拟合参数 (${xHeader}):</span> μ = ${formatStat(statsData.gaussian.mean)}, σ = ${formatStat(statsData.gaussian.stdDev)}</li>`;
                    specificStatsFound = true;
                }
                break;
            case 'density':
                specificListHTML += `<li><span>注意:</span> 显示的是核密度估计 (KDE) 曲线，一种非参数方法估计概率密度函数。</li>`;
                specificStatsFound = true;
                break;
            case 'histogram':
            case 'bar':
                specificListHTML += `<li><span>注意:</span> 显示的是频数或值的分布。</li>`;
                specificStatsFound = true;
                break;
            case 'scatter':
            case 'area':
            case 'scatter_linear_regression':
            case 'line_trend':
            case 'residual_plot_linear':
            case 'scatter_poly2_regression':
            case 'scatter_poly3_regression':
            case 'scatter_exp_regression':
            case 'scatter_log_regression':
            case 'scatter_power_regression':
                if (statsData.correlation !== undefined) {
                    const corrVal = statsData.correlation;
                    const corrText = isNaN(corrVal) ? 'N/A (数据不足或方差为零)' : formatStat(corrVal);
                    specificListHTML += `<li><span>皮尔逊相关系数 (${xHeader} vs ${yHeader}):</span> ${corrText}</li>`;
                    specificStatsFound = true;
                }
                if (statsData.spearmanCorrelation !== undefined) {
                    const spearmanVal = statsData.spearmanCorrelation;
                    const spearmanText = isNaN(spearmanVal) ? 'N/A (数据不足或计算错误)' : formatStat(spearmanVal);
                    specificListHTML += `<li><span>斯皮尔曼等级相关系数 (${xHeader} vs ${yHeader}):</span> ${spearmanText}</li>`;
                    specificStatsFound = true;
                }

                if (statsData.regression && chartType !== 'area') {
                    const reg = statsData.regression;
                    let regTitle = '';
                    let regDetails = '';

                    switch (reg.type) {
                        case 'linear':
                            regTitle = `线性回归模型 (${yHeader} ~ ${xHeader})`;
                            regDetails = `<li><span>回归方程:</span> ${reg.equationString || `${yHeader} ≈ ${formatStat(reg.slope)} * ${xHeader} + ${formatStat(reg.intercept)}`}</li>
                                            <li><span>判定系数 (R²):</span> ${formatStat(reg.rSquared)}</li>
                                            <li><span>解释:</span> 模型解释了 ${yHeader} 方差的 ${formatStat(reg.rSquared * 100, 1)}%。</li>`;
                            break;
                        case 'polynomial':
                            regTitle = `${reg.degree}次多项式回归 (${yHeader} ~ ${xHeader})`;
                            regDetails = `<li><span>拟合方程:</span> ${reg.equationString || 'N/A'}</li>
                                            <li><span>判定系数 (R²):</span> ${formatStat(reg.rSquared)}</li>`;
                            break;
                        case 'exponential':
                            regTitle = `指数回归 (${yHeader} ~ ${xHeader})`;
                            regDetails = `<li><span>拟合方程:</span> ${reg.equationString || 'N/A'}</li>
                                            <li><span>判定系数 (R²):</span> ${formatStat(reg.rSquared)}</li>`;
                            break;
                        case 'logarithmic':
                            regTitle = `对数回归 (${yHeader} ~ ${xHeader})`;
                            regDetails = `<li><span>拟合方程:</span> ${reg.equationString || 'N/A'}</li>
                                            <li><span>判定系数 (R²):</span> ${formatStat(reg.rSquared)}</li>`;
                            break;
                        case 'power':
                            regTitle = `幂函数回归 (${yHeader} ~ ${xHeader})`;
                            regDetails = `<li><span>拟合方程:</span> ${reg.equationString || 'N/A'}</li>
                                            <li><span>判定系数 (R²):</span> ${formatStat(reg.rSquared)}</li>`;
                            break;
                    }

                    if (regTitle) {
                        specificListHTML += `<li><b>${regTitle}:</b><ul>${regDetails}</ul></li>`;
                        specificStatsFound = true;
                    }

                    if (statsData.residuals && (chartType === 'residual_plot_linear' || reg.type === 'linear')) {
                        specificListHTML += `<li><b>残差统计 (线性模型):</b>
                                                <ul>
                                                    <li><span>均值:</span> ${formatStat(statsData.residuals.mean)}</li>
                                                    <li><span>标准差:</span> ${formatStat(statsData.residuals.stdDev)}</li>
                                                </ul>
                                            </li>`;
                        specificStatsFound = true;
                    }
                } else if (chartType !== 'area' && !chartType.startsWith('t_test') && chartType !== 'permutation_test' && chartType !== 'kmeans' && chartType !== 'contour_density' && chartType !== 'bubble_color' && chartType !== 'scatter' && chartType !== 'line_trend') {
                    specificListHTML += `<li>无法计算回归模型 (数据不足、不满足模型要求、方差为零或计算错误)。</li>`;
                    specificStatsFound = true;
                }
                break;
            case 'correlation_heatmap':
                if (statsData.correlationMatrix) {
                    const pearsonMatrix = statsData.correlationMatrix.pearson;
                    const spearmanMatrix = statsData.correlationMatrix.spearman;
                    const headers = statsData.correlationMatrix.headers;
                    if (pearsonMatrix) {
                        let matrixHTML = `<b>皮尔逊相关系数矩阵 (${headers.length}x${headers.length}):</b><pre>`;
                        const colWidth = Math.max(8, ...headers.map(h => h.length)) + 2;
                        matrixHTML += ''.padEnd(colWidth);
                        headers.forEach(h => matrixHTML += h.padEnd(colWidth));
                        matrixHTML += '\n';
                        pearsonMatrix.forEach((row, i) => {
                            matrixHTML += headers[i].padEnd(colWidth);
                            row.forEach(val => matrixHTML += formatStat(val, 2).padEnd(colWidth));
                            matrixHTML += '\n';
                        });
                        matrixHTML += '</pre>';
                        specificStatsHTML += matrixHTML;
                        specificStatsFound = true;
                    }
                    if (spearmanMatrix) {
                        let matrixHTML = `<b>斯皮尔曼相关系数矩阵 (${headers.length}x${headers.length}):</b><pre>`;
                        const colWidth = Math.max(8, ...headers.map(h => h.length)) + 2;
                        matrixHTML += ''.padEnd(colWidth);
                        headers.forEach(h => matrixHTML += h.padEnd(colWidth));
                        matrixHTML += '\n';
                        spearmanMatrix.forEach((row, i) => {
                            matrixHTML += headers[i].padEnd(colWidth);
                            row.forEach(val => matrixHTML += formatStat(val, 2).padEnd(colWidth));
                            matrixHTML += '\n';
                        });
                        matrixHTML += '</pre>';
                        specificStatsHTML += matrixHTML;
                        specificStatsFound = true;
                    }
                } else {
                    specificListHTML += '<li>无法计算相关系数矩阵 (有效数值列不足或计算错误)。</li>';
                    specificStatsFound = true;
                }
                break;
            case 'scatter_matrix':
                const splomColorHeader = statsData.splomColorHeader;
                let splomNote = `散点图矩阵显示了所选数值变量两两之间的关系。`;
                if (splomColorHeader) {
                    splomNote += ` 点颜色基于列 "${splomColorHeader}"。`;
                }
                if (statsData.correlationMatrix) {
                    splomNote += ' 相关系数见下方矩阵。';
                    const pearsonMatrix = statsData.correlationMatrix.pearson;
                    const spearmanMatrix = statsData.correlationMatrix.spearman;
                    const headers = statsData.correlationMatrix.headers;
                    if (pearsonMatrix) {
                        let matrixHTML = `<b>皮尔逊相关系数矩阵 (${headers.length}x${headers.length}):</b><pre>`;
                        const colWidth = Math.max(8, ...headers.map(h => h.length)) + 2;
                        matrixHTML += ''.padEnd(colWidth);
                        headers.forEach(h => matrixHTML += h.padEnd(colWidth));
                        matrixHTML += '\n';
                        pearsonMatrix.forEach((row, i) => {
                            matrixHTML += headers[i].padEnd(colWidth);
                            row.forEach(val => matrixHTML += formatStat(val, 2).padEnd(colWidth));
                            matrixHTML += '\n';
                        });
                        matrixHTML += '</pre>';
                        specificStatsHTML += matrixHTML;
                    }
                    if (spearmanMatrix) {
                        let matrixHTML = `<b>斯皮尔曼相关系数矩阵 (${headers.length}x${headers.length}):</b><pre>`;
                        const colWidth = Math.max(8, ...headers.map(h => h.length)) + 2;
                        matrixHTML += ''.padEnd(colWidth);
                        headers.forEach(h => matrixHTML += h.padEnd(colWidth));
                        matrixHTML += '\n';
                        spearmanMatrix.forEach((row, i) => {
                            matrixHTML += headers[i].padEnd(colWidth);
                            row.forEach(val => matrixHTML += formatStat(val, 2).padEnd(colWidth));
                            matrixHTML += '\n';
                        });
                        matrixHTML += '</pre>';
                        specificStatsHTML += matrixHTML;
                    }
                } else {
                    splomNote += ' 无法计算相关系数矩阵。';
                }
                specificListHTML += `<li><span>注意:</span> ${splomNote}</li>`;
                specificStatsFound = true;
                break;
            case 'contour':
            case 'bubble_color':
                let cDimHeader = (chartType === 'contour') ? zHeader : zHeader;
                specificListHTML += `<li><span>注意:</span> 此图表用于可视化三维数据关系 (${xHeader}, ${yHeader}, ${cDimHeader})。</li>`;
                specificStatsFound = true;
                break;
            case 'scatter_3d':
                specificListHTML += `<li><span>注意:</span> 此图表用于可视化四维数据关系 (${xHeader}, ${yHeader}, ${zHeader}, ${cHeader} 为颜色)。</li>`;
                specificStatsFound = true;
                break;
            case 'contour_density':
                specificListHTML += `<li><span>注意:</span> 此图表显示 X-Y 平面上的数据点密度。</li>`;
                specificStatsFound = true;
                break;
            case 'parallel_coordinates':
                const parcoordsColorHeader = statsData.parcoordsColorHeader;
                let parcoordsNote = `平行坐标图用于可视化多个变量之间的关系和模式。`;
                if (parcoordsColorHeader) {
                    parcoordsNote += ` 线条颜色基于列 "${parcoordsColorHeader}"。`;
                }
                if (statsData.parcoordsInteractionNote) {
                    parcoordsNote += ` ${statsData.parcoordsInteractionNote}`;
                }
                specificListHTML += `<li><span>注意:</span> ${parcoordsNote}</li>`;
                specificStatsFound = true;
                break;
            case 'kmeans':
                if (statsData.kmeans) {
                    const km = statsData.kmeans;
                    specificListHTML += `<li><b>K-均值聚类结果 (基于 ${km.dimensionsUsed.join(', ')}):</b>
                                            <ul>
                                                <li><span>聚类数 (K):</span> ${km.k}</li>
                                                <li><span>聚类点数:</span> ${km.clusteredDataPoints.length} (来自 ${currentParsedData?.numericData[0]?.length ?? '?'} 行，移除了缺失值)</li>
                                                <li><span>平均 Silhouette 分数:</span> ${formatStat(km.silhouette.mean)} (越接近 1 越好)</li>
                                                <li><span>质心坐标 (维度: ${km.dimensionsUsed.join('/')}):</span></li>
                                                <pre>${km.centroids.map((c, i) => `  Cluster ${i + 1}: [${c.map(v => formatStat(v, 2)).join(', ')}]`).join('\n')}</pre>
                                            </ul>
                                        </li>`;
                    specificStatsFound = true;
                }
                break;
        }
    }

    specificListHTML += '</ul>';

    statsHTML = generalStatsHTML;

    const hasSpecificListContent = specificListHTML.replace(/<\/?ul>/g, '').trim().length > 0;
    const hasSpecificPreContent = specificStatsHTML.includes('<pre>');

    if (specificStatsFound && (hasSpecificListContent || hasSpecificPreContent)) {
        statsHTML += '<hr/>';
        statsHTML += specificStatsHTML;
        if (hasSpecificListContent) {
            statsHTML += specificListHTML;
        }
    } else if (!generalStatsFound && !specificStatsFound) {
        statsHTML = '<p>未能计算任何统计摘要。</p>';
    }

    statsContentDiv.innerHTML = statsHTML;
}

function applyOrdinalMap(layout, axisName, columnIndex, ordinalMaps) {
    if (ordinalMaps && ordinalMaps[columnIndex]) {
        const mapping = ordinalMaps[columnIndex];
        const tickvals = Object.keys(mapping).map(Number).sort((a,b) => a-b);
        const ticktext = tickvals.map(val => mapping[val]);
        
        if (!layout[axisName]) layout[axisName] = {};
        layout[axisName].tickvals = tickvals;
        layout[axisName].ticktext = ticktext;
    }
}

function drawUnivariateChart(chartType, data, header, statsData, layout) {
    const traces = [];
    const cleanData = data.filter(v => v !== null && !isNaN(v));
    if (cleanData.length === 0) throw new Error(`选择的列 (${header}) 没有有效的数值数据。`);

    layout.xaxis.title = header;
    const basicStats = statsData.basicStats[header];

    switch (chartType) {
        case 'histogram':
            traces.push({ x: cleanData, type: 'histogram', name: '频数', marker: { color: DEFAULT_POINT_COLOR } });
            layout.title = `直方图: ${header}`;
            layout.yaxis.title = '频数 (Count)';
            break;
        case 'boxplot':
            traces.push({ y: cleanData, type: 'box', name: header, boxpoints: 'all', jitter: 0.3, pointpos: -1.8, boxmean: 'sd', marker: { color: DEFAULT_POINT_COLOR } });
            layout.title = `箱线图: ${header}`;
            layout.yaxis.title = '数据值';
            layout.xaxis.title = '';
            break;
        case 'violin':
            traces.push({ y: cleanData, type: 'violin', name: header, points: 'all', box: { visible: true }, meanline: { visible: true }, marker: { color: DEFAULT_POINT_COLOR } });
            layout.title = `小提琴图: ${header}`;
            layout.yaxis.title = '数据值';
            layout.xaxis.title = '';
            break;
        case 'density':
            if (cleanData.length < MIN_POINTS_FOR_KDE) {
                throw new Error(`KDE 拟合需要至少 ${MIN_POINTS_FOR_KDE} 个有效数据点 (找到 ${cleanData.length} 个)。`);
            }
            try {
                const kde = ss.kernelDensityEstimation(cleanData);
                const dataMin = basicStats.min, dataMax = basicStats.max;
                const range = dataMax - dataMin;
                const plotMin = dataMin - range * 0.1, plotMax = dataMax + range * 0.1;
                const step = (plotMax - plotMin) / KDE_PLOT_POINTS;
                const xPoints = Array.from({ length: KDE_PLOT_POINTS + 1 }, (_, i) => plotMin + i * step);
                const yPoints = xPoints.map(x => kde(x));

                traces.push({ x: xPoints, y: yPoints, type: 'scatter', mode: 'lines', name: 'KDE 拟合', line: { color: 'red' } });
                traces.push({ x: cleanData, type: 'histogram', histnorm: 'probability density', name: '数据分布 (参考)', autobinx: true, marker: { color: DEFAULT_POINT_COLOR, opacity: 0.5 } });
                layout.barmode = 'overlay';
                layout.title = `KDE 拟合: ${header}`;
                layout.yaxis.title = '密度';
            } catch (e) {
                console.error("KDE 计算错误:", e);
                throw new Error(`计算 KDE 时出错: ${e.message}`);
            }
            break;
        case 'gaussian':
            layout.title = `直方图与高斯拟合: ${header}`;
            layout.yaxis.title = '概率密度';
            if (!basicStats || basicStats.count < MIN_POINTS_FOR_TTEST || basicStats.stdDev <= STD_DEV_ZERO_THRESHOLD) {
                chartErrorDiv.textContent += `\n警告：列 "${header}" 数据点过少或标准差为零，无法绘制有效高斯曲线。`;
                traces.push({ x: cleanData, type: 'histogram', histnorm: 'probability density', name: '密度', marker: { color: DEFAULT_POINT_COLOR } });
            } else {
                const { mean, stdDev, min, max } = basicStats;
                statsData.gaussian = { mean, stdDev };
                traces.push({ x: cleanData, type: 'histogram', histnorm: 'probability density', name: '观测密度', marker: { color: DEFAULT_POINT_COLOR, opacity: 0.6 } });
                const rangeMin = mean - 4 * stdDev, rangeMax = mean + 4 * stdDev;
                const plotMin = Math.min(min, rangeMin), plotMax = Math.max(max, rangeMax);
                const step = (plotMax - plotMin) / KDE_PLOT_POINTS;
                const curveX = Array.from({ length: KDE_PLOT_POINTS + 1 }, (_, i) => plotMin + i * step);
                const curveY = curveX.map(x => gaussianPDF(x, mean, stdDev));
                traces.push({ x: curveX, y: curveY, type: 'scatter', mode: 'lines', name: `高斯拟合 (μ=${formatStat(mean)}, σ=${formatStat(stdDev)})`, line: { color: 'red', width: 2 } });
                layout.barmode = 'overlay';
            }
            break;
        case 'cdf':
            const sortedData = [...cleanData].sort((a, b) => a - b);
            traces.push({ x: sortedData, type: 'histogram', histnorm: 'probability', cumulative: { enabled: true, direction: "increasing" }, name: '累积概率 (ECDF)', marker: { color: DEFAULT_POINT_COLOR } });
            layout.title = `累积分布函数 (ECDF): ${header}`;
            layout.yaxis.title = '累积概率 P(X ≤ x)';
            layout.yaxis.range = [0, 1.05];
            break;
    }
    return { traces, layout };
}
function drawBivariateChart(chartType, xData, yData, xHeader, yHeader, idxX, idxY, statsData, layout) {
    let traces = [];
    let traces2 = [];
    let layout2 = null;

    let combinedData = xData.map((val, i) => ({ x: val, y: yData[i] }));
    const { ordinalMaps } = currentParsedData;

    if ((chartType === 'line_trend' || chartType === 'area') && ordinalMaps && ordinalMaps[idxX]) {
        combinedData.sort((a, b) => {
            if (a.x === null || isNaN(a.x)) return 1;
            if (b.x === null || isNaN(b.x)) return -1;
            return a.x - b.x;
        });
    }
    
    const cleanPairs = combinedData.filter(d => d.x !== null && !isNaN(d.x) && d.y !== null && !isNaN(d.y));
    if (cleanPairs.length === 0) throw new Error(`选择的列 (${xHeader} 和 ${yHeader}) 之间没有有效的 X-Y 数据对。`);
    
    const xClean = cleanPairs.map(p => p.x);
    const yClean = cleanPairs.map(p => p.y);


    if (chartType === 'contour_density') {
        traces.push({
            x: xClean,
            y: yClean,
            type: 'histogram2dcontour',
            colorscale: 'Viridis',
            contours: { coloring: 'heatmap', showlabels: true, labelfont: { size: 10, color: 'white' } },
            colorbar: { title: '点密度' }
        });
        layout.title = `数据点密度等高线图 (${xHeader}, ${yHeader})`;
    } else {
        statsData.correlation = NaN;
        statsData.spearmanCorrelation = NaN;
        if (xClean.length >= MIN_POINTS_FOR_CORR_REG) {
            const varianceX = ss.variance(xClean);
            const varianceY = ss.variance(yClean);
            if (varianceX > STD_DEV_ZERO_THRESHOLD && varianceY > STD_DEV_ZERO_THRESHOLD) {
                try {
                    statsData.correlation = ss.sampleCorrelation(xClean, yClean);
                    if (!isFinite(statsData.correlation)) statsData.correlation = NaN;
                } catch (e) { console.error(`Pearson Correlation Error:`, e); statsData.correlation = NaN; }
                try {
                    statsData.spearmanCorrelation = ss.sampleRankCorrelation(xClean, yClean);
                    if (!isFinite(statsData.spearmanCorrelation)) statsData.spearmanCorrelation = NaN;
                } catch (e) { console.error(`Spearman Correlation Error:`, e); statsData.spearmanCorrelation = NaN; }
            }
        }
    }
    
    layout.xaxis.title = xHeader;
    layout.yaxis.title = yHeader;
    if(!layout.title) layout.title = `${yHeader} vs ${xHeader}`;

    const plotMode = (chartType.startsWith('line') || chartType === 'area' || chartType === 'scatter') ? 'lines+markers' : 'markers';
    const baseTrace = {
        x: xClean,
        y: yClean,
        mode: plotMode,
        type: 'scatter',
        name: '观测数据',
        marker: {
            color: DEFAULT_POINT_COLOR
        }
    };
    if(chartType === 'scatter') baseTrace.mode = 'markers';
    if(chartType === 'line_trend') baseTrace.mode = 'lines+markers';

    if (chartType === 'area') {
        baseTrace.fill = 'tozeroy';
        layout.title = `面积图: ${yHeader} vs ${xHeader}`;
    }

    if(chartType !== 'contour_density') {
        traces.push(baseTrace);
    }
    
    let regressionModel = null;
    let showResiduals = (chartType === 'residual_plot_linear');
    let regressionError = null;
    const needsRegression = chartType.includes('regression') || showResiduals;

    if (needsRegression) {
        try {
            regressionModel = getRegressionModel(chartType, xClean, yClean);
        } catch (error) {
            regressionError = error.message;
            console.error("回归计算失败:", error);
        }
    }

    if (regressionModel) {
        statsData.regression = regressionModel;
        const xRange = ss.extent(xClean);
        const xMin = xRange[0], xMax = xRange[1];
        const xFitStart = (xMin === xMax) ? xMin - 1 : xMin;
        const xFitEnd = (xMin === xMax) ? xMax + 1 : xMax;
        const numFitPoints = 100;
        const xFit = Array.from({ length: numFitPoints + 1 }, (_, i) => xFitStart + (xFitEnd - xFitStart) * i / numFitPoints);

        const yFit = xFit.map(x => {
            try {
                if ((regressionModel.type === 'logarithmic' || regressionModel.type === 'power') && x <= POSITIVE_VALUE_THRESHOLD) return NaN;
                return regressionModel.predict(x);
            } catch (e) { return NaN; }
        });

        const validFitPoints = xFit.map((x, i) => ({ x: x, y: yFit[i] })).filter(p => !isNaN(p.y));

        if (validFitPoints.length > 1) {
            traces.push({
                x: validFitPoints.map(p => p.x),
                y: validFitPoints.map(p => p.y),
                mode: 'lines', type: 'scatter',
                name: `${regressionModel.type} 拟合 (R²=${formatStat(regressionModel.rSquared)})`,
                line: { color: 'red' }
            });
            let fitTypeName = regressionModel.type.charAt(0).toUpperCase() + regressionModel.type.slice(1);
            if (regressionModel.type === 'polynomial') fitTypeName += ` (阶数 ${regressionModel.degree})`;
            layout.title += ` (${fitTypeName} 拟合)`;
        } else if (!regressionError) {
            regressionError = `无法绘制有效的 ${regressionModel.type} 拟合曲线。`;
        }

        if (showResiduals && regressionModel.type === 'linear') {
            const residuals = yClean.map((y, i) => y - regressionModel.predict(xClean[i]));
            const cleanResiduals = residuals.filter(r => !isNaN(r));
            statsData.residuals = cleanResiduals.length > 0 ? { mean: ss.mean(cleanResiduals), stdDev: ss.standardDeviation(cleanResiduals) } : { mean: NaN, stdDev: NaN };
            
            traces2.push({ x: xClean, y: residuals, mode: 'markers', type: 'scatter', name: '残差', marker: { color: DEFAULT_POINT_COLOR } });
            traces2.push({ x: ss.extent(xClean), y: [0, 0], mode: 'lines', type: 'scatter', name: 'y=0', line: { color: 'grey', dash: 'dash' } });
            
            layout2 = { title: `残差图 (基于 ${xHeader} 的线性模型)`, xaxis: { title: xHeader }, yaxis: { title: '残差 (观测值 - 预测值)', zeroline: true }, hovermode: 'closest', margin: layout.margin, autosize: true };
            plotDiv2.style.display = 'block';
        }
    }

    if (regressionError) {
        chartErrorDiv.textContent = (chartErrorDiv.textContent ? chartErrorDiv.textContent + '\n' : '') + `警告：${regressionError}`;
    }
    
    applyOrdinalMap(layout, 'xaxis', idxX, ordinalMaps);
    applyOrdinalMap(layout, 'yaxis', idxY, ordinalMaps);

    return { traces, layout, traces2, layout2 };
}

function createPlotlyDimension(header, values) {
    const cleanCol = values.filter(v => v !== null && !isNaN(v));
    let range = [0, 1];
    if (cleanCol.length > 0) {
        range = ss.extent(cleanCol);
        if (range[0] === range[1]) {
            const val = range[0];
            const offset = Math.abs(val * 0.1) || 1;
            range = [val - offset, val + offset];
        }
    }
    return {
        label: header,
        values: values,
        range: range
    };
}

function drawMultivariateChart(chartType, numericDataColumns, originalDataColumns, originalHeaders, statsData, layout) {
    const traces = [];

    const potentiallyValidNumericCols = [];
    const potentiallyValidOriginalCols = [];
    const potentiallyValidHeaders = [];
    const potentiallyValidIndices = [];

    numericDataColumns.forEach((col, i) => {
        if (col && Array.isArray(col) && col.some(v => v !== null && !isNaN(v))) {
            potentiallyValidNumericCols.push(col);
            potentiallyValidOriginalCols.push(originalDataColumns[i]);
            potentiallyValidHeaders.push(originalHeaders[i]);
            potentiallyValidIndices.push(i);
        }
    });

    if (potentiallyValidNumericCols.length < 2) {
        throw new Error(`此分析类型 (${chartType}) 需要至少两列包含有效数值数据的列。`);
    }

    statsData.involvedHeaders = potentiallyValidHeaders;

    if (chartType === 'correlation_heatmap') {
        const corrColsData = [];
        const corrHeaders = [];
        potentiallyValidNumericCols.forEach((col, i) => {
            const cleanCol = col.filter(v => v !== null && !isNaN(v));
            if (cleanCol.length >= MIN_POINTS_FOR_CORR_REG && ss.variance(cleanCol) > STD_DEV_ZERO_THRESHOLD) {
                corrColsData.push(col);
                corrHeaders.push(potentiallyValidHeaders[i]);
            }
        });
        if (corrColsData.length < 2) {
            throw new Error(`相关系数热力图需要至少两列满足要求 (≥ ${MIN_POINTS_FOR_CORR_REG} 个有效点且方差 > 0)。`);
        }

        statsData.involvedHeaders = corrHeaders;

        const corrResult = calculateCorrelationMatrix(corrColsData, corrHeaders);
        if (!corrResult || !corrResult.pearson || corrResult.pearson.length === 0) {
            throw new Error("无法计算相关系数矩阵。");
        }
        statsData.correlationMatrix = corrResult;

        const pearsonMatrix = corrResult.pearson;
        const headers = corrResult.headers;
        const numRows = pearsonMatrix.length;
        const numCols = pearsonMatrix[0].length;

        const textValues = Array(numRows).fill(null).map(() => Array(numCols).fill(''));
        const textFontColors = Array(numRows).fill(null).map(() => Array(numCols).fill('black'));
        const textColorThreshold = 0.5;

        for (let i = 0; i < numRows; i++) {
            for (let j = 0; j < numCols; j++) {
                const zValue = pearsonMatrix[i][j];
                if (!isNaN(zValue)) {
                    textValues[i][j] = formatStat(zValue, 2);
                    if (Math.abs(zValue) > textColorThreshold) {
                        textFontColors[i][j] = 'white';
                    } else {
                        textFontColors[i][j] = 'black';
                    }
                } else {
                    textValues[i][j] = 'N/A';
                    textFontColors[i][j] = 'grey';
                }
            }
        }

        traces.push({
            z: pearsonMatrix,
            x: headers,
            y: headers,
            type: 'heatmap',
            colorscale: 'RdBu',
            zmin: -1,
            zmax: 1,
            colorbar: {
                title: 'Pearson r'
            },
            hoverongaps: false,
            text: textValues,
            texttemplate: "%{text}",
            textfont: {
                color: textFontColors,
                size: 10
            },
            hoverinfo: 'x+y+z',
            hoverlabel: {
                bgcolor: 'white'
            }
        });
        layout.title = '相关系数热力图 (Pearson)';
        layout.xaxis.title = '';
        layout.yaxis.title = '';
        layout.xaxis.tickangle = -45;
        layout.yaxis.automargin = true;
        layout.xaxis.automargin = true;
    } else if (chartType === 'scatter_matrix') {
        const splomNumericCols = [];
        const splomOriginalCols = [];
        const splomHeaders = [];
        potentiallyValidNumericCols.forEach((col, i) => {
            const cleanCol = col.filter(v => v !== null && !isNaN(v));
            if (cleanCol.length >= MIN_POINTS_FOR_CORR_REG) {
                splomNumericCols.push(col);
                splomOriginalCols.push(potentiallyValidOriginalCols[i]);
                splomHeaders.push(potentiallyValidHeaders[i]);
            }
        });
        if (splomNumericCols.length < 2) {
            throw new Error(`散点图矩阵需要至少两列满足要求 (≥ ${MIN_POINTS_FOR_CORR_REG} 个有效点)。`);
        }

        statsData.involvedHeaders = splomHeaders;

        const colorVarIndex = parseInt(selectSplomColorVar.value, 10);
        let colorDataRaw = null;
        let colorDataNumeric = null;
        let colorHeader = null;
        let markerOptions = {
            size: 5,
            opacity: 0.6
        };
        let isNumericColor = false;
        let hoverText = null;

        if (colorVarIndex >= 0 && colorVarIndex < currentParsedData.originalData.length) {
            colorDataRaw = currentParsedData.originalData[colorVarIndex];
            colorHeader = originalHeaders[colorVarIndex];
            statsData.splomColorHeader = colorHeader;

            const dataLength = splomNumericCols[0].length;
            if (colorDataRaw.length !== dataLength) {
                console.warn(`SPLOM color data length (${colorDataRaw.length}) mismatch with plot data length (${dataLength}). Adjusting.`);
                colorDataRaw = colorDataRaw.slice(0, dataLength);
                while (colorDataRaw.length < dataLength) colorDataRaw.push('');
            }
            hoverText = colorDataRaw.map(val => `${colorHeader}: ${val}`);

            colorDataNumeric = colorDataRaw.map(v => {
                const num = parseFloat(v);
                return (v !== '' && !isNaN(num)) ? num : NaN;
            });

            const validNumericCount = colorDataNumeric.filter(v => !isNaN(v)).length;
            const validRawCount = colorDataRaw.filter(v => v !== '').length;
            isNumericColor = validRawCount > 0 && (validNumericCount / validRawCount > NUMERIC_COLOR_THRESHOLD);

            markerOptions = {
                ...markerOptions,
                color: isNumericColor ? colorDataNumeric : colorDataRaw,
                colorscale: isNumericColor ? 'Viridis' : undefined,
                showscale: isNumericColor,
                colorbar: isNumericColor ? {
                    title: colorHeader
                } : undefined
            };
        } else {
            markerOptions.color = DEFAULT_POINT_COLOR;
        }

        const dimensions = splomNumericCols.map((col, i) => createPlotlyDimension(splomHeaders[i], col));

        traces.push({
            type: 'splom',
            dimensions: dimensions,
            diagonal: {
                visible: false
            },
            text: hoverText,
            hoverinfo: hoverText ? 'text' : 'none',
            marker: markerOptions
        });

        layout.title = '散点图矩阵';
        layout.autosize = true;
        layout.hovermode = 'closest';
        layout.dragmode = 'select';
        layout.margin = {
            l: 60,
            r: 30,
            b: 60,
            t: 80,
            pad: 4
        };

        statsData.correlationMatrix = calculateCorrelationMatrix(splomNumericCols, splomHeaders);
    } else if (chartType === 'parallel_coordinates') {
        const MAX_PARCOORDS_COLS = 15;
        if (potentiallyValidNumericCols.length > MAX_PARCOORDS_COLS) {
            const currentErrors = chartErrorDiv.textContent;
            const warning = `警告：平行坐标图可能难以解读超过 ${MAX_PARCOORDS_COLS} 个变量。当前选择了 ${potentiallyValidNumericCols.length} 个。`;
            if (!currentErrors.includes(warning)) {
                chartErrorDiv.textContent = (currentErrors ? currentErrors + '\n' : '') + warning;
            }
        }

        statsData.involvedHeaders = potentiallyValidHeaders;

        const colorVarIndex = parseInt(selectColorVar.value, 10);
        let colorDataRaw = null;
        let colorDataNumeric = null;
        let colorHeader = null;
        let lineOptions = {};
        let isNumericColor = false;

        if (colorVarIndex >= 0 && colorVarIndex < currentParsedData.originalData.length) {
            colorDataRaw = currentParsedData.originalData[colorVarIndex];
            colorHeader = originalHeaders[colorVarIndex];
            statsData.parcoordsColorHeader = colorHeader;

            const dataLength = potentiallyValidNumericCols[0].length;
            if (colorDataRaw.length !== dataLength) {
                console.warn(`Parcoords color data length (${colorDataRaw.length}) mismatch with plot data length (${dataLength}). Adjusting.`);
                colorDataRaw = colorDataRaw.slice(0, dataLength);
                while (colorDataRaw.length < dataLength) colorDataRaw.push('');
            }

            colorDataNumeric = colorDataRaw.map(v => {
                const num = parseFloat(v);
                return (v !== '' && !isNaN(num)) ? num : NaN;
            });

            const validNumericCount = colorDataNumeric.filter(v => !isNaN(v)).length;
            const validRawCount = colorDataRaw.filter(v => v !== '').length;
            isNumericColor = validRawCount > 0 && (validNumericCount / validRawCount > NUMERIC_COLOR_THRESHOLD);

            lineOptions = {
                color: isNumericColor ? colorDataNumeric : colorDataRaw,
                colorscale: isNumericColor ? 'Viridis' : undefined,
                showscale: isNumericColor,
                colorbar: isNumericColor ? {
                    title: colorHeader,
                    len: 0.75,
                    y: 0.5
                } : undefined
            };
        } else {
            lineOptions.color = DEFAULT_POINT_COLOR;
        }

        const dimensions = potentiallyValidNumericCols.map((colData, i) => createPlotlyDimension(potentiallyValidHeaders[i], colData));

        traces.push({
            type: 'parcoords',
            line: lineOptions,
            dimensions: dimensions
        });

        layout = {
            title: '平行坐标图',
            hovermode: 'closest',
            margin: {
                l: 80,
                r: 80,
                b: 50,
                t: 80,
                pad: 4
            }
        };

        statsData.parcoordsInteractionNote = "交互提示：拖动轴可重新排序，在轴上垂直拖动可筛选线条，双击背景可重置筛选。";
    }
    return {
        traces,
        layout
    };
}

function drawKMeansChart(xData, yData, xHeader, yHeader, statsData, layout) {
    const traces = [];
    const kValue = parseInt(kmeansKInput.value, 10);
    if (isNaN(kValue) || kValue < 2) {
        throw new Error("请输入有效的聚类数 K (≥ 2)。");
    }

    const kmeansResult = calculateKMeans([xData, yData], [xHeader, yHeader], kValue);
    statsData.kmeans = kmeansResult;

    const { clusteredDataPoints, centroids, labels } = kmeansResult;

    const xVisData = clusteredDataPoints.map(p => p[0]);
    const yVisData = clusteredDataPoints.map(p => p[1]);

    for (let i = 0; i < kValue; i++) {
        const clusterPointsX = [];
        const clusterPointsY = [];
        labels.forEach((label, index) => {
            if (label === i) {
                clusterPointsX.push(xVisData[index]);
                clusterPointsY.push(yVisData[index]);
            }
        });

        if (clusterPointsX.length > 0) {
            traces.push({
                x: clusterPointsX,
                y: clusterPointsY,
                mode: 'markers',
                type: 'scatter',
                name: `聚类 ${i + 1}`,
                marker: { size: 6, opacity: 0.8 }
            });
        }
    }

    const centroidX = centroids.map(c => c[0]);
    const centroidY = centroids.map(c => c[1]);
    traces.push({
        x: centroidX,
        y: centroidY,
        mode: 'markers',
        type: 'scatter',
        marker: {
            color: 'black',
            size: 12,
            symbol: 'cross',
            line: { width: 2 }
        },
        name: '质心',
        hoverinfo: 'text',
        text: centroidX.map((_, i) => `质心 ${i+1}`)
    });

    layout.title = `K-均值聚类 (K=${kValue}, 基于: ${yHeader} vs ${xHeader})`;
    layout.xaxis.title = xHeader;
    layout.yaxis.title = yHeader;
    layout.hovermode = 'closest';
    layout.showlegend = true;

    return {
        traces,
        layout
    };
}

function performHypothesisTest(chartType, dataCol1, dataCol2, header1, header2, statsData, layout) {
    const traces = [];

    if (chartType === 't_test_one_sample') {
        if (!dataCol1) throw new Error("未选择用于单样本 T 检验的数据列。");
        const mu0_str = hypothesizedMeanInput.value;
        const mu0 = parseFloat(mu0_str);
        if (isNaN(mu0)) throw new Error("请输入有效的假设均值 (μ₀)。");

        statsData.tTest = calculateTTestOneSample(dataCol1, mu0);
        if (!statsData.tTest) throw new Error(`无法计算单样本 T 检验 (列 "${header1}" 数据不足或计算错误)。`);

        const cleanData = dataCol1.filter(v => v !== null && !isNaN(v));
        traces.push({
            y: cleanData,
            type: 'box',
            name: header1,
            boxpoints: 'all',
            jitter: 0.3,
            marker: {
                color: DEFAULT_POINT_COLOR
            }
        });
        layout.title = `单样本 T 检验: ${header1} vs μ₀=${mu0}`;
        layout.yaxis.title = '数据值';
        layout.xaxis.title = '';
        layout.shapes = [{
            type: 'line',
            xref: 'paper',
            x0: 0,
            x1: 1,
            yref: 'y',
            y0: mu0,
            y1: mu0,
            line: {
                color: 'red',
                width: 2,
                dash: 'dash'
            },
            name: `μ₀ = ${mu0}`
        }];
        layout.annotations = [{
            x: 0.05,
            y: mu0,
            xref: 'paper',
            yref: 'y',
            text: `μ₀ = ${mu0}`,
            showarrow: false,
            yanchor: 'bottom',
            font: {
                color: 'red'
            }
        }];
    } else if (chartType === 't_test_paired') {
        statsData.tTest = calculateTTestPaired(dataCol1, dataCol2);
        if (!statsData.tTest) throw new Error(`无法计算配对样本 T 检验 (${header1} vs ${header2}) (有效数据对不足或计算错误)。`);

        const diffHeader = `配对差值 (${header1} - ${header2})`;
        if (statsData.tTest.differences) {
            statsData.basicStats[diffHeader] = calculateBasicStats(statsData.tTest.differences);
        }

        traces.push({
            y: statsData.tTest.differences,
            type: 'box',
            name: diffHeader,
            boxpoints: 'all',
            jitter: 0.3,
            marker: {
                color: DEFAULT_POINT_COLOR
            }
        });
        layout.title = `配对样本 T 检验: ${header1} vs ${header2}`;
        layout.yaxis.title = '配对差值';
        layout.xaxis.title = '';
        layout.shapes = [{
            type: 'line',
            xref: 'paper',
            x0: 0,
            x1: 1,
            yref: 'y',
            y0: 0,
            y1: 0,
            line: {
                color: 'grey',
                width: 2,
                dash: 'dash'
            },
            name: '差值=0'
        }];
        layout.annotations = [{
            x: 0.05,
            y: 0,
            xref: 'paper',
            yref: 'y',
            text: '差值=0',
            showarrow: false,
            yanchor: 'bottom',
            font: {
                color: 'grey'
            }
        }];
    } else if (chartType === 't_test_two_sample') {
        statsData.tTest = calculateTTestTwoSample(dataCol1, dataCol2);
        if (!statsData.tTest) throw new Error(`无法计算双独立样本 T 检验 (${header1} vs ${header2}) (每组有效数据不足或计算错误)。`);

        const cleanData1 = dataCol1.filter(v => v !== null && !isNaN(v));
        const cleanData2 = dataCol2.filter(v => v !== null && !isNaN(v));
        traces.push({
            y: cleanData1,
            type: 'box',
            name: header1,
            boxpoints: 'all',
            jitter: 0.3,
            marker: {
                color: DEFAULT_POINT_COLOR
            }
        });
        traces.push({
            y: cleanData2,
            type: 'box',
            name: header2,
            boxpoints: 'all',
            jitter: 0.3,
            marker: {
                color: 'orange'
            }
        });
        layout.title = `双独立样本 T 检验: ${header1} vs ${header2}`;
        layout.yaxis.title = '数据值';
        layout.xaxis.title = '分组';
        layout.boxmode = 'group';
    } else if (chartType === 'permutation_test') {
        const iterations = parseInt(permutationIterationsInput.value, 10);
        if (isNaN(iterations) || iterations < 100) {
            throw new Error("请输入有效的置换次数 (≥ 100)。");
        }

        statsData.permutationTest = calculatePermutationTest(dataCol1, dataCol2, iterations);

        const cleanData1 = dataCol1.filter(v => v !== null && !isNaN(v));
        const cleanData2 = dataCol2.filter(v => v !== null && !isNaN(v));
        traces.push({
            y: cleanData1,
            type: 'box',
            name: header1,
            boxpoints: 'all',
            jitter: 0.3,
            marker: {
                color: DEFAULT_POINT_COLOR
            }
        });
        traces.push({
            y: cleanData2,
            type: 'box',
            name: header2,
            boxpoints: 'all',
            jitter: 0.3,
            marker: {
                color: 'orange'
            }
        });
        layout.title = `置换检验: ${header1} vs ${header2}`;
        layout.yaxis.title = '数据值';
        layout.xaxis.title = '分组';
        layout.boxmode = 'group';
    }
    return {
        traces,
        layout
    };
}

function drawCategoricalChart(chartType, labelsData, valuesData, labelsHeader, valuesHeader, statsData, layout) {
    const traces = [];

    const numRows = Math.min(labelsData.length, valuesData.length);
    let rawPairs = [];
    for (let i = 0; i < numRows; i++) {
        const label = labelsData[i];
        const value = valuesData[i];
        if (label !== '' && label !== null && label !== undefined && value !== null && !isNaN(value)) {
            rawPairs.push({
                label: String(label),
                value: value
            });
        }
    }

    if (rawPairs.length === 0) {
        throw new Error(`所选的标签列 (${labelsHeader}) 和值列 (${valuesHeader}) 之间没有有效的配对数据。请确保值列为数值型。`);
    }

    const aggregated = {};
    rawPairs.forEach(pair => {
        if (aggregated[pair.label]) {
            aggregated[pair.label] += pair.value;
        } else {
            aggregated[pair.label] = pair.value;
        }
    });

    let finalCombined = Object.keys(aggregated).map(label => ({
        label: label,
        value: aggregated[label]
    }));

    const { ordinalMaps, headers } = currentParsedData;
    const idxLabels = headers.indexOf(labelsHeader);
    const isOrdinal = idxLabels > -1 && ordinalMaps && ordinalMaps[idxLabels];

    if (chartType === 'pareto') {
        finalCombined.sort((a, b) => b.value - a.value);
    } else if (isOrdinal) {
        const numericToStringMap = ordinalMaps[idxLabels]; 
        const stringToNumericMapCI = {};
        for (const key in numericToStringMap) {
            const label = numericToStringMap[key];
            if (label) {
                stringToNumericMapCI[label.toLowerCase()] = parseInt(key, 10);
            }
        }

        finalCombined.sort((a, b) => {
            const numA = a.label ? stringToNumericMapCI[a.label.toLowerCase()] : undefined;
            const numB = b.label ? stringToNumericMapCI[b.label.toLowerCase()] : undefined;

            if (numA !== undefined && numB !== undefined) {
                return numA - numB;
            }
            return a.label.localeCompare(b.label);
        });
    } else {
        finalCombined.sort((a, b) => a.label.localeCompare(b.label));
    }

    const finalLabels = finalCombined.map(d => d.label);
    const finalValues = finalCombined.map(d => d.value);

    switch (chartType) {
        case 'bar':
            traces.push({
                x: finalLabels,
                y: finalValues,
                type: 'bar',
                name: valuesHeader
            });
            layout.title = `条形图: ${valuesHeader} by ${labelsHeader}`;
            layout.xaxis.title = labelsHeader;
            layout.yaxis.title = valuesHeader;
            layout.xaxis.categoryorder = 'array';
            layout.xaxis.categoryarray = finalLabels;
            break;

        case 'pie':
            traces.push({
                labels: finalLabels,
                values: finalValues,
                type: 'pie',
                sort: false, 
                hoverinfo: 'label+percent+value',
                textinfo: 'label+percent'
            });
            layout.title = `饼图: ${valuesHeader} by ${labelsHeader}`;
            break;

        case 'pareto':
            const totalSum = ss.sum(finalValues);
            if (totalSum === 0) {
                throw new Error("无法计算帕累托图，因为所有值的总和为零。");
            }
            let cumulativeSum = 0;
            const cumulativePercentage = finalValues.map(v => {
                cumulativeSum += v;
                return (cumulativeSum / totalSum) * 100;
            });

            traces.push({
                x: finalLabels,
                y: finalValues,
                type: 'bar',
                name: valuesHeader,
                marker: {
                    color: DEFAULT_POINT_COLOR
                }
            });

            traces.push({
                x: finalLabels,
                y: cumulativePercentage,
                type: 'scatter',
                mode: 'lines+markers',
                name: '累积百分比',
                yaxis: 'y2',
                line: {
                    color: 'red'
                }
            });

            layout.title = `帕累托图: ${valuesHeader} by ${labelsHeader}`;
            layout.xaxis = {
                title: labelsHeader,
                type: 'category'
            };
            layout.yaxis = {
                title: valuesHeader
            };
            layout.yaxis2 = {
                title: '累积百分比 (%)',
                overlaying: 'y',
                side: 'right',
                range: [0, 105]
            };
            layout.showlegend = true;
            statsData.pareto = true;
            break;
    }

    return {
        traces,
        layout
    };
}

function drawTrivariateChart(chartType, xData, yData, zData, xHeader, yHeader, zHeader, cData, cHeader, idxX, idxY, idxZ, statsData, layout) {
    const traces = [];
    const { ordinalMaps } = currentParsedData;

    layout.xaxis.title = xHeader;
    layout.yaxis.title = yHeader;

    if (chartType === 'scatter_3d') {
        const cleanQuads = filterCleanQuads(xData, yData, zData, cData);
        if (cleanQuads.length === 0) throw new Error(`选择的列 (${xHeader}, ${yHeader}, ${zHeader}, ${cHeader}) 之间没有有效的四维数据点。`);

        const xClean = cleanQuads.map(q => q.x);
        const yClean = cleanQuads.map(q => q.y);
        const zClean = cleanQuads.map(q => q.z);
        const cClean = cleanQuads.map(q => q.c);

        traces.push({
            x: xClean,
            y: yClean,
            z: zClean,
            mode: 'markers',
            type: 'scatter3d',
            marker: {
                color: cClean,
                colorscale: 'Viridis',
                showscale: true,
                size: 5,
                opacity: 0.8,
                colorbar: {
                    title: cHeader
                }
            }
        });
        layout.title = `四维散点图`;
        layout.scene = {
            xaxis: { title: xHeader },
            yaxis: { title: yHeader },
            zaxis: { title: zHeader }
        };
        applyOrdinalMap(layout.scene, 'xaxis', idxX, ordinalMaps);
        applyOrdinalMap(layout.scene, 'yaxis', idxY, ordinalMaps);
        applyOrdinalMap(layout.scene, 'zaxis', idxZ, ordinalMaps);

    } else {
        const cleanTriplets = filterCleanTriplets(xData, yData, zData);
        if (cleanTriplets.length === 0) throw new Error(`选择的列 (${xHeader}, ${yHeader}, ${zHeader}) 之间没有有效的三维数据点。`);

        const xClean = cleanTriplets.map(t => t.x);
        const yClean = cleanTriplets.map(t => t.y);
        const zClean = cleanTriplets.map(t => t.z);
        
        const zHeaderLabel = (chartType === 'bubble_color') ? `颜色: ${zHeader}` : zHeader;

        if (chartType === 'bubble_color') {
            traces.push({
                x: xClean,
                y: yClean,
                mode: 'markers',
                type: 'scatter',
                marker: {
                    color: zClean,
                    colorscale: 'Viridis',
                    showscale: true,
                    size: 10,
                    opacity: 0.8,
                    colorbar: {
                        title: zHeaderLabel
                    }
                }
            });
            layout.title = `三维散点图 (气泡/颜色图)`;
        } else if (chartType === 'contour') {
            traces.push({
                x: xClean,
                y: yClean,
                z: zClean,
                type: 'contour',
                colorscale: 'Viridis',
                contours: {
                    coloring: 'heatmap'
                },
                colorbar: {
                    title: zHeaderLabel
                }
            });
            layout.title = `等高线图`;
        }
        
        applyOrdinalMap(layout, 'xaxis', idxX, ordinalMaps);
        applyOrdinalMap(layout, 'yaxis', idxY, ordinalMaps);
    }

    return { traces, layout };
}


function drawChart() {
    inputErrorDiv.textContent = '';
    chartErrorDiv.textContent = '';
    const chartType = chartTypeSelect.value;

    if (!currentParsedData) {
        inputErrorDiv.textContent = '错误：请先加载或输入有效数据。';
        clearOutput();
        return;
    }

    clearOutput();

    let traces = [];
    let layout = {
        title: '图表/分析结果',
        xaxis: { title: 'X', automargin: true },
        yaxis: { title: 'Y', automargin: true },
        hovermode: 'closest',
        margin: { l: 60, r: 30, b: 50, t: 60, pad: 4 },
        autosize: true,
        titlefont: { size: 16 }
    };
    let traces2 = [], layout2 = null;
    let statsData = {
        headers: currentParsedData?.headers || [],
        basicStats: {},
        ordinalMaps: currentParsedData?.ordinalMaps || {},
        gaussian: null, correlation: undefined, spearmanCorrelation: undefined,
        regression: null, residuals: null, tTest: null, permutationTest: null,
        kmeans: null, correlationMatrix: null, involvedHeaders: [],
        parcoordsColorHeader: null, splomColorHeader: null, parcoordsInteractionNote: null
    };

    try {
        currentParsedData.numericData.forEach((col, i) => {
            const header = currentParsedData.headers[i];
            statsData.basicStats[header] = calculateBasicStats(col);
        });

        let result = {};
        const { numericData, originalData, headers } = currentParsedData;

        const singleVarCharts = ['histogram', 'boxplot', 'violin', 'density', 'gaussian', 'cdf', 't_test_one_sample'];
        const dualVarCharts = ['scatter', 'line_trend', 'area', 'contour_density',
            'scatter_linear_regression', 'scatter_poly2_regression', 'scatter_poly3_regression',
            'scatter_exp_regression', 'scatter_log_regression', 'scatter_power_regression',
            'residual_plot_linear', 'kmeans', 't_test_paired', 't_test_two_sample', 'permutation_test'];
        const triVarCharts = ['scatter_3d', 'contour', 'bubble_color'];
        const categoricalCharts = ['bar', 'pie', 'pareto'];
        const multiVarCharts = ['correlation_heatmap', 'scatter_matrix', 'parallel_coordinates'];

        if (singleVarCharts.includes(chartType)) {
            const idx1 = parseInt(selectCol1.value, 10);
            if (isNaN(idx1) || idx1 < 0) throw new Error("请为单变量分析选择一个有效的数据列。");
            statsData.involvedHeaders = [headers[idx1]];
            if (chartType.startsWith('t_test')) {
                result = performHypothesisTest(chartType, numericData[idx1], null, headers[idx1], null, statsData, layout);
            } else {
                result = drawUnivariateChart(chartType, numericData[idx1], headers[idx1], statsData, layout);
            }
        } else if (dualVarCharts.includes(chartType)) {
            const idxX = parseInt(selectColX.value, 10);
            const idxY = parseInt(selectColY.value, 10);
            if (isNaN(idxX) || isNaN(idxY) || idxX < 0 || idxY < 0) throw new Error("请为双变量分析选择两个有效的数据列。");
            
            const nonIdenticalRequired = [
                'scatter', 'line_trend', 'area', 'residual_plot_linear', 'scatter_linear_regression', 
                'scatter_poly2_regression', 'scatter_poly3_regression', 'scatter_exp_regression', 
                'scatter_log_regression', 'scatter_power_regression', 't_test_paired', 
                't_test_two_sample', 'permutation_test', 'kmeans'
            ];

            if (idxX === idxY && nonIdenticalRequired.includes(chartType)) {
                throw new Error(`此分析类型 (${chartType}) 的 X 和 Y 轴不能选择同一列。`);
            }
            
            statsData.involvedHeaders = [headers[idxX], headers[idxY]];
            if (chartType.startsWith('t_test') || chartType === 'permutation_test') {
                result = performHypothesisTest(chartType, numericData[idxX], numericData[idxY], headers[idxX], headers[idxY], statsData, layout);
            } else if (chartType === 'kmeans') {
                result = drawKMeansChart(numericData[idxX], numericData[idxY], headers[idxX], headers[idxY], statsData, layout);
            } else {
                result = drawBivariateChart(chartType, numericData[idxX], numericData[idxY], headers[idxX], headers[idxY], idxX, idxY, statsData, layout);
            }
        } else if (triVarCharts.includes(chartType)) {
            const idxX = parseInt(selectCol3DX.value, 10);
            const idxY = parseInt(selectCol3DY.value, 10);
            const idxZ = parseInt(selectCol3DZ.value, 10);
            if (isNaN(idxX) || isNaN(idxY) || isNaN(idxZ)) throw new Error("请为图表选择所有必需的数据列。");

            if (chartType === 'scatter_3d') {
                const idxC = parseInt(selectCol4DColor.value, 10);
                if (isNaN(idxC)) throw new Error("请为 3D 散点图的颜色轴选择一个有效列。");
                if (new Set([idxX, idxY, idxZ, idxC]).size < 4) throw new Error("为 3D 散点图选择的四个轴必须是不同的列。");
                statsData.involvedHeaders = [headers[idxX], headers[idxY], headers[idxZ], headers[idxC]];
                result = drawTrivariateChart(chartType, numericData[idxX], numericData[idxY], numericData[idxZ], headers[idxX], headers[idxY], headers[idxZ], numericData[idxC], headers[idxC], idxX, idxY, idxZ, statsData, layout);
            } else { 
                if (new Set([idxX, idxY, idxZ]).size < 3) throw new Error("为图表选择的三个轴必须是不同的列。");
                statsData.involvedHeaders = [headers[idxX], headers[idxY], headers[idxZ]];
                result = drawTrivariateChart(chartType, numericData[idxX], numericData[idxY], numericData[idxZ], headers[idxX], headers[idxY], headers[idxZ], null, null, idxX, idxY, idxZ, statsData, layout);
            }
        } else if (categoricalCharts.includes(chartType)) {
            const idxLabels = parseInt(selectLabelsCol.value, 10);
            const idxValues = parseInt(selectValuesCol.value, 10);
            if (isNaN(idxLabels) || isNaN(idxValues)) throw new Error("请为图表选择有效的标签和值列。");
            if (idxLabels === idxValues) throw new Error("标签列和值列不能是同一列。");
            statsData.involvedHeaders = [headers[idxLabels], headers[idxValues]];
            result = drawCategoricalChart(chartType, originalData[idxLabels], numericData[idxValues], headers[idxLabels], headers[idxValues], statsData, layout);
        } else if (multiVarCharts.includes(chartType)) {
            result = drawMultivariateChart(chartType, numericData, originalData, headers, statsData, layout);
        } else {
            throw new Error(chartType ? `未知的图表/分析类型: ${chartType}` : `请选择一个有效的图表/分析类型。`);
        }

        traces = result.traces || [];
        layout = result.layout || layout;
        traces2 = result.traces2 || [];
        layout2 = result.layout2 || null;

        if (traces.length > 0 || layout.shapes?.length > 0 || layout.annotations?.length > 0) {
            Plotly.react(plotDiv, traces, layout);
        } else {
            Plotly.newPlot(plotDiv, [], { title: '未生成图表 (请查看统计摘要或错误信息)' });
        }

        if (traces2.length > 0 && layout2) {
            Plotly.react(plotDiv2, traces2, layout2);
            plotDiv2.style.display = 'block';
        } else {
            Plotly.purge(plotDiv2);
            plotDiv2.style.display = 'none';
        }

        displayStats(statsData, chartType);

    } catch (error) {
        console.error("绘图或统计时发生错误:", error);
        chartErrorDiv.textContent = (chartErrorDiv.textContent ? chartErrorDiv.textContent + '\n\n' : '') + `错误: ${error.message}`;
        console.error(error.stack);
        Plotly.purge(plotDiv);
        Plotly.purge(plotDiv2);
        plotDiv2.style.display = 'none';
        statsContentDiv.innerHTML = `<p style="color: red;">处理时发生错误，无法显示统计摘要。</p>`;
        Plotly.newPlot(plotDiv, [], { title: '发生错误，请检查数据和选项' });
        currentStatsData = null;
    }
}


function exportChart(format) {
    if (format !== 'svg') {
        console.warn(`Export format ${format} is not offered via UI.`);
        return;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const chartType = chartTypeSelect.value || 'chart';
    const filename = `${chartType}_export_${timestamp}`;

    let mainPlotHasContent = false;
    try {
        mainPlotHasContent = plotDiv && plotDiv.data && plotDiv.data.length > 0;
        if (!mainPlotHasContent && plotDiv.layout && (plotDiv.layout.shapes?.length > 0 || plotDiv.layout.annotations?.length > 0)) {
            mainPlotHasContent = true;
        }
    } catch (e) {
        console.warn("Error checking main plot content:", e);
    }

    if (!mainPlotHasContent) {
        alert("主图表为空或未生成，无法导出。");
        return;
    }

    const config = {
        filename: filename,
        format: format,
        width: plotDiv.offsetWidth || 800,
        height: plotDiv.offsetHeight || 600,
    };

    Plotly.downloadImage(plotDiv, config).catch(err => {
        console.error(`导出主图表 (SVG) 失败:`, err);
        alert(`导出主图表 (SVG) 失败: ${err.message}`);
    });

    let secondaryPlotHasContent = false;
    try {
        secondaryPlotHasContent = plotDiv2.style.display !== 'none' && plotDiv2 && plotDiv2.data && plotDiv2.data.length > 0;
    } catch (e) {
        console.warn("Error checking secondary plot content:", e);
    }

    if (secondaryPlotHasContent) {
        const filename2 = `${chartType}_secondary_export_${timestamp}`;
        const config2 = {
            filename: filename2,
            format: format,
            width: plotDiv2.offsetWidth || 800,
            height: plotDiv2.offsetHeight || 400,
        };
        setTimeout(() => {
            Plotly.downloadImage(plotDiv2, config2).catch(err => {
                console.error(`导出次图表 (SVG) 失败:`, err);
            });
        }, 500);
    }
}

function exportStats(format) {
    if (!currentStatsData) {
        alert("没有可导出的统计数据。请先生成图表和统计摘要。");
        return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const chartType = chartTypeSelect.value || 'stats';
    const filename = `${chartType}_stats_${timestamp}`;

    if (format === 'txt') {
        try {
            let textContent = '';
            const statsElement = document.getElementById('statsContent');
            textContent = Array.from(statsElement.childNodes).map(node => {
                if (node.nodeType === Node.TEXT_NODE) return node.textContent;
                if (node.nodeType === Node.ELEMENT_NODE) return node.innerText || node.textContent;
                return '';
            }).join('\n').replace(/\n\s*\n/g, '\n').trim();

            if (!textContent) {
                alert("统计摘要内容为空。");
                return;
            }
            const blob = new Blob([textContent], {
                type: 'text/plain;charset=utf-8'
            });
            triggerDownload(blob, `${filename}.txt`);
        } catch (e) {
            console.error("导出 TXT 失败:", e);
            alert("导出 TXT 失败。");
        }
    } else if (format === 'csv') {
        try {
            const csvString = generateStatsCSV(currentStatsData);
            if (!csvString) {
                alert("无法生成 CSV 数据。");
                return;
            }
            const BOM = "\uFEFF";
            const blob = new Blob([BOM + csvString], {
                type: 'text/csv;charset=utf-8;'
            });
            triggerDownload(blob, `${filename}.csv`);
        } catch (e) {
            console.error("导出 CSV 失败:", e);
            alert(`导出 CSV 失败: ${e.message}`);
        }
    }
}

function generateStatsCSV(stats) {
    if (!stats) return '';
    let csv = 'Category,Item,Column/Comparison,Value\n';
    const chartType = chartTypeSelect.value;

    let headersForStats = [];
    if (stats.involvedHeaders && stats.involvedHeaders.length > 0) {
        headersForStats = stats.involvedHeaders;
    } else if (stats.kmeans && stats.kmeans.dimensionsUsed) {
        headersForStats = stats.kmeans.dimensionsUsed;
    } else if (stats.correlationMatrix && stats.correlationMatrix.headers) {
        headersForStats = stats.correlationMatrix.headers;
    } else if (Object.keys(stats.basicStats).length > 0) {
        headersForStats = Object.keys(stats.basicStats);
    }

    if (chartType === 't_test_paired' && stats.tTest && stats.involvedHeaders?.length === 2) {
        const diffHeader = `配对差值 (${stats.involvedHeaders[0]} - ${stats.involvedHeaders[1]})`;
        if (stats.basicStats[diffHeader] && !headersForStats.includes(diffHeader)) {
            headersForStats.push(diffHeader);
        }
    }

    if (stats.basicStats) {
        headersForStats.forEach(header => {
            const bs = stats.basicStats[header];
            if (bs && bs.count !== undefined) {
                csv += `Basic,Count,"${csvEscape(header)}",${bs.count}\n`;
                csv += `Basic,Sum,"${csvEscape(header)}",${formatStat(bs.sum)}\n`;
                csv += `Basic,Mean,"${csvEscape(header)}",${formatStat(bs.mean)}\n`;
                csv += `Basic,Median,"${csvEscape(header)}",${formatStat(bs.median)}\n`;
                csv += `Basic,StdDev,"${csvEscape(header)}",${formatStat(bs.stdDev)}\n`;
                csv += `Basic,Variance,"${csvEscape(header)}",${formatStat(bs.variance)}\n`;
                csv += `Basic,Min,"${csvEscape(header)}",${formatStat(bs.min)}\n`;
                csv += `Basic,Max,"${csvEscape(header)}",${formatStat(bs.max)}\n`;
                csv += `Basic,Q1,"${csvEscape(header)}",${formatStat(bs.q1)}\n`;
                csv += `Basic,Q3,"${csvEscape(header)}",${formatStat(bs.q3)}\n`;
            }
        });
    }

    const header1 = stats.involvedHeaders?.[0];
    const header2 = stats.involvedHeaders?.[1];
    const comparisonHeaders = (header1 && header2) ? `${csvEscape(header1)} vs ${csvEscape(header2)}` : (header1 ? csvEscape(header1) : 'N/A');

    if (stats.gaussian && header1) {
        csv += `Gaussian Fit,Mean,"${csvEscape(header1)}",${formatStat(stats.gaussian.mean)}\n`;
        csv += `Gaussian Fit,StdDev,"${csvEscape(header1)}",${formatStat(stats.gaussian.stdDev)}\n`;
    }

    if (stats.correlation !== undefined && header1 && header2) {
        csv += `Correlation,Pearson r,"${comparisonHeaders}",${formatStat(stats.correlation)}\n`;
    }
    if (stats.spearmanCorrelation !== undefined && header1 && header2) {
        csv += `Correlation,Spearman rho,"${comparisonHeaders}",${formatStat(stats.spearmanCorrelation)}\n`;
    }

    if (stats.regression && header1 && header2) {
        const reg = stats.regression;
        let category = 'Regression';
        let comparison = `${csvEscape(header2)} ~ ${csvEscape(header1)}`;
        let equation = reg.equationString || 'N/A';

        switch (reg.type) {
            case 'linear':
                category = 'Regression (Linear)';
                csv += `${category},Slope,"${comparison}",${formatStat(reg.slope)}\n`;
                csv += `${category},Intercept,"${comparison}",${formatStat(reg.intercept)}\n`;
                break;
            case 'polynomial':
                category = `Regression (Polynomial ${reg.degree})`;
                break;
            case 'exponential':
                category = 'Regression (Exponential)';
                break;
            case 'logarithmic':
                category = 'Regression (Logarithmic)';
                break;
            case 'power':
                category = 'Regression (Power)';
                break;
        }
        csv += `${category},Equation,"${comparison}","${csvEscape(equation)}"\n`;
        csv += `${category},R-squared,"${comparison}",${formatStat(reg.rSquared)}\n`;
    }

    if (stats.residuals && stats.regression && stats.regression.type === 'linear') {
        csv += `Residuals (Linear),Mean,"",${formatStat(stats.residuals.mean)}\n`;
        csv += `Residuals (Linear),StdDev,"",${formatStat(stats.residuals.stdDev)}\n`;
    }

    const test = stats.tTest || stats.permutationTest;
    if (test) {
        let category = 'Hypothesis Test';
        let comparison = 'N/A';
        let testSpecifics = '';

        if (test.type === 'one_sample' && header1) {
            category = 'T-Test (One Sample)';
            comparison = `${csvEscape(header1)} vs ${test.hypothesizedMean}`;
            testSpecifics += `${category},Hypothesized Mean,"${csvEscape(header1)}",${test.hypothesizedMean}\n`;
            testSpecifics += `${category},Sample Mean,"${csvEscape(header1)}",${formatStat(test.sampleMean)}\n`;
            testSpecifics += `${category},Sample N,"${csvEscape(header1)}",${test.n}\n`;
            testSpecifics += `${category},T-Statistic,"${comparison}",${formatStat(test.tStatistic)}\n`;
            testSpecifics += `${category},DF,"${comparison}",${formatStat(test.df, 1)}\n`;
        } else if (test.type === 'paired' && header1 && header2) {
            category = 'T-Test (Paired)';
            comparison = `Difference (${csvEscape(header1)}-${csvEscape(header2)})`;
            testSpecifics += `${category},Difference Mean,"${comparison}",${formatStat(test.diffMean)}\n`;
            testSpecifics += `${category},Difference SD,"${comparison}",${formatStat(test.diffStdDev)}\n`;
            testSpecifics += `${category},Pairs N,"${comparison}",${test.nPairs}\n`;
            testSpecifics += `${category},T-Statistic,"${comparison}",${formatStat(test.tStatistic)}\n`;
            testSpecifics += `${category},DF,"${comparison}",${formatStat(test.df, 1)}\n`;
        } else if (test.type === 'two_sample' && header1 && header2) {
            category = 'T-Test (Two Sample Welch)';
            comparison = `${csvEscape(header1)} vs ${csvEscape(header2)}`;
            testSpecifics += `${category},Mean (${header1}),"${comparison}",${formatStat(test.mean1)}\n`;
            testSpecifics += `${category},Mean (${header2}),"${comparison}",${formatStat(test.mean2)}\n`;
            testSpecifics += `${category},N (${header1}),"${comparison}",${test.n1}\n`;
            testSpecifics += `${category},N (${header2}),"${comparison}",${test.n2}\n`;
            testSpecifics += `${category},T-Statistic,"${comparison}",${formatStat(test.tStatistic)}\n`;
            testSpecifics += `${category},DF,"${comparison}",${formatStat(test.df, 1)}\n`;
        } else if (test.type === 'permutation' && header1 && header2) {
            category = 'Permutation Test';
            comparison = `${csvEscape(header1)} vs ${csvEscape(header2)}`;
            testSpecifics += `${category},Observed Mean Diff,"${comparison}",${formatStat(test.observedMeanDifference)}\n`;
            testSpecifics += `${category},Iterations,"${comparison}",${test.iterations}\n`;
            testSpecifics += `${category},N (${header1}),"${comparison}",${test.n1}\n`;
            testSpecifics += `${category},N (${header2}),"${comparison}",${test.n2}\n`;
        }

        if (comparison !== 'N/A') {
            csv += testSpecifics;
            csv += `${category},P-Value,"${comparison}",${formatStat(test.pValue, 5)}\n`;
        }
    }

    if (stats.kmeans) {
        const km = stats.kmeans;
        const category = 'K-Means Clustering';
        csv += `${category},K (Clusters),"",${km.k}\n`;
        csv += `${category},Dimensions Used,"","${csvEscape(km.dimensionsUsed.join(', '))}"\n`;
        csv += `${category},Points Clustered,"",${km.clusteredDataPoints.length}\n`;
        csv += `${category},Mean Silhouette,"",${formatStat(km.silhouette.mean)}\n`;
        km.centroids.forEach((centroid, i) => {
            csv += `${category},Centroid ${i + 1},"${csvEscape(km.dimensionsUsed.join('/'))}","${csvEscape(centroid.map(v => formatStat(v, 3)).join(', '))}"\n`;
        });
    }

    if (stats.correlationMatrix) {
        const headers = stats.correlationMatrix.headers;
        if (stats.correlationMatrix.pearson) {
            const matrix = stats.correlationMatrix.pearson;
            csv += 'Correlation Matrix (Pearson),Header,' + headers.map(h => `"${csvEscape(h)}"`).join(',') + '\n';
            matrix.forEach((row, i) => {
                csv += `Correlation Matrix (Pearson),"${csvEscape(headers[i])}",` + row.map(val => formatStat(val, 4)).join(',') + '\n';
            });
        }
        if (stats.correlationMatrix.spearman) {
            const matrix = stats.correlationMatrix.spearman;
            csv += 'Correlation Matrix (Spearman),Header,' + headers.map(h => `"${csvEscape(h)}"`).join(',') + '\n';
            matrix.forEach((row, i) => {
                csv += `Correlation Matrix (Spearman),"${csvEscape(headers[i])}",` + row.map(val => formatStat(val, 4)).join(',') + '\n';
            });
        }
    }

    if (chartType.match(/parallel_coordinates|scatter_matrix|contour|bubble_color|scatter_3d|bar|pie|pareto/)) {
        csv += `Analysis Type,Note,"",${chartType} plot used.\n`;
        if (stats.parcoordsColorHeader) {
            csv += `Parallel Coordinates,Color Variable,"","${csvEscape(stats.parcoordsColorHeader)}"\n`;
        }
        if (stats.parcoordsInteractionNote) {
            csv += `Parallel Coordinates,Interaction,"","${csvEscape(stats.parcoordsInteractionNote)}"\n`;
        }
        if (stats.splomColorHeader) {
            csv += `Scatter Matrix,Color Variable,"","${csvEscape(stats.splomColorHeader)}"\n`;
        }
    }

    return csv;
}

function csvEscape(str) {
    if (str === null || str === undefined) return '';
    str = String(str);
    if (str.search(/("|,|\n|\r)/g) >= 0) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 100);
}


function gaussianPDF(x, mean, stdDev) {
    if (stdDev <= STD_DEV_ZERO_THRESHOLD) {
        return (Math.abs(x - mean) < STD_DEV_ZERO_THRESHOLD) ? 1e9 : 0;
    }
    const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
    const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
    return coefficient * Math.exp(exponent);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        let elementToFullscreen = null;
        let mainPlotHasContent = false;
        let secondaryPlotHasContent = false;

        try {
            mainPlotHasContent = plotDiv && plotDiv.data && plotDiv.data.length > 0;
        } catch (e) {}
        try {
            secondaryPlotHasContent = plotDiv2.style.display !== 'none' && plotDiv2 && plotDiv2.data && plotDiv2.data.length > 0;
        } catch (e) {}

        if (mainPlotHasContent) {
            elementToFullscreen = plotDiv;
        } else if (secondaryPlotHasContent) {
            elementToFullscreen = plotDiv2;
        } else if (plotDiv.layout && (plotDiv.layout.shapes?.length > 0 || plotDiv.layout.annotations?.length > 0)) {
            elementToFullscreen = plotDiv;
        }

        if (elementToFullscreen) {
            elementToFullscreen.requestFullscreen()
                .then(() => {
                    fullscreenBtn.textContent = '退出全屏';
                })
                .catch(err => {
                    alert(`无法进入全屏模式: ${err.message} (${err.name})`);
                });
        } else {
            alert("没有可供全屏显示的图表。");
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen()
                .then(() => {
                    fullscreenBtn.textContent = '全屏显示';
                });
        }
    }
}

document.addEventListener('fullscreenchange', () => {
    const isFullscreen = !!document.fullscreenElement;
    fullscreenBtn.textContent = isFullscreen ? '退出全屏' : '全屏显示';

    requestAnimationFrame(() => {
        setTimeout(() => {
            const elementInFullscreen = document.fullscreenElement;
            if (elementInFullscreen && typeof Plotly !== 'undefined' && Plotly.Plots && Plotly.Plots.resize) {
                try {
                    if (document.contains(elementInFullscreen) && (elementInFullscreen.id === 'plotDiv' || elementInFullscreen.id === 'plotDiv2')) {
                        Plotly.Plots.resize(elementInFullscreen);
                    }
                } catch (e) {
                    console.warn("调整全屏图表大小失败:", e);
                }
            } else if (!isFullscreen && typeof Plotly !== 'undefined' && Plotly.Plots && Plotly.Plots.resize) {
                try {
                    if (document.contains(plotDiv)) Plotly.Plots.resize(plotDiv);
                } catch (e) {
                    console.warn("调整主图表大小失败:", e);
                }
                try {
                    if (plotDiv2.style.display !== 'none' && document.contains(plotDiv2)) Plotly.Plots.resize(plotDiv2);
                } catch (e) {
                    console.warn("调整次图表大小失败:", e);
                }
            }
        }, 150);
    });
});

window.onload = () => {
    clearOutput();
    clearColumnSelectors();
    handleChartTypeChange();

    if (dataInput.value.trim()) {
        reparseAndRepopulate();
    } else {
        Plotly.newPlot(plotDiv, [], {
            title: '请先输入数据并选择图表/分析类型'
        });
    }
};
