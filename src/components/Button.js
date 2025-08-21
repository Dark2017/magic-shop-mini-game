import UIUtils from '../utils/UIUtils.js'
import { THEME_COLORS, BUTTON_TYPES, getButtonColor, getButtonTextColor } from '../config/colors.js'

// 标准按钮组件
export default class Button {
  constructor(ctx, x, y, width, height, text, colorType = BUTTON_TYPES.PRIMARY, customColor = null) {
    this.ctx = ctx
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.text = text
    this.colorType = colorType
    this.color = customColor || getButtonColor(colorType)
    this.textColor = getButtonTextColor(colorType)
    this.borderRadius = 12
    this.isEnabled = true
    this.isVisible = true
    this.onClick = null
  }
  
  // 设置位置
  setPosition(x, y) {
    this.x = x
    this.y = y
  }
  
  // 设置尺寸
  setSize(width, height) {
    this.width = width
    this.height = height
  }
  
  // 设置文本
  setText(text) {
    this.text = text
  }
  
  // 设置颜色
  setColor(color) {
    this.color = color
  }
  
  // 设置是否启用
  setEnabled(enabled) {
    this.isEnabled = enabled
  }
  
  // 设置是否可见
  setVisible(visible) {
    this.isVisible = visible
  }
  
  // 设置点击回调
  setOnClick(callback) {
    this.onClick = callback
  }
  
  // 渲染按钮
  render() {
    if (!this.isVisible) return
    
    const rect = { x: this.x, y: this.y, width: this.width, height: this.height }
    const actualColor = this.isEnabled ? this.color : THEME_COLORS.DISABLED
    const actualTextColor = this.isEnabled ? this.textColor : THEME_COLORS.TEXT_DISABLED
    
    // 绘制按钮背景（无边框）
    UIUtils.drawRoundRect(this.ctx, rect, actualColor, this.borderRadius)
    
    // 按钮文字
    UIUtils.drawCenteredText(this.ctx, this.text, this.x + this.width / 2, this.y + this.height / 2 + 5, actualTextColor, '14px Arial')
  }
  
  // 检查点击
  handleTouch(x, y) {
    if (!this.isVisible || !this.isEnabled) return false
    
    const isClicked = UIUtils.isPointInRect(x, y, { x: this.x, y: this.y, width: this.width, height: this.height })
    
    if (isClicked && this.onClick) {
      this.onClick()
      return true
    }
    
    return isClicked
  }
  
  // 获取按钮矩形区域
  getRect() {
    return { x: this.x, y: this.y, width: this.width, height: this.height }
  }
}

// 圆形按钮组件
export class CircleButton {
  constructor(ctx, x, y, radius, icon, color = '#4CAF50', textColor = '#FFFFFF') {
    this.ctx = ctx
    this.x = x
    this.y = y
    this.radius = radius
    this.icon = icon
    this.color = color
    this.textColor = textColor
    this.isEnabled = true
    this.isVisible = true
    this.onClick = null
  }
  
  // 设置位置
  setPosition(x, y) {
    this.x = x
    this.y = y
  }
  
  // 设置图标
  setIcon(icon) {
    this.icon = icon
  }
  
  // 设置颜色
  setColor(color) {
    this.color = color
  }
  
  // 设置是否启用
  setEnabled(enabled) {
    this.isEnabled = enabled
  }
  
  // 设置是否可见
  setVisible(visible) {
    this.isVisible = visible
  }
  
  // 设置点击回调
  setOnClick(callback) {
    this.onClick = callback
  }
  
  // 渲染圆形按钮
  render() {
    if (!this.isVisible) return
    
    const actualColor = this.isEnabled ? this.color : '#757575'
    const actualTextColor = this.isEnabled ? this.textColor : '#AAAAAA'
    
    // 圆形背景（无边框）
    this.ctx.fillStyle = actualColor + 'DD' // 添加透明度
    this.ctx.beginPath()
    this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI)
    this.ctx.fill()
    
    // 图标
    this.ctx.fillStyle = actualTextColor
    this.ctx.font = 'bold 10px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(this.icon, this.x, this.y)
    this.ctx.textBaseline = 'alphabetic' // 重置为默认
  }
  
  // 检查点击
  handleTouch(x, y) {
    if (!this.isVisible || !this.isEnabled) return false
    
    const distance = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2)
    const isClicked = distance <= this.radius
    
    if (isClicked && this.onClick) {
      this.onClick()
      return true
    }
    
    return isClicked
  }
  
  // 获取按钮矩形区域（用于碰撞检测）
  getRect() {
    return { 
      x: this.x - this.radius, 
      y: this.y - this.radius, 
      width: this.radius * 2, 
      height: this.radius * 2 
    }
  }
}

// 自动售卖按钮组件
export class AutoSellButton extends Button {
  constructor(ctx, x, y, width, height, dataManager, gameManager) {
    super(ctx, x, y, width, height, '🤖 自动售卖', BUTTON_TYPES.PRIMARY)
    this.dataManager = dataManager
    this.gameManager = gameManager
    this.statusRadius = 5
  }
  
  // 获取当前状态
  getState() {
    if (!this.dataManager.gameData.settings) {
      this.dataManager.gameData.settings = { autoSellEnabled: false }
    }
    return this.dataManager.gameData.settings.autoSellEnabled || false
  }
  
  // 切换状态
  toggle() {
    if (!this.dataManager.gameData.settings) {
      this.dataManager.gameData.settings = { autoSellEnabled: false }
    }
    
    const currentState = this.dataManager.gameData.settings.autoSellEnabled
    this.dataManager.gameData.settings.autoSellEnabled = !currentState
    const newState = this.dataManager.gameData.settings.autoSellEnabled
    
    // 创建状态提示
    const message = newState ? '🤖 自动售卖已开启' : '⏸️ 自动售卖已关闭'
    const color = newState ? '#00FF00' : '#FF9800'
    
    // 显示浮动提示
    this.gameManager.createFloatingText(message, this.gameManager.canvas.width / 2, this.gameManager.canvas.height / 2, color, 16)
    
    // 创建轻型烟花效果
    this.gameManager.createFireworkEffect(
      this.x + this.width / 2, 
      this.y + this.height / 2, 
      color
    )
    
    // 保存设置
    this.dataManager.markDirty()
    
    console.log(`自动售卖功能已${newState ? '开启' : '关闭'}`)
  }
  
  // 渲染自动售卖按钮
  render() {
    if (!this.isVisible) return
    
    const isEnabled = this.getState()
    const rect = { x: this.x, y: this.y, width: this.width, height: this.height }
    
    // 根据状态选择颜色和样式
    let backgroundColor, textColor
    
    if (isEnabled) {
      // 开启状态：使用激活色
      backgroundColor = THEME_COLORS.ACTIVE  // 金色
      textColor = THEME_COLORS.TEXT_PRIMARY  // 白色文字
    } else {
      // 关闭状态：使用禁用色
      backgroundColor = THEME_COLORS.DISABLED  // 深灰色
      textColor = THEME_COLORS.TEXT_DISABLED   // 浅灰色文字
    }
    
    // 绘制按钮背景（圆角矩形，无边框）
    UIUtils.drawRoundRect(this.ctx, rect, backgroundColor, this.borderRadius)
    
    // 按钮文字
    this.ctx.fillStyle = textColor
    this.ctx.font = isEnabled ? 'bold 14px Arial' : '14px Arial'  // 开启时使用粗体
    this.ctx.textAlign = 'center'
    this.ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2 + 5)
    
    // 添加发光效果（仅在开启时）
    if (isEnabled) {
      // 外发光效果
      this.ctx.shadowColor = THEME_COLORS.ACTIVE
      this.ctx.shadowBlur = 8
      UIUtils.drawRoundRect(this.ctx, { 
        x: this.x - 1, 
        y: this.y - 1, 
        width: this.width + 2, 
        height: this.height + 2 
      }, 'transparent', this.borderRadius)
      this.ctx.shadowBlur = 0  // 重置阴影
    }
  }
  
  // 检查点击并切换状态
  handleTouch(x, y) {
    if (!this.isVisible) return false
    
    const isClicked = UIUtils.isPointInRect(x, y, { x: this.x, y: this.y, width: this.width, height: this.height })
    
    if (isClicked) {
      this.toggle()
      return true
    }
    
    return false
  }
}
