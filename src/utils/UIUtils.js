// UI工具类 - 通用UI工具函数
export default class UIUtils {
  
  // 检查点是否在矩形内
  static isPointInRect(x, y, rect) {
    return rect && x >= rect.x && x <= rect.x + rect.width && 
           y >= rect.y && y <= rect.y + rect.height
  }
  
  // 格式化数字显示
  static formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }
  
  // 格式化时间显示
  static formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  }
  
  // 获取设备信息
  static getDeviceInfo() {
    // 安全获取screen信息，兼容微信小程序环境
    const screen = window.screen || {}
    const screenWidth = screen.width || 375
    const screenHeight = screen.height || 667
    
    return {
      pixelRatio: window.devicePixelRatio || 1,
      screenWidth: screenWidth,
      screenHeight: screenHeight,
      isIOS: typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent),
      isAndroid: typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent)
    }
  }
  
  // 计算安全区域
  static calculateSafeArea(deviceInfo) {
    let safeTop = 20 // 默认状态栏高度
    
    // iOS设备安全区域适配
    if (deviceInfo.isIOS) {
      // iPhone X及以上机型
      if (deviceInfo.screenHeight >= 812) {
        safeTop = 44
      }
    }
    
    return {
      top: safeTop,
      bottom: 34, // 默认底部安全区域
      left: 0,
      right: 0
    }
  }
  
  // 绘制圆角矩形（兼容处理）
  static drawRoundRect(ctx, rect, fillStyle, radius = 12, strokeStyle = null, lineWidth = 2) {
    // 支持传入rect对象或单独的坐标参数
    const x = rect.x || rect
    const y = rect.y || arguments[2] 
    const width = rect.width || arguments[3]
    const height = rect.height || arguments[4]
    
    // 如果是旧的调用方式，重新排列参数
    if (typeof rect === 'number') {
      const oldX = arguments[0]
      const oldY = arguments[1] 
      const oldWidth = arguments[2]
      const oldHeight = arguments[3]
      const oldRadius = arguments[4]
      const oldFillStyle = arguments[5]
      const oldStrokeStyle = arguments[6]
      const oldLineWidth = arguments[7]
      
      ctx.fillStyle = oldFillStyle
      
      // 检查是否支持 roundRect API
      if (ctx.roundRect && typeof ctx.roundRect === 'function') {
        try {
          ctx.beginPath()
          ctx.roundRect(oldX, oldY, oldWidth, oldHeight, [oldRadius])
          ctx.fill()
          
          if (oldStrokeStyle) {
            ctx.strokeStyle = oldStrokeStyle
            ctx.lineWidth = oldLineWidth
            ctx.beginPath()
            ctx.roundRect(oldX, oldY, oldWidth, oldHeight, [oldRadius])
            ctx.stroke()
          }
        } catch (e) {
          ctx.fillRect(oldX, oldY, oldWidth, oldHeight)
          if (oldStrokeStyle) {
            ctx.strokeStyle = oldStrokeStyle
            ctx.lineWidth = oldLineWidth
            ctx.strokeRect(oldX, oldY, oldWidth, oldHeight)
          }
        }
      } else {
        ctx.fillRect(oldX, oldY, oldWidth, oldHeight)
        if (oldStrokeStyle) {
          ctx.strokeStyle = oldStrokeStyle
          ctx.lineWidth = oldLineWidth
          ctx.strokeRect(oldX, oldY, oldWidth, oldHeight)
        }
      }
      return
    }
    
    // 新的调用方式：使用rect对象
    ctx.fillStyle = fillStyle
    
    if (ctx.roundRect && typeof ctx.roundRect === 'function') {
      try {
        ctx.beginPath()
        ctx.roundRect(x, y, width, height, [radius])
        ctx.fill()
        
        if (strokeStyle) {
          ctx.strokeStyle = strokeStyle
          ctx.lineWidth = lineWidth
          ctx.beginPath()
          ctx.roundRect(x, y, width, height, [radius])
          ctx.stroke()
        }
      } catch (e) {
        ctx.fillRect(x, y, width, height)
        if (strokeStyle) {
          ctx.strokeStyle = strokeStyle
          ctx.lineWidth = lineWidth
          ctx.strokeRect(x, y, width, height)
        }
      }
    } else {
      ctx.fillRect(x, y, width, height)
      if (strokeStyle) {
        ctx.strokeStyle = strokeStyle
        ctx.lineWidth = lineWidth
        ctx.strokeRect(x, y, width, height)
      }
    }
  }
  
  // 绘制渐变背景
  static drawGradientRect(ctx, x, y, width, height, startColor, endColor) {
    const gradient = ctx.createLinearGradient(x, y, x, y + height)
    gradient.addColorStop(0, startColor)
    gradient.addColorStop(1, endColor)
    ctx.fillStyle = gradient
    ctx.fillRect(x, y, width, height)
  }
  
  // 绘制文字（居中）
  static drawCenteredText(ctx, text, x, y, color = '#FFFFFF', font = '14px Arial') {
    ctx.fillStyle = color
    ctx.font = font
    ctx.textAlign = 'center'
    ctx.fillText(text, x, y)
  }
  
  // 绘制文字（左对齐）
  static drawLeftText(ctx, text, x, y, color = '#FFFFFF', font = '14px Arial') {
    ctx.fillStyle = color
    ctx.font = font
    ctx.textAlign = 'left'
    ctx.fillText(text, x, y)
  }
}
