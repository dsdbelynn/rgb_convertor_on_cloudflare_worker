// DOM 元素
const colorWheel = document.getElementById('colorWheel');
const colorWheelThumb = document.getElementById('colorWheelThumb');
const valueSlider = document.getElementById('valueSlider');
const valueSliderThumb = document.getElementById('valueSliderThumb');
const colorPreview = document.getElementById('colorPreview');
const hueInput = document.getElementById('hue');
const saturationInput = document.getElementById('saturation');
const valueInput = document.getElementById('value');
const redInput = document.getElementById('red');
const greenInput = document.getElementById('green');
const blueInput = document.getElementById('blue');
const hexInput = document.getElementById('hex');
const importHexButton = document.getElementById('importHex');
const rgbInfo = document.getElementById('rgbInfo');
const hexInfo = document.getElementById('hexInfo');
const hsvInfo = document.getElementById('hsvInfo');

// 当前 HSV 值
let hsv = { h: 0, s: 100, v: 100 };
let updating = false;
// Canvas尺寸调整函数

function adjustCanvasDimensions() {
    // 获取设备像素比
    const dpr = window.devicePixelRatio || 1;
    
    // 调整色轮canvas尺寸
    const wheelContainer = colorWheel.parentElement;
    const wheelSize = Math.min(wheelContainer.clientWidth, wheelContainer.clientHeight);
    
    // 设置canvas内部尺寸
    colorWheel.width = wheelSize;
    colorWheel.height = wheelSize;
    
    // 确保CSS显示尺寸与内部尺寸匹配
    colorWheel.style.width = `${wheelSize}px`;
    colorWheel.style.height = `${wheelSize}px`;
    
    // 调整亮度滑块canvas尺寸
    const sliderContainer = valueSlider.parentElement;
    const sliderWidth = sliderContainer.clientWidth;
    const sliderHeight = 30; // 固定高度
    
    valueSlider.width = sliderWidth;
    valueSlider.height = sliderHeight;
    
    valueSlider.style.width = `${sliderWidth}px`;
    valueSlider.style.height = `${sliderHeight}px`;
    
    // 重新绘制组件
    if (colorWheelCtx && valueSliderCtx) {
        drawColorWheel();
        drawValueSlider();
        updateColor();
        
        // 强制更新指示器位置
        const radius = colorWheel.width / 2;
        const satRadius = (hsv.s / 100) * radius;
        const angle = hsv.h * Math.PI / 180;
        
        // 计算色轮指示器位置
        const thumbX = radius + satRadius * Math.cos(angle);
        const thumbY = radius - satRadius * Math.sin(angle);
        
        // 直接设置指示器位置
        colorWheelThumb.style.left = `${thumbX}px`;
        colorWheelThumb.style.top = `${thumbY}px`;
        
        // 更新亮度滑块指示器位置
        const valuePos = (hsv.v / 100) * valueSlider.width;
        valueSliderThumb.style.left = `${valuePos}px`;
        valueSliderThumb.style.top = '0px'; // 确保垂直位置正确
    }
}



// 获取上下文
const colorWheelCtx = colorWheel.getContext('2d');
const valueSliderCtx = valueSlider.getContext('2d');

// 页面加载后调整尺寸
window.addEventListener('load', adjustCanvasDimensions);

// 页面大小变化时调整尺寸
window.addEventListener('resize', adjustCanvasDimensions);


drawColorWheel();
drawValueSlider();

// 用初始颜色更新所有显示
updateColor();

// 色轮的事件监听器
colorWheel.addEventListener('mousedown', startColorWheelDrag);
valueSlider.addEventListener('mousedown', startValueSliderDrag);

// 输入框的事件监听器
hueInput.addEventListener('input', updateFromHSV);
saturationInput.addEventListener('input', updateFromHSV);
valueInput.addEventListener('input', updateFromHSV);
redInput.addEventListener('input', updateFromRGB);
greenInput.addEventListener('input', updateFromRGB);
blueInput.addEventListener('input', updateFromRGB);

// 绘制色轮
function drawColorWheel() {
    const centerX = colorWheel.width / 2;
    const centerY = colorWheel.height / 2;
    const radius = Math.min(centerX, centerY);

    // 清空画布
    colorWheelCtx.clearRect(0, 0, colorWheel.width, colorWheel.height);

    // 绘制色轮
    for (let angle = 0; angle < 360; angle += 1) {
        const startAngle = (angle - 0.5) * Math.PI / 180;
        const endAngle = (angle + 0.5) * Math.PI / 180;

        colorWheelCtx.beginPath();
        colorWheelCtx.moveTo(centerX, centerY);
        colorWheelCtx.arc(centerX, centerY, radius, startAngle, endAngle);
        colorWheelCtx.closePath();

        // 创建饱和度渐变
        const gradient = colorWheelCtx.createRadialGradient(
            centerX, centerY, 0, 
            centerX, centerY, radius
        );
        gradient.addColorStop(0, 'white');
        
        // 将角度垂直翻转 (沿水平轴对称)
        const flippedAngle = (360 - angle) % 360;
        gradient.addColorStop(1, `hsl(${flippedAngle}, 100%, 50%)`);

        colorWheelCtx.fillStyle = gradient;
        colorWheelCtx.fill();
    }
}

// 根据当前色调和饱和度绘制亮度滑块
function drawValueSlider() {
    const width = valueSlider.width;
    const height = valueSlider.height;
    const gradient = valueSliderCtx.createLinearGradient(0, 0, width, 0); // 横向渐变
    
    const rgbFull = hsvToRgb(hsv.h, hsv.s / 100, 1);
    const hexFull = rgbToHex(rgbFull.r, rgbFull.g, rgbFull.b);
    
    gradient.addColorStop(0, '#000000'); // 从左侧黑色开始
    gradient.addColorStop(1, hexFull);   // 到右侧全色结束
    
    valueSliderCtx.fillStyle = gradient;
    valueSliderCtx.fillRect(0, 0, width, height);
}

// 开始拖动色轮指示器
function startColorWheelDrag(e) {
    document.addEventListener('mousemove', dragColorWheel);
    document.addEventListener('mouseup', stopDrag);
    dragColorWheel(e);
}

// 拖动色轮指示器
function dragColorWheel(e) {
    const rect = colorWheel.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    
    const radius = Math.min(centerX, centerY);
    const distance = Math.sqrt(x * x + y * y);
    const saturation = Math.min(distance / radius * 100, 100);
    
    // 计算色调角度
    let hue = Math.atan2(-y, x) * 180 / Math.PI;
    if (hue < 0) hue += 360;
    
    hsv.h = hue;
    hsv.s = saturation;
    
    updateColor();
}

// 开始拖动亮度滑块指示器
function startValueSliderDrag(e) {
    document.addEventListener('mousemove', dragValueSlider);
    document.addEventListener('mouseup', stopDrag);
    dragValueSlider(e);
}

// 拖动亮度滑块指示器
function dragValueSlider(e) {
    const rect = valueSlider.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    const value = Math.max(0, Math.min(100, (x / width) * 100));
    hsv.v = value;
    
    updateColor();
}


// 停止拖动
function stopDrag() {
    document.removeEventListener('mousemove', dragColorWheel);
    document.removeEventListener('mousemove', dragValueSlider);
    document.removeEventListener('mouseup', stopDrag);
}

// 从 HSV 输入更新颜色
function updateFromHSV() {
    if (updating) return;
    
    hsv.h = Math.min(360, Math.max(0, parseFloat(hueInput.value) || 0));
    hsv.s = Math.min(100, Math.max(0, parseFloat(saturationInput.value) || 0));
    hsv.v = Math.min(100, Math.max(0, parseFloat(valueInput.value) || 0));
    
    hueInput.value = Math.round(hsv.h);
    saturationInput.value = Math.round(hsv.s);
    valueInput.value = Math.round(hsv.v);
    
    updateColor();
}

// 从 RGB 输入更新颜色
function updateFromRGB() {
    if (updating) return;
    
    const r = Math.min(255, Math.max(0, parseInt(redInput.value) || 0));
    const g = Math.min(255, Math.max(0, parseInt(greenInput.value) || 0));
    const b = Math.min(255, Math.max(0, parseInt(blueInput.value) || 0));
    
    redInput.value = Math.round(r);
    greenInput.value = Math.round(g);
    blueInput.value = Math.round(b);
    
    const newHsv = rgbToHsv(r, g, b);
    hsv.h = newHsv.h;
    hsv.s = newHsv.s * 100;
    hsv.v = newHsv.v * 100;
    
    updateColor();
}

function updateColor(updateHexInput = false) {
    updating = true;
    
    // 更新HSV输入
    hueInput.value = Math.round(hsv.h);
    saturationInput.value = Math.round(hsv.s);
    valueInput.value = Math.round(hsv.v);
    
    // 计算RGB值
    const rgb = hsvToRgb(hsv.h, hsv.s / 100, hsv.v / 100);
    
    // 更新RGB输入
    redInput.value = Math.round(rgb.r);
    greenInput.value = Math.round(rgb.g);
    blueInput.value = Math.round(rgb.b);
    
    // 生成HEX值
    const hexValue = rgbToHex(rgb.r, rgb.g, rgb.b);
    hexInput.value = hexValue;
    
    // 更新颜色预览
    colorPreview.style.backgroundColor = hexValue;
    
    // 更新信息框
    const rgbText = `${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}`;
    const hsvText = `${Math.round(hsv.h)}°, ${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%`;
    
    document.querySelector('#rgbInfo .info-value').textContent = rgbText;
    document.querySelector('#rgbInfo').setAttribute('data-copy-value', rgbText);
    
    document.querySelector('#hexInfo .info-value').textContent = hexValue;
    document.querySelector('#hexInfo').setAttribute('data-copy-value', hexValue);
    
    document.querySelector('#hsvInfo .info-value').textContent = hsvText;
    document.querySelector('#hsvInfo').setAttribute('data-copy-value', hsvText);
    
    // 更新亮度滑块
    drawValueSlider();
    
    // 更新色轮指示器位置
    const wheelRect = colorWheel.getBoundingClientRect();
    const centerX = colorWheel.width / 2;
    const centerY = colorWheel.height / 2;
    const satRadius = (hsv.s / 100) * centerX;
    const angle = hsv.h * Math.PI / 180;
    
    const thumbX = centerX + satRadius * Math.cos(angle);
    const thumbY = centerY - satRadius * Math.sin(angle);
    
    colorWheelThumb.style.left = `${thumbX}px`;
    colorWheelThumb.style.top = `${thumbY}px`;
    
    // 更新亮度滑块指示器位置
    const valuePos = (hsv.v / 100) * valueSlider.width;
    valueSliderThumb.style.left = `${valuePos}px`;
    
    updating = false;
}

// 添加导入按钮事件处理
importHexButton.addEventListener('click', function() {
    let hex = hexInput.value.trim();
    
    // 检查是否是有效的HEX颜色值
    if (!hex.startsWith('#')) {
        hex = '#' + hex;
    }
    
    // 验证格式
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
        // 无效的HEX值，重置为当前颜色
        const rgb = hsvToRgb(hsv.h, hsv.s / 100, hsv.v / 100);
        hexInput.value = rgbToHex(rgb.r, rgb.g, rgb.b);
        return;
    }
    
    // 将3位HEX扩展为6位
    if (hex.length === 4) {
        const r = hex.charAt(1);
        const g = hex.charAt(2);
        const b = hex.charAt(3);
        hex = `#${r}${r}${g}${g}${b}${b}`;
    }
    
    // 解析为RGB
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    
    // 更新输入框值
    redInput.value = r;
    greenInput.value = g;
    blueInput.value = b;
    
    // 转换为HSV并更新颜色
    const newHsv = rgbToHsv(r, g, b);
    hsv.h = newHsv.h;
    hsv.s = newHsv.s * 100;
    hsv.v = newHsv.v * 100;
    
    // 更新显示
    updateColor();
});

// 将 HSV 转换为 RGB
function hsvToRgb(h, s, v) {
    h = (h % 360) / 60;
    const i = Math.floor(h);
    const f = h - i;
    const p = v * (1 - s);
    const q = v * (1 - s * f);
    const t = v * (1 - s * (1 - f));
    
    let r, g, b;
    switch (i) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    
    return {
        r: r * 255,
        g: g * 255,
        b: b * 255
    };
}

// 将 RGB 转换为 HSV
function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    
    let h;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    
    if (max === min) {
        h = 0;
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
    }
    
    return { h, s, v };
}

// 将 RGB 转换为 HEX
function rgbToHex(r, g, b) {
    r = Math.round(r);
    g = Math.round(g);
    b = Math.round(b);
    
    function componentToHex(c) {
        const hex = c.toString(16).toUpperCase();
        return hex.length === 1 ? '0' + hex : hex;
    }
    
    return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

// 信息框的点击复制功能
const infoBoxes = document.querySelectorAll('.info-box');

infoBoxes.forEach(box => {
    // 为每个盒子添加复制提示元素
    const tooltip = document.createElement('div');
    tooltip.className = 'copy-tooltip';
    tooltip.textContent = '已复制!';
    box.appendChild(tooltip);
    
    box.addEventListener('click', async function() {
        const textToCopy = this.getAttribute('data-copy-value');
        
        try {
            // 复制到剪贴板
            await navigator.clipboard.writeText(textToCopy);
            
            // 显示复制成功提示
            this.classList.add('copied');
            
            // 500毫秒后移除提示
            setTimeout(() => {
                this.classList.remove('copied');
            }, 500);
        } catch (err) {
            console.error('复制失败:', err);
        }
    });
});
// 添加触摸支持
colorWheel.addEventListener('touchstart', function(e) {
    e.preventDefault();
    
    function handleTouch(touchEvent) {
        touchEvent.preventDefault();
        const touch = touchEvent.touches[0];
        const rect = colorWheel.getBoundingClientRect();
        
        // 计算实际canvas尺寸与显示尺寸的比例
        const scaleX = colorWheel.width / rect.width;
        const scaleY = colorWheel.height / rect.height;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // 计算触摸位置相对于中心的坐标
        const x = (touch.clientX - rect.left - centerX);
        const y = (touch.clientY - rect.top - centerY);
        
        // 其余计算保持不变...
        const radius = Math.min(centerX, centerY);
        const distance = Math.sqrt(x*x + y*y);
        const saturation = Math.min(distance / radius * 100, 100);
        
        let hue = Math.atan2(-y, x) * 180 / Math.PI;
        if (hue < 0) hue += 360;
        
        hsv.h = hue;
        hsv.s = saturation;
        
        updateColor();
    }
    
    document.addEventListener('touchmove', handleTouch, {passive: false});
    document.addEventListener('touchend', function() {
        document.removeEventListener('touchmove', handleTouch);
    }, {once: true});
    
    handleTouch(e);
}, {passive: false});


valueSlider.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const handleTouchMove = function(moveEvent) {
        moveEvent.preventDefault();
        
        // 获取触摸点
        const touch = moveEvent.touches[0];
        const rect = valueSlider.getBoundingClientRect();
        
        // 计算触摸位置（相对于滑块左边缘）
        let x = touch.clientX - rect.left;
        const width = rect.width;
        
        // 确保值在0-100范围内，即使触摸超出滑块边界
        const value = Math.max(0, Math.min(100, (x / width) * 100));
        hsv.v = value;
        
        updateColor();
    };
    
    // 使用document级别的事件监听
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', function() {
        document.removeEventListener('touchmove', handleTouchMove);
    }, { once: true });
    
    // 处理初始触摸
    handleTouchMove(e);
}, { passive: false });

function startColorWheelTouch(e) {
    document.addEventListener('touchmove', dragColorWheelTouch);
    document.addEventListener('touchend', stopTouch);
    dragColorWheelTouch(e);
}

function dragColorWheelTouch(e) {
    e.preventDefault(); // 阻止默认行为
    if (!e.touches) return;
    const touch = e.touches[0];
    const rect = colorWheel.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // 计算相对于色轮中心的坐标
    const x = touch.clientX - rect.left - centerX;
    const y = touch.clientY - rect.top - centerY;
    
    const radius = Math.min(centerX, centerY);
    const distance = Math.sqrt(x * x + y * y);
    // 即使触摸移出边界，也能获取正确的饱和度值
    const saturation = Math.min(distance / radius * 100, 100);
    
    let hue = Math.atan2(-y, x) * 180 / Math.PI;
    if (hue < 0) hue += 360;
    
    hsv.h = hue;
    hsv.s = saturation;
    
    updateColor();
}

function startValueSliderTouch(e) {
    document.addEventListener('touchmove', dragValueSliderTouch);
    document.addEventListener('touchend', stopTouch);
    dragValueSliderTouch(e);
}

function dragValueSliderTouch(e) {
    e.preventDefault(); // 阻止默认行为
    if (!e.touches) return;
    const touch = e.touches[0];
    const rect = valueSlider.getBoundingClientRect();
    
    // 计算触摸点相对于滑块的X坐标，不受滑块宽度的限制
    let x = touch.clientX - rect.left;
    // 获取滑块宽度
    const width = rect.width;
    
    // 确保值在0-100范围内，即使触摸超出滑块边界
    const value = Math.max(0, Math.min(100, (x / width) * 100));
    hsv.v = value;
    
    updateColor();
}

function stopTouch() {
    document.removeEventListener('touchmove', dragColorWheelTouch);
    document.removeEventListener('touchmove', dragValueSliderTouch);
    document.removeEventListener('touchend', stopTouch);
}
